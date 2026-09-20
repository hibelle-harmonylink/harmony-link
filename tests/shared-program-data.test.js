const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const loadPrograms = () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('shared/data/programs.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_PROGRAMS));
};

const programs = loadPrograms();
const byId = id => programs.find(p => p.id === id);

test('canonical program data has exactly the 3 named specialty programs with unique stable IDs', () => {
  assert.equal(programs.length, 3);
  const ids = programs.map(p => p.id);
  assert.deepEqual(ids, ['hibelle-digital', 'hibelle-english', 'meeran-melody']);
  assert.equal(new Set(ids).size, 3);
  // slugs (the website's own short identifiers) are also unique.
  assert.equal(new Set(programs.map(p => p.slug)).size, 3);
});

test('Korean and English fields exist for every program (title/description/status/app tags)', () => {
  programs.forEach(p => {
    ['titleKo', 'titleEn', 'descriptionKo', 'descriptionEn', 'statusKo', 'statusEn', 'appTagsKo', 'appTagsEn', 'appPromoTextKo', 'appPromoTextEn'].forEach(key => {
      assert.ok(p[key] && p[key].length, `${p.id} missing ${key}`);
    });
  });
});

test('titles are identical across web and app (no override needed); descriptions/tags/images intentionally differ per surface', () => {
  // The website's specialtyPrograms and the app's old featuredPrograms used the exact
  // same title strings -- confirming there is no titleKo/titleEn override field here.
  assert.equal(byId('hibelle-digital').titleKo, '하이벨 디지털');
  assert.equal(byId('hibelle-digital').titleEn, 'Hibelle Digital');
  assert.equal(byId('hibelle-english').titleKo, '하이벨 화상영어');
  assert.equal(byId('meeran-melody').titleKo, '미란멜로디');
  // The web's long-form description and the app's short middot tags are genuinely
  // different Production copy, both preserved rather than unified.
  assert.notEqual(byId('hibelle-digital').descriptionKo, byId('hibelle-digital').appTagsKo);
});

test('each program has a web page/poster and a distinct app brand-mark image', () => {
  programs.forEach(p => {
    assert.match(p.image, /^assets\//, `${p.id} web image should be a relative site-root path`);
    assert.match(p.appImage, /^\/assets\/brands\//, `${p.id} appImage should be the app's own brand-mark path`);
    assert.notEqual(p.image, p.appImage, `${p.id} web poster and app brand-mark should be different assets`);
  });
  assert.equal(byId('hibelle-digital').url, 'digital-classes/index.html');
  assert.equal(byId('hibelle-english').url, 'online-english/');
  assert.equal(byId('meeran-melody').url, 'meeran-melody/');
  // The app links back to the website's own Programs section for all 3, unlike the
  // website's per-program dedicated page -- a real, preserved Production difference.
  programs.forEach(p => assert.equal(p.appUrl, '/#specialty-banners'));
});

test('operation status matches Production: 2 directly operated, 1 co-operated', () => {
  assert.equal(programs.filter(p => p.statusEn === 'DIRECTLY OPERATED').length, 2);
  assert.equal(programs.filter(p => p.statusEn === 'CO-OPERATED').length, 1);
  assert.equal(byId('meeran-melody').statusKo, '공동운영');
});

test('script.js (web) reads Programs data from the canonical file instead of hardcoding it', () => {
  const webScript = read('script.js');
  assert.match(webScript, /function programToWebModel\(program\)\{/);
  assert.match(webScript, /const specialtyPrograms = \(window\.HARMONY_LINK_PROGRAMS\|\|\[\]\)\.map\(programToWebModel\);/);
  // The old hand-duplicated 3-entry literal (with inline teacher/form fields) is gone.
  assert.doesNotMatch(webScript, /titleKo:'하이벨 디지털'/);
  // The now-redundant local route lookup was removed in favor of the canonical url field.
  assert.doesNotMatch(webScript, /const programRoutes = \{/);
  assert.match(webScript, /href="\$\{program\.url\}"/);
});

test('index.html loads shared/data/programs.js before script.js', () => {
  const webPage = read('index.html');
  const programsIndex = webPage.indexOf('shared/data/programs.js');
  const scriptIndex = webPage.indexOf('src="script.js');
  assert.ok(programsIndex > -1, 'index.html does not load shared/data/programs.js');
  assert.ok(programsIndex < scriptIndex, 'shared/data/programs.js must load before script.js');
});

test('app/app.js (app) reads Programs data from the canonical file for both the compact preview and the promo carousel', () => {
  const appScript = read('app/app.js');
  assert.match(appScript, /function programToAppModel\(program\)\{/);
  assert.match(appScript, /function programToPromotion\(program\)\{/);
  assert.match(appScript, /const featuredPrograms=\(window\.HARMONY_LINK_PROGRAMS\|\|\[\]\)\.map\(programToAppModel\);/);
  assert.match(appScript, /const programPromotions=\(window\.HARMONY_LINK_PROGRAMS\|\|\[\]\)\.map\(programToPromotion\);/);
  assert.match(appScript, /const programs=\[\.\.\.featuredPrograms,\.\.\.basePrograms\];/);
  // The local homepageFlyers duplicate-image map is gone -- specialtyCards() now
  // derives the poster path straight from the canonical entry's own "image" field.
  assert.doesNotMatch(appScript, /homepageFlyers/);
  assert.match(appScript, /const posterImages=Object\.fromEntries\(\(window\.HARMONY_LINK_PROGRAMS\|\|\[\]\)\.map\(p=>\[p\.id,`\.\.\/\$\{p\.image\}`\]\)\);/);
});

test('app/index.html loads ../shared/data/programs.js before app.js', () => {
  const appPage = read('app/index.html');
  const programsIndex = appPage.indexOf('../shared/data/programs.js');
  const appJsIndex = appPage.indexOf('src="app.js');
  assert.ok(programsIndex > -1, 'app/index.html does not load ../shared/data/programs.js');
  assert.ok(programsIndex < appJsIndex, '../shared/data/programs.js must load before app.js');
});

test('shared-content.js no longer hardcodes the 3 named programs as featuredPrograms or promotions', () => {
  const sharedContent = read('shared-content.js');
  assert.doesNotMatch(sharedContent, /featuredPrograms:\s*\[/);
  assert.doesNotMatch(sharedContent, /하이벨 디지털/);
  assert.doesNotMatch(sharedContent, /하이벨 화상영어/);
  assert.doesNotMatch(sharedContent, /미란멜로디/);
  // The 1 non-program promotion (benefit CTA) must remain untouched.
  assert.match(sharedContent, /kind:"benefit"/);
  assert.match(sharedContent, /titleKo:"PREMIUM 파트너"/);
});

test('no representative program value is hardcoded a second time outside the canonical file and its known adapters', () => {
  const needles = [
    'assets/specialty/hibelle-digital-20260718.jpg',      // web poster path
    'AI와 스마트폰을 실생활에서<br>자신 있게 활용하도록', // Hibelle Digital app promo copy
  ];
  const searchTargets = {
    'index.html': read('index.html'),
    'app/index.html': read('app/index.html'),
    'shared-content.js': read('shared-content.js'),
    'community.html': read('community.html'),
    'community.js': read('community.js'),
    'senior-learning.js': read('senior-learning.js'),
  };
  Object.entries(searchTargets).forEach(([file, content]) => {
    needles.forEach(needle => {
      assert.doesNotMatch(content, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} should not hardcode "${needle}"`);
    });
  });
});

test('HOME Programs Preview and the Programs detail screen both render exactly the 3 canonical programs, and HOME stays CSS-only compact', () => {
  const appPage = read('app/index.html');
  const appScript = read('app/app.js');
  const overridesCss = read('app/overrides.css');
  assert.match(appPage, /id="recommendedPrograms"/);
  assert.match(appPage, /id="programList"/);
  // Both containers are rendered by the exact same specialtyCards() output (3 items);
  // the visual compact-vs-full distinction is scoped by ID in CSS, not by different data.
  assert.match(appScript, /\$\("#recommendedPrograms"\)\.innerHTML=specialtyCards\(\);/);
  assert.match(appScript, /\$\("#programList"\)\.innerHTML=specialtyCards\(\);/);
  assert.match(overridesCss, /#recommendedPrograms\.app-specialty-grid\{grid-template-columns:1fr!important/);
  assert.doesNotMatch(overridesCss, /#programList\.app-specialty-|#programList \.app-specialty-/);
});

test('root and app service workers precache the new canonical programs file with a matching version', () => {
  const rootSw = read('service-worker.js');
  assert.match(rootSw, /'\/shared\/data\/programs\.js\?v=1'/);
  const appSw = read('app/service-worker-v104.js');
  assert.match(appSw, /"\.\.\/shared\/data\/programs\.js\?v=1"/);
  assert.match(appSw, /const CACHE="harmony-link-app-v104"/);
  // Old SW versions are kept on disk, not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v103.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v102.js')), true);
});

test('the 12-category homepage grid and the app basePrograms generic categories are untouched by Programs canonicalization', () => {
  const homepage = read('index.html');
  const appScript = read('app/app.js');
  // The 12-category grid is a completely separate feature from the 3 named programs.
  const categoryStart = homepage.indexOf('id="program-categories"');
  const categoryMarkup = homepage.slice(categoryStart, homepage.indexOf('</section>', categoryStart));
  assert.equal((categoryMarkup.match(/program-category-card/g) || []).length >= 12, true);
  // basePrograms (the app's own unrelated generic-category placeholder list) is untouched.
  assert.match(appScript, /const basePrograms = \[/);
  assert.match(appScript, /id:"cognitive"/);
});
