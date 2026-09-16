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
  assert.match(css, /#partner-center \.partner-resource-item\{display:grid!important;grid-template-columns:auto minmax\(0,1fr\) auto!important;align-items:center!important/);
  assert.match(css, /@media\(max-width:1000px\) and \(min-width:761px\)\{[\s\S]*?#partner-center \.partner-resource-items\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?#partner-center \.partner-resource-toggle\{min-height:54px!important;padding:8px!important;gap:8px!important/);
  assert.match(css, /partner-resource-library\[data-count="12"\]\{grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(script, /class="partner-resource-action" aria-hidden="true">확인<\/span>/);
  assert.doesNotMatch(script, /<b>\$\{section\.icon\}<\/b>/);
  assert.match(script, /forEach\(other=>\{if\(other!==button\)closeResource\(other\);\}\)/);
  assert.match(script, /textContent=open\?'닫기':'확인'/);
});
