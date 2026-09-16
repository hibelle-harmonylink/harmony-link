const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('all partner tiers retain their existing policy copy inside staged detail panels', () => {
  assert.match(script, /id="freeBenefits"[\s\S]*?<strong>시작하기<\/strong><span>기본 프로필을 등록해 파트너 활동을 시작합니다\.<\/span>[\s\S]*?<strong>공지사항<\/strong><span>플랫폼 공지와 뉴스레터를 받아봅니다\.<\/span>/);
  assert.match(script, /id="basicBenefits"[\s\S]*?<strong>FREE 혜택<\/strong><span>FREE 파트너의 모든 혜택을 이용합니다\.<\/span>[\s\S]*?<strong>홍보·노출<\/strong><span>소형 배너와 검색 우선 노출을 제공합니다\.<\/span>/);
  assert.match(script, /id="premiumBenefits"[\s\S]*?<strong>디자인 지원<\/strong><span>홍보 전단과 배너 디자인을 지원합니다\.<\/span>[\s\S]*?<strong>스토어 혜택<\/strong><span>디지털 스토어 판매 수수료를 할인합니다\.<\/span>/);
});

test('membership starts with FREE only and clears every prior tier stage on a tier change', () => {
  assert.match(script, /const resetTierPanels = scope =>/);
  assert.match(script, /partnerPlans\.querySelectorAll\('\.partner-plan-benefits'\)\.forEach\(item => \{[\s\S]*?item\.hidden = true;[\s\S]*?resetTierPanels\(item\);/);
  assert.match(script, /item\.classList\.toggle\('active', item === button\)/);
  assert.match(script, /selectPartnerPlan\(partnerPlans\.querySelector\('\.partner-plan-toggle\.free'\)\)/);
  assert.match(css, /\.partner-plan-toggle\.active\{border-color:#0b5fc2!important;background:#0b5fc2!important;color:#fff!important/);
});

test('only one large tier panel opens, and its small benefit boxes remain hidden until confirm', () => {
  assert.match(script, /class="partner-tier-panel"/);
  assert.match(script, /class="partner-tier-panel-toggle" type="button" aria-expanded="false"/);
  assert.match(script, /class="partner-tier-panel-body"[^>]* hidden/);
  assert.match(script, /class="partner-tier-detail-toggle" type="button" aria-expanded="false"/);
  assert.match(script, /class="partner-tier-detail"[^>]* hidden/);
  assert.match(script, /const shouldOpen = !panel\.classList\.contains\('is-open'\);[\s\S]*?resetTierPanels\(benefitPanel\);/);
  assert.match(script, /const shouldShow = detail\.hidden;[\s\S]*?detail\.hidden = !shouldShow;/);
  assert.match(css, /\.partner-tier-detail\[hidden\],\.partner-tier-panel-body\[hidden\]\{display:none!important\}/);
});

test('staged tier panels keep mobile-safe, one-column detail layout', () => {
  assert.match(css, /\.partner-tier-detail\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:900px\) and \(min-width:761px\)\{\.partner-tier-detail\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.partner-tier-detail\{grid-template-columns:1fr;gap:6px/);
});
