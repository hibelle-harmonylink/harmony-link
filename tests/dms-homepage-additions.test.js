const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const eventsData = read('shared/data/events.js');
const script = read('script.js');
const programsData = read('shared/data/programs.js');
const careerData = read('career/data.js');
const detailPage = read('special-event-dms-ai-workshop.html');

test('DMS AI workshop event is registered in the canonical events file with the requested fields', () => {
  assert.match(eventsData, /id:"dms-ai-automation-workshop"/);
  assert.match(eventsData, /titleKo:"DMS 실무자를 위한 AI 업무 자동화 특강"/);
  assert.match(eventsData, /dateStart:"2026-09-23",dateEnd:"2026-09-23"/);
  assert.match(eventsData, /뉴욕 오전 9:30 \/ 텍사스 오전 8:30/);
  assert.match(eventsData, /온라인 \(Google Meet\)/);
  assert.match(eventsData, /detailUrl:"special-event-dms-ai-workshop\.html"/);
  assert.match(eventsData, /flyerKo:"assets\/events\/dms-ai-automation-workshop-20260923\.jpg"/);
});

test('the homepage event card for the DMS workshop shows only 일정/시간/장소 -- 대상 was intentionally dropped from the card (but stays on the detail page)', () => {
  const dmsEntry = eventsData.match(/\{id:"dms-ai-automation-workshop"[\s\S]*?appBadgeDark:false\}/)?.[0] || '';
  assert.ok(dmsEntry, 'could not locate the dms-ai-automation-workshop event entry');
  assert.match(dmsEntry, /data-ko=\\"일정\\" data-en=\\"DATE\\"/);
  assert.match(dmsEntry, /data-ko=\\"시간\\" data-en=\\"TIME\\"/);
  assert.match(dmsEntry, /data-ko=\\"장소\\" data-en=\\"LOCATION\\"/);
  assert.doesNotMatch(dmsEntry, /대상/);
  assert.doesNotMatch(dmsEntry, /DMS 실무자 \(전 직원\)/);
  // The card-level "일시" label was renamed to "일정"; the detail page keeps
  // its own separate 대상 row untouched.
  assert.doesNotMatch(dmsEntry, /data-ko=\\"일시\\"/);
  assert.match(detailPage, /DMS 실무자 \(전 직원\)/);
});

test('the free-music-class event card also uses 일정 instead of 일시 (scoped to this event only)', () => {
  const musicEntry = eventsData.match(/\{id:"free-music-class"[\s\S]*?appBadgeDark:false\}/)?.[0] || '';
  assert.ok(musicEntry, 'could not locate the free-music-class event entry');
  assert.match(musicEntry, /data-ko=\\"일정\\" data-en=\\"DATE\\"/);
  assert.doesNotMatch(musicEntry, /data-ko=\\"일시\\"/);
});

test('other event cards keep their existing 일시/장소/문의 labels untouched (only the 2 requested events were relabeled)', () => {
  ['ai-business-automation', 'one-day-class', 'finance-ai-seminar'].forEach(id => {
    const entry = eventsData.match(new RegExp(`\\{id:"${id}"[\\s\\S]*?appBadgeDark:(?:true|false)\\}`))?.[0] || '';
    assert.ok(entry, `could not locate the ${id} event entry`);
    assert.match(entry, /data-ko=\\"일시\\"/, `${id} should still say 일시`);
  });
});

test('DMS workshop reuses the existing event card renderer/data pipeline -- no dedicated DMS event UI was added', () => {
  assert.match(script, /function eventToWebHtml\(event\)/);
  assert.doesNotMatch(script, /dmsEventCard|dms-event-card/);
});

test('DMS workshop detail page reuses the existing special-event detail template, links the real Google Meet URL, and still carries the full 강의 내용 + 대상 body content', () => {
  assert.match(detailPage, /class="messiah-detail-header"/);
  assert.match(detailPage, /class="messiah-detail-hero"/);
  assert.match(detailPage, /class="messiah-detail-panel"/);
  assert.match(detailPage, /class="messiah-support-list"/);
  assert.match(detailPage, /class="messiah-detail-meta"/);
  assert.match(detailPage, /href="https:\/\/meet\.google\.com\/tka-fouc-fbe"/);
  assert.match(detailPage, /target="_blank" rel="noopener noreferrer"/);
  ['학생관리 앱', 'SNS 혹은 블로그 자동화', '광고 자동화', '문의고객 문자/이메일 자동화', 'Subscriber 이메일 자동화'].forEach(item => {
    assert.ok(detailPage.includes(item), `detail page missing course item: ${item}`);
  });
});

test('the DMS flyer JPG is unchanged from the verified Google Drive original', () => {
  const flyerPath = path.join(root, 'assets/events/dms-ai-automation-workshop-20260923.jpg');
  const stat = fs.statSync(flyerPath);
  assert.equal(stat.size, 297453, 'flyer file size must match the original Google Drive upload exactly');
});

test('Education Programs section gains one DMS partner card without touching the canonical 3-program data file', () => {
  assert.match(programsData, /single source of truth for the 3 named specialty programs/);
  const programIds = [...programsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(programIds, ['hibelle-digital', 'hibelle-english', 'meeran-melody']);
  assert.doesNotMatch(programsData, /dms/i);
});

test('the hand-appended DMS Education Program card marks itself as an outside partner, has no category caption, and sits in normal document order right after the 3 canonical cards', () => {
  assert.match(script, /specialty-dms/);
  assert.match(script, /입점 파트너/);
  assert.match(script, /DMS Care Training Center/);
  // The "직업교육 · Healthcare" category caption was removed this round --
  // the DMS card now shares the exact same badge/h3/description/button
  // shape as the other 3 cards, with no extra heading wrapper.
  assert.doesNotMatch(script, /직업교육 · Healthcare/);
  assert.doesNotMatch(script, /specialty-dms-category|specialty-dms-heading/);
  // Reuses the existing verified logo asset; no new logo file is introduced.
  assert.match(script, /assets\/images\/dms-care-logo\.webp/);
  // Links to the real, already-existing Production DMS partner page (career/data.js),
  // not a newly created page and not the general partner-request form.
  assert.match(script, /href="career\/partner\.html\?partner=dms"/);
  assert.doesNotMatch(script, /class="specialty-poster-preview"[^>]*dms/);
  // DMS is appended after the 3 canonical .map()'d cards, so natural grid
  // flow (not a centering hack) places it in row 2, column 1.
  assert.match(script, /\$\{specialtyPrograms\.map\(\(program,index\)=>\{[\s\S]*?\}\)\.join\(''\)\}\$\{dmsPartnerCard\}/);
});

test('no CSS forces the DMS card to center itself alone in a row -- desktop 3-col flow places it naturally in row 2, column 1', () => {
  const css = read('homepage-ui.css');
  assert.doesNotMatch(css, /nth-child\(4\):last-child\{grid-column:1\/-1/);
});

test('DMS card link target already exists in career/data.js and was not modified this round', () => {
  assert.match(careerData, /id: 'dms'/);
  assert.match(careerData, /logo: *'\.\.\/assets\/images\/dms-care-logo\.webp'/);
});
