const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const css = read('admin.css');
const js = read('admin.js');
const html = read('admin.html');

// 2026-10: compact redesign of the member detail dialog -- fitting a
// partner account with a long full_name, 강의과목, and an active region on
// a 1366x768 laptop without an internal scrollbar. The dialog widened
// slightly (780px -> 860px) to use horizontal space instead of shrinking
// fonts; 활동 지역 and 기능 권한 became slim one-line rows instead of
// fixed-height boxes; 강의과목 clamps to two lines behind "전체 보기".
test('the dialog widened to use horizontal space instead of shrinking', () => {
  assert.match(css, /\.member-dialog\{width:min\(860px,calc\(100% - 28px\)\);max-height:90vh;overflow:hidden\}/);
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
  assert.match(css, /\.member-detail-grid\{grid-template-columns:1fr 1fr\}/);
  assert.match(css, /\.member-group-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:4px 10px\}/);
  assert.match(css, /\.member-group-grid>\.member-name-field\{grid-column:auto\}/);
});

test('강의과목/담당강사 span the entire subjects row instead of a half-width control track', () => {
  assert.match(css, /\.member-detail-grid>\.member-subjects-row\{grid-column:1\/-1;grid-row:2\}/);
  assert.match(css, /\.member-subjects-row \.partner-metadata strong,\.member-subjects-row \.student-metadata strong\{word-break:keep-all;overflow-wrap:break-word\}/);
  assert.match(js, /syncedClampField\('강의과목', member\.teaching_subjects\)/);
  // 전문분야/수강과목 now render as the last item inside 회원·파트너 정보's
  // own grid, via the same syncedReadonlyField helper used everywhere else.
  assert.match(js, /syncedReadonlyField\('전문분야', member\.specialty\)/);
});

test('강의과목 clamps to two lines with the full text opening in a separate overlay popup', () => {
  assert.match(js, /const syncedClampField = \(label, value\) => \{/);
  // .member-synced-field strong{display:block} (an existing, unrelated
  // rule) has the exact same specificity as a bare .member-clamp-value
  // class and sits later in the file, so it silently wins and the clamp
  // never applies unless the clamp selector matches .member-synced-field
  // too (found by actually rendering this in a browser, not just regex).
  assert.match(css, /\.member-synced-field strong\.member-clamp-value\{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden\}/);
  // "전체 보기" no longer expands inline (<details>) -- it opens the shared
  // overlay dialog, so the main detail dialog's size never changes.
  assert.match(js, /<button type="button" class="member-clamp-trigger">전체 보기<\/button>/);
  assert.match(js, /openInfoDialog\('강의과목 전체보기', `<p class="member-info-text">\$\{escapeHtml\(text\)\}<\/p>`\)/);
});

test('기본 정보 rows hide the synced-field source badge visually (title tooltip keeps it discoverable) so 영문 이름/연락처 are not squeezed into an early ellipsis', () => {
  assert.match(css, /\.member-group--info \.member-synced-field>span em\{display:none\}/);
  // The outer div still carries the explanatory title (syncedReadonlyField
  // always sets it), so nothing is actually lost -- only hidden from the
  // compact row's limited width.
  assert.match(js, /syncedReadonlyField = \(label, value, title = '신청서 자동연동/);
});

test('활동 지역 and 기능 권한 are compact one-line rows, not fixed-height boxes', () => {
  // 활동 지역/수업 범위 now render as plain .member-readonly rows inside
  // 기본 정보's own grid (no separate .member-region-row box style).
  assert.doesNotMatch(css, /min-height:144px/);
  assert.match(js, /const featureHtml = member => \{/);
  assert.match(js, /class="feature-summary"/);
  assert.match(js, /사용 가능 <b>\$\{allowedCount\}<\/b>/);
  assert.match(js, /사용 제한 <b>\$\{deniedCount\}<\/b>/);
});

test('non-partner region stays hidden via the existing .partner-metadata toggle', () => {
  assert.match(js, /class="member-readonly partner-metadata" hidden/);
  assert.match(js, /field\.hidden = selectedType !== 'partner'/);
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
  // 영문 이름 renders through a display-only truncation helper (credential
  // suffix after the first comma hidden from view); the save payload below
  // still sends memberFullName(member) verbatim, untouched by that helper.
  assert.match(js, /syncedReadonlyField\('영문 이름', memberFullNameDisplay\(member\)\)/);
  assert.match(js, /const memberFullNameDisplay = member => memberFullName\(member\)\.split\(','\)\[0\]\.trim\(\)/);
  // 닉네임/업체명 is read-only plain text again -- no input, and the save
  // handler always sends the member's own stored value back unchanged.
  assert.doesNotMatch(js, /id="detailNickname"/);
  assert.match(js, /nickname: memberNickname\(member\)/);
  assert.match(js, /admin_update_member_name/);
  assert.match(js, /p_display_name: nextName/);
  assert.match(js, /freshMember\.display_name[^\n]*nextName/);
  assert.match(js, /p_full_name: memberFullName\(member\)/);
});
