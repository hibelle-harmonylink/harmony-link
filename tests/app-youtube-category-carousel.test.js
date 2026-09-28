// Regression tests for the "app YouTube + category carousel" round: the
// About-page YouTube title 1-line fix, a play icon on its CTA button, and
// the 배움과 서비스 12-card mobile horizontal carousel. See app/index.html
// and app/overrides.css.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appPage = read('app/index.html');
const overridesCss = read('app/overrides.css');

function loadCategories() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('shared/data/categories.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_CATEGORIES));
}

test('YouTube section title exists, its href is unchanged, and a mobile-only clamp keeps it to 1 line below 420px', () => {
  assert.match(appPage, /<h2 data-ko="영상으로 만나는 Harmony Link" data-en="Meet Harmony Link through video">영상으로 만나는 Harmony Link<\/h2>/);
  assert.match(appPage, /href="https:\/\/www\.youtube\.com\/watch\?v=7jo7Ovnq7Ew" target="_blank" rel="noopener noreferrer"><img src="https:\/\/i\.ytimg\.com\/vi\/7jo7Ovnq7Ew\/maxresdefault\.jpg"/);
  assert.match(overridesCss, /@media\(max-width:420px\)\{\.app-about-video h2\{font-size:clamp\(17px,calc\(-5\.4px \+ 7vw\),24px\)\}\}/);
});

test('소개영상 재생 button carries a play icon (▶) alongside the existing text, and the YouTube link itself is untouched', () => {
  assert.match(appPage, /<span class="app-about-video-play" aria-hidden="true">▶<\/span><span data-ko="소개영상 재생" data-en="Play Introduction Video">소개영상 재생<\/span>/);
  assert.match(appPage, /<a href="https:\/\/www\.youtube\.com\/watch\?v=7jo7Ovnq7Ew" target="_blank" rel="noopener noreferrer">/);
});

test('shared/data/categories.js is unchanged: still 12 categories, in the fixed order, 5 available + 7 preparing', () => {
  const categories = loadCategories();
  assert.equal(categories.length, 12);
  assert.deepEqual(categories.map(c => c.titleKo), ['디지털', '언어', '음악', '미술', '건강', '생활', '가족', '금융', '문화', '취미', '직업', '진학']);
  const available = categories.filter(c => c.status === 'available').map(c => c.titleKo);
  const preparing = categories.filter(c => c.status === 'preparing').map(c => c.titleKo);
  assert.deepEqual(available, ['디지털', '언어', '음악', '직업', '진학']);
  assert.equal(preparing.length, 7);
});

test('mobile (<640px) horizontal carousel CSS exists for #appCategoryGrid: flex row, native overflow-x scroll, scroll-snap, and compact fixed-width cards', () => {
  assert.match(overridesCss, /@media\(max-width:639px\)\{[\s\S]*?\.app-category-grid\{display:flex;grid-template-columns:none;overflow-x:auto;[\s\S]*?scroll-snap-type:x proximity/);
  assert.match(overridesCss, /\.app-category-card\{flex:0 0 auto;width:82px;[\s\S]*?scroll-snap-align:start\}/);
  // Card click/href behavior is untouched -- this round only changed the
  // grid/card CSS, never categoryCard()/renderCategories() in app.js.
  const appScript = read('app/app.js');
  assert.match(appScript, /function categoryCard\(category\)\{/);
  assert.match(appScript, /category\.status==="available"&&category\.url/);
  assert.match(appScript, /data-category-coming-soon/);
});

test('the tablet/desktop grid (>=640px) is untouched by the mobile carousel change', () => {
  assert.match(overridesCss, /@media\(min-width:640px\) and \(max-width:899px\)\{\.app-category-grid\{grid-template-columns:repeat\(4,1fr\)\}/);
  assert.match(overridesCss, /@media\(min-width:900px\)\{\s*\.app-category-grid\{grid-template-columns:repeat\(6,1fr\)\}/);
});

test('Quick Access (6), 교육 프로그램 (4), bottom nav (5), login modal, and hamburger safe-area CSS from earlier rounds are all still in place', () => {
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 6);
  const appScript = read('app/app.js');
  assert.match(appScript, /\}\)\.join\(""\)\+dmsAppCard\(\)/);
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((bottomNav.match(/<small data-ko="([^"]+)"/g) || []).length, 5);
  assert.match(overridesCss, /\.app-auth-choice\[hidden\],\.app-auth-flow\[hidden\]\{display:none\}/);
  assert.match(overridesCss, /\.topbar\{padding-right:max\(14px,env\(safe-area-inset-right\)\)!important\}/);
});
