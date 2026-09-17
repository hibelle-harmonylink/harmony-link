const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');

test('partner start guide uses the requested two-line Korean descriptions', () => {
  assert.match(script, /data-ko="Google 또는 Kakao 계정으로&lt;br&gt;간편하게 로그인합니다\."/);
  assert.match(script, /data-ko="파트너 신청서를 작성하고&lt;br&gt;필요한 정보를 제출합니다\."/);
  assert.match(script, /data-ko="승인 후 안내 메일을 통해&lt;br&gt;파트너 이용 방법을 확인합니다\."/);
  assert.match(script, /data-ko="FREE · BASIC · PREMIUM 중&lt;br&gt;필요한 등급을 선택합니다\."/);
  assert.match(script, /data-ko="승인된 파트너는&lt;br&gt;등급별 혜택과 자료를 이용합니다\."/);
  assert.doesNotMatch(script, /안내메일/);
});

test('partner start guide has no compact override from PR 237', () => {
  assert.doesNotMatch(css, /#partner-center \.partner-upgrade-guide li\{min-height:88px!important;padding:10px 11px!important/);
  assert.doesNotMatch(css, /#partner-center \.partner-guide-details\{padding:0 16px 16px!important/);
});
