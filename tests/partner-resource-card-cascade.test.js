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
  assert.match(script, /data-resource-tier="\$\{section\.tier\}"/);
  assert.match(script, /window\.HarmonyPartnerResources=\{setAccessTier:/);
  assert.doesNotMatch(resourceBlock, /partnerModal|partner-modal-plans/);
});

test('partner center keeps the established cumulative access sets closed until a tier is selected', () => {
  assert.match(script, /const benefitText=\{0:'FREE · 2개 시작 자료를 이용할 수 있습니다\.',20:'BASIC · FREE 포함 총 6개 자료를 이용할 수 있습니다\.',50:'PREMIUM · 전체 12개 자료를 모두 이용할 수 있습니다\.'/);
  assert.match(script, /const setAccessTier=\(maxTier=0,selectedTier=null\)=>/);
  assert.match(script, /const selected=selectedTier!==null&&allowed\.includes\(requestedTier\)\?requestedTier:null;/);
  assert.match(script, /const visible=selected!==null&&Number\(section\.dataset\.resourceTier\)<=selected;/);
  assert.doesNotMatch(script, /resourceTier\)===selected/);
  assert.match(script, /setAccessTier\(0\);/);
  assert.match(script, /#primary-nav a\[href="#partner-center"\][\s\S]*?setAccessTier\(Number\(downloads\.dataset\.maxTier\|\|0\)\);/);
  assert.match(auth, /HarmonyPartnerResources\?\.setAccessTier\(resourceTier\);/);
  assert.match(resourceBlock, /tier:0[\s\S]*?tier:0[\s\S]*?tier:20[\s\S]*?tier:20[\s\S]*?tier:20[\s\S]*?tier:20[\s\S]*?tier:50[\s\S]*?tier:50[\s\S]*?tier:50[\s\S]*?tier:50[\s\S]*?tier:50[\s\S]*?tier:50/);
});

test('the actual resource groups restore one-click open and one-open-at-a-time details', () => {
  assert.match(script, /class="partner-resource-items" id="partnerResource\$\{index\}" hidden/);
  assert.doesNotMatch(resourceBlock, /partner-resource-panel/);
  assert.doesNotMatch(resourceBlock, /partner-resource-detail-toggle/);
  assert.match(script, /const closeResource = button =>/);
  assert.match(script, /downloads\.querySelectorAll\('\.partner-resource-toggle'\)\.forEach\(other=>\{if\(other!==button\)closeResource\(other\);\}\);/);
  assert.match(script, /textContent=open\?'닫기':'열기'/);
  assert.match(script, /downloads\.querySelectorAll\('\.partner-resource-toggle'\)\.forEach\(closeResource\);/);
});

test('partner resource details use the restored uniform grid at every breakpoint', () => {
  assert.doesNotMatch(css, /#partner-center \.partner-resource-panel\{/);
  assert.doesNotMatch(css, /#partner-center \.partner-resource-detail-toggle\{/);
  assert.match(css, /#partner-center \.partner-resource-items\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(css, /#partner-center \.partner-resource-items\[hidden\]\{display:none!important\}/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?#partner-center \.partner-resource-items\{grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /#partner-center \.partner-resource-item>a\[download\]\{background:#20834b!important;color:#fff!important\}/);
  assert.match(css, /#partner-center \.partner-resource-item>a:not\(\[download\]\)\{background:#6554a6!important;color:#fff!important\}/);
  assert.match(css, /#partner-center \.partner-resource-item>small\{background:#e2e6eb!important;color:#4b5563!important;cursor:default!important\}/);
});

test('partner resource titles remain concise one-line labels without changing their actions', () => {
  assert.match(script, /\['추천 노출 신청'\]/);
  assert.match(script, /\['프로그램 등록'\]/);
  assert.match(script, /\['홍보 디자인'\]/);
  assert.match(script, /\['배너 제작'\]/);
});
