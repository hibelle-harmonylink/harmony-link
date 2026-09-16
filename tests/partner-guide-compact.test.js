const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');

test('partner start guide retains its original layout while keeping concise copy', () => {
  assert.match(script, /data-ko="Google 또는 카카오 계정으로 시작합니다\."/);
  assert.match(script, /data-ko="업체 또는 개인 강사 신청서를 제출합니다\."/);
  assert.match(script, /data-ko="승인 후 FREE 등급과 안내메일을 받습니다\."/);
  assert.match(script, /data-ko="필요에 따라 BASIC 또는 PREMIUM으로 변경합니다\."/);
  assert.match(script, /data-ko="다시 로그인하면 등급별 자료를 이용합니다\."/);
  assert.doesNotMatch(script, /Google 또는 카카오 계정으로 가입하고 로그인합니다\./);
  assert.doesNotMatch(script, /\$20 BASIC 또는 \$50 PREMIUM을 문의하고 관리자가 등급을 변경합니다\./);
});

test('partner start guide has no compact override from PR 237', () => {
  assert.doesNotMatch(css, /#partner-center \.partner-upgrade-guide li\{min-height:88px!important;padding:10px 11px!important/);
  assert.doesNotMatch(css, /#partner-center \.partner-guide-details\{padding:0 16px 16px!important/);
});
