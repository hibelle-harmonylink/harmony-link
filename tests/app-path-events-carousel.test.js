// Regression tests for the "app path + events carousel" round: the "원하는
// 이용 경로를 선택하세요" section compacted to 2 plain buttons (no cards/
// description), the HOME 교육 프로그램 preview hidden entirely, and 강좌·행사
// converted to a mobile horizontal-scroll flyer carousel. See app/index.html
// and app/overrides.css.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appPage = read('app/index.html');
const overridesCss = read('app/overrides.css');
const appScript = read('app/app.js');

test('Choose Your Path: the 2 old description paragraphs are gone from HOME', () => {
  assert.doesNotMatch(appPage, /업체와 전문 강사가 Harmony Link 입점 파트너로 참여할 수 있습니다\./);
  assert.doesNotMatch(appPage, /기관, 단체, 소그룹과 개인에게 맞는 교육을 신청할 수 있습니다\./);
});

test('Choose Your Path: exactly 2 apply buttons exist, side by side, with the original hrefs unchanged', () => {
  const pathwaysBlock = appPage.match(/<section class="app-pathways" id="appPathways"[\s\S]*?<\/section>/)?.[0] || '';
  const links = [...pathwaysBlock.matchAll(/<a href="([^"]+)"[^>]*data-ko="([^"]+)"/g)];
  assert.equal(links.length, 2);
  assert.deepEqual(links.map(m => m[2]), ['입점 파트너 신청하기', '교육 신청하기']);
  assert.equal(links[0][1], 'https://forms.gle/pF4xy5Jz4ycVouKo9');
  assert.equal(links[1][1], 'https://docs.google.com/forms/d/1LfKkCnsfGLgsvs9ptLluwZkkGupY6iJYBzBbA7jMEK8/viewform');
  assert.match(overridesCss, /\.app-pathway-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('HOME 교육 프로그램 preview section is hidden, but the full Programs screen, its 4 cards, and DMS are untouched', () => {
  const homeProgramsPreview = appPage.match(/<section class="home-programs" hidden[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(homeProgramsPreview, /id="recommendedPrograms"/);
  assert.doesNotMatch(overridesCss, /\.home-programs\{[^}]*display:/); // no display override defeats [hidden]
  assert.match(appPage, /<section class="screen" id="programs" data-screen="programs">/);
  assert.match(appPage, /id="programList"/);
  assert.match(appScript, /\}\)\.join\(""\)\+dmsAppCard\(\)/);
  assert.match(appScript, /const url="\.\.\/career\/partner\.html\?partner=dms";/);
  // The bottom-nav 프로그램 button still routes to the untouched #programs screen.
  assert.match(appPage, /<button type="button" data-go="programs"><span class="bn-icon-wrap">/);
});

test('HOME 강좌·행사 gallery is a mobile (<640px) horizontal-scroll carousel of small flyer cards, no description', () => {
  assert.match(overridesCss, /@media\(max-width:639px\)\{[\s\S]*?\.app-home-event-grid\{display:flex;grid-template-columns:none;overflow-x:auto;[\s\S]*?scroll-snap-type:x proximity/);
  assert.match(overridesCss, /\.app-home-event-card\{flex:0 0 auto;width:140px;scroll-snap-align:start\}/);
  const homeEventCardBody = appScript.match(/function homeEventCard\(item\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(homeEventCardBody, /item\.textKo|item\.textEn/);
});

test('event detail hrefs (including DMS AI 특강) and the eventCard()/renderEvents() full-screen logic are untouched by the carousel change', () => {
  assert.match(appScript, /function eventCard\(item\)\{/);
  assert.match(appScript, /function renderEvents\(\)\{/);
  assert.match(appScript, /"hole19-tournament":"\.\.\/special-event-hole19\.html","free-music-class":"\.\.\/special-event-music-class\.html"/);
  const eventsData = read('shared/data/events.js');
  assert.match(eventsData, /detailUrl:"special-event-dms-ai-workshop\.html"/);
});

test('배움과 서비스 12-card carousel (previous round), Quick Access 6개, YouTube 1-line title + play icon, login modal, and hamburger safe-area are all untouched', () => {
  assert.match(overridesCss, /\.app-category-card\{flex:0 0 auto;width:82px;[\s\S]*?scroll-snap-align:start\}/);
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 6);
  assert.match(overridesCss, /@media\(max-width:420px\)\{\.app-about-video h2\{font-size:clamp\(17px,calc\(-5\.4px \+ 7vw\),24px\)\}\}/);
  assert.match(appPage, /class="app-about-video-play" aria-hidden="true">▶</);
  assert.match(overridesCss, /\.app-auth-choice\[hidden\],\.app-auth-flow\[hidden\]\{display:none\}/);
  assert.match(overridesCss, /\.topbar\{padding-right:max\(14px,env\(safe-area-inset-right\)\)!important\}/);
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((bottomNav.match(/<small data-ko="([^"]+)"/g) || []).length, 5);
});
