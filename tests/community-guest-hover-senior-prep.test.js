const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const communityPage = read('community.html');
const community = read('community.js');
const auth = read('auth.js');
const styles = read('styles.css');
const senior = read('senior-learning.js');
const seniorCss = read('senior-learning.css');
const homepage = read('index.html');
const homepageScript = read('script.js');

test('guest community writers get the existing homepage login route while active members keep compose access', () => {
  assert.match(communityPage, /id="communityLoginPrompt"/);
  assert.match(communityPage, /게시글을 작성하려면 로그인이 필요합니다./);
  assert.match(communityPage, /href="index\.html\?auth=login&amp;return=community\.html">로그인/);
  assert.match(community, /if \(!user \|\| !profile\) \{[\s\S]*?communityLoginPrompt[\s\S]*?게시글을 작성하려면 로그인이 필요합니다\./);
  assert.match(community, /showGuestView[\s\S]*?openComposer'\)\.hidden = false/);
  assert.match(community, /communityLoginPrompt'\)\.hidden = true/);
  assert.match(auth, /'senior-mini-apps\.html', 'community\.html'/);
  assert.match(auth, /window\.location\.replace\(returnTarget\)/);
});

test('business promotion is a normal board category directly after jobs without a schema change', () => {
  const jobs = community.indexOf("{ value: 'jobs', label: '구인·구직' }");
  const business = community.indexOf("{ value: 'business', label: '업체 홍보' }");
  const free = community.indexOf("{ value: 'free', label: '자유게시판' }");
  assert.ok(jobs < business && business < free);
  assert.match(community, /Object\.fromEntries\(boardCategories\.map/);
  assert.match(community, /payload = \{ category: document\.getElementById\('postCategory'\)\.value/);
});

test('hover feedback is limited to content cards, desktop pointers, and reduced-motion safe behavior', () => {
  assert.match(styles, /@media \(hover:hover\) and \(pointer:fine\)/);
  assert.match(styles, /\.business-spotlight-card,#partner-center \.partner-tier-guide button\):hover\{transform:translateY\(-4px\);box-shadow:/);
  assert.match(styles, /transition:transform \.22s ease,box-shadow \.22s ease/);
  assert.doesNotMatch(styles.match(/\/\* Shared hover feedback[\s\S]*/)?.[0] || '', /\.auth-modal|\.floating-message-panel|textarea|input|footer/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?transform:none!important/);
});

test('event cards override the reveal transform only for the five visible event-card grids', () => {
  assert.match(styles, /main>section \.reveal\{opacity:1!important;transform:none!important\}/);
  assert.match(styles, /#events \.event-grid>\.event-card:not\(\.event-coming\),#events \.past-event-grid>\.event-card\{transition:transform \.22s ease,box-shadow \.22s ease!important\}/);
  assert.match(styles, /#events \.event-grid>\.event-card:not\(\.event-coming\):hover,#events \.past-event-grid>\.event-card:hover\{transform:translateY\(-4px\)!important/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?#events \.event-grid>\.event-card:not\(\.event-coming\):hover,#events \.past-event-grid>\.event-card:hover\{transform:none!important\}/);
});

test('past event cards reuse only their existing poster assets in the flyer modal', () => {
  assert.match(homepageScript, /pastGrid\.querySelectorAll\('\.event-card'\)/);
  assert.match(homepageScript, /button\.className = 'btn event-flyer-button'/);
  assert.match(homepageScript, /button\.href = poster\.href/);
  assert.match(homepageScript, /data-ko="전단지 보기" data-en="View Flyer"/);
  assert.match(homepageScript, /#events \.event-poster, #events \.event-flyer-button/);
  assert.match(homepage, /assets\/events\/one-day-class\.jpg/);
  assert.match(homepage, /assets\/events\/finance-ai-seminar\.jpg/);
});

test('event flyer overlay closes only outside the modal panel', () => {
  assert.match(homepageScript, /eventFlyerModal\.querySelectorAll\('\[data-event-flyer-close\]'\)\.forEach\(button=>button\.addEventListener\('click',closeEventFlyer\)\)/);
  assert.match(homepageScript, /const eventFlyerPanel=eventFlyerModal\.querySelector\('\.event-flyer-panel'\)/);
  assert.match(homepageScript, /eventFlyerModal\.addEventListener\('click',event=>\{\s*if\(!eventFlyerPanel\.contains\(event\.target\)\)closeEventFlyer\(\);\s*\}\)/);
  assert.match(homepageScript, /<section class="event-flyer-panel" role="dialog"/);
  assert.match(homepageScript, /<div class="event-flyer-scroll"><img src="" alt=""><\/div>/);
  assert.match(homepageScript, /event\.key==='Escape'&&!eventFlyerModal\.hidden\)closeEventFlyer\(\)/);
});

test('DMS keeps its existing business data while using the requested Korean summary', () => {
  assert.match(homepageScript, /summaryKo:'미국 의료 직업 학교'/);
  assert.match(homepageScript, /categoryKo:'미국 의료 직업 학교'/);
  assert.match(homepageScript, /1933 E Frankford Rd\. Suite 165, Carrollton, TX 75007/);
  assert.match(homepageScript, /469-605-6035/);
  assert.match(styles, /\.business-summary\{[^}]*height:21px[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/);
});

test('the learning and services heading is updated while business phone display stays intact and calls do not open flyers', () => {
  assert.match(homepage, /data-ko="배움과 서비스를 만나보세요" data-en="Discover Learning & Services">배움과 서비스를 만나보세요<\/h2>/);
  assert.match(homepageScript, /const renderBusinessPhone = contact => String\(contact \|\| ''\)\.replace/);
  assert.match(homepageScript, /href="tel:\$\{number\.replace\(\/\[\^\\d\+\]\/g, ''\)\}"/);
  assert.match(homepageScript, /const contactMarkup=`<p class="business-contact">\$\{renderBusinessPhone\(contact\)\}<\/p>`/);
  assert.match(homepageScript, /event\.target\.closest\('a,button'\)/);
  for (const phone of ['516-390-1383', '201-585-0958', '929-845-0958', '929-766-0088', '646-996-8093', '718-799-0133', '718-864-6430', '469-605-6035']) {
    assert.match(homepageScript, new RegExp(phone.replace(/-/g, '\\-')));
  }
});

test('smartphone category stays available while every individual material is preparing', () => {
  assert.match(senior, /id:'smartphone'[\s\S]*?status:'ready'/);
  assert.match(senior, /assets\/digital-program\/slide-\$\{index \+ 1\}\.png/);
  assert.match(senior, /const smartphoneLessons = \[/);
  assert.match(senior, /\.map\(lesson => \(\{ \.\.\.lesson, status:'preparing' \}\)\)/);
  assert.match(senior, /id:'smartphone',[\s\S]*?lessons:smartphoneLessons/);
  assert.match(senior, /const isLessonAvailable = lesson => \['ready', 'available'\]\.includes/);
  assert.match(senior, /data-senior-category="\$\{category\.id\}"/);
  assert.match(senior, /aria-disabled="true"/);
  assert.match(senior, />자료 준비중</);
  assert.doesNotMatch(senior, /renderSmartphonePreparation/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'digital-program', 'slide-1.png')));
});
