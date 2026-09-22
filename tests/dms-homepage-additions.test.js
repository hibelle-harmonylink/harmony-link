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
  assert.match(eventsData, /DMS 실무자 \(전 직원\)/);
  assert.match(eventsData, /detailUrl:"special-event-dms-ai-workshop\.html"/);
  assert.match(eventsData, /flyerKo:"assets\/events\/dms-ai-automation-workshop-20260923\.jpg"/);
});

test('DMS workshop reuses the existing event card renderer/data pipeline -- no dedicated DMS event UI was added', () => {
  assert.doesNotMatch(script, /dms-event-card|dmsEventCard|dms-workshop-card/);
  assert.match(script, /function eventToWebHtml\(event\)/);
});

test('DMS workshop detail page reuses the existing special-event detail template and links the real Google Meet URL', () => {
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

test('Education Programs section gains one DMS partner card without touching the canonical 3-program data file', () => {
  assert.match(programsData, /single source of truth for the 3 named specialty programs/);
  const programIds = [...programsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(programIds, ['hibelle-digital', 'hibelle-english', 'meeran-melody']);
  assert.doesNotMatch(programsData, /dms/i);
});

test('the hand-appended DMS Education Program card marks itself as an outside partner, not a Harmony Link-operated program', () => {
  assert.match(script, /specialty-dms/);
  assert.match(script, /입점 파트너/);
  assert.match(script, /DMS Care Training Center/);
  assert.match(script, /직업교육 · Healthcare/);
  // Reuses the existing verified logo asset; no new logo file is introduced.
  assert.match(script, /assets\/images\/dms-care-logo\.webp/);
  // Links to the real, already-existing Production DMS partner page (career/data.js),
  // not a newly created page and not the general partner-request form.
  assert.match(script, /href="career\/partner\.html\?partner=dms"/);
  assert.doesNotMatch(script, /class="specialty-poster-preview"[^>]*dms/);
});

test('DMS card link target already exists in career/data.js and was not modified this round', () => {
  assert.match(careerData, /id: 'dms'/);
  assert.match(careerData, /logo: *'\.\.\/assets\/images\/dms-care-logo\.webp'/);
});
