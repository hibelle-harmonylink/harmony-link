const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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
  assert.match(css, /html\[lang="en"\] \.site-header \.primary-nav\{\s*grid-template-columns:64px minmax\(96px,112px\) 106px 72px 74px 48px 52px 90px max-content/);
  assert.match(css, /html\[lang="en"\] \.site-header \.primary-nav\{\s*grid-template-columns:60px 94px 87px 68px 64px 44px 44px 90px max-content/);
  assert.match(css, /@media\(min-width:761px\) and \(max-width:900px\)\{[\s\S]*?html\[lang="en"\] \.site-header \.primary-nav\.open/);
  assert.match(script, /const usesCompactHeader = \(\) => window\.innerWidth <= 760 \|\| \(currentLanguage === 'en' && window\.innerWidth <= 900\)/);
});

test('homepage menu keeps the senior learning link and uses the requested education-program title', () => {
  assert.match(page, /href="senior-learning\.html"/);
  assert.match(script, /EDUCATION PROGRAMS/);
  assert.match(script, /data-ko="교육 프로그램" data-en="Education Programs"/);
  assert.doesNotMatch(script, /PROFESSIONAL EDUCATION PROGRAMS|data-ko="전문 교육 프로그램"/);
});
