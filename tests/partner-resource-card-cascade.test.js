const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

test('partner resource cards use the compact cascade without the legacy 104px floor', () => {
  assert.doesNotMatch(css, /#partner-center \.partner-resource-toggle\{min-height:104px!important\}/);
  assert.match(css, /#partner-center \.partner-resource-library\{gap:clamp\(7px,\.75vw,10px\)!important\}/);
  assert.match(css, /#partner-center \.partner-resource-toggle\{min-height:clamp\(72px,6vw,82px\)!important;padding:clamp\(8px,\.7vw,10px\)!important;gap:clamp\(7px,\.7vw,9px\)!important/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?#partner-center \.partner-resource-toggle\{min-height:72px!important;padding:8px!important;gap:7px!important/);
  assert.match(css, /#partner-center \.partner-resource-library\[data-count="12"\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important\}/);
});
