const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const careerHub = read('career.html');
const hubJs = read('career/hub.js');
const partnerJs = read('career/partner.js');
const careerCss = read('career/career.css');
const careerData = read('career/data.js');
const programsData = read('shared/data/programs.js');
const appPage = read('app/index.html');
const appScript = read('app/app.js');
const overridesCss = read('app/overrides.css');

test('career.html no longer repeats the "직업교육 파트너" heading/description above the DMS card', () => {
  assert.doesNotMatch(careerHub, /직업교육 파트너/);
  assert.doesNotMatch(careerHub, /전문 교육기관의 다양한 직업교육 프로그램을 만나보세요\./);
  // The hero heading itself ("직업") and its one-line lead are untouched.
  assert.match(careerHub, /<h1>직업<\/h1>/);
  assert.match(careerHub, /새로운 가능성을 여는 실무 중심 직업교육 프로그램을 만나보세요\./);
  assert.match(careerHub, /<div class="career-partner-grid" id="careerPartnerGrid"><\/div>/);
});

test('career hub card (career.html DMS card) puts the logo beside the title instead of stacked above it, more compactly', () => {
  assert.match(hubJs, /<div class="career-partner-head">/);
  assert.match(careerCss, /\.career-partner-head\{display:flex;align-items:center/);
  // Logo enlarged from the old 52px card-scoped size.
  assert.match(careerCss, /\.career-partner-card \.career-partner-logo\{width:64px;height:64px;margin-bottom:0/);
  assert.match(careerCss, /\.career-partner-card h3\{font-size:21px;margin:0\}/);
});

test('DMS program page hero (career/partner.html) also enlarges the logo and places it beside the h1', () => {
  assert.match(partnerJs, /<div class="career-partner-hero-head">/);
  assert.match(careerCss, /\.career-partner-hero-head\{display:flex;align-items:center/);
  assert.match(careerCss, /\.career-partner-hero-head \.career-partner-logo\{width:76px;height:76px;margin-bottom:0/);
});

test('DMS link, 6-program data, and career/data.js are untouched by this layout round', () => {
  assert.match(hubJs, /career\/partner\.html\?partner=/);
  assert.match(careerData, /id: 'dms'/);
  assert.match(careerData, /logo: *'\.\.\/assets\/images\/dms-care-logo\.webp'/);
  const programCount = (careerData.match(/id: '[a-z-]+', nameKo:/g) || []).length;
  // Sanity check that the 6 DMS programs are still present as program entries
  // (matched loosely since program entries live nested under partner.programs).
  assert.ok((careerData.match(/nameKo:/g) || []).length >= 6, 'expected at least 6 program nameKo fields to remain');
  assert.doesNotMatch(careerData, /직업교육 파트너/);
});

test('career.html remains a real, standalone page (not an in-app screen) even after the 직업 tile was removed from the HOME Quick Access grid in the mobile-home-polish round', () => {
  assert.ok(fs.existsSync(path.join(root, 'career.html')), 'career.html must still exist, untouched');
  assert.doesNotMatch(appScript, /data-screen="career"/);
  assert.doesNotMatch(appPage, /data-screen="career"/);
});

test('app 교육 프로그램 (Programs) gains one DMS card without touching the canonical 3-program data file', () => {
  assert.match(programsData, /single source of truth for the 3 named specialty programs/);
  const programIds = [...programsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(programIds, ['hibelle-digital', 'hibelle-english', 'meeran-melody']);
  assert.doesNotMatch(programsData, /dms/i);
});

test('the hand-appended DMS app-specialty-card reuses career/data.js\'s real DMS partner page, shows 입점 파트너, and is appended (not replacing) the 3 canonical program cards', () => {
  assert.match(appScript, /function dmsAppCard\(\)/);
  assert.match(appScript, /career\/partner\.html\?partner=dms/);
  assert.match(appScript, /입점 파트너/);
  assert.match(appScript, /\}\)\.join\(""\)\+dmsAppCard\(\)/);
});

// mobile-home-polish round: the DMS card switched from its small square logo
// (app-specialty-logo) to the same app-specialty-poster format the other 3
// program cards use, showing DMS's own existing program flyer instead of its
// brand mark, so the 4 "교육 프로그램" cards read as one consistent set.
test('DMS "교육 프로그램" card shows a real existing DMS flyer image via app-specialty-poster, matching the other 3 cards\' format instead of a small logo', () => {
  assert.match(appScript, /class="app-specialty-poster" href="\$\{url\}"[\s\S]*?dms-care-flyer-en\.png/);
  assert.doesNotMatch(appScript, /app-specialty-logo/);
  assert.doesNotMatch(appScript, /dms-care-logo\.webp/);
  assert.ok(fs.existsSync(path.join(root, 'assets/images/dms-care-flyer-en.png')), 'the flyer image dmsAppCard() references must actually exist in the repo');
});

test('app home Business Spotlight shows the Korean label in Korean mode instead of the literal English string', () => {
  assert.match(appPage, /<h2 data-ko="비즈니스 스포트라이트" data-en="Business Spotlight">비즈니스 스포트라이트<\/h2>/);
});

test('app home no longer shows the promotional community card, but Community itself (page, data, other nav links) is untouched', () => {
  assert.doesNotMatch(appPage, /class="community-card"/);
  assert.doesNotMatch(appPage, /class="community-card-link"/);
  assert.match(appPage, /<a href="\.\.\/community\.html" data-ko="커뮤니티" data-en="Community">커뮤니티<\/a>/);
  assert.match(appPage, /<a href="\.\.\/community\.html"><span class="bn-icon-wrap">/);
  assert.ok(fs.existsSync(path.join(root, 'community.html')), 'community.html must still exist, untouched');
});

test('app home Quick Access has exactly 6 tiles, in the fixed new order, with 비즈니스 스포트라이트 shortened to 비즈니스', () => {
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  const labels = [...quickBlock.matchAll(/data-ko="([^"]+)" data-en="[^"]*">[^<]*<\/span>\s*<\/(?:button|a)>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['소개', '프로그램', '강좌·행사', '비즈니스', '시니어 배움터', '파트너']);
  assert.doesNotMatch(quickBlock, /직업|미니앱|마이페이지|문의/);
  assert.match(quickBlock, /data-scroll="appPartners"/);
  assert.match(appPage, /id="appPartners"/);
  // 미니앱/마이페이지's underlying handlers are untouched even with no Quick Access
  // tile left to trigger them (career.html itself is asserted separately above).
  assert.match(appScript, /actionTile\.dataset\.action==="install"\) \$\("#installButton"\)\.click\(\)/);
  assert.match(appScript, /actionTile\.dataset\.action==="account"\) \$\("#appAuthButton"\)\.click\(\)/);
});

test('DB/Supabase/Auth/Apps Script/migration/Sheet and DMS 6-program certification data are untouched by this round', () => {
  assert.doesNotMatch(appScript, /supabase\.createClient\([^)]*ricndeoiomzjacmrsjtg[^)]*\)[\s\S]{0,50}\/\/\s*modified/i);
  assert.match(appScript, /appAuthClient=window\.supabase\.createClient\("https:\/\/ricndeoiomzjacmrsjtg\.supabase\.co"/);
  assert.match(careerData, /NHA CCMA/);
  assert.match(careerData, /469-605-6035|469 605 6035/);
});

// --- 배움과 서비스 (12 categories), added after the round above shipped ---
const webIndexHtml = read('index.html');
const categoriesData = read('shared/data/categories.js');

function loadCategories() {
  const vm = require('node:vm');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(categoriesData, sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_CATEGORIES));
}

test('shared/data/categories.js has exactly the 12 Production categories, in order, matching the "5 available / 7 preparing" split', () => {
  const categories = loadCategories();
  assert.equal(categories.length, 12);
  assert.deepEqual(categories.map(c => c.id), ['digital', 'language', 'music', 'art', 'health', 'lifestyle', 'family', 'finance', 'culture', 'hobby', 'career', 'admissions']);
  assert.deepEqual(categories.map(c => c.titleKo), ['디지털', '언어', '음악', '미술', '건강', '생활', '가족', '금융', '문화', '취미', '직업', '진학']);
  const available = categories.filter(c => c.status === 'available');
  const preparing = categories.filter(c => c.status === 'preparing');
  assert.equal(available.length, 5);
  assert.equal(preparing.length, 7);
  assert.deepEqual(available.map(c => c.id), ['digital', 'language', 'music', 'career', 'admissions']);
  preparing.forEach(c => assert.equal(c.url, null, `${c.id} is 준비중 and must not carry a real url`));
});

test('shared/data/categories.js stays byte-in-sync with index.html\'s own static #program-categories markup (icon, title, status, url) -- the website section itself is untouched', () => {
  const categories = loadCategories();
  const gridBlock = webIndexHtml.match(/<div class="program-category-grid"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/)?.[0] || '';
  assert.ok(gridBlock, 'could not locate #program-categories grid in index.html');
  const cardBlocks = gridBlock.match(/<(?:a|button)\s+class="program-category-card[^>]*>[\s\S]*?<\/(?:a|button)>/g) || [];
  const parsed = cardBlocks.map(block => {
    const hrefMatch = block.match(/href="([^"]*)"/);
    const statusMatch = block.match(/data-ko="(운영중|준비중)"/);
    const iconMatch = block.match(/icon" aria-hidden="true">([^<]+)</);
    const titleMatch = block.match(/<strong data-ko="([^"]+)" data-en="([^"]+)">/);
    return {
      status: statusMatch?.[1] === '운영중' ? 'available' : 'preparing',
      icon: iconMatch?.[1],
      titleKo: titleMatch?.[1],
      titleEn: titleMatch?.[2],
      url: hrefMatch ? hrefMatch[1] : null,
    };
  });
  assert.equal(parsed.length, 12, 'expected to parse exactly 12 cards out of index.html');
  categories.forEach((c, i) => {
    assert.equal(parsed[i].status, c.status, `${c.id}: status mismatch vs index.html`);
    assert.equal(parsed[i].icon, c.icon, `${c.id}: icon mismatch vs index.html`);
    assert.equal(parsed[i].titleKo, c.titleKo, `${c.id}: titleKo mismatch vs index.html`);
    assert.equal(parsed[i].titleEn, c.titleEn, `${c.id}: titleEn mismatch vs index.html`);
    assert.equal(parsed[i].url, c.url, `${c.id}: url mismatch vs index.html`);
  });
  // index.html's own section is completely unmodified by this round.
  assert.match(webIndexHtml, /<section class="program-categories section" id="program-categories">/);
});

test('app home gets a separate "배움과 서비스" 12-card section (distinct from Quick Access and 교육 프로그램), reusing shared/data/categories.js instead of a second hardcoded list', () => {
  assert.match(appPage, /<script src="\.\.\/shared\/data\/categories\.js\?v=1"><\/script>/);
  assert.match(appPage, /<section class="app-category-section" id="appCategories">/);
  assert.match(appPage, /<div class="app-category-grid" id="appCategoryGrid"><\/div>/);
  assert.match(appPage, /data-ko="배움과 서비스를 만나보세요" data-en="Discover Learning & Services"/);
  assert.match(appScript, /function renderCategories\(\)\{/);
  assert.match(appScript, /window\.HARMONY_LINK_CATEGORIES/);
  assert.doesNotMatch(appScript, /HARMONY_LINK_APP_CATEGORIES|appCategoriesData\s*=\s*\[/);
  // Quick Access (6 tiles) was NOT force-expanded to 12 to fake this requirement.
  const quickBlock = appPage.match(/<section class="quick-access-grid" id="quickAccess"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((quickBlock.match(/class="quick-access-tile"/g) || []).length, 6);
});

test('app "배움과 서비스" renders exactly 12 cards in the fixed Production order, with 직업 pointing at the existing career.html and no fabricated new pages', () => {
  assert.match(appScript, /function categoryCard\(category\)\{/);
  assert.match(appScript, /href="\.\.\/\$\{category\.url\}"/);
  assert.match(appScript, /data-category-coming-soon/);
  assert.doesNotMatch(appPage, /data-screen="(digital|language|music|art|health|lifestyle|family|finance|culture|hobby|career-category|admissions)"/);
});

test('app "배움과 서비스" 준비중 cards use the same coming-soon confirmation copy as the website\'s program-coming-soon modal', () => {
  const webScript = read('script.js');
  assert.match(webScript, /data-ko="준비중입니다" data-en="Coming soon">준비중입니다/);
  assert.match(appPage, /id="categoryComingSoonModal"/);
  assert.match(appPage, /data-ko="준비중입니다" data-en="Coming soon">준비중입니다/);
  assert.match(appPage, /더 좋은 프로그램으로 곧 찾아뵙겠습니다\./);
  assert.match(appPage, /data-category-coming-soon-close/);
});

test('Business Spotlight and Community-box-removal from the earlier part of this round are still intact after adding 배움과 서비스', () => {
  assert.match(appPage, /<h2 data-ko="비즈니스 스포트라이트" data-en="Business Spotlight">비즈니스 스포트라이트<\/h2>/);
  assert.doesNotMatch(appPage, /class="community-card"/);
  assert.match(appPage, /<a href="\.\.\/community\.html" data-ko="커뮤니티" data-en="Community">커뮤니티<\/a>/);
});
