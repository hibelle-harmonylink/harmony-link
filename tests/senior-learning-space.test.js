const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'senior-learning.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'senior-learning.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'senior-learning.css'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');

test('senior learning space has a homepage entry and uses existing member authentication', () => {
  assert.match(home, /href="senior-learning\.html"[^>]*>시니어 배움터/);
  assert.match(page, /하모니링크 회원을 위한 배움터예요/);
  assert.match(page, /return=senior-learning\.html/);
  assert.match(script, /get_own_member_profile/);
  assert.match(script, /\['active', 'expiring'\]/);
  assert.match(auth, /'senior-learning\.html'/);
  assert.match(auth, /window\.location\.replace\(returnTarget\)/);
});

test('senior learning space defines six data-driven learning categories', () => {
  for (const title of ['스마트폰', '설정과 화면', '생활 디지털', 'AI 배우기', '디지털 취미', '디지털 안전']) assert.match(script, new RegExp(`title:'${title}'`));
  assert.match(script, /accessLevel:'free'/);
  assert.match(script, /status:'ready'/);
  assert.match(script, /status:'preparing'/);
  assert.match(script, /assets\/digital-program\/slide-\$\{index \+ 1\}\.png/);
});

test('senior learning keeps the original cognition card and provides an extensible mini-app area', () => {
  assert.match(home, /class="program-category-card is-coming-soon reveal" type="button" data-program-coming-soon/);
  assert.match(home, /<strong data-ko="인지" data-en="Cognitive">인지<\/strong>/);
  assert.doesNotMatch(home.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || '', />미니\s*앱</);
  assert.match(script, /const miniApps = \[/);
  assert.match(script, /title:'쉬운 한자 찾기'/);
  assert.match(script, /href:'easy-hanja\.html'/);
  assert.match(script, /id="seniorMiniAppsTitle">미니앱</);
  assert.match(script, /배운 내용을 바로 활용할 수 있는 쉬운 디지털 도구/);
  assert.match(script, />사용하기</);
  assert.match(css, /\.senior-mini-app-grid \{ display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\); gap:18px; \}/);
  assert.match(css, /@media \(max-width:620px\)[\s\S]*?\.senior-mini-app-grid \{ grid-template-columns:1fr;/);
  assert.match(page, /senior-learning\.css\?v=20260916-21/);
  assert.match(page, /senior-learning\.js\?v=20260916-21/);
});

test('senior learning viewer supports navigation, fullscreen, progress, and keyboard controls', () => {
  assert.match(script, /data-senior-previous/);
  assert.match(script, /data-senior-next/);
  assert.match(script, /data-senior-fullscreen/);
  assert.match(script, /requestFullscreen/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /\$\{index \+ 1\} \/ \$\{total\}/);
});

test('senior learning layout is responsive and never relies on horizontal scrolling', () => {
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:900px\).*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css, /@media \(max-width:620px\).*grid-template-columns:1fr/s);
  assert.match(css, /aspect-ratio:16\/9/);
});
