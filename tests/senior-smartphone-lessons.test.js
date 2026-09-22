const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const folders = require('../senior-smartphone-lessons');
const lessons = folders.flatMap(folder => folder.lessons);
const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'senior-learning.js'), 'utf8');

// Real controller and real content; only browser/Supabase boundaries are mocked.
async function harness(query = '?category=smartphone', mode = 'materials', status = 'active', available = false) {
  const nodes = new Map();
  const requests = [];
  const images = [];
  const listeners = {};
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      hidden:false, html:'', listeners:{}, picture:null,
      addEventListener(event, fn) { this.listeners[event] = fn; },
      scrollIntoView() {}, focus() {},
      set innerHTML(value) { if (this.picture) this.picture.isConnected = false; this.html = value; this.picture = null; },
      get innerHTML() { return this.html; },
      querySelector(selector) {
        if (selector === '[data-lesson-picture]' && this.html.includes('data-lesson-picture')) {
          if (!this.picture) this.picture = { isConnected:true, innerHTML:'', textContent:'', image:null,
            querySelector() { return { prepend:img => { this.image = img; } }; } };
          return this.picture;
        }
        return null;
      }
    });
    return nodes.get(id);
  };
  const sandbox = { URLSearchParams, location:{ search:query }, history:{ pushState(s, t, url) { this.url = url; } },
    document:{ body:{ dataset:{ seniorPage:mode } }, getElementById:node, addEventListener(type, fn) { listeners[type] = fn; } },
    window:{ HarmonySmartphoneLessons:folders, addEventListener(type, fn) { listeners[type] = fn; },
      supabase:{ createClient:() => ({ auth:{
        getSession:async () => ({ data:{ session:status === 'guest' ? null : { user:{ id:'local-fixture' } } } }),
        onAuthStateChange() {}, signOut() {}
      }, rpc:async name => { requests.push(name); return { data:{ account_status:status } }; } }) } },
    Image:class { constructor() { images.push(this); this.naturalWidth = available ? 1000 : 0; } set src(value) { this.path = value; } },
    setTimeout:fn => { fn(); return 0; }
  };
  vm.runInNewContext(script, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  const click = (attribute, value, area = 'seniorLearningContent') => {
    const target = { closest:selector => selector === `[${attribute}]` ? { dataset:{ [attribute.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())]:value } } : null };
    node(area).listeners.click({ target });
  };
  return { node, images, click, requests, sandbox, listeners };
}

test('three Drive folders have exactly twenty ordered lessons each and sixty distinct local paths', () => {
  assert.deepEqual(folders.map(f => f.title), ['설정', '인터넷·연결', '전화·문자·연락처']);
  for (const folder of folders) {
    assert.equal(folder.lessons.length, 20);
    assert.deepEqual(folder.lessons.map(l => l.number), Array.from({ length:20 }, (_, i) => String(i + 1).padStart(2, '0')));
  }
  assert.equal(new Set(lessons.map(l => l.id)).size, 60);
  assert.equal(new Set(lessons.map(l => l.slides[0])).size, 60);
  for (const item of lessons) {
    assert.match(item.slides[0], /^assets\/senior-learning\/smartphone\/(?:\d{2}|(?:settings|internet-connectivity|calls-messages-contacts)\/\d{2})\/slide-01\.png$/);
    assert.equal(item.slides.length, 1);
    assert.equal(item.status, 'ready');
  }
  assert.ok(lessons.slice(0, 15).every(l => fs.existsSync(path.join(root, l.slides[0]))));
});

test('all sixty lessons contain substantive separate device steps, use cases, reminders and help', () => {
  for (const item of lessons) {
    assert.ok(item.title.length > 3 && item.description.length > 15);
    assert.ok(item.when.length >= 35, item.id);
    for (const platform of ['galaxy', 'iphone']) {
      assert.ok(item[platform].length >= 4, `${item.id} ${platform}`);
      assert.ok(item[platform].join('').length > 100, `${item.id} ${platform} detailed`);
      assert.ok(item[platform].some(step => step.includes('**')), 'real button names emphasized');
    }
    assert.ok(item.remember.length >= 2);
    assert.ok(item.trouble.length >= 1);
    assert.notDeepEqual(item.galaxy, item.iphone);
  }
});

test('real controller renders folders first, twenty cards next, and all sixty text details', async () => {
  const h = await harness();
  assert.equal((h.node('seniorLearningContent').innerHTML.match(/class="smartphone-folder-card"/g) || []).length, 3);
  assert.doesNotMatch(h.node('seniorLearningContent').innerHTML, /data-senior-lesson=/);
  for (const folder of folders) {
    h.click('data-senior-folder', folder.id);
    assert.equal((h.node('seniorLearningContent').innerHTML.match(/class="smartphone-lesson-card"/g) || []).length, 20);
    for (const item of folder.lessons) {
      h.click('data-senior-lesson', item.id);
      const html = h.node('seniorLearningContent').innerHTML;
      const headings = ['오늘 배울 내용', '언제 사용하나요?', '갤럭시에서 알아보기', '아이폰에서 알아보기', '그림으로 확인하기', '기억하세요', '잘 안 될 때'];
      let previous = -1;
      for (const label of headings) {
        const position = html.indexOf(`<h3>${label}</h3>`);
        assert.ok(position > previous, `${item.id}: ${label} in reading order`);
        previous = position;
      }
      assert.ok(html.includes(item.title));
      assert.equal((html.match(/<ol>/g) || []).length, 2);
      assert.doesNotMatch(html, /<img/);
      assert.ok(h.node('seniorBreadcrumb').innerHTML.includes(folder.title));
    }
  }
});

test('missing pictures stay out of DOM; adding a local file is enough to display it on next visit', async () => {
  const h = await harness('?category=smartphone&lesson=smartphone-settings-missing');
  h.click('data-senior-lesson', 'smartphone-16');
  const slot = h.node('seniorLearningContent').picture;
  const picture = h.images.at(-1);
  assert.equal(picture.path, 'assets/senior-learning/smartphone/settings/16/slide-01.png');
  picture.onerror();
  assert.match(slot.innerHTML, /<h3>그림으로 확인하기<\/h3>[\s\S]*그림 교재 준비 중/);
  assert.equal(slot.image, null);
  h.click('data-senior-lesson', 'smartphone-16');
  const loaded = h.images.at(-1);
  loaded.naturalWidth = 1000;
  loaded.onload();
  assert.equal(h.node('seniorLearningContent').picture.image, loaded);
  assert.match(h.node('seniorLearningContent').picture.innerHTML, /1 \/ 1/);
  assert.match(h.node('seniorLearningContent').picture.innerHTML, /data-senior-fullscreen/);
});

test('old lesson bookmarks still open, back links retain folder, and stale image loads do not repaint', async () => {
  const h = await harness('?category=smartphone&lesson=smartphone-08');
  assert.match(h.node('seniorLearningContent').innerHTML, /스마트폰 글자 크기/);
  assert.match(h.node('seniorBreadcrumb').innerHTML, /설정/);
  const oldPicture = h.images[0];
  const oldSlot = h.node('seniorLearningContent').picture;
  h.click('data-senior-folder', 'settings');
  oldPicture.naturalWidth = 1000;
  oldPicture.onload();
  assert.equal(oldSlot.image, null);
  assert.match(h.sandbox.history.url, /folder=settings/);
  h.sandbox.location.search = '?category=smartphone&folder=calls-messages-contacts';
  h.listeners.popstate();
  assert.match(h.node('seniorLearningContent').innerHTML, /전화·문자·연락처/);
});

test('guest/inactive gates still block content and active/expiring still use read-only member RPC', async () => {
  for (const status of ['guest', 'inactive', 'active', 'expiring']) {
    const h = await harness('?category=smartphone', 'materials', status);
    const permitted = ['active', 'expiring'].includes(status);
    assert.equal(h.node('seniorLearningApp').hidden, !permitted);
    assert.equal(h.node('seniorLearningGate').hidden, permitted);
    assert.ok(h.requests.every(name => name === 'get_own_member_profile'));
    if (!permitted) assert.equal(h.node('seniorLearningContent').innerHTML, '');
  }
});

test('home/mini apps and other preparing categories retain their rendering', async () => {
  const home = await harness('', 'home');
  assert.match(home.node('seniorLearningContent').innerHTML, /senior-mini-apps.html/);
  assert.equal(home.node('seniorBreadcrumb').innerHTML, '');
  const mini = await harness('', 'mini-apps');
  assert.match(mini.node('seniorLearningContent').innerHTML, /easy-hanja.html/);
  assert.equal(mini.node('seniorBreadcrumb').innerHTML, '');
  const computer = await harness('?category=computer');
  assert.match(computer.node('seniorLearningContent').innerHTML, /자료 준비중/);
  assert.doesNotMatch(computer.node('seniorLearningContent').innerHTML, /data-senior-lesson=/);
  const invalid = await harness('?category=smartphone&lesson=not-real&page=oops');
  assert.doesNotThrow(() => invalid.listeners.keydown({ target:{ matches:() => false }, key:'ArrowRight' }));
});

test('materials-only compact header and responsive grids preserve readable sizes and controls', () => {
  const html = fs.readFileSync(path.join(root, 'senior-learning-materials.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'senior-learning.css'), 'utf8');
  assert.ok(html.indexOf('src="senior-smartphone-lessons.js') < html.indexOf('src="senior-learning.js'));
  assert.match(css, /body\[data-senior-page="materials"\] \.senior-learning-main \{ padding-top:80px/);
  assert.match(css, /\.smartphone-folder-grid \{ display:grid; grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.smartphone-folder-card \{[^}]*max-width:280px/);
  assert.match(css, /\.smartphone-folder-card strong \{[^}]*white-space:nowrap/);
  assert.match(css, /\.smartphone-lesson-card h3 \{[^}]*font-size:20px[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/);
  assert.match(css, /\.smartphone-lesson-card p \{[^}]*-webkit-line-clamp:2/);
  assert.match(css, /\.senior-breadcrumb\[hidden\] \{ display:none/);
  assert.match(css, /@media \(max-width:620px\)[\s\S]*?\.smartphone-lesson-grid \{ grid-template-columns:1fr/);
  assert.match(css, /\.smartphone-detail section p,\.smartphone-detail li \{ font-size:18px/);
  assert.match(css, /\.smartphone-lesson-card \.senior-primary-button \{[^}]*min-height:48px/);
  assert.match(css, /\.smartphone-lesson-card p \{[^}]*color:#334b63; font-size:18px/);
  assert.match(css, /@media \(max-width:1200px\)[^\n]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.smartphone-lesson-grid \{[^}]*repeat\(4,minmax\(0,1fr\)\)/);
});

test('materials to folders to grid to text detail uses one content title and reversible query hierarchy', async () => {
  const h = await harness('');
  assert.equal((h.node('seniorLearningContent').innerHTML.match(/class="senior-category-card"/g) || []).length, 3);
  assert.equal(h.node('seniorMaterialsIntro').hidden, false);
  h.click('data-senior-category', 'smartphone');
  assert.equal(h.node('seniorMaterialsIntro').hidden, true);
  assert.equal(h.sandbox.history.url, 'senior-learning-materials.html?category=smartphone');
  assert.doesNotMatch(h.node('seniorLearningContent').innerHTML, /senior-lesson-list|data-senior-lesson/);
  h.click('data-senior-folder', 'settings');
  assert.equal((h.node('seniorLearningContent').innerHTML.match(/>배우기 →/g) || []).length, 20);
  assert.doesNotMatch(h.node('seniorLearningContent').innerHTML, /교재 보기|senior-lesson-list/);
  h.click('data-senior-lesson', 'smartphone-01');
  assert.match(h.sandbox.history.url, /category=smartphone&folder=settings&lesson=smartphone-01/);
  assert.match(h.node('seniorBreadcrumb').innerHTML, />교재<.*>스마트폰<.*>설정<.*스마트폰 이해하기/);
  for (const query of ['?category=smartphone&folder=settings', '?category=smartphone', '']) {
    h.sandbox.location.search = query;
    h.listeners.popstate();
    const html = h.node('seniorLearningContent').innerHTML;
    assert.ok(html.includes(query.includes('folder') ? 'smartphone-lesson-grid' : query ? 'smartphone-folder-grid' : 'senior-category-grid'));
  }
  assert.equal(h.node('seniorMaterialsIntro').hidden, false);
});

test('materials landing removes duplicate tabs and their space but nested breadcrumb still works', async () => {
  const h = await harness('');
  assert.equal(h.node('seniorBreadcrumb').hidden, true);
  assert.equal(h.node('seniorBreadcrumb').innerHTML, '');
  assert.equal((h.node('seniorLearningContent').innerHTML.match(/class="senior-category-card"/g) || []).length, 3);
  h.click('data-senior-category', 'smartphone');
  assert.equal(h.node('seniorBreadcrumb').hidden, false);
  assert.match(h.node('seniorBreadcrumb').innerHTML, />교재<.*>스마트폰</);
  h.click('data-senior-home', '', 'seniorBreadcrumb');
  assert.equal(h.node('seniorBreadcrumb').hidden, true);
  assert.equal(h.node('seniorBreadcrumb').innerHTML, '');
});

test('all sixty compact card labels are separate from full detail titles and accessible button labels', async () => {
  const h = await harness();
  for (const folder of folders) {
    assert.ok(folder.cardDescription && folder.cardDescription.length <= 20);
    h.click('data-senior-category', 'smartphone');
    assert.ok(h.node('seniorLearningContent').innerHTML.includes(folder.cardDescription));
    h.click('data-senior-folder', folder.id);
    const cards = h.node('seniorLearningContent').innerHTML;
    for (const item of folder.lessons) {
      assert.ok(item.cardTitle && item.cardTitle.length <= 16, item.id);
      assert.doesNotMatch(item.cardTitle, /스마트폰/);
      assert.ok(cards.includes(`<h3 title="${item.title}">${item.cardTitle}</h3>`), item.id);
      assert.ok(cards.includes(`aria-label="${item.title} 배우기"`), item.id);
      h.click('data-senior-lesson', item.id);
      assert.ok(h.node('seniorLearningContent').innerHTML.includes(`<h2 tabindex="-1">${item.title}</h2>`));
    }
  }
  assert.deepEqual(folders[0].lessons.filter(l => ['03','06','10','12'].includes(l.number)).map(l => l.cardTitle),
    ['버튼·충전 위치','라이트·다크 모드','화면 자동 꺼짐','접근성·손쉬운 사용']);
});
