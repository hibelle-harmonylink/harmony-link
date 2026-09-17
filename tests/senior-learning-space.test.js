const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'senior-learning.html'), 'utf8');
const materialsPage = fs.readFileSync(path.join(root, 'senior-learning-materials.html'), 'utf8');
const miniAppsPage = fs.readFileSync(path.join(root, 'senior-mini-apps.html'), 'utf8');
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
  assert.match(auth, /'senior-learning\.html', 'senior-learning-materials\.html', 'senior-mini-apps\.html'/);
  assert.match(auth, /window\.location\.replace\(returnTarget\)/);
});

test('senior learning preserves six source categories while grouping their materials into three cards', () => {
  for (const title of ['스마트폰', '설정과 화면', '생활 디지털', 'AI 배우기', '디지털 취미', '디지털 안전']) assert.match(script, new RegExp(`title:'${title}'`));
  for (const title of ['스마트폰', '컴퓨터', 'AI 도구']) assert.match(script, new RegExp(`title:'${title}'`));
  for (const description of ['스마트폰 사용법을 쉽게 배워보세요.', '컴퓨터 사용법을 쉽게 배워보세요.', '유용한 AI 도구를 쉽게 배워보세요.']) assert.match(script, new RegExp(`description:'${description.replace(/[.]/g, '\\.')}'`));
  assert.match(script, /const sourceLearningData = \[/);
  assert.match(script, /sourceLearningData\.find\(category => category\.id === 'settings'\)\.lessons/);
  assert.match(script, /sourceLearningData\.find\(category => category\.id === 'daily-digital'\)\.lessons/);
  assert.match(script, /sourceLearningData\.find\(category => category\.id === 'safety'\)\.lessons/);
  assert.match(script, /sourceLearningData\.find\(category => category\.id === 'digital-hobby'\)\.lessons/);
  assert.match(script, /accessLevel:'free'/);
  assert.match(script, /status:'ready'/);
  assert.match(script, /status:'preparing'/);
  assert.match(script, /assets\/digital-program\/slide-\$\{index \+ 1\}\.png/);
});

test('senior learning keeps the original cognition card and provides an extensible mini-app page', () => {
  assert.match(home, /class="program-category-card is-coming-soon reveal" type="button" data-program-coming-soon/);
  assert.match(home, /<strong data-ko="인지" data-en="Cognitive">인지<\/strong>/);
  assert.doesNotMatch(home.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || '', />미니\s*앱</);
  assert.match(script, /const miniApps = \[/);
  assert.match(script, /title:'한자 변환기'/);
  assert.match(script, /href:'easy-hanja\.html'/);
  assert.match(script, /한자 정보를 쉽게 확인해보세요/);
  assert.match(script, />사용하기</);
  assert.match(script, /mini-hanja\.svg/);
  assert.match(css, /\.senior-mini-app-grid \{ display:grid; grid-template-columns:repeat\(3,minmax\(0,1fr\)\); gap:22px; \}/);
  assert.match(css, /@media \(max-width:620px\)[\s\S]*?\.senior-mini-app-grid \{ grid-template-columns:1fr;/);
  assert.match(page, /senior-learning\.css\?v=20260916-25/);
  assert.match(page, /senior-learning\.js\?v=20260916-25/);
  assert.match(miniAppsPage, /data-senior-page="mini-apps"/);
  assert.match(miniAppsPage, /생활에 도움이 되는 간편한 디지털 도구를 이용해보세요/);
  assert.match(miniAppsPage, /href="senior-learning\.html">← 시니어 배움터/);
  assert.match(miniAppsPage, /return=senior-mini-apps\.html/);
});

test('senior learning home keeps its choices and routes each choice to a dedicated page', () => {
  assert.match(page, /senior-account-actions/);
  assert.match(page, /id="seniorSignout"/);
  assert.match(page, /필요한 디지털 정보와 생활에 도움이 되는 도구를 쉽고 편하게 이용해보세요/);
  assert.match(script, /assets\/senior-learning\/textbook-card\.svg/);
  assert.match(script, /assets\/senior-learning\/mini-app-card\.svg/);
  assert.match(script, /href="senior-learning-materials\.html"/);
  assert.match(script, /href="senior-mini-apps\.html"/);
  assert.doesNotMatch(script, /data-senior-tab/);
  assert.doesNotMatch(script, /const setTab = tab =>/);
  assert.match(materialsPage, /data-senior-page="materials"/);
  assert.match(materialsPage, /스마트폰과 디지털 사용법을 필요한 주제별로 확인해보세요/);
  assert.match(materialsPage, /href="senior-learning\.html">← 시니어 배움터/);
  assert.match(materialsPage, /return=senior-learning-materials\.html/);
  assert.match(materialsPage, /senior-learning\.js\?v=20260916-26/);
  assert.match(script, /client\?\.auth\.signOut\(\)/);
  assert.match(css, /\.tool-site-header \{ min-height:68px; background:#eef8f1!important;/);
  assert.match(css, /\.senior-content-tabs \{[^}]*display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
  assert.match(css, /\.senior-section-choice \{ min-height:360px;/);
  assert.match(css, /@media \(max-width:620px\).*?\.senior-content-tabs \{ grid-template-columns:1fr;/s);
});

test('senior learning materials and mini apps share protected rendering without repeating the home choices', () => {
  assert.match(script, /const pageMode = document\.body\.dataset\.seniorPage \|\| 'home'/);
  assert.match(script, /if \(pageMode === 'home'\) \{ content\.innerHTML = renderHomeChoices\(\); return; \}/);
  assert.match(script, /if \(pageMode === 'mini-apps'\) \{ content\.innerHTML = renderMiniApps\(\); return; \}/);
  assert.match(script, /const renderMiniApps = \(\) => `<section class="senior-mini-apps">/);
  assert.doesNotMatch(materialsPage, /senior-section-choice/);
  assert.doesNotMatch(miniAppsPage, /senior-section-choice/);
  assert.match(script, /const renderCategories =/);
  assert.match(script, /const renderMiniApps =/);
  assert.match(script, /data-mini-app-card/);
  assert.match(script, /event\.key === ' '/);
  assert.match(script, /<a class="senior-mini-app-card"/);
  for (const asset of ['material-smartphone.svg', 'material-computer.svg', 'material-ai.svg', 'mini-hanja.svg']) {
    assert.equal(fs.existsSync(path.join(root, 'assets', 'senior-learning', asset)), true, `${asset} exists`);
  }
  assert.match(script, /<b>교재 보기<\/b>/);
  assert.match(css, /\.senior-category-card \{ min-height:390px;/);
  assert.match(css, /\.senior-mini-app-card \{ min-height:390px;/);
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
