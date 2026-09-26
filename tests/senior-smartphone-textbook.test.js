// Regression tests for the Muse -> Drive -> Claude -> Harmony Link textbook
// publishing pipeline: an approved PDF ("01_스마트폰_이것만알기.pdf") placed
// under downloads/senior-learning/ and surfaced as a "스마트폰 교재" section
// on the 시니어배움터 -> 스마트폰 screen.
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
const pdfPath = path.join(root, 'downloads/senior-learning/01_스마트폰_이것만알기.pdf');
const folders = require('../senior-smartphone-lessons');

test('the approved PDF is stored under downloads/senior-learning/ unmodified (real PDF, non-trivial size)', () => {
  assert.ok(fs.existsSync(pdfPath), 'PDF file must exist at downloads/senior-learning/01_스마트폰_이것만알기.pdf');
  const buffer = fs.readFileSync(pdfPath);
  assert.match(buffer.subarray(0, 5).toString('latin1'), /^%PDF-/);
  assert.ok(buffer.length > 1_000_000, 'expected a multi-page PDF, not a placeholder');
});

test('senior-learning.js declares the smartphone textbook as data (extensible for future approved PDFs)', () => {
  assert.match(script, /const smartphoneTextbooks = \[/);
  assert.match(script, /title:'01\. 스마트폰, 이것만 알기'/);
  assert.match(script, /href:'downloads\/senior-learning\/01_스마트폰_이것만알기\.pdf'/);
});

test('the smartphone screen renders only the "스마트폰 교재" section (no legacy folder grid or its guide text), with a single "교재 보기" button per card', () => {
  assert.match(script, /<h3 id="smartphoneTextbooksTitle">스마트폰 교재<\/h3>/);
  const folderScreenTemplate = script.match(/content\.innerHTML = `<section class="smartphone-folders">[\s\S]*?<\/section>`;/)?.[0] || '';
  assert.notEqual(folderScreenTemplate, '');
  const titleIndex = folderScreenTemplate.indexOf('<h2 tabindex="-1">스마트폰</h2>');
  const textbookIndex = folderScreenTemplate.indexOf('smartphone-textbooks');
  assert.ok(titleIndex >= 0 && textbookIndex > titleIndex, 'order: h2 스마트폰 -> 교재 section');
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

test('CSS for the new textbook card reuses existing design tokens/patterns and adds only minimal new rules', () => {
  assert.match(css, /\.smartphone-textbook-card \{[^}]*border:2px solid var\(--senior-line\)/);
  assert.match(css, /\.smartphone-textbook-card \{[^}]*background:var\(--senior-pale\)/);
  assert.match(css, /\.smartphone-textbook-card \.senior-primary-button \{ width:100%; \}/);
  // The button itself is unmodified -- only its width is adjusted per card, not redefined.
  assert.match(css, /\.senior-primary-button,\.senior-secondary-button \{ min-height:52px;/);
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

test('real controller renders only the textbook card on the smartphone screen -- the 3 legacy folder cards and their guide text are gone', async () => {
  const h = await harness();
  const html = h.node('seniorLearningContent').innerHTML;
  assert.match(html, /<h3 id="smartphoneTextbooksTitle">스마트폰 교재<\/h3>/);
  assert.match(html, /<strong>01\. 스마트폰, 이것만 알기<\/strong>/);
  assert.match(html, /<a class="senior-primary-button" href="downloads\/senior-learning\/01_스마트폰_이것만알기\.pdf" target="_blank" rel="noopener noreferrer">교재 보기<\/a>/);
  assert.equal((html.match(/class="smartphone-folder-card"/g) || []).length, 0);
  for (const label of ['설정', '인터넷·연결', '전화·문자·연락처']) assert.doesNotMatch(html, new RegExp(`<strong>${label}</strong>`));
  assert.doesNotMatch(html, /배우고 싶은 폴더를 고르세요/);
});
