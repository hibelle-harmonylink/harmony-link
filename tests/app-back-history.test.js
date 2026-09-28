const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const workerSource = read('app/service-worker-v104.js');
const page = read('app/index.html');
const script = read('app/app.js');
const origin = 'https://example.test';
const entry = `${origin}/app/`;
const index = `${entry}index.html`;
const currentCache = workerSource.match(/const CACHE="([^"]+)"/)[1];
// Actual retired source: app/index.html at 0b0c88a10739e954fc3340912456c34fe2cd10aa,
// the parent of PR #304 (1795b0e76ab16877cabff5ab734f91101b243574).
// Keep only its distinctive markup here, not a second deployable legacy page.
const oldHtml = '<h1>마음을 잇고, 가능성을 열다</h1><div class="hero-connection-visual">교육과 사람을 잇다</div>';

function workerHarness() {
  const listeners = {};
  const stores = new Map();
  const requests = [];
  const deleted = [];
  const precacheRequests = [];
  let offline = false;
  let quotaFailure = false;
  let responseHtml = page;
  const keyOf = request => new URL(typeof request === 'string' ? request : request.url, entry).href;
  const store = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const cache = name => ({
    async addAll(items) {
      for (const request of items) {
        precacheRequests.push(request);
        const url = keyOf(request);
        // Reproduce old HTTP cache at /app/index.html even after the server updates.
        const body = url === index && request.cache !== 'reload' ? oldHtml : page;
        store(name).set(url, new Response(body));
      }
    },
    async put(request, response) {
      if (quotaFailure) throw new Error('quota');
      store(name).set(keyOf(request), response.clone());
    },
    async match(request) { return store(name).get(keyOf(request))?.clone(); }
  });
  const caches = {
    async open(name) { return cache(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { deleted.push(name); return stores.delete(name); },
    async match(request) {
      for (const name of stores.keys()) {
        const hit = await cache(name).match(request);
        if (hit) return hit;
      }
    }
  };
  const sandbox = {
    URL, Request, Response, caches,
    self: {
      location: { href: `${entry}service-worker-v104.js` },
      addEventListener(type, listener) { listeners[type] = listener; },
      skipWaiting() {}, clients: { claim() {} }
    },
    async fetch(request, options) {
      requests.push({ request, options });
      if (offline) throw new Error('network unavailable');
      return new Response(responseHtml);
    }
  };
  vm.runInNewContext(workerSource, sandbox);
  return {
    stores, deleted, requests, precacheRequests,
    async lifecycle(type) {
      let done;
      listeners[type]({ waitUntil(promise) { done = promise; } });
      await done;
    },
    async fetch(url) {
      let response;
      listeners.fetch({ request: new Request(url), respondWith(promise) { response = promise; } });
      return response;
    },
    seed(name, url, html) { store(name).set(url, new Response(html)); },
    offline(value = true) { offline = value; },
    quota(value = true) { quotaFailure = value; },
    networkHtml(value) { responseHtml = value; }
  };
}

test('current app entry has the new Hero, not the PR #304 predecessor markup', () => {
  for (const legacy of ['마음을 잇고', '가능성을 열다', 'hero-connection-visual', '프로그램 둘러보기']) {
    assert.ok(!page.includes(legacy), legacy);
  }
  assert.match(page, /배우고 싶은 사람과/);
  assert.equal((page.match(/class="quick-access-tile"/g) || []).length, 6);
  assert.match(page, /id="appPathways"/);
  assert.match(page, /id="appMenuToggle"/);
  const nav = page.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
  assert.equal((nav.match(/data-go=|<a /g) || []).length, 5);
});

test('install bypasses stale HTTP HTML for BOTH app entry aliases', async () => {
  const h = workerHarness();
  await h.lifecycle('install');
  assert.ok(h.precacheRequests.length > 2);
  assert.ok(h.precacheRequests.every(request => request.cache === 'reload'));
  for (const url of [entry, index]) {
    assert.equal(await h.stores.get(currentCache).get(url).text(), page);
  }
});

test('activate retires old app shells but preserves homepage and unrelated caches', async () => {
  const h = workerHarness();
  h.seed('harmony-link-app-v104', index, oldHtml);
  h.seed('harmony-link-app-v95', entry, oldHtml);
  h.seed('harmony-link-pwa-v20', `${origin}/`, 'homepage');
  h.seed('other-project', `${origin}/other`, 'other');
  await h.lifecycle('install');
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted.sort(), ['harmony-link-app-v104', 'harmony-link-app-v95']);
  assert.ok(h.stores.has('harmony-link-pwa-v20'));
  assert.ok(h.stores.has('other-project'));
});

test('offline history aliases use one current shell, never per-alias or global legacy caches', async () => {
  const h = workerHarness();
  h.seed('retained-old-cache', index, oldHtml);
  await h.lifecycle('install');
  // Even a stale alias cannot supersede the canonical current fallback.
  h.seed(currentCache, index, oldHtml);
  h.offline();
  for (const url of [entry, index, `${entry}?source=pwa`, `${index}?v=74&popup=off`]) {
    assert.equal(await (await h.fetch(url)).text(), page, url);
  }
});

test('successful alias navigation refreshes the shared fallback without altering the requested URL', async () => {
  const h = workerHarness();
  await h.lifecycle('install');
  const fresh = `${page}\n<!-- newest network response -->`;
  h.networkHtml(fresh);
  const url = `${index}?source=pwa&contact=volunteer`;
  assert.equal(await (await h.fetch(url)).text(), fresh);
  assert.equal(h.requests[0].request.url, url);
  assert.equal(h.requests[0].options.cache, 'no-store');
  h.offline();
  assert.equal(await (await h.fetch(entry)).text(), fresh);
});

test('missing current shell does not fall back to retired app HTML or turn missing JS into HTML', async () => {
  const h = workerHarness();
  h.seed('old-cache', entry, oldHtml);
  h.seed('old-cache', index, oldHtml);
  h.offline();
  for (const url of [entry, index, `${entry}missing.js`]) {
    assert.equal((await h.fetch(url)).type, 'error');
  }
});

test('cache storage failure does not replace a successful network response', async () => {
  const h = workerHarness();
  h.seed(currentCache, entry, oldHtml);
  h.quota();
  assert.equal(await (await h.fetch(entry)).text(), page);
});

test('ordinary page and asset URLs are not treated as app entry aliases', async () => {
  const h = workerHarness();
  await h.lifecycle('install');
  h.seed(currentCache, `${entry}app.css?v=65`, 'current CSS');
  h.offline();
  assert.equal(await (await h.fetch(`${entry}app.css?v=65`)).text(), 'current CSS');
  for (const url of [`${origin}/`, `${origin}/index.html`, `${entry}other.html`]) {
    assert.equal((await h.fetch(url)).type, 'error');
  }
});

test('real navigate/popstate code preserves Back order and permits leaving the app', () => {
  const navigation = script.match(/function navigate\([\s\S]*?\n\}/)[0];
  const popstate = script.match(/window\.addEventListener\("popstate",event=>\{[\s\S]*?\n\}\);/)[0];
  const historyEntries = [{ url: `${origin}/previous-page`, state: null }, { url: `${entry}#home`, state: { screen: 'home', contactMode: 'general' } }];
  let position = 1;
  let handler;
  let active;
  const screens = ['home', 'about', 'programs', 'events', 'contact'].map(screen => ({
    dataset: { screen }, classList: { toggle(name, enabled) { if (enabled) active = screen; } }
  }));
  const sandbox = {
    window: { scrollTo() {}, addEventListener(type, callback) { handler = callback; } },
    document: { body: { classList: { toggle() {} } } },
    requestAnimationFrame(fn) { fn(); }, setTimeout(fn) { fn(); }, setContactMode() {},
    $$(selector) { return selector === '.screen' ? screens : []; },
    history: {
      pushState(state, title, url) {
        historyEntries.splice(++position);
        historyEntries.push({ state, url: new URL(url, historyEntries[position - 1].url).href });
      }
    }
  };
  vm.runInNewContext(`${navigation}\n${popstate}`, sandbox);
  for (const screen of ['about', 'programs', 'events', 'home']) sandbox.navigate(screen);
  const back = [];
  for (const screen of ['events', 'programs', 'about', 'home']) {
    const item = historyEntries[--position];
    handler({ state: item.state });
    assert.equal(active, screen);
    back.push(item.url);
  }
  assert.deepEqual(back, ['events', 'programs', 'about', 'home'].map(screen => `${entry}#${screen}`));
  assert.equal(historyEntries[--position].url, `${origin}/previous-page`);
  assert.equal(position, 0, 'no artificial home loop traps the user inside the app');
});
