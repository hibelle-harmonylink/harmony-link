const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'admin.css'), 'utf8');
const responsive = css.slice(css.indexOf('/* Member-admin overview:'));

test('uses shrinkable grid tracks for the title, six summary cards, and refresh action', () => {
  assert.match(responsive, /\.admin-title-row\{[\s\S]*grid-template-columns:minmax\(240px,\.85fr\) minmax\(0,1\.7fr\) max-content/);
  assert.match(responsive, /\.admin-title-row \.admin-summary\{[\s\S]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(responsive, /\.admin-summary article\{width:100%;min-width:0/);
  assert.match(responsive, /body\.admin-page\{overflow-x:hidden\}/);
});

test('keeps all six compact summary cards on one responsive row', () => {
  assert.match(responsive, /\.admin-title-row \.admin-summary\{[\s\S]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)[\s\S]*min-height:clamp\(58px,5vw,68px\)/);
  assert.match(responsive, /@media\(max-width:720px\)\{[\s\S]*\.admin-title-row \.admin-summary\{[\s\S]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
  assert.match(responsive, /\/\* Keep the member totals compact and comparable at every viewport size\./);
});

test('keeps filters and the member list within responsive page tracks', () => {
  assert.match(responsive, /@media\(max-width:899px\)\{[\s\S]*\.admin-toolbar\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(responsive, /@media\(max-width:680px\)\{[\s\S]*\.admin-toolbar\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(responsive, /@media\(min-width:681px\) and \(max-width:1150\.99px\)\{[\s\S]*\.member-table\{min-width:0;table-layout:auto\}/);
  assert.match(responsive, /\.member-table tr\{[\s\S]*grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(responsive, /@media\(min-width:681px\) and \(max-width:850px\)\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
