// Regression tests for the "mobile app home polish" round: Quick Access
// trimmed to 6 tiles, mobile header hamburger-visibility fix, HOME hero
// heading 2-line control, 교육 프로그램 DMS card switched to a real flyer
// image, and the HOME 강좌·행사 gallery redesign. See app/app.js,
// app/index.html and app/overrides.css.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appPage = read('app/index.html');
const appScript = read('app/app.js');
const overridesCss = read('app/overrides.css');

test('Quick Access has exactly 6 tiles in the exact required order', () => {
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  const labels = [...quickBlock.matchAll(/data-ko="([^"]+)" data-en="[^"]*">[^<]*<\/span>\s*<\/(?:button|a)>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['소개', '프로그램', '강좌·행사', '비즈니스', '시니어 배움터', '파트너']);
});

test('직업/미니앱/마이페이지/문의 tiles are gone from Quick Access, but their underlying pages/handlers are not deleted', () => {
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.doesNotMatch(quickBlock, /data-ko="직업"|data-ko="미니앱"|data-ko="마이페이지"|data-ko="문의"/);
  assert.ok(fs.existsSync(path.join(root, 'career.html')), 'career.html must still exist');
  assert.match(appScript, /actionTile\.dataset\.action==="install"\) \$\("#installButton"\)\.click\(\)/);
  assert.match(appScript, /actionTile\.dataset\.action==="account"\) \$\("#appAuthButton"\)\.click\(\)/);
  // 문의 stays reachable from the bottom nav and the desktop/hamburger nav.
  assert.match(appPage, /<button type="button" data-go="contact"><span class="bn-icon-wrap">/);
  assert.match(appPage, /<button type="button" data-go="contact" data-ko="문의" data-en="Contact">문의<\/button>/);
});

test('교육 프로그램 still has exactly 4 cards (3 canonical + DMS), DMS href unchanged', () => {
  const specialtyCardsBody = appScript.match(/function specialtyCards\(\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(specialtyCardsBody, /\}\)\.join\(""\)\+dmsAppCard\(\)/);
  assert.match(appScript, /const url="\.\.\/career\/partner\.html\?partner=dms";/);
});

test('DMS "교육 프로그램" card uses app-specialty-poster with a real existing flyer image, not the small square logo', () => {
  const dmsCardBody = appScript.match(/function dmsAppCard\(\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(dmsCardBody, /class="app-specialty-poster"/);
  assert.match(dmsCardBody, /dms-care-flyer-en\.png/);
  assert.doesNotMatch(dmsCardBody, /app-specialty-logo|dms-care-logo\.webp/);
  assert.ok(fs.existsSync(path.join(root, 'assets/images/dms-care-flyer-en.png')));
});

test('HOME 강좌·행사 gallery cards carry no description text (title + flyer only), while the full Events screen keeps its badge/description', () => {
  const homeEventCardBody = appScript.match(/function homeEventCard\(item\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(homeEventCardBody, /item\.textKo|item\.textEn|class="badge/);
  assert.match(homeEventCardBody, /<h3>\$\{title\}<\/h3>/);
  const eventCardBody = appScript.match(/function eventCard\(item\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(eventCardBody, /item\.textKo/);
  assert.match(eventCardBody, /class="badge/);
});

test('HOME 강좌·행사 gallery is a CSS grid, 2 columns at/below 480px and 3 columns above it', () => {
  assert.match(overridesCss, /\.app-home-event-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);/);
  assert.match(overridesCss, /@media\(max-width:480px\)\{\.app-home-event-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(overridesCss, /\.app-home-event-card \.event-image-open img\{display:block;width:100%;height:100%;object-fit:contain\}/);
});

test('mobile header: login button is shrunk on mobile only, and the topbar accounts for env(safe-area-inset-right) so the hamburger keeps a real margin', () => {
  assert.match(overridesCss, /@media\(max-width:899px\)\{\s*\.topbar\{padding-right:max\(14px,env\(safe-area-inset-right\)\)!important\}/);
  assert.match(overridesCss, /\.member-button\.member-login\{min-width:56px!important;padding-inline:10px!important\}/);
  assert.match(overridesCss, /\.member-button\.member-login\{height:28px!important;min-width:50px!important;padding-inline:8px!important\}/);
  // Desktop/tablet member-login sizing (>=900px, min-width:72px) is untouched.
  assert.match(overridesCss, /\.member-button\.member-login\{min-width:72px!important;padding-inline:16px!important/);
  assert.match(overridesCss, /\.app-menu-toggle\{flex-shrink:0\}/);
});

test('login modal step-visibility fix from the previous round is still in place (no regression)', () => {
  assert.match(overridesCss, /\.app-auth-choice\[hidden\],\.app-auth-flow\[hidden\]\{display:none\}/);
});

test('hero heading keeps exactly 2 lines below 440px via a clamp()\'d font-size; unchanged above that width', () => {
  assert.match(overridesCss, /@media\(max-width:440px\)\{\s*\.app-shell #home \.hero h1\{font-size:clamp\(20px,calc\(-1\.333px \+ 6\.667vw\),28px\)\}/);
  assert.match(appPage, /배우고 싶은 사람과<br><em>가르치는 사람을 연결합니다\.<\/em>/);
});
