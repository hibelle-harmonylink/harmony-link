const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('desktop header reserves one grid slot for every menu item and the account group', () => {
  assert.match(css, /grid-template-columns:64px minmax\(96px,112px\) 64px 72px 62px 48px 48px 76px max-content/);
  assert.match(css, /justify-content:start!important/);
  assert.match(css, /margin-left:0!important/);
  assert.match(css, /auth-nav-slot[^}]*flex-wrap:nowrap!important/);
  assert.match(css, /auth-user[^}]*white-space:nowrap!important/);
  assert.match(css, /height:72px!important/);
});

test('homepage menu keeps the senior learning link and uses the requested education-program title', () => {
  assert.match(page, /href="senior-learning\.html"/);
  assert.match(script, /EDUCATION PROGRAMS/);
  assert.match(script, /data-ko="교육 프로그램" data-en="Education Programs"/);
  assert.doesNotMatch(script, /PROFESSIONAL EDUCATION PROGRAMS|data-ko="전문 교육 프로그램"/);
});
