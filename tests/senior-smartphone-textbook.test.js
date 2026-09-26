// Regression tests for the Muse -> Drive -> Claude -> Harmony Link textbook
// publishing pipeline: approved PDFs ("01_스마트폰_이것만알기.pdf",
// "02_스마트폰_버튼과화면첫걸음.pdf", "03_스마트폰_손가락으로조작하기.pdf",
// "04_스마트폰_홈화면과앱아이콘.pdf") placed under downloads/senior-learning/
// and surfaced as compact list-row cards in the "스마트폰 교재" section on
// the 시니어배움터 -> 스마트폰 screen, in order, same card design.
//
// As of the "PDF 교재로 통일" round, the 3 legacy folder cards (설정 /
// 인터넷·연결 / 전화·문자·연락처) and their "폴더를 고르세요" guide copy are
// removed from this screen's UI -- but senior-smartphone-lessons.js, its
// data, and assets/senior-learning/ images are intentionally untouched and
// still exist on disk, so Muse can use them as reference material and the
// legacy render code can be reached by state without being deleted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const script = read('senior-learning.js');
const css = read('senior-learning.css');
const pdfPath01 = path.join(root, 'downloads/senior-learning/01_스마트폰_이것만알기.pdf');
const pdfPath02 = path.join(root, 'downloads/senior-learning/02_스마트폰_버튼과화면첫걸음.pdf');
const pdfPath03 = path.join(root, 'downloads/senior-learning/03_스마트폰_손가락으로조작하기.pdf');
const pdfPath04 = path.join(root, 'downloads/senior-learning/04_스마트폰_홈화면과앱아이콘.pdf');
const folders = require('../senior-smartphone-lessons');

test('all four approved PDFs are stored under downloads/senior-learning/ unmodified -- real PDFs at their exact Drive-approved byte size', () => {
  assert.ok(fs.existsSync(pdfPath01), 'PDF file must exist at downloads/senior-learning/01_스마트폰_이것만알기.pdf');
  const buffer01 = fs.readFileSync(pdfPath01);
  assert.match(buffer01.subarray(0, 5).toString('latin1'), /^%PDF-/);
  // Exact byte count (not just "non-trivial size") proves the PDF was placed
  // as-is from Drive, not re-rendered/re-exported/edited.
  assert.equal(buffer01.length, 2625998, '01 PDF must be unchanged from the previous round (same exact size)');

  assert.ok(fs.existsSync(pdfPath02), 'PDF file must exist at downloads/senior-learning/02_스마트폰_버튼과화면첫걸음.pdf');
  const buffer02 = fs.readFileSync(pdfPath02);
  assert.match(buffer02.subarray(0, 5).toString('latin1'), /^%PDF-/);
  assert.equal(buffer02.length, 444076, '02 PDF must match its exact Drive-approved size (unmodified)');

  assert.ok(fs.existsSync(pdfPath03), 'PDF file must exist at downloads/senior-learning/03_스마트폰_손가락으로조작하기.pdf');
  const buffer03 = fs.readFileSync(pdfPath03);
  assert.match(buffer03.subarray(0, 5).toString('latin1'), /^%PDF-/);
  // Exact Drive-approved byte size (384267), confirming a byte-identical
  // copy of the Drive original rather than a re-export/edit.
  assert.equal(buffer03.length, 384267, '03 PDF must match its exact Drive-approved size (unmodified)');

  assert.ok(fs.existsSync(pdfPath04), 'PDF file must exist at downloads/senior-learning/04_스마트폰_홈화면과앱아이콘.pdf');
  const buffer04 = fs.readFileSync(pdfPath04);
  assert.match(buffer04.subarray(0, 5).toString('latin1'), /^%PDF-/);
  // Exact Drive-approved byte size (446851), confirming a byte-identical
  // copy of the Drive original rather than a re-export/edit.
  assert.equal(buffer04.length, 446851, '04 PDF must match its exact Drive-approved size (unmodified)');
});

test('senior-learning.js declares all four smartphone textbooks as data, in order, with 01/02/03 unchanged (extensible for future approved PDFs)', () => {
  assert.match(script, /const smartphoneTextbooks = \[/);
  const dataBlock = script.match(/const smartphoneTextbooks = \[[\s\S]*?\];/)?.[0] || '';
  assert.notEqual(dataBlock, '');
  const entry01Index = dataBlock.indexOf("id:'smartphone-01'");
  const entry02Index = dataBlock.indexOf("id:'smartphone-02'");
  const entry03Index = dataBlock.indexOf("id:'smartphone-03'");
  const entry04Index = dataBlock.indexOf("id:'smartphone-04'");
  assert.ok(entry01Index >= 0 && entry02Index > entry01Index && entry03Index > entry02Index && entry04Index > entry03Index, '01 must come before 02, which must come before 03, which must come before 04, in source order');
  assert.match(script, /title:'01\. 스마트폰, 이것만 알기'/);
  assert.match(script, /href:'downloads\/senior-learning\/01_스마트폰_이것만알기\.pdf'/);
  assert.match(script, /title:'02\. 버튼과 화면 첫걸음'/);
  assert.match(script, /href:'downloads\/senior-learning\/02_스마트폰_버튼과화면첫걸음\.pdf'/);
  assert.match(script, /title:'03\. 손가락으로 조작하기'/);
  assert.match(script, /href:'downloads\/senior-learning\/03_스마트폰_손가락으로조작하기\.pdf'/);
  assert.match(script, /title:'04\. 홈화면과 앱 아이콘'/);
  assert.match(script, /href:'downloads\/senior-learning\/04_스마트폰_홈화면과앱아이콘\.pdf'/);
});

test('the smartphone screen renders straight into the textbook cards -- no on-screen "스마트폰"/"스마트폰 교재" heading duplicates the breadcrumb, no legacy folder grid or guide text, one "교재 보기" button per card', () => {
  const folderScreenTemplate = script.match(/content\.innerHTML = `<section class="smartphone-folders"[\s\S]*?<\/section>`;/)?.[0] || '';
  assert.notEqual(folderScreenTemplate, '');
  // The breadcrumb ("교재 > 스마트폰", rendered separately by
  // renderBreadcrumb()) already names this screen -- no repeated "스마트폰"
  // or "스마트폰 교재" heading text inside the content itself.
  assert.doesNotMatch(folderScreenTemplate, /<h2[^>]*>스마트폰<\/h2>/);
  assert.doesNotMatch(folderScreenTemplate, /<h3[^>]*>스마트폰 교재<\/h3>/);
  assert.match(folderScreenTemplate, /aria-label="스마트폰 교재"/);
  assert.match(folderScreenTemplate, /<a class="senior-primary-button" href="\$\{book\.href\}" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  // Only one button per card -- no separate download button/link.
  assert.equal((folderScreenTemplate.match(/senior-primary-button/g) || []).length, 1);
  assert.doesNotMatch(folderScreenTemplate, /download[= >]/);
  // The legacy folder grid and its "폴더를 고르세요" guide copy are gone from
  // this screen -- but only from this one template branch, not deleted code.
  assert.doesNotMatch(folderScreenTemplate, /smartphone-folder-grid/);
  assert.doesNotMatch(folderScreenTemplate, /smartphone-folder-card/);
  assert.doesNotMatch(folderScreenTemplate, /배우고 싶은 폴더를 고르세요/);
  // The folder/lesson browsing render code itself is preserved for reuse by
  // direct state (old bookmarks, and as a base for future textbook rounds).
  assert.match(script, /const renderSmartphoneLesson = lesson =>/);
  assert.match(script, /class="smartphone-lesson-grid"/);
});

test('textbook cards use a compact list-row layout (title left, button right) that reuses existing design tokens', () => {
  // As of the "compact list" round: one row per textbook, title and button
  // side by side, so the list stays scannable as more Muse PDFs (03, 04,
  // 05...) get added, instead of each textbook taking a tall standalone box.
  assert.match(css, /\.smartphone-textbook-grid \{ display:grid; grid-template-columns:1fr;/);
  assert.match(css, /\.smartphone-textbook-card \{[^}]*display:flex; flex-direction:row; align-items:center; justify-content:space-between;/);
  assert.match(css, /\.smartphone-textbook-card \{[^}]*background:var\(--senior-pale\)/);
  // Title can wrap up to 2 lines for long future titles but never more.
  assert.match(css, /\.smartphone-textbook-card strong \{[^}]*-webkit-line-clamp:2/);
  // Button sits to the right at a fixed width, not stretched full-width.
  assert.match(css, /\.smartphone-textbook-card \.senior-primary-button \{[^}]*flex:0 0 auto; width:auto;[^}]*min-height:44px/);
  // The accessibility touch-target floor (44px) established in an earlier
  // round is kept, even though the base button style still defaults to 52px.
  assert.match(css, /\.senior-primary-button,\.senior-secondary-button \{ min-height:52px;/);
});

test('mobile (<=620px) shrinks textbook card padding/gap further without dropping below the 44px button floor or shrinking the title to unreadable size', () => {
  const mobileBlock = css.match(/@media \(max-width:620px\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.notEqual(mobileBlock, '', 'expected the materials-specific @media(max-width:620px) block to exist');
  assert.match(mobileBlock, /\.smartphone-textbook-grid \{ gap:6px; \}/);
  assert.match(mobileBlock, /\.smartphone-textbook-card \{ padding:9px 12px; gap:8px;/);
  assert.match(mobileBlock, /\.smartphone-textbook-card strong \{ font-size:14\.5px;/);
  // Button keeps its 44px min-height on mobile too -- only padding/font shrink.
  assert.doesNotMatch(mobileBlock, /\.smartphone-textbook-card \.senior-primary-button \{[^}]*min-height:(?!44px)/);
});

test('the existing three smartphone folders, their sixty lessons, and slide images are preserved on disk as Muse reference material (not deleted)', () => {
  assert.deepEqual(folders.map(f => f.title), ['설정', '인터넷·연결', '전화·문자·연락처']);
  const lessons = folders.flatMap(folder => folder.lessons);
  assert.equal(lessons.length, 60);
  assert.match(script, /const smartphoneFolders = window\.HarmonySmartphoneLessons \|\| \[\];/);
  assert.match(script, /const smartphoneLessons = smartphoneFolders\.flatMap\(folder => folder\.lessons\);/);
  assert.ok(fs.existsSync(path.join(root, 'senior-smartphone-lessons.js')), 'senior-smartphone-lessons.js must not be deleted');
  // Spot-check slide images across all 3 folders still exist on disk.
  const sample = [lessons[0], lessons[20], lessons[40], lessons[59]];
  for (const lesson of sample) {
    assert.equal(fs.existsSync(path.join(root, lesson.slides[0])), true, `${lesson.slides[0]} must still exist`);
  }
});

// Real controller + real content, browser/Supabase boundaries mocked -- same
// harness pattern as tests/senior-smartphone-lessons.test.js.
async function harness(query = '?category=smartphone') {
  const nodes = new Map();
  const listeners = {};
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      hidden:false, html:'', listeners:{},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      scrollIntoView() {}, focus() {},
      set innerHTML(value) { this.html = value; },
      get innerHTML() { return this.html; },
      querySelector() { return null; }
    });
    return nodes.get(id);
  };
  const sandbox = { URLSearchParams, location:{ search:query }, history:{ pushState(s, t, url) { this.url = url; } },
    document:{ body:{ dataset:{ seniorPage:'materials' } }, getElementById:node, addEventListener(type, fn) { listeners[type] = fn; } },
    window:{ HarmonySmartphoneLessons:folders, addEventListener(type, fn) { listeners[type] = fn; },
      supabase:{ createClient:() => ({ auth:{
        getSession:async () => ({ data:{ session:{ user:{ id:'local-fixture' } } } }),
        onAuthStateChange() {}, signOut() {}
      }, rpc:async () => ({ data:{ account_status:'active' } }) }) } },
    Image:class { set src(value) { this.path = value; } },
    setTimeout:fn => { fn(); return 0; }
  };
  vm.runInNewContext(script, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return { node };
}

test('real controller renders all four textbook cards stacked in order (01, 02, 03, 04), same card design, no duplicate heading, no legacy folder cards or guide text', async () => {
  const h = await harness();
  const html = h.node('seniorLearningContent').innerHTML;
  assert.doesNotMatch(html, /<h2[^>]*>스마트폰<\/h2>/);
  assert.doesNotMatch(html, /<h3[^>]*>스마트폰 교재<\/h3>/);

  // 01 unchanged.
  assert.match(html, /<strong>01\. 스마트폰, 이것만 알기<\/strong>/);
  assert.match(html, /<a class="senior-primary-button" href="downloads\/senior-learning\/01_스마트폰_이것만알기\.pdf" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  // 02 unchanged.
  assert.match(html, /<strong>02\. 버튼과 화면 첫걸음<\/strong>/);
  assert.match(html, /<a class="senior-primary-button" href="downloads\/senior-learning\/02_스마트폰_버튼과화면첫걸음\.pdf" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  // 03 unchanged.
  assert.match(html, /<strong>03\. 손가락으로 조작하기<\/strong>/);
  assert.match(html, /<a class="senior-primary-button" href="downloads\/senior-learning\/03_스마트폰_손가락으로조작하기\.pdf" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  // 04 added, same card structure/design (identical article/strong/button markup shape).
  assert.match(html, /<strong>04\. 홈화면과 앱 아이콘<\/strong>/);
  assert.match(html, /<a class="senior-primary-button" href="downloads\/senior-learning\/04_스마트폰_홈화면과앱아이콘\.pdf" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  // 01 must appear before 02, before 03, before 04 (stacked in order).
  assert.ok(html.indexOf('01. 스마트폰, 이것만 알기') < html.indexOf('02. 버튼과 화면 첫걸음'), '01 must render above 02');
  assert.ok(html.indexOf('02. 버튼과 화면 첫걸음') < html.indexOf('03. 손가락으로 조작하기'), '02 must render above 03');
  assert.ok(html.indexOf('03. 손가락으로 조작하기') < html.indexOf('04. 홈화면과 앱 아이콘'), '03 must render above 04');
  // Exactly 4 cards, exactly 4 buttons -- no extra placeholder cards for 05+.
  assert.equal((html.match(/class="smartphone-textbook-card"/g) || []).length, 4);
  assert.equal((html.match(/senior-primary-button/g) || []).length, 4);

  assert.equal((html.match(/class="smartphone-folder-card"/g) || []).length, 0);
  for (const label of ['설정', '인터넷·연결', '전화·문자·연락처']) assert.doesNotMatch(html, new RegExp(`<strong>${label}</strong>`));
  assert.doesNotMatch(html, /배우고 싶은 폴더를 고르세요/);
  // The breadcrumb still names this screen even though the in-content
  // heading is gone.
  assert.match(h.node('seniorBreadcrumb').innerHTML, />교재<.*>스마트폰</);
});
