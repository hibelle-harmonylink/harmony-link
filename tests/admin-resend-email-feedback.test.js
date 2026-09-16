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
  assert.match(resend, /feedback\.innerHTML = `<strong>안내메일을 성공적으로 보냈습니다\.<\/strong><span>\$\{escapeHtml\(member\.email\)\}<\/span>`;/);
  assert.match(resend, /feedback\.className = 'member-save-feedback success';/);
  assert.match(resend, /feedback\.scrollIntoView\(\{ block: 'nearest', behavior: 'smooth' \}\);/);
});

test('resend shows a detail error and always restores the button', () => {
  assert.match(resend, /const errorText = '안내메일 발송에 실패했습니다\. 잠시 후 다시 시도해주세요\.';/);
  assert.match(resend, /feedback\.textContent = errorText;/);
  assert.match(resend, /feedback\.className = 'member-save-feedback error';/);
  assert.match(resend, /button\.disabled = false;/);
  assert.match(resend, /button\.textContent = '안내메일 다시 보내기';/);
  assert.match(resend, /button\.classList\.remove\('is-sending'\)/);
  assert.match(adminCss, /\.member-resend\.is-sending\{cursor:wait\}/);
});

test('admin asset versions advance together for the resend UX', () => {
  assert.equal(version.version, '20260916-10');
  assert.match(adminHtml, /const pageVersion = '20260916-10'/);
  assert.match(adminHtml, /admin\.css\?v=20260916-10/);
  assert.match(adminHtml, /admin\.js\?v=20260916-10/);
});

test('detail feedback stays immediately above the action row on desktop and mobile', () => {
  assert.match(adminCss, /\.member-save-feedback\{order:5;min-width:0\}/);
  assert.match(adminCss, /\.member-detail-actions\{order:6\}/);
  assert.match(adminCss, /\.member-save-feedback\.success,.member-save-feedback\.error\{display:grid/);
});

test('retries only transient delivery-status reads without requeueing an email', () => {
  const retryHelper = adminJs.slice(adminJs.indexOf('const isTransientFetchError'), adminJs.indexOf('const sendRoleNotification'));
  const notification = adminJs.slice(adminJs.indexOf('const getRoleEmailStatusWithRetry'), adminJs.indexOf('const sendRoleNotification'));
  assert.match(retryHelper, /const isTransientFetchError = error => \/failed to fetch\|networkerror\|network request failed\/i/);
  assert.match(notification, /for \(let retry = 0; retry < 3; retry \+= 1\)/);
  assert.match(notification, /client\.rpc\('admin_get_role_email_status'/);
  assert.doesNotMatch(notification, /admin_queue_role_email/);
});
