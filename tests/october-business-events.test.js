const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'shared/data/events.js'), 'utf8');
const webScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const events = JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_EVENTS));
const byId = id => events.find(event => event.id === id);

test('three supplied business-event flyers are stored unchanged under the event asset convention', () => {
  const expected = {
    'roxpkg-build-a-box-ai-automation-20260928.jpg': 277338,
    'boxd-kitchen-youtube-interview-20260926.jpg': 384146,
    'lina-market-ai-growth-20261003.jpg': 313787
  };
  for (const [name, size] of Object.entries(expected)) {
    assert.equal(fs.statSync(path.join(root, 'assets/events', name)).size, size);
  }
});

test('LINA MARKET stays date-driven and carries the confirmed schedule and secure Meet link', () => {
  const event = byId('lina-market-ai-growth');
  assert.equal(event.dateEnd, '2026-10-03');
  assert.match(event.detailRowsHtml, /2026년 10월 3일/);
  assert.match(event.detailRowsHtml, /NY 오후 8:00 \/ LA 오후 5:00/);
  assert.match(event.detailRowsHtml, /https:\/\/meet\.google\.com\/nfa-ukyo-hou/);
  assert.match(event.detailRowsHtml, /target="_blank" rel="noopener noreferrer"/);
  assert.match(event.detailRowsHtml, /data-ko="온라인 \(Google Meet\)"[^>]*>온라인 \(Google Meet\)<\/a>/);
  assert.doesNotMatch(JSON.stringify(event), /"status":/);
  assert.match(webScript, /'lina-market-ai-growth'[\s\S]*?'roxpkg-build-a-box-ai-automation'[\s\S]*?'boxd-kitchen-youtube-interview'[\s\S]*?'ai-business-automation'[\s\S]*?'dms-workshop-card'/);
});

test('ROXPKG and boxd are past events with DMS-style date, time, and location rows', () => {
  const rox = byId('roxpkg-build-a-box-ai-automation');
  const boxd = byId('boxd-kitchen-youtube-interview');
  for (const event of [rox, boxd]) {
    assert.match(event.detailRowsHtml, /data-ko="일정"/);
    assert.match(event.detailRowsHtml, /data-ko="시간"/);
    assert.match(event.detailRowsHtml, /data-ko="장소"/);
    assert.match(event.detailRowsHtml, /data-ko="온라인 \(Google Meet\)"[^>]*>온라인 \(Google Meet\)<\//);
    assert.equal((event.detailRowsHtml.match(/<div><dt /g) || []).length, 3);
    assert.doesNotMatch(event.detailRowsHtml, /온라인 ↗/);
  }
  assert.match(rox.detailRowsHtml, /NY 오후 10:30 \/ CA 오후 7:30/);
  assert.match(rox.detailRowsHtml, /https:\/\/meet\.google\.com\/fmb-fvrz-xuv/);
  assert.match(boxd.detailRowsHtml, /NY 오전 10:30/);
  assert.doesNotMatch(boxd.detailRowsHtml, /href=/);
});

test('existing AI automation event keeps its content while using the DMS information hierarchy', () => {
  const event = byId('ai-business-automation');
  assert.equal(event.titleKo, 'AI 업무자동화 무료 특강');
  assert.equal(event.descriptionKo, '비즈니스 사업자를 위한 실전 AI 업무자동화 무료 특강');
  assert.equal(event.flyerKo, 'assets/events/ai-business-automation-free-class-20260911.webp');
  assert.match(event.detailRowsHtml, /data-ko="일정"[\s\S]*data-ko="시간"[\s\S]*data-ko="장소"/);
  assert.match(event.detailRowsHtml, /event-time-zone-list/);
  assert.match(event.detailRowsHtml, /미국 동부[\s\S]*오후 10:00[\s\S]*미국 서부[\s\S]*오후 7:00[\s\S]*한국[\s\S]*9월 12일 오전 11:00/);
  assert.equal((event.detailRowsHtml.match(/event-time-zone-row/g) || []).length, 3);
  assert.match(event.detailRowsHtml, /data-ko="온라인 \(Google Meet\)"[^>]*>온라인 \(Google Meet\)<\/dd>/);
  assert.equal((event.detailRowsHtml.match(/<div><dt /g) || []).length, 3);
  assert.doesNotMatch(event.detailRowsHtml, /온라인 ↗/);
});
