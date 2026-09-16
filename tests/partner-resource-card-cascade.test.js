const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

test('partner resource cards use a one-column accordion without the legacy card floor', () => {
  assert.doesNotMatch(css, /#partner-center \.partner-resource-toggle\{min-height:104px!important\}/);
  assert.match(css, /#partner-center \.partner-resource-library\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important;gap:7px!important/);
  assert.match(css, /#partner-center \.partner-resource-toggle\{min-height:56px!important;padding:8px 10px!important;gap:10px!important;grid-template-columns:28px minmax\(0,1fr\) auto!important/);
  assert.match(css, /#partner-center \.partner-resource-action\{display:inline-flex!important[\s\S]*?min-width:64px!important;height:32px!important/);
  assert.match(css, /#partner-center \.partner-resource-items\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;align-items:stretch!important;column-gap:18px!important;row-gap:11px!important;width:100%!important/);
  assert.match(css, /#partner-center \.partner-resource-detail-copy\{grid-column:1\/-1!important[\s\S]*?text-align:left!important/);
  assert.match(css, /#partner-center \.partner-resource-item\{display:grid!important;grid-template-columns:56px minmax\(0,1fr\) 88px!important;align-items:center!important;gap:8px!important;width:100%!important[\s\S]*?min-height:76px!important/);
  assert.match(css, /#partner-center \.partner-resource-item>span\{display:inline-flex!important[\s\S]*?width:56px!important/);
  assert.match(css, /#partner-center \.partner-resource-item>strong\{min-width:0!important;font-size:13px!important;line-height:1\.4!important;display:block!important;white-space:nowrap!important;overflow:visible!important/);
  assert.doesNotMatch(css, /#partner-center \.partner-resource-item>strong\{[\s\S]*?-webkit-line-clamp:2/);
  assert.match(css, /#partner-center \.partner-resource-item>a,#partner-center \.partner-resource-item>small\{display:inline-flex!important[\s\S]*?width:88px!important[\s\S]*?height:34px!important/);
  assert.match(css, /#partner-center \.partner-resource-item>a\[download\]\{background:#20834b!important;color:#fff!important\}/);
  assert.match(css, /#partner-center \.partner-resource-item>small\{background:#e2e6eb!important;color:#4b5563!important;cursor:default!important\}/);
  assert.match(css, /@media\(max-width:1000px\) and \(min-width:761px\)\{[\s\S]*?#partner-center \.partner-resource-items\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?#partner-center \.partner-resource-toggle\{min-height:54px!important;padding:8px!important;gap:8px!important/);
  assert.match(css, /partner-resource-library\[data-count="12"\]\{grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(script, /class="partner-resource-action" aria-hidden="true">확인<\/span>/);
  assert.doesNotMatch(script, /<b>\$\{section\.icon\}<\/b>/);
  assert.match(script, /forEach\(other=>\{if\(other!==button\)closeResource\(other\);\}\)/);
  assert.match(script, /textContent=open\?'닫기':'확인'/);
});

test('partner resource titles use concise one-line labels without changing their actions', () => {
  assert.match(script, /\['추천 노출 신청'\]/);
  assert.match(script, /\['프로그램 등록'\]/);
  assert.match(script, /\['홍보 디자인'\]/);
  assert.match(script, /\['배너 제작'\]/);
  assert.doesNotMatch(script, /홈페이지 추천 노출 신청|프로그램 등록 신청|홍보 디자인 신청|배너 제작 신청/);
});
