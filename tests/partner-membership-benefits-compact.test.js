const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('all partner tiers retain their policies in concise titled benefit cards', () => {
  assert.match(script, /id="freeBenefits"[\s\S]*?<strong>시작하기<\/strong><span>기본 프로필을 등록해 파트너 활동을 시작합니다\.<\/span>[\s\S]*?<strong>매칭<\/strong><span>가능한 기관·수강 의뢰 매칭을 안내합니다\.<\/span>/);
  assert.match(script, /id="basicBenefits"[\s\S]*?<strong>FREE 혜택<\/strong><span>FREE 파트너의 모든 혜택을 이용합니다\.<\/span>[\s\S]*?<strong>홍보·노출<\/strong><span>소형 배너와 검색 우선 노출을 제공합니다\.<\/span>/);
  assert.match(script, /id="premiumBenefits"[\s\S]*?<strong>디자인 지원<\/strong><span>홍보 전단과 배너 디자인을 지원합니다\.<\/span>[\s\S]*?<strong>스토어 혜택<\/strong><span>디지털 스토어 판매 수수료를 할인합니다\.<\/span>/);
});

test('membership benefits use compact desktop cards and mobile-safe stacking', () => {
  assert.match(css, /\.partner-plan-benefits,\.partner-modal-plans>#basicBenefits,\.partner-modal-plans>#premiumBenefits,\.partner-modal-plans>#freeBenefits\{padding:10px!important/);
  assert.match(css, /\.partner-plan-benefits h3\{display:inline!important/);
  assert.match(css, /\.partner-plan-benefits \.plan-benefit-lead\{display:inline!important/);
  assert.match(css, /\.partner-plan-benefits ul\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;gap:4px 12px!important;margin:8px 0 0!important/);
  assert.match(css, /\.partner-plan-benefits li\{min-height:0!important;padding:7px 8px!important;border:1px solid #d9e6f3/);
  assert.match(css, /\.partner-plan-benefits li strong\{display:block;color:var\(--deep\);font-size:13px/);
  assert.match(css, /\.partner-plan-benefits li span\{display:block;margin-top:2px;color:#52657c;font-size:11px/);
  assert.match(css, /@media\(max-width:900px\) and \(min-width:761px\)\{\.partner-plan-benefits ul\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}\}/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.partner-plan-benefits ul\{grid-template-columns:1fr!important/);
});
