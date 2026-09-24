// Regression tests for the "app home reference polish" round: Hero badge
// removal + face-crop fix, Hero/Quick Access/소개 spacing compaction, and
// the 시니어 배움터 / Harmony Link · 이음문화센터 line-break fixes. See
// app/index.html and app/overrides.css.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appPage = read('app/index.html');
const overridesCss = read('app/overrides.css');

test('Hero "전문 강사 연결" badge is fully removed (element and CSS), image source/alt text unchanged', () => {
  assert.doesNotMatch(appPage, /hero-visual-badge|전문 강사 연결/);
  assert.doesNotMatch(overridesCss, /hero-visual-badge/);
  assert.match(appPage, /<img src="\.\.\/assets\/home\/harmony-community-learning\.png\?v=20260915-1" alt="함께 배우고 대화하는 Harmony Link 학습 공동체"/);
});

test('Hero mobile image crop is adjusted via object-position (not a new/different image), taller than the old 96px crop that cut off faces', () => {
  assert.match(overridesCss, /\.hero-visual\.hero-visual-compact img\{height:130px!important;object-position:50% 15%!important\}/);
});

test('Quick Access: 6 tiles, unchanged order, icon/tile sizing tokens are consistent across all tiles (no per-tile overrides)', () => {
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  const labels = [...quickBlock.matchAll(/data-ko="([^"]+)" data-en="[^"]*">[^<]*<\/span>\s*<\/(?:button|a)>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['소개', '프로그램', '강좌·행사', '비즈니스', '시니어 배움터', '파트너']);
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 6);
  // One shared .quick-access-icon/.quick-access-tile/.quick-access-label rule set
  // (not per-card classes), so every card gets identical icon size/box/alignment.
  assert.doesNotMatch(quickBlock, /class="quick-access-icon [a-z-]/);
});

test('시니어 배움터 label uses word-break:keep-all so it only wraps at its natural space (시니어 / 배움터), never mid-syllable (시니어 배움 / 터)', () => {
  assert.match(overridesCss, /\.quick-access-label\{[^}]*word-break:keep-all/);
});

test('배움과 서비스 stays at exactly 12 cards, untouched (shared/data/categories.js still the single source)', () => {
  assert.match(appPage, /<div class="app-category-grid" id="appCategoryGrid"><\/div>/);
  const categoriesData = read('shared/data/categories.js');
  const ids = [...categoriesData.matchAll(/id:"([a-z]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 12);
});

test('교육 프로그램 stays at exactly 4 cards (3 canonical + DMS), DMS href/flyer image untouched by this round', () => {
  const appScript = read('app/app.js');
  assert.match(appScript, /\}\)\.join\(""\)\+dmsAppCard\(\)/);
  assert.match(appScript, /const url="\.\.\/career\/partner\.html\?partner=dms";/);
  assert.match(appScript, /dms-care-flyer-en\.png/);
});

test('"Harmony Link ·" / "이음문화센터" is an explicit forced 2-line break, not left to unpredictable CJK wrapping', () => {
  assert.match(appPage, /<strong>Harmony Link ·<br><b data-ko="이음문화센터" data-en="E-eum Culture Center">이음문화센터<\/b><\/strong>/);
});

test('소개 페이지 주요 링크 유지: 하이벨컨설팅 회사소개 링크와 YouTube 소개영상 링크가 그대로 존재', () => {
  assert.match(appPage, /href="https:\/\/hibelleconsulting\.com\/" target="_blank" rel="noopener noreferrer" data-ko="하이벨컨설팅 회사소개"/);
  assert.match(appPage, /href="https:\/\/www\.youtube\.com\/watch\?v=7jo7Ovnq7Ew" target="_blank" rel="noopener noreferrer"><img src="https:\/\/i\.ytimg\.com\/vi\/7jo7Ovnq7Ew\/maxresdefault\.jpg"/);
});

test('bottom nav still has exactly 5 items, unchanged order', () => {
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  const labels = [...bottomNav.matchAll(/<small data-ko="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(labels, ['홈', '프로그램', '강좌·행사', '커뮤니티', '문의']);
});

test('login modal step-visibility fix and mobile header safe-area/hamburger fix (both from earlier rounds) are still in place', () => {
  assert.match(overridesCss, /\.app-auth-choice\[hidden\],\.app-auth-flow\[hidden\]\{display:none\}/);
  assert.match(overridesCss, /\.topbar\{padding-right:max\(14px,env\(safe-area-inset-right\)\)!important\}/);
  assert.match(overridesCss, /\.app-menu-toggle\{flex-shrink:0\}/);
});
