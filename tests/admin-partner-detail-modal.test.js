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

test('detail modal reads synchronized metadata from the canonical RPC row without editable controls', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  // 전문분야/수강과목 are reached through the 지역정보 관리/수강 정보 보기
  // popups (plain read-only text there); 담당강사 stays a syncedReadonlyField
  // row in the full-width subjects row below both cards.
  assert.match(detail, /<span>전문분야<\/span><strong>\$\{escapeHtml\(member\.specialty \|\| '—'\)\}<\/strong>/);
  assert.match(detail, /syncedClampField\('강의과목', member\.teaching_subjects\)/);
  assert.match(detail, /openInfoDialog\('수강 정보', `<p class="member-info-text">\$\{escapeHtml\(member\.enrolled_subject \|\| '—'\)\}<\/p>`\)/);
  assert.match(detail, /syncedReadonlyField\('담당강사', member\.assigned_instructor\)/);
  assert.doesNotMatch(detail, /id="detailSpecialty"|id="detailTeachingSubjects"|id="detailEnrolledSubject"|id="detailAssignedInstructor"/);
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
  // 회원번호 is now a read-only chip in the dialog header, not inside 기본
  // 정보's grid.
  assert.match(detail, /<span class="\$\{memberNumberClass\(member\)\}">\$\{escapeHtml\(member\.member_number \|\| '—'\)\}<\/span>/);
  assert.match(detail, /readonlyField\('이메일'/);
  assert.match(detail, /readonlyField\('가입일'/);
  assert.doesNotMatch(detail, /readonlyField\('닉네임'/);
  assert.doesNotMatch(detail, /readonlyField\('이름'/);
  assert.doesNotMatch(detail, /readonlyField\('연락처'/);
  assert.doesNotMatch(detail, /readonlyField\('회원유형'/);
  assert.doesNotMatch(detail, /readonlyField\('멤버십'/);
  assert.doesNotMatch(detail, /readonlyField\('계정상태'/);
});

// Corrected status-color policy: black now requires an explicit
// application_completed === true. false, null, and undefined (including a
// historic row that predates this column) all read as "not yet complete"
// (red) -- a NULL no longer passes as if the application were already done.
// A member with no member_number at all gets its own distinct, non-alarming
// "needs reconciliation" treatment instead of either color.
test('member-number status color rule: true is black, everything else with a number is red, no number is its own missing state', () => {
  assert.match(adminJs, /const memberNumberClass = member => \{\s*if \(!member\.member_number\) return 'member-number member-number-missing';\s*return member\.application_completed === true \? 'member-number' : 'member-number member-number-pending';\s*\};/);
  assert.match(adminCss, /\.member-number\{display:inline-block;color:#111827;/);
  assert.match(adminCss, /\.member-number\.member-number-pending\{color:#dc2626\}/);
  assert.match(adminCss, /\.member-number\.member-number-missing\{color:#9aa8b8;font-style:italic/);
});

test('detail dialog is a consolidated 2-card grid (기본정보 absorbs 지역·권한, 회원정보 absorbs 전문분야) with 강의과목/기능권한 as standalone rows below it', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /<h3>기본 정보 <small class="member-editable-note">필드별 관리 source 표시<\/small><\/h3>/);
  assert.match(detail, /<h3>회원·파트너 정보 <small class="member-editable-note">관리 설정<\/small><\/h3>/);
  // No more standalone 지역·권한/전문분야 cards or titles.
  assert.doesNotMatch(detail, /<h3>지역·권한<\/h3>/);
  assert.doesNotMatch(detail, /member-group--region|member-group--specialty/);
  // Just two cards + the subjects row assemble into one explicit grid;
  // 기능 권한 is a standalone row appended after it, not nested in any card.
  assert.match(detail, /const grid = `<div class="member-detail-grid">\$\{basicInfoFields\}\$\{roleInfoFields\}\$\{subjectsRow\}<\/div>`;/);
  assert.match(detail, /const featureRow = `<div class="member-feature-row" id="detailFeatures">/);
  assert.match(detail, /class="member-detail-groups">\$\{grid\}\$\{featureRow\}/);
  assert.match(adminCss, /\.member-detail-grid\{display:grid;gap:8px\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{[\s\S]*?\.member-detail-grid\{grid-template-columns:1fr 1fr\}/);
  // Explicit placement: 기본정보/회원정보 share row 1 (native grid stretch
  // equalizes their height); 강의과목 is a standalone full-width row 2.
  assert.match(adminCss, /\.member-detail-grid>\.member-group--info\{grid-column:1;grid-row:1\}/);
  assert.match(adminCss, /\.member-detail-grid>\.member-group--role\{grid-column:2;grid-row:1\}/);
  assert.match(adminCss, /\.member-detail-grid>\.member-subjects-row\{grid-column:1\/-1;grid-row:2\}/);
});

test('활동 지역/전문분야 are reached through one popup instead of separate equal-height boxes in the main grid', () => {
  // 활동 지역/수업 범위/전문분야 no longer render inside either card's grid
  // at all (no .member-region-compact/.member-region-row/.member-region-combined
  // box style needed any more) -- they live in the 지역정보 관리 popup,
  // opened via one bottom-right button.
  assert.doesNotMatch(adminCss, /\.member-region-compact\{/);
  assert.doesNotMatch(adminCss, /\.member-region-actions\{/);
  assert.doesNotMatch(adminCss, /\.member-region-combined\{/);
  assert.match(adminCss, /\.member-group-footer\{display:flex;justify-content:flex-end/);
  assert.match(adminCss, /\.partner-region-summary\{display:grid/);
  assert.match(adminCss, /\.feature-summary\{display:flex;align-items:center;flex-wrap:wrap;/);
  assert.doesNotMatch(adminCss, /min-height:144px/);
});

test('every grid/flex child and every group-grid input/select shrinks to fit instead of forcing the dialog to scroll horizontally', () => {
  assert.match(adminCss, /\.member-group-grid input,\.member-group-grid select\{width:100%;max-width:100%;box-sizing:border-box\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{\s*\n\s*\.member-detail>\*,/);
});

test('이메일 shows the full address with no ellipsis, wrapping instead of truncating within its half-width column', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /readonlyField\('이메일', escapeHtml\(member\.email \|\| ''\)\)/);
  assert.match(adminCss, /\.member-group--info \.member-readonly strong\{flex:1 1 auto;min-width:0;overflow-wrap:anywhere\}/);
});
