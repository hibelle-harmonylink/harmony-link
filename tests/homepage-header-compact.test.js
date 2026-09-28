const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const englishClassPage = fs.readFileSync(path.join(root, 'online-english', 'index.html'), 'utf8');
const musicClassPage = fs.readFileSync(path.join(root, 'meeran-melody', 'index.html'), 'utf8');
const musicProgramPage = fs.readFileSync(path.join(root, 'meeran-melody', 'program.html'), 'utf8');

test('desktop header balances the complete menu group against the hero container', () => {
  assert.match(css, /grid-template-columns:64px minmax\(96px,112px\) 64px 72px 62px 48px 48px 90px max-content/);
  assert.match(css, /justify-content:end!important/);
  assert.match(css, /margin-left:auto!important/);
  assert.match(css, /auth-nav-slot[^}]*flex-wrap:nowrap!important/);
  assert.match(css, /auth-user[^}]*white-space:nowrap!important/);
  assert.match(css, /height:72px!important/);
});

test('KO and EN use equal centered button cells', () => {
  assert.match(css, /lang-toggle\{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:90px!important;height:36px!important/);
  assert.match(css, /lang-toggle span\{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:42px!important;height:32px!important/);
});

test('English header cells fit the full labels before switching to the existing compact menu', () => {
  assert.match(css, /html\[lang="en"\] \.site-header \.primary-nav\{\s*grid-template-columns:64px minmax\(96px,112px\) 106px 96px 74px 48px 52px 90px max-content/);
  assert.match(css, /@media\(max-width:1200px\)\{[\s\S]*?html\[lang="en"\] \.site-header \.primary-nav\.open/);
  assert.match(css, /@media\(max-width:1200px\)\{[\s\S]*?html\[lang="en"\] \.site-header \.primary-nav\{[^}]*font-size:13px!important/);
  assert.doesNotMatch(css, /html\[lang="en"\] \.site-header \.primary-nav\{[^}]*font-size:11px!important/);
  assert.match(css, /html\[lang="en"\] \.site-header \.header-partner-link::before\{content:"Partner Center"\}/);
  assert.match(script, /partnerCenterNav\.dataset\.en = 'Partner Center'/);
  assert.match(page, /class="header-partner-link" href="#partner-center" data-ko="파트너" data-en="Partner Center"/);
  [englishClassPage, musicClassPage, musicProgramPage].forEach(staticPage => {
    assert.match(staticPage, /href="\/#partner-center" data-ko="파트너" data-en="Partner Center"/);
    assert.doesNotMatch(staticPage, /data-en="Partners"/);
  });
  assert.match(script, /const usesCompactHeader = \(\) => window\.innerWidth <= 760 \|\| \(currentLanguage === 'en' && window\.innerWidth <= 1200\)/);
});

test('language changes refresh the Business Spotlight grid without calling the retired carousel renderer', () => {
  assert.doesNotMatch(script, /renderAdvertisingCarousel/);
  assert.match(script, /window\.setTimeout\(renderBusinessSpotlights,0\)/);
  assert.match(script, /mobileLanguageButton\.onclick=\(\)=>\{\s*setLanguage\(currentLanguage==='ko'\?'en':'ko'\);\s*renderBusinessSpotlights\(\);/);
  assert.match(script, /let selectedBusinessRegion = 'all';/);
  assert.match(script, /function renderBusinessSpotlights\(selectedRegion=selectedBusinessRegion\) \{\s*selectedBusinessRegion = selectedRegion;/);
  assert.match(script, /summary=currentLanguage==='en'\?\(item\.summaryEn\|\|item\.copyEn\):\(item\.summaryKo\|\|item\.copy\)/);
});

test('homepage menu keeps the senior learning link and uses the requested education-program title', () => {
  assert.match(page, /href="senior-learning\.html"/);
  assert.match(script, /EDUCATION PROGRAMS/);
  assert.match(script, /data-ko="교육 프로그램" data-en="Education Programs"/);
  assert.doesNotMatch(script, /PROFESSIONAL EDUCATION PROGRAMS|data-ko="전문 교육 프로그램"/);
});
