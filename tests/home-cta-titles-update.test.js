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

test('Hero CTA row: no arrow glyph, exactly 2 CTAs, destinations and styling unchanged', () => {
  const ctaRow = appPage.match(/<div class="hero-cta-row">[\s\S]*?<\/div>/)?.[0] || '';
  assert.doesNotMatch(ctaRow, /<b aria-hidden="true">→<\/b>/);
  assert.equal((ctaRow.match(/data-go="programs"|href="\.\.\/#partner-application"/g) || []).length, 2);
  assert.match(ctaRow, /<button class="primary-action app-program-explore" type="button" data-go="programs"><span data-ko="교육 프로그램 찾기" data-en="Find Programs">교육 프로그램 찾기<\/span><\/button>/);
  assert.match(ctaRow, /<a class="app-hero-secondary-action" href="\.\.\/#partner-application"><span data-ko="강사·업체로 참여하기" data-en="Join as an Instructor or Provider">강사·업체로 참여하기<\/span><\/a>/);
});

test('Hero CTA row lays out both buttons side by side with equal-width grid columns, scoped to the dashboard hero only', () => {
  assert.match(overridesCss, /\.hero-dashboard \.hero-cta-row\{display:grid!important;grid-template-columns:1fr 1fr!important/);
  assert.match(overridesCss, /\.hero-dashboard \.hero-cta-row \.app-program-explore\{min-height:44px!important;height:44px!important/);
  assert.match(overridesCss, /\.hero-dashboard \.hero-cta-row \.app-hero-secondary-action\{min-height:44px!important;height:44px!important/);
  // Touch target floor (44px) is preserved, not reduced further.
  assert.doesNotMatch(overridesCss, /\.hero-dashboard \.hero-cta-row[^{]*\{[^}]*height:(?:[1-3]?\d|4[0-3])px/);
});

test('Hero headline, description, image, and badge are untouched by the CTA edit', () => {
  assert.match(appPage, /data-ko="배우고 싶은 사람과<br><em>가르치는 사람을 연결합니다\.<\/em>" data-en="Connecting people who want to learn <em>with people ready to teach\.<\/em>"/);
  assert.match(appPage, /class="hero-desc" data-ko="디지털 · 음악 · 언어 · 건강 · 문화 · 생활교육까지<br>필요한 교육을 찾고 전문 강사와 연결하세요\./);
  assert.match(appPage, /<img src="\.\.\/assets\/home\/harmony-community-learning\.png\?v=20260915-1"/);
  assert.match(appPage, /data-ko="전문 강사 연결" data-en="Expert instructor matching">전문 강사 연결<\/b>/);
});

test('Programs title is unified to "교육 프로그램"/"Education Programs" on both HOME preview and the Programs detail screen; "전문 교육 프로그램" is gone', () => {
  assert.doesNotMatch(appPage, /전문 교육 프로그램|Professional Programs|PROFESSIONAL PROGRAMS/);
  assert.equal((appPage.match(/data-ko="교육 프로그램" data-en="Education Programs"/g) || []).length, 2, 'expected exactly 2: HOME preview h2 + Programs screen h1');
  assert.match(appPage, /<h2 data-ko="교육 프로그램" data-en="Education Programs">교육 프로그램<\/h2>/);
  assert.match(appPage, /<h1 data-ko="교육 프로그램" data-en="Education Programs">교육 프로그램<\/h1>/);
  // Matches the real website's own naming for this same content (script.js's specialty-banners section).
  assert.match(webScript, /<h2 data-ko="교육 프로그램" data-en="Education Programs">교육 프로그램<\/h2>/);
});

test('Programs card data, images, buttons, and links are untouched -- only the section title changed', () => {
  assert.match(appScript, /function specialtyCards\(\)\{/);
  assert.match(appScript, /const featured=sharedContent\.featuredPrograms\|\|\[\];/);
  assert.match(appPage, /id="recommendedPrograms"/);
  assert.match(appPage, /id="programList"/);
  const sharedContent = read('shared-content.js');
  assert.match(sharedContent, /하이벨 디지털/);
  assert.match(sharedContent, /하이벨 화상영어/);
  assert.match(sharedContent, /미란멜로디/);
});

test('Business section title is unified to "Business Spotlight" on HOME (both languages); "업체 광고 · 제휴 공간"/"Business Ads & Partnerships" is gone', () => {
  assert.doesNotMatch(appPage, /업체 광고 · 제휴 공간|Business Ads & Partnerships/);
  assert.match(appPage, /<p class="eyebrow" data-ko="BUSINESS SPOTLIGHT" data-en="BUSINESS SPOTLIGHT">BUSINESS SPOTLIGHT<\/p>/);
  assert.match(appPage, /<h2 data-ko="Business Spotlight" data-en="Business Spotlight">Business Spotlight<\/h2>/);
  // Matches the real website's own eyebrow/title for the same feature (script.js's dynamically
  // inserted #advertising section and the business flyer modal header).
  assert.match(webScript, /<p class="eyebrow">BUSINESS SPOTLIGHT<\/p><h2 data-ko="비즈니스 스포트라이트" data-en="Business Spotlight">/);
  assert.match(webScript, /<p>BUSINESS SPOTLIGHT<\/p><h2 id="businessFlyerTitle">/);
});

test('Business Preview still renders exactly one canonical business, carousel and "더보기" link unaffected by the title change', () => {
  assert.match(appScript, /function renderPartners\(\)\{[\s\S]*?Math\.min\(1,partners\.length\)/);
  assert.match(appPage, /<a href="\.\.\/#partner-center" data-ko="더보기" data-en="See More">더보기<\/a>/);
  assert.match(appPage, /class="app-partner-prev" type="button"/);
  assert.match(appPage, /class="app-partner-next" type="button"/);
});

test('Business/Events canonical data are untouched by the title/CTA edits', () => {
  const businessesData = read('shared/data/businesses.js');
  const eventsData = read('shared/data/events.js');
  // shared/data/businesses.js's own header comment already legitimately says "Business
  // Spotlight" (the feature name, from Phase 1) -- check for the new HTML markup this
  // round introduced instead of banning that plain phrase.
  assert.doesNotMatch(businessesData, /hero-cta-row|<h2 data-ko="Business Spotlight"|data-ko="교육 프로그램" data-en="Education Programs"/);
  assert.doesNotMatch(eventsData, /hero-cta-row|<h2 data-ko="Business Spotlight"|data-ko="교육 프로그램" data-en="Education Programs"/);
  const businessCount = (businessesData.match(/id:"[a-z0-9-]+"/g) || []).length;
  assert.equal(businessCount, 6);
  const eventIds = [...eventsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(eventIds, ['messiah', 'hole19-tournament', 'free-music-class', 'ai-business-automation', 'one-day-class', 'finance-ai-seminar']);
});

test('Bottom nav (5 items), hamburger, Quick Access (2x2, 4 tiles) are untouched by this round\'s edits', () => {
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((bottomNav.match(/data-go=|<a /g) || []).length, 5);
  assert.match(appPage, /<nav class="desktop-app-nav" id="appPrimaryNav" aria-label="주요 메뉴">/);
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 4);
  assert.match(quickBlock, /data-go="programs"/);
  assert.match(quickBlock, /href="\.\.\/senior-learning\.html"/);
  assert.match(quickBlock, /data-go="events"/);
  assert.match(quickBlock, /href="\.\.\/#partner-center"/);
});

test('the general website files are unaffected by this app-only round', () => {
  assert.doesNotMatch(webIndex, /hero-cta-row|quick-access|hero-dashboard/);
  assert.doesNotMatch(webStyles, /hero-cta-row|quick-access|hero-dashboard/);
  assert.doesNotMatch(homepageUiCss, /hero-cta-row|quick-access|hero-dashboard/);
});
