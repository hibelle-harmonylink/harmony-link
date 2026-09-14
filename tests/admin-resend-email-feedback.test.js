const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const resend = adminJs.slice(adminJs.indexOf('const resendNotification = async'), adminJs.indexOf('const updateMember = async'));

test('resend immediately disables its button and prevents a duplicate click', () => {
  assert.match(resend, /if \(button\.disabled\) return;/);
  assert.match(resend, /button\.disabled = true;/);
  assert.match(resend, /button\.textContent = '메일 보내는 중…';/);
  assert.match(resend, /button\.classList\.add\('is-sending'\)/);
});

test('resend reports confirmed delivery inside the detail feedback region', () => {
  assert.match(resend, /const feedback = detail\.querySelector\('#detailSaveFeedback'\);/);
  assert.match(resend, /await sendRoleNotification\(member\);/);
  assert.match(resend, /feedback\.textContent = `\$\{member\.email\}으로 안내메일을 보냈습니다\.`;/);
  assert.match(resend, /feedback\.className = 'member-save-feedback success';/);
});

test('resend shows a detail error and always restores the button', () => {
  assert.match(resend, /feedback\.textContent = `안내메일 전송 실패: \$\{errorText\}`;/);
  assert.match(resend, /feedback\.className = 'member-save-feedback error';/);
  assert.match(resend, /button\.disabled = false;/);
  assert.match(resend, /button\.textContent = '안내메일 다시 보내기';/);
  assert.match(resend, /button\.classList\.remove\('is-sending'\)/);
  assert.match(adminCss, /\.member-resend\.is-sending\{cursor:wait\}/);
});

test('admin asset versions advance together for the resend UX', () => {
  assert.equal(version.version, '20260913-2');
  assert.match(adminHtml, /const pageVersion = '20260913-2'/);
  assert.match(adminHtml, /admin\.css\?v=20260913-2/);
  assert.match(adminHtml, /admin\.js\?v=20260913-2/);
});
