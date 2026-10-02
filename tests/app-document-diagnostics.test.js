const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const script = read('app/app.js');
const page = read('app/index.html');
const diagnostics = script.slice(0, script.indexOf('// End app document diagnostics.'));
const key = 'harmony-link-app-diagnostics';

function harness(options = {}) {
  const listeners = {}, stores = new Map(), writes = [];
  const context = {
    URL, URLSearchParams, Date,
    location: new URL(options.url || 'https://example.test/app/?source=pwa#home'),
    document: {
      visibilityState: 'visible',
      documentElement: { getAttribute: () => options.legacy ? null : '2026-09-26-1' }
    },
    history: { state: { screen: 'home', contactMode: 'general' } },
    navigator: { serviceWorker: { controller: options.controller || null } },
    performance: { getEntriesByType: () => [options.navigation || { type: 'navigate', transferSize: 1200, encodedBodySize: 900, workerStart: 0 }] },
    localStorage: {
      getItem(name) { if (options.blocked) throw Error('blocked'); return stores.get(name) || null; },
      setItem(name, value) { if (options.blocked || options.quota) throw Error('unavailable'); writes.push(name); stores.set(name, value); }
    },
    window: { addEventListener(type, listener) { listeners[type] = listener; } }
  };
  vm.runInNewContext(diagnostics, context);
  return {
    context, listeners, stores, writes,
    emit(type, extra = {}) { listeners[type]({ type, persisted: false, ...extra }); },
    read() { return JSON.parse(JSON.stringify(context.window.HARMONY_APP_DIAGNOSTICS.read())); }
  };
}

test('current HTML declares a non-visible shell marker; diagnostics do not change UI, navigation or workers', () => {
  assert.match(page, /<html lang="ko" data-app-shell-version="2026-09-26-1">/);
  assert.equal((page.match(/2026-09-26-1/g) || []).length, 1);
  assert.doesNotMatch(diagnostics, /innerHTML|textContent|createElement|appendChild|\.style\b|classList|fetch\(|sendBeacon|XMLHttpRequest|console\.|\.reload\(|pushState\(|replaceState\(|\.assign\(|\.register\(|\.unregister\(|caches\./);
  const worker = read('app/service-worker-v104.js');
  assert.match(worker, /const CACHE="harmony-link-app-v107"/);
  assert.match(worker, /cache:"reload"/);
  assert.match(worker, /cache:"no-store"/);
  const h = harness();
  assert.deepEqual(Object.keys(h.listeners), ['pageshow', 'pagehide', 'popstate']);
  assert.equal(h.writes.length, 0, 'no storage mutation until a diagnostic event');
});

test('pageshow records the shell, safe URL, history, visibility, navigation and timestamp', () => {
  const h = harness();
  h.emit('pageshow');
  const [entry] = h.read();
  assert.equal(entry.shellVersion, '2026-09-26-1');
  assert.equal(entry.markerPresent, true);
  assert.equal(entry.href, 'https://example.test/app/?source=pwa#home');
  assert.equal(entry.pathname, '/app/');
  assert.equal(entry.search, '?source=pwa');
  assert.equal(entry.hash, '#home');
  assert.deepEqual(entry.historyState, { screen: 'home', contactMode: 'general' });
  assert.equal(entry.visibilityState, 'visible');
  assert.equal(entry.navigationType, 'navigate');
  assert.equal(entry.persisted, false);
  assert.ok(Number.isSafeInteger(entry.timestamp));
  assert.equal(entry.transferSize, 1200);
});

test('synthetic persisted=true is recorded, without claiming a real BFCache reproduction', () => {
  const h = harness({ navigation: { type: 'back_forward', transferSize: 0, encodedBodySize: 900, workerStart: 0 } });
  h.emit('pagehide', { persisted: true });
  h.emit('pageshow', { persisted: true });
  assert.deepEqual(h.read().map(entry => [entry.event, entry.persisted]), [['pagehide', true], ['pageshow', true]]);
  assert.equal(h.read()[1].navigationType, 'back_forward');
});

test('an instrumented markerless document is legacy-or-unknown (uninstrumented old HTML cannot log)', () => {
  const h = harness({ legacy: true, url: 'https://example.test/app/index.html?v=74&popup=off#about' });
  h.emit('pageshow');
  assert.equal(h.read()[0].shellVersion, 'legacy-or-unknown');
  assert.equal(h.read()[0].markerPresent, false);
  assert.equal(h.read()[0].pathname, '/app/index.html');
  assert.equal(h.read()[0].search, '?popup=off&v=74');
});

test('controlled and uncontrolled documents record controller presence and a sanitized script URL', () => {
  const absent = harness();
  absent.emit('pageshow');
  assert.equal(absent.read()[0].controllerPresent, false);
  assert.equal(absent.read()[0].controllerScriptURL, null);
  const present = harness({ controller: { scriptURL: 'https://example.test/app/service-worker-v104.js?token=SECRET#SECRET' } });
  present.emit('pageshow');
  assert.equal(present.read()[0].controllerPresent, true);
  assert.equal(present.read()[0].controllerScriptURL, 'https://example.test/app/service-worker-v104.js');
});

test('popstate observes the incoming safe state without changing existing history or navigation', () => {
  const h = harness();
  h.context.location = new URL('https://example.test/app/#events');
  const state = { screen: 'events', contactMode: 'general', token: 'SECRET' };
  h.emit('popstate', { state });
  assert.equal(h.read()[0].event, 'popstate');
  assert.deepEqual(h.read()[0].historyState, { screen: 'events', contactMode: 'general' });
  assert.equal(h.read()[0].hash, '#events');
  assert.equal(h.read()[0].persisted, null);
  assert.equal(h.context.history.state.screen, 'home');
  assert.equal(state.token, 'SECRET', 'original state is not mutated');
});

test('query, hash, history and unknown paths cannot store tokens or personal data', () => {
  const h = harness({ url: 'https://example.test/app/?debugApp=1&code=SECRET&access_token=SECRET&refresh_token=SECRET&state=SECRET&email=person@example.test&source=SECRET&v=SECRET#access_token=SECRET' });
  h.context.history.state = { screen: 'SECRET', contactMode: 'SECRET', user: { email: 'person@example.test' }, token: 'SECRET' };
  h.emit('pageshow');
  assert.equal(h.read()[0].href, 'https://example.test/app/?debugApp=1');
  assert.deepEqual(h.read()[0].historyState, { screen: null, contactMode: null });
  h.context.location = new URL('https://example.test/app/person@example.test?code=SECRET');
  h.emit('pagehide');
  assert.equal(h.read()[1].pathname, '/[redacted]');
  assert.doesNotMatch(h.stores.get(key), /SECRET|person@example\.test|access_token|refresh_token/);
});

test('only the last 20 events are retained, across page instances, in one storage key', () => {
  const h = harness();
  for (let i = 0; i < 35; i++) h.emit('popstate', { state: { screen: i === 15 ? 'about' : 'home' } });
  assert.equal(h.read().length, 20);
  assert.equal(h.read()[0].historyState.screen, 'about');
  assert.deepEqual([...new Set(h.writes)], [key]);
  const next = harness();
  next.stores.set(key, h.stores.get(key));
  next.emit('pageshow');
  assert.equal(next.read().length, 20);
  assert.equal(next.read().at(-1).event, 'pageshow');
});

test('malformed or poisoned previous storage is sanitized before exposure and re-saving', () => {
  const h = harness();
  h.stores.set(key, '{bad json');
  h.emit('pageshow');
  assert.equal(h.read().length, 1);
  const poisoned = { ...h.read()[0], href: 'https://example.test/app/?code=SECRET', secret: 'SECRET', historyState: { screen: 'home', token: 'SECRET' } };
  h.stores.set(key, JSON.stringify([poisoned]));
  assert.doesNotMatch(JSON.stringify(h.read()), /SECRET/);
  h.emit('pagehide');
  assert.doesNotMatch(h.stores.get(key), /SECRET/);
});

test('blocked storage or quota failure never interrupts the app and keeps a bounded memory log', () => {
  for (const options of [{ blocked: true }, { quota: true }]) {
    const h = harness(options);
    assert.doesNotThrow(() => { for (let i = 0; i < 25; i++) h.emit('pageshow'); });
    assert.equal(h.read().length, 20);
  }
});

test('debug helper is read-only, returns frozen snapshots and has no clear or write action', () => {
  const h = harness();
  h.emit('pageshow');
  const helper = h.context.window.HARMONY_APP_DIAGNOSTICS;
  assert.deepEqual(Object.keys(helper), ['read']);
  assert.equal(Object.getOwnPropertyDescriptor(h.context.window, 'HARMONY_APP_DIAGNOSTICS').writable, false);
  const snapshot = helper.read();
  assert.ok(Object.isFrozen(helper) && Object.isFrozen(snapshot) && Object.isFrozen(snapshot[0]) && Object.isFrozen(snapshot[0].historyState));
});

test('HTTP-cache-like and network/SW navigation timings remain evidence, not automatic root-cause claims', () => {
  for (const [transferSize, workerStart] of [[0, 0], [1200, 0], [1200, 10]]) {
    const h = harness({ navigation: { type: 'back_forward', transferSize, encodedBodySize: 900, workerStart } });
    h.emit('pageshow');
    assert.equal(h.read()[0].transferSize, transferSize);
    assert.equal(h.read()[0].workerStart, workerStart);
    assert.equal(h.read()[0].persisted, false);
  }
});
