const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'easy-hanja.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'easy-hanja.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'easy-hanja.css'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');

test('easy hanja finder has the requested member gate and accessible search controls', () => {
  assert.match(page, /쉬운 한자 찾기/);
  assert.match(page, /한글이나 한자를 입력하면 쉽게 찾아드려요\./);
  assert.match(page, /찾고 싶은 한글이나 한자를 입력하세요/);
  assert.match(page, /한자 찾기/);
  assert.match(page, /이 기능은 하모니링크 회원이면 무료로 사용할 수 있어요\./);
  assert.match(page, /무료 회원가입/);
  assert.match(page, /로그인/);
  assert.match(page, /index\.html\?auth=signup&amp;return=easy-hanja\.html/);
  assert.match(page, /index\.html\?auth=login&amp;return=easy-hanja\.html/);
});

test('easy hanja finder searches Hangul and Hanja locally, then supports large display and copying', () => {
  assert.match(script, /const words = \[/);
  assert.match(script, /\['학교','學校','배울 학 · 학교 교'\]/);
  assert.match(script, /const isHanja/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /class="hanja-character"/);
  assert.match(script, /data-hanja-copy/);
});

test('all active member types can use the tool through the existing sign-in flow', () => {
  assert.match(script, /\['active','expiring'\]\.includes/);
  assert.doesNotMatch(script, /membership === 'premium'|membership === 'basic'/);
  assert.match(auth, /requestedReturn === 'easy-hanja\.html'/);
  assert.match(auth, /returnTarget === 'easy-hanja\.html'/);
});

test('easy hanja finder keeps large touch controls and a single-column mobile result layout', () => {
  assert.match(css, /\.hanja-button\{min-height:52px/);
  assert.match(css, /\.hanja-search-row input\{min-width:0;flex:1;height:56px/);
  assert.match(css, /@media\(max-width:620px\).*?\.hanja-results\{grid-template-columns:1fr/s);
});
