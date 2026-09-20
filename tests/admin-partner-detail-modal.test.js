const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const adminJs = read('admin.js');
const adminCss = read('admin.css');
const migration = read(path.join('supabase', 'migrations', '202609130004_member_application_completion.sql'));

// Investigation finding (this round): the partner-application-to-admin-detail
// pipeline already exists end to end -- automation/member-signup.gs matches a
// Google Form response to a member by UUID/email and posts
// action:'member_application_sync' to the notify-role-change edge function,
// which calls internal_sync_member_application_metadata() to write
// nickname/full_name/phone/specialty/teaching_subjects/enrolled_subject/
// assigned_instructor into member_admin_metadata and flip
// application_completed to true (see tests/member-number-reconciliation.test.js,
// which already covers that pipeline). No DB/RLS/schema change was needed or
// made this round; these tests instead cover the one real gap found -- the
// admin detail modal's rendering of that already-synced data.

test('admin_list_members already returns every field the detail modal needs (no DB change required)', () => {
  assert.match(migration, /member_number text, phone text, specialty text, teaching_subjects text,/);
  assert.match(migration, /enrolled_subject text, assigned_instructor text, is_withdrawn boolean,/);
  assert.match(migration, /application_completed boolean/);
});

test('existing member numbers are preserved on repeat registration, never reissued', () => {
  // internal_register_member_admin_metadata() uses ON CONFLICT (member_id) DO
  // UPDATE that keeps the existing member_number unchanged -- a retry can
  // never replace it.
  assert.match(migration, /on conflict \(member_id\) do update set\s*\n\s*member_number = public\.member_admin_metadata\.member_number,/);
});

test('detail modal reads specialty/teaching_subjects (partner) and enrolled_subject/assigned_instructor (student) straight from the canonical RPC row', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /전문분야<input id="detailSpecialty"/);
  assert.match(detail, /강의과목<input id="detailTeachingSubjects"/);
  assert.match(detail, /수강과목<input id="detailEnrolledSubject"/);
  assert.match(detail, /담당강사<input id="detailAssignedInstructor"/);
  assert.match(detail, /if \(specialty\) specialty\.value = member\.specialty \|\| '';/);
  assert.match(detail, /if \(teachingSubjects\) teachingSubjects\.value = member\.teaching_subjects \|\| '';/);
  assert.match(detail, /if \(enrolledSubject\) enrolledSubject\.value = member\.enrolled_subject \|\| '';/);
  assert.match(detail, /if \(assignedInstructor\) assignedInstructor\.value = member\.assigned_instructor \|\| '';/);
});

test('partner-only and student-only metadata fields respect [hidden] instead of an author display rule silently overriding it', () => {
  // Regression for a second instance of this session's CSS bug class
  // (community.css's .community-login-prompt): .member-group-grid label{display:grid}
  // is unconditional, so a .partner-metadata/.student-metadata label hidden by
  // showRoleMetadata() stayed visually visible -- both roles' fields showed at
  // once -- until this [hidden] override was added.
  assert.match(adminCss, /\.member-group-grid label\[hidden\]\{display:none!important\}/);
});

test('회원번호 stays a read-only chip; 닉네임/이름/연락처/회원유형/멤버십/계정상태 each render exactly once as their live input/select (no duplicate read-only summary)', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /readonlyField\('회원번호'/);
  assert.match(detail, /readonlyField\('이메일'/);
  assert.match(detail, /readonlyField\('가입일'/);
  assert.doesNotMatch(detail, /readonlyField\('닉네임'/);
  assert.doesNotMatch(detail, /readonlyField\('이름'/);
  assert.doesNotMatch(detail, /readonlyField\('연락처'/);
  assert.doesNotMatch(detail, /readonlyField\('회원유형'/);
  assert.doesNotMatch(detail, /readonlyField\('멤버십'/);
  assert.doesNotMatch(detail, /readonlyField\('계정상태'/);
});

test('member-number-pending (검정→빨강) status color rule is unchanged: black is the default/completed state, red is only application_completed === false', () => {
  assert.match(adminJs, /const memberNumberClass = member => member\.member_number && member\.application_completed === false\s*\n\s*\? 'member-number member-number-pending'\s*\n\s*: 'member-number';/);
  assert.match(adminCss, /\.member-number\{display:inline-block;color:#111827;/);
  assert.match(adminCss, /\.member-number\.member-number-pending\{color:#dc2626\}/);
});

test('detail dialog is a 3-group compact grid (기본 정보 / 회원·파트너 정보 / 지역·권한) instead of a read-only summary followed by a separately-scrolling edit form', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /<h3>기본 정보<\/h3>/);
  assert.match(detail, /<h3>회원·파트너 정보<\/h3>/);
  assert.match(detail, /<h3>지역·권한<\/h3>/);
  assert.match(detail, /class="member-detail-groups"/);
  assert.match(adminCss, /\.member-detail-groups\{display:grid;gap:14px\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{[\s\S]*?\.member-detail-groups\{grid-template-columns:1fr 1fr;gap:\d+px;align-items:start\}/);
  // 지역·권한 is the 3rd group and spans the full width beneath the other two.
  assert.match(adminCss, /\.member-detail-groups>\.member-group:nth-child\(3\)\{grid-column:1\/-1\}/);
});

test('활동 지역 and 기능 access sit side by side via flexbox, so a non-partner (활동 지역 hidden) still gets the full-width feature list instead of an empty fixed column', () => {
  assert.match(adminCss, /\.member-region-access-row\{display:flex;gap:\d+px;align-items:flex-start\}/);
  assert.match(adminCss, /\.member-region-access-row \.partner-region\{flex:0 0 300px;max-width:300px;margin:0\}/);
  assert.match(adminCss, /#detailFeatures\{flex:1 1 auto;min-width:0\}/);
});

test('every grid/flex child and every group-grid input/select shrinks to fit instead of forcing the dialog to scroll horizontally', () => {
  assert.match(adminCss, /\.member-group-grid input,\.member-group-grid select\{width:100%;max-width:100%;box-sizing:border-box\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{\s*\n\s*\.member-detail>\*,/);
});

test('a long email in 기본 정보 truncates with an ellipsis (and a title tooltip) instead of wrapping across several lines and pushing the layout taller', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /readonlyField\('이메일', escapeHtml\(member\.email \|\| ''\), true\)/);
  assert.match(adminCss, /\.member-readonly-truncate strong\{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;min-width:0\}/);
});
