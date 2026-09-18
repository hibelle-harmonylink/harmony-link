const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'easy-hanja.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'easy-hanja.js'), 'utf8');
const dictionary = fs.readFileSync(path.join(root, 'hanja-dictionary.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'easy-hanja.css'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const miniApps = fs.readFileSync(path.join(root, 'mini-apps.html'), 'utf8');
const dictionaryContext = { window: {} };
vm.runInNewContext(dictionary, dictionaryContext);
const localDictionary = dictionaryContext.window.HARMONY_HANJA_DICTIONARY;

test('hanja converter has the requested member gate and accessible conversion controls', () => {
  assert.match(page, /<h1 id="hanjaTitle">한자 변환기<\/h1>/);
  assert.doesNotMatch(page, /쉬운 한자 찾기/);
  assert.match(page, /한글을 입력하면 관련 한자를 쉽게 확인할 수 있어요\./);
  assert.match(page, /<label for="hanjaQuery"[^>]*>한글을 입력하세요<\/label>/);
  assert.match(page, /placeholder="한글을 입력하세요"/);
  assert.match(page, />변환하기<\/button>/);
  assert.match(page, /하모니링크 회원이면 무료로 사용할 수 있어요/);
  assert.match(page, /회원가입 또는 로그인 후 바로 이용하실 수 있습니다\./);
  assert.match(page, /무료 회원가입/);
  assert.match(page, /로그인/);
  assert.match(page, /index\.html\?auth=signup&amp;return=easy-hanja\.html/);
  assert.match(page, /index\.html\?auth=login&amp;return=easy-hanja\.html/);
});

test('hanja converter uses an extensible local word lexicon and only returns verified results', () => {
  for (const pair of ["['학교','學校'", "['교육','敎育'", "['문화','文化'", "['건강','健康'", "['음악','音樂'", "['사랑','愛'"]) assert.match(dictionary, new RegExp(pair.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(dictionary, /window\.HARMONY_HANJA_DICTIONARY/);
  assert.match(dictionary, /\['英','영','꽃부리 영'\]/);
  assert.match(dictionary, /\['永','영','길 영'\]/);
  assert.match(dictionary, /\['民','민','백성 민'\]/);
  assert.match(script, /word\.hangul === value \|\| word\.hanja === value/);
  assert.match(script, /적절한 한자 변환 결과를 찾지 못했습니다\./);
  assert.match(script, /value\.length === 1/);
  assert.ok(localDictionary.words.length >= 70);
  for (const [hangul, hanja] of [['학교', '學校'], ['교육', '敎育'], ['문화', '文化'], ['건강', '健康'], ['음악', '音樂']]) {
    assert.equal(localDictionary.words.find(word => word.hangul === hangul)?.hanja, hanja);
  }
  assert.match(script, /const isHanja/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /class="hanja-character"/);
  assert.match(script, /data-hanja-copy/);
});

test('homepage keeps cognition as the original category and keeps mini apps outside primary navigation', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const categoryStart = homepage.indexOf('id="program-categories"');
  const categoryMarkup = homepage.slice(categoryStart, homepage.indexOf('</section>', categoryStart));
  const primaryNav = homepage.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(categoryMarkup, /data-program-coming-soon[\s\S]*?data-ko="인지" data-en="Cognitive">인지<\/strong>/);
  assert.doesNotMatch(categoryMarkup, /href="mini-apps\.html"/);
  assert.doesNotMatch(primaryNav, /미니\s*앱|Mini Apps/);
  assert.doesNotMatch(primaryNav, />인지</);
  assert.doesNotMatch(homepage, /easy-hanja-entry/);
  assert.match(homepage, /auth\.js\?v=20260916-15/);
});

test('mini apps page provides the easy hanja finder as its first app', () => {
  assert.match(miniApps, /<h1 id="miniAppsTitle">미니 앱<\/h1>/);
  assert.match(miniApps, /href="easy-hanja\.html"/);
  assert.match(miniApps, /쉬운 한자 찾기/);
  assert.match(miniApps, /한글이나 한자를 입력하면 뜻과 읽는 법을 쉽게 찾아드려요\./);
  assert.match(miniApps, /class="logo"/);
  assert.match(miniApps, /class="logo-mark brand-image"/);
  assert.match(miniApps, /assets\/harmony-logo\.png/);
  assert.match(miniApps, /class="header-login"/);
  assert.match(miniApps, /class="site-header tool-site-header"/);
  assert.match(miniApps, /class="logo-mark brand-image"/);
  assert.match(miniApps, /이음문화센터/);
  assert.match(css, /\.mini-app-card/);
});

test('all active member types can use the tool through the existing sign-in flow', () => {
  assert.match(script, /\['active','expiring'\]\.includes/);
  assert.doesNotMatch(script, /membership === 'premium'|membership === 'basic'/);
  assert.match(auth, /requestedEasyHanjaReturn/);
  assert.match(auth, /returnToEasyHanjaIfRequested/);
  assert.match(auth, /\?return=\$\{encodeURIComponent\(requestedReturn\)\}/);
  assert.match(auth, /if \(event === 'SIGNED_IN'\) returnToEasyHanjaIfRequested\(session\)/);
});

test('easy hanja keeps a loading state until OAuth-returned session and member profile are confirmed', () => {
  assert.match(page, /id="hanjaLoading"[\s\S]*?회원 정보를 확인하고 있어요\.\.\./);
  assert.match(script, /const showLoading = \(\) =>/);
  assert.match(script, /Array\.isArray\(rpcData\) \? rpcData\[0\] : rpcData/);
  assert.match(script, /for \(let attempt = 0; attempt < 3; attempt \+= 1\)/);
  assert.match(script, /client\?\.auth\.onAuthStateChange\(\(event, session\) =>/);
  assert.match(script, /if \(event !== 'INITIAL_SESSION'\) void checkMember\(session\)/);
  assert.match(script, /\['active','expiring'\]\.includes\(profile\?\.account_status/);
});

test('easy hanja finder keeps large touch controls and a single-column mobile result layout', () => {
  assert.match(css, /\.hanja-button\s*\{\s*min-height:\s*52px/);
  assert.match(css, /\.hanja-search-row input\s*\{\s*min-width:\s*0;\s*flex:\s*1;\s*height:\s*56px/);
  assert.match(css, /@media\s*\(max-width:\s*620px\).*?\.hanja-results\s*\{\s*grid-template-columns:\s*1fr/s);
});

test('easy hanja header reuses the homepage logo markup and header login style', () => {
  assert.match(page, /class="site-header(?:\s+[^"]+)?"/);
  assert.match(page, /class="logo"/);
  assert.match(page, /class="logo-mark brand-image"/);
  assert.match(page, /assets\/harmony-logo\.png/);
  assert.match(page, /이음문화센터/);
  assert.match(page, /class="hanja-account-actions"/);
  assert.match(page, /id="hanjaSignout"/);
  assert.match(page, /href="senior-mini-apps\.html">← 미니앱/);
  assert.match(page, /class="site-header tool-site-header"/);
  assert.match(css, /\.tool-site-header \.nav-wrap \{ justify-content: space-between !important; \}/);
  assert.match(css, /\.hanja-account-actions \{ display:flex; align-items:center;/);
  assert.match(css, /\.tool-site-header \.hanja-account-actions \.header-login/);
  assert.doesNotMatch(css, /body \{[^}]*font-family:/);
  assert.match(page, /styles\.css\?v=20260916-19/);
  assert.match(page, /easy-hanja\.css\?v=20260916-30/);
  assert.match(page, /hanja-dictionary\.js\?v=20260916-30/);
  assert.match(page, /easy-hanja\.js\?v=20260916-30/);
  assert.match(page, /homepage-ui\.css\?v=20260916-16/);
  assert.doesNotMatch(page, /hanja-logo-mark|hanja-home-link/);
});

test('hanja signout button respects its hidden attribute instead of always rendering', () => {
  // Same class of bug as senior-learning.css: an unconditional
  // `display:...!important` on .header-login overrode the browser's native
  // [hidden] styling, so #hanjaSignout stayed visible with its static
  // "로그아웃" text even for a logged-out visitor whose session check had
  // already set signout.hidden = true.
  assert.match(css, /\.tool-site-header \.hanja-account-actions \.header-login:not\(\[hidden\]\) \{[^}]*display:inline-flex !important/);
  assert.doesNotMatch(css, /\.tool-site-header \.hanja-account-actions \.header-login \{[^}]*display:inline-flex/);
  assert.match(script, /loading\.hidden = false;[\s\S]*?signout\.hidden = true;/);
  assert.match(script, /gate\.hidden = false;[\s\S]*?signout\.hidden = true;/);
  assert.match(script, /app\.hidden = false;[\s\S]*?signout\.hidden = false;/);
});
