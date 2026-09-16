const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const resourceBlock = script.slice(script.indexOf('const partnerResourceSections'), script.indexOf("document.querySelectorAll('#events"));

test('the production partner center, not the application modal, owns tier state', () => {
  assert.match(script, /if \(downloads\) \{/);
  assert.match(script, /const partnerResourceState = \{ selectedTier: 0, openPanel: null, detailExpanded: null, maxTier: 0 \}/);
  assert.match(script, /data-resource-tier="\$\{section\.tier\}"/);
  assert.match(script, /window\.HarmonyPartnerResources=\{setAccessTier:/);
  assert.doesNotMatch(resourceBlock, /partnerModal|partner-modal-plans/);
});

test('partner center starts on FREE and shows only the selected tier, never cumulative tiers', () => {
  assert.match(script, /const setAccessTier=\(maxTier=0,selectedTier=0\)=>/);
  assert.match(script, /const visible=Number\(section\.dataset\.resourceTier\)===selected;/);
  assert.doesNotMatch(script, /resourceTier\)<=selected/);
  assert.match(script, /setAccessTier\(0,0\);/);
  assert.match(auth, /HarmonyPartnerResources\?\.setAccessTier\(resourceTier, 0\)/);
});

test('the actual resource groups use one-open-panel and confirm-before-details behavior', () => {
  assert.match(script, /class="partner-resource-panel" id="partnerResourcePanel\$\{index\}" hidden/);
  assert.match(script, /class="partner-resource-detail-toggle" aria-expanded="false" aria-controls="partnerResourceDetails\$\{index\}">확인/);
  assert.match(script, /class="partner-resource-items" id="partnerResourceDetails\$\{index\}" hidden/);
  assert.match(script, /const resetResourcePanels = \(\) =>/);
  assert.match(script, /partnerResourceState\.openPanel = null;/);
  assert.match(script, /partnerResourceState\.detailExpanded = null;/);
  assert.match(script, /const shouldOpen = panel\?\.hidden;[\s\S]*?resetResourcePanels\(\);/);
  assert.match(script, /const shouldShow = detail\?\.hidden;[\s\S]*?detail\.hidden = false;/);
});

test('partner center stage styles are scoped to the actual resource DOM and remain mobile safe', () => {
  assert.match(css, /#partner-center \.partner-resource-group\.is-open/);
  assert.match(css, /#partner-center \.partner-resource-panel\[hidden\]\{display:none!important\}/);
  assert.match(css, /#partner-center \.partner-resource-detail-toggle\{display:inline-flex!important/);
  assert.match(css, /#partner-center \.partner-resource-items\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?#partner-center \.partner-resource-items\{grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /#partner-center \.partner-resource-item>a\[download\]\{background:#20834b!important;color:#fff!important\}/);
});

test('partner resource titles remain concise one-line labels without changing their actions', () => {
  assert.match(script, /\['추천 노출 신청'\]/);
  assert.match(script, /\['프로그램 등록'\]/);
  assert.match(script, /\['홍보 디자인'\]/);
  assert.match(script, /\['배너 제작'\]/);
});
