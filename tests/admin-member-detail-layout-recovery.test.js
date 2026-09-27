const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const css = read('admin.css');
const js = read('admin.js');
const html = read('admin.html');

test('recovered member dialog uses the historical 780px envelope, not a wider redesign', () => {
  assert.match(css, /\.member-dialog\{width:min\(780px,calc\(100% - 28px\)\);max-height:90vh;overflow:hidden\}/);
  assert.doesNotMatch(css, /\.member-dialog\{max-height:none\}/);
});

test('dialog header, identity, and actions remain outside the shrinking information scroll surface', () => {
  assert.match(css, /\.member-dialog\[open\]\{display:flex;flex-direction:column\}/);
  assert.match(css, /\.member-dialog-head\{flex-shrink:0\}/);
  assert.match(css, /\.member-detail\{display:flex;flex-direction:column;min-height:0;overflow:hidden;/);
  assert.match(css, /\.member-detail-summary,\.member-detail-actions\{flex-shrink:0\}/);
  assert.match(css, /\.member-detail-groups\{min-height:0;overflow-y:auto;overflow-x:hidden;align-content:start\}/);
});

test('both basic and role controls use two readable tracks without a wasted name row', () => {
  assert.match(css, /\.member-detail-groups\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.member-group-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:8px 12px\}/);
  assert.match(css, /\.member-group-grid>\.member-name-field\{grid-column:auto\}/);
});

test('long partner/student synchronized descriptions span the entire group instead of a control track', () => {
  assert.match(css, /\.member-group-grid>\.partner-metadata,\.member-group-grid>\.student-metadata\{grid-column:1\/-1\}/);
  assert.match(css, /\.member-group-grid>\.partner-metadata strong,\.member-group-grid>\.student-metadata strong\{word-break:keep-all;overflow-wrap:break-word\}/);
  assert.match(js, /syncedReadonlyField\('강의과목', member\.teaching_subjects\)/);
  assert.match(js, /syncedReadonlyField\('전문분야', member\.specialty\)/);
});

test('lower region and access panels keep equal tracks and allow readable list wrapping', () => {
  assert.match(css, /\.member-region-access-row\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.member-region-access-row \.feature-box ul\{min-width:0;max-width:100%;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.member-region-access-row \.feature-box li\{[^}]*white-space:normal;word-break:keep-all;overflow-wrap:break-word\}/);
  assert.doesNotMatch(css, /\.member-region-access-row \.feature-box\{[^}]*;height:144px/);
});

test('non-partner region stays hidden and does not leave an empty third column', () => {
  assert.match(css, /\.member-region-access-row \.partner-region\[hidden\]\{display:none\}/);
  assert.match(css, /\.member-region-access-row:has\(>\.partner-region\[hidden\]\)\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
});

test('existing close, type/membership/status preview, resend, and save handlers remain connected', () => {
  assert.match(html, /<form method="dialog" class="member-dialog-head">/);
  assert.match(html, /<button value="cancel" aria-label="닫기">/);
  assert.match(js, /\[type, membership, status\]\.forEach\(select => select\.addEventListener\('change', preview\)\)/);
  assert.match(js, /type\.addEventListener\('change', \(\) => showRoleMetadata\(type\.value\)\)/);
  assert.match(js, /querySelector\('#detailSave'\)\.addEventListener\('click', \(\) => updateMember\(raw, nameInput\.value, type\.value, membership\.value, status\.value/);
  assert.match(js, /querySelector\('\.member-resend'\)\.addEventListener\('click', event => resendNotification/);
});

test('layout recovery keeps existing identity sources, save RPC, and readback verification', () => {
  assert.match(js, /syncedReadonlyField\('영문 이름', memberFullName\(member\)\)/);
  assert.match(js, /id="detailNickname"/);
  assert.match(js, /admin_update_member_name/);
  assert.match(js, /p_display_name: nextName/);
  assert.match(js, /freshMember\.display_name[^\n]*nextName/);
  assert.match(js, /p_full_name: memberFullName\(member\)/);
});
