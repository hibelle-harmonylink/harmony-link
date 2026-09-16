const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'easy-hanja.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'easy-hanja.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'easy-hanja.css'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const miniApps = fs.readFileSync(path.join(root, 'mini-apps.html'), 'utf8');

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
  assert.match(script, /\['사랑','愛','애','사랑 애'\]/);
  assert.match(script, /\['학교','學校','학교','배울 학 · 학교 교'\]/);
  assert.match(script, /\['한국','韓國','한국','한국 한 · 나라 국'\]/);
  assert.match(script, /\['英','영','꽃부리 영'\]/);
  assert.match(script, /\['永','영','길 영'\]/);
  assert.match(script, /\['榮','영','영화 영'\]/);
  assert.match(script, /\['泳','영','헤엄칠 영'\]/);
  assert.match(script, /\['民','민','백성 민'\]/);
  assert.match(script, /\['敏','민','민첩할 민'\]/);
  assert.match(script, /\['珉','민','옥돌 민'\]/);
  assert.match(script, /\['旻','민','하늘 민'\]/);
  const countCandidates = reading => (script.match(new RegExp(`\\['[^']+','${reading}','[^']+'\\]`, 'g')) || []).length;
  assert.ok(countCandidates('영') >= 4);
  assert.ok(countCandidates('민') >= 4);
  assert.match(script, /\['愛','애','사랑 애'\]/);
  assert.match(script, /\['學','학','배울 학'\]/);
  assert.match(script, /\['國','국','나라 국'\]/);
  assert.match(script, /\.map\(\(\[, hanja, reading, meaning\]\) => \(\{ character:hanja, reading, meaning \}\)\)/);
  assert.match(script, /const isHanja/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /class="hanja-character"/);
  assert.match(script, /data-hanja-copy/);
});

test('homepage provides a mini apps category entry point instead of a standalone easy hanja card', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(homepage, /href="mini-apps\.html"/);
  assert.match(homepage, /data-ko="미니 앱"/);
  assert.match(homepage, /배움에 도움이 되는 간단한 도구를 사용해보세요/);
  assert.doesNotMatch(homepage, /easy-hanja-entry/);
});

test('mini apps page provides the easy hanja finder as its first app', () => {
  assert.match(miniApps, /<h1 id="miniAppsTitle">미니 앱<\/h1>/);
  assert.match(miniApps, /href="easy-hanja\.html"/);
  assert.match(miniApps, /쉬운 한자 찾기/);
  assert.match(miniApps, /한글이나 한자를 입력하면 뜻과 읽는 법을 쉽게 찾아드려요\./);
  assert.match(miniApps, /hanja-logo-mark/);
  assert.match(css, /\.mini-app-card/);
});

test('all active member types can use the tool through the existing sign-in flow', () => {
  assert.match(script, /\['active','expiring'\]\.includes/);
  assert.doesNotMatch(script, /membership === 'premium'|membership === 'basic'/);
  assert.match(auth, /requestedReturn === 'easy-hanja\.html'/);
  assert.match(auth, /returnTarget === 'easy-hanja\.html'/);
});

test('easy hanja finder keeps large touch controls and a single-column mobile result layout', () => {
  assert.match(css, /\.hanja-button\s*\{\s*min-height:\s*52px/);
  assert.match(css, /\.hanja-search-row input\s*\{\s*min-width:\s*0;\s*flex:\s*1;\s*height:\s*56px/);
  assert.match(css, /@media\s*\(max-width:\s*620px\).*?\.hanja-results\s*\{\s*grid-template-columns:\s*1fr/s);
});

test('easy hanja header reuses Harmony Link brand and homepage button styling', () => {
  assert.match(page, /hanja-logo-mark/);
  assert.match(page, /hanja-logo-name/);
  assert.match(page, /이음문화센터/);
  assert.match(css, /\.hanja-home-link\s*\{[^}]*border: 1px solid #b9d1ee/s);
  assert.match(css, /\.hanja-logo-mark\s*\{/);
});
