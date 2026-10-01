const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const css = fs.readFileSync('homepage-ui.css', 'utf8');
const source = fs.readFileSync('shared/data/events.js', 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const byId = id => sandbox.window.HARMONY_LINK_EVENTS.find(event => event.id === id);

test('partner resources use compact cards without reserving a fake static action', () => {
  assert.match(css, /#partner-center \.partner-resource-toggle\{[\s\S]*?grid-template-areas:"number number" "summary summary"!important/);
  assert.match(css, /#partner-center \.partner-resource-summary\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /#partner-center \.partner-resource-static::after\{content:none!important\}/);
});

test('event meta uses one readable label/value rhythm and keeps three AI time rows', () => {
  assert.match(css, /grid-template-columns:48px minmax\(0,1fr\)!important/);
  assert.match(css, /#events \.event-info dt,[\s\S]*?font-size:11px!important/);
  assert.match(css, /#events \.event-info dd,[\s\S]*?font-size:13px!important/);
  assert.match(css, /event-time-zone-list[\s\S]*?font-size:12px!important[\s\S]*?line-height:1\.45!important/);
  assert.equal((byId('ai-business-automation').detailRowsHtml.match(/event-time-zone-row/g) || []).length, 3);
});

test('confirmed flyer contacts are present without changing event classification data', () => {
  const trial = byId('one-day-class');
  const finance = byId('finance-ai-seminar');
  assert.match(trial.detailRowsHtml, /data-ko="문의"[\s\S]*817-905-3468/);
  assert.match(finance.detailRowsHtml, /data-ko="문의"[\s\S]*646-467-1144/);
  assert.equal(trial.dateEnd, '2026-08-01');
  assert.equal(finance.dateEnd, '2026-07-24');
});

test('current event cards preserve their shared height while descriptions absorb slack above the compact CTA rhythm', () => {
  assert.match(css, /#events \.event-grid>\.event-card:not\(\[hidden\]\)\{[\s\S]*?height:480px!important;[\s\S]*?min-height:480px!important/);
  assert.match(css, /#events \.event-grid>\.event-card:not\(\[hidden\]\) \.event-poster\{[\s\S]*?height:212px!important/);
  assert.match(css, /#events \.event-card \.event-info>p\{[\s\S]*?flex:1 1 auto!important/);
  assert.match(css, /@media\(max-width:1100px\) and \(min-width:981px\)\{[\s\S]*?height:auto!important;min-height:480px!important/);
  assert.match(css, /#events \.event-grid>\.event-card:not\(\[hidden\]\) \.event-detail-button,[\s\S]*?#events \.past-event-grid \.event-flyer-button\{[\s\S]*?margin-top:12px!important/);
});
