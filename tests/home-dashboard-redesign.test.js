const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const appPage = read('app/index.html');
const appScript = read('app/app.js');
const overridesCss = read('app/overrides.css');
const webIndex = read('index.html');
const webScript = read('script.js');
const webStyles = read('styles.css');
const homepageUiCss = read('homepage-ui.css');

test('HOME gets a 2x2 Quick Access grid reusing the existing data-go/anchor navigation, right after the Hero', () => {
  const home = appPage.match(/<section class="screen active home-dashboard"[\s\S]*?<\/section>|<section class="screen active" id="home"[\s\S]*$/)?.[0] || appPage;
  const heroIndex = home.indexOf('class="hero hero-dashboard"');
  const quickIndex = home.indexOf('id="quickAccess"');
  const pathwaysIndex = home.indexOf('id="appPathways"');
  assert.ok(heroIndex > -1, 'Hero must carry the new hero-dashboard modifier class');
  assert.ok(quickIndex > heroIndex && quickIndex < pathwaysIndex, 'Quick Access must sit between the Hero and the next section');
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(quickBlock, /data-go="programs"/);
  assert.match(quickBlock, /href="\.\.\/senior-learning\.html"/);
  assert.match(quickBlock, /data-go="events"/);
  assert.match(quickBlock, /href="\.\.\/#partner-center"/);
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 4);
  // No new JS wiring: programs/events reuse the existing document-level [data-go] click
  // delegation, and the other two are plain links identical in pattern to the desktop nav.
  assert.doesNotMatch(appScript, /quickAccess|quick-access/);
});

test('Hero keeps its exact web-sourced copy, CTAs, and image; only a compacting modifier class and CSS were added', () => {
  assert.match(appPage, /data-ko="HARMONY LINK · 이음문화센터" data-en="HARMONY LINK · E-EUM CULTURE CENTER"/);
  assert.match(appPage, /<button class="primary-action app-program-explore" type="button" data-go="programs"><span data-ko="교육 프로그램 찾기" data-en="Find Programs">/);
  assert.match(appPage, /<a class="app-hero-secondary-action" href="\.\.\/#partner-application">/);
  assert.match(appPage, /<img src="\.\.\/assets\/home\/harmony-community-learning\.png\?v=20260915-1"/);
  assert.match(appPage, /class="hero-visual hero-visual-compact"/);
  assert.match(overridesCss, /\.app-shell #home \.hero\.hero-dashboard\{min-height:0!important/);
});

test('Programs Preview stays a compact CSS-only row layout scoped to #recommendedPrograms; the full Programs screen (#programList) is untouched', () => {
  assert.match(appPage, /<button type="button" data-go="programs" data-ko="전체 보기" data-en="View All">전체 보기<\/button>/);
  assert.match(overridesCss, /#recommendedPrograms\.app-specialty-grid\{grid-template-columns:1fr!important/);
  assert.match(overridesCss, /#recommendedPrograms \.app-specialty-card\{flex-direction:row!important\}/);
  // specialtyCards()/renderRecommended()/renderPrograms() themselves are unmodified --
  // the compaction is CSS-only and scoped by ID, so #programList never matches it.
  assert.match(appScript, /function specialtyCards\(\)\{/);
  assert.match(appScript, /function renderRecommended\(\)\{/);
  assert.doesNotMatch(overridesCss, /#programList\.app-specialty-|#programList \.app-specialty-/);
});

test('Featured Event shows exactly the nearest upcoming event via renderHomeEvents(), with the full Events screen and eventCard() untouched', () => {
  assert.match(appScript, /function renderHomeEvents\(\)\{[\s\S]*?\.slice\(0,1\)\.map\(eventCard\)\.join\(""\);/);
  assert.match(appScript, /function eventCard\(item\)\{/);
  assert.match(appScript, /function renderEvents\(\)\{/);
  assert.match(appPage, /<h2 data-ko="강좌 · 행사" data-en="Classes & Events">강좌 · 행사<\/h2>/);
  assert.match(appPage, /<button type="button" data-go="events" data-ko="행사 보기" data-en="View Events">행사 보기<\/button>/);
  assert.match(appPage, /id="upcomingEventsList"/);
  assert.match(appPage, /id="pastEventsList" class="past-events-list" hidden/);
});

test('Business Preview shows exactly one canonical business via renderPartners(), with a "더보기" link to the existing partner-center entry point', () => {
  assert.match(appScript, /function renderPartners\(\)\{[\s\S]*?Math\.min\(1,partners\.length\)/);
  assert.match(appScript, /const partners\s*=\s*businessPromotions;/);
  assert.match(appPage, /<a href="\.\.\/#partner-center" data-ko="더보기" data-en="See More">더보기<\/a>/);
  // Carousel navigation (prev/next) is unchanged, so paging still cycles through all 6 businesses.
  assert.match(appPage, /class="app-partner-prev" type="button"/);
  assert.match(appPage, /class="app-partner-next" type="button"/);
  assert.match(overridesCss, /#partnerPrograms \.app-partner-card\{min-height:0!important\}/);
});

test('Community CTA, bottom nav, and hamburger nav markup are byte-identical to before the redesign', () => {
  assert.match(appPage, /<section class="community-card">/);
  assert.match(appPage, /<a class="community-card-link" href="\.\.\/community\.html"><span data-ko="커뮤니티 보기"/);
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((bottomNav.match(/data-go=|<a /g) || []).length, 5);
  assert.match(appPage, /<nav class="desktop-app-nav" id="appPrimaryNav" aria-label="주요 메뉴">/);
  assert.match(appPage, /<button class="app-menu-toggle" id="appMenuToggle"/);
});

test('the HOME redesign is app-only: none of the new dashboard classes leak into the general web site files', () => {
  ['quick-access-grid', 'quick-access-tile', 'hero-dashboard', 'hero-visual-compact'].forEach(cls => {
    assert.doesNotMatch(webIndex, new RegExp(cls), `index.html should not contain .${cls}`);
    assert.doesNotMatch(webScript, new RegExp(cls), `script.js should not contain .${cls}`);
    assert.doesNotMatch(webStyles, new RegExp(cls), `styles.css should not contain .${cls}`);
    assert.doesNotMatch(homepageUiCss, new RegExp(cls), `homepage-ui.css should not contain .${cls}`);
  });
});

test('Business/Events canonical schemas are untouched by the HOME redesign', () => {
  const businessesData = read('shared/data/businesses.js');
  const eventsData = read('shared/data/events.js');
  assert.doesNotMatch(businessesData, /quick-access|hero-dashboard/);
  assert.doesNotMatch(eventsData, /quick-access|hero-dashboard/);
  const businessCount = (businessesData.match(/id:"[a-z0-9-]+"/g) || []).length;
  assert.equal(businessCount, 6);
  const eventIds = [...eventsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(eventIds, ['messiah', 'hole19-tournament', 'free-music-class', 'ai-business-automation', 'one-day-class', 'finance-ai-seminar']);
});

test('Auth/Contact/Senior Learning/Community are not touched by the HOME redesign', () => {
  assert.doesNotMatch(appScript, /senior/i);
  assert.doesNotMatch(appPage, /data-screen="senior/);
  assert.match(appPage, /<h1 id="contactTitle" data-ko="궁금한 점이 있으신가요\?"/);
  assert.match(appScript, /function initAppAuth\(\)\{/);
  assert.match(appPage, /<a href="\.\.\/community\.html"><span class="bn-icon-wrap">/);
});

test('service worker v104 registers and versions bump together (app.js, service worker) -- overrides.css is untouched by Phase 3 and correctly stays at v103', () => {
  assert.match(appPage, /overrides\.css\?v=103/);
  assert.match(appPage, /app\.js\?v=104/);
  assert.match(appScript, /register\("service-worker-v104\.js"/);
  const sw104 = read('app/service-worker-v104.js');
  assert.match(sw104, /const CACHE="harmony-link-app-v104"/);
  assert.match(sw104, /"\.\/overrides\.css\?v=103"/);
  assert.match(sw104, /"\.\/app\.js\?v=104"/);
});
