const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('all partner tiers retain their existing benefit policies with concise panel descriptions', () => {
  assert.match(script, /id="freeBenefits"[\s\S]*?비용 없이 기본 등록과 플랫폼 이용을 시작합니다\.[\s\S]*?업체·강사 기본 프로필 등록/);
  assert.match(script, /id="basicBenefits"[\s\S]*?정기 노출과 매칭 안내를 강화합니다\.[\s\S]*?FREE 파트너의 모든 혜택/);
  assert.match(script, /id="premiumBenefits"[\s\S]*?디자인·노출·매칭을 최우선으로 지원합니다\.[\s\S]*?BASIC 파트너의 모든 혜택[\s\S]*?디지털 스토어 판매 수수료 할인/);
});

test('membership benefits use compact desktop cards and mobile-safe stacking', () => {
  assert.match(css, /\.partner-plan-benefits,\.partner-modal-plans>#basicBenefits,\.partner-modal-plans>#premiumBenefits,\.partner-modal-plans>#freeBenefits\{padding:10px!important/);
  assert.match(css, /\.partner-plan-benefits h3\{display:inline!important/);
  assert.match(css, /\.partner-plan-benefits \.plan-benefit-lead\{display:inline!important/);
  assert.match(css, /\.partner-plan-benefits ul\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;gap:4px 12px!important;margin:8px 0 0!important/);
  assert.match(css, /\.partner-plan-benefits li\{min-height:0!important;padding:0!important/);
  assert.match(css, /@media\(max-width:900px\) and \(min-width:761px\)\{\.partner-plan-benefits ul\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}\}/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.partner-plan-benefits ul\{grid-template-columns:1fr!important/);
});
