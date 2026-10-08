const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const admin = read('admin.js');
const html = read('admin.html');
const oldMigration = read('supabase/migrations/202609130004_member_application_completion.sql');
const newMigration = read('supabase/migrations/202610070001_admin_list_members_name_source_split.sql');

// admin_list_members() used to fold the OAuth provider's raw_user_meta_data
// full_name into the display_name column whenever member_profiles.display_name
// was empty. That meant display_name was never actually empty by the time the
// client saw it, so admin.js's own full_name fallback was dead code for any
// member whose display_name had never been manually confirmed by an admin --
// even when a verified Korean full_name was already synced from a matched
// application. This migration stops blending the two sources in SQL: the
// client now receives display_name (raw, possibly NULL) and oauth_name (the
// OAuth account name, possibly NULL) as two separate columns, and decides the
// priority itself.
function extractMemberPersonName() {
  const match = admin.match(/const fallbackMemberName = member => \{[\s\S]*?\n  \};\n[\s\S]*?const memberPersonName = member => \{[\s\S]*?\n  \};/);
  assert.ok(match, 'could not extract fallbackMemberName/memberPersonName from admin.js');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[0]}\nthis.memberPersonName = memberPersonName;`, context);
  return context.memberPersonName;
}

// 2026-10 regression: memberNickname/memberFullName used to fall back to
// fallbackMemberName(member) -- the same helper memberPersonName uses to
// always show *some* name for a person -- whenever the member's own
// nickname/full_name was empty. For a member with a confirmed display_name
// but no separate nickname or verified English name (권태화's exact shape),
// that silently copied the Korean display_name into both the 닉네임/업체명
// and 영문 이름 fields. Each field must now read only its own stored value.
function extractNicknameAndFullName() {
  const match = admin.match(/const memberNickname = member => String\(member\.nickname \|\| ''\)\.trim\(\);\s*\n\s*const memberFullName = member => String\(member\.full_name \|\| ''\)\.trim\(\);/);
  assert.ok(match, 'could not extract memberNickname/memberFullName from admin.js');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[0]}\nthis.memberNickname = memberNickname;\nthis.memberFullName = memberFullName;`, context);
  return { memberNickname: context.memberNickname, memberFullName: context.memberFullName };
}

test('REAL EXECUTION: 권태화-shaped member (confirmed 한글 이름, no separate nickname or verified English name) never leaks display_name into 닉네임/영문 이름', () => {
  const { memberNickname, memberFullName } = extractNicknameAndFullName();
  const member = { display_name: '권태화', nickname: '', full_name: '', oauth_name: 'Tae Hwa Kwon', email: 'kwontae@example.com' };
  assert.equal(memberNickname(member), '');
  assert.equal(memberFullName(member), '');
  const memberPersonName = extractMemberPersonName();
  // The header/한글 이름 still correctly shows 권태화 -- only the two
  // separate fields must read as empty, not the person-name helper itself.
  assert.equal(memberPersonName(member), '권태화');
});

test('REAL EXECUTION: a real, distinct nickname or full_name is still returned exactly as stored', () => {
  const { memberNickname, memberFullName } = extractNicknameAndFullName();
  const member = { display_name: '손성경', nickname: 'DMS Care', full_name: 'Christine Son' };
  assert.equal(memberNickname(member), 'DMS Care');
  assert.equal(memberFullName(member), 'Christine Son');
});

test('REAL EXECUTION: display_name wins over full_name and oauth_name when present', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(
    memberPersonName({ display_name: '염나영', full_name: '다른 이름', oauth_name: 'nayoung', email: 'meilly@naver.com' }),
    '염나영'
  );
});

test('REAL EXECUTION: display_name empty falls through to a verified full_name before the OAuth name', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(
    memberPersonName({ display_name: '', full_name: '김미란', oauth_name: 'meeran melody', email: 'meeranmelodyny@gmail.com' }),
    '김미란'
  );
});

test('REAL EXECUTION: display_name and full_name both empty falls through to the OAuth account name, never transliterated', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(
    memberPersonName({ display_name: '', full_name: '', oauth_name: 'Tae Hwa Kwon', email: 'kwontae@gmail.com' }),
    'Tae Hwa Kwon'
  );
});

test('REAL EXECUTION: all three name sources empty falls through to the email local-part', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(
    memberPersonName({ display_name: '', full_name: '', oauth_name: '', email: 'sangup.lee@example.com' }),
    'sangup.lee'
  );
  assert.equal(
    memberPersonName({ display_name: null, full_name: null, oauth_name: null, email: '' }),
    '이름 없음'
  );
});

test('REAL EXECUTION: the admin placeholder display_name special case is unaffected by the oauth_name split', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(
    memberPersonName({ display_name: 'Harmony Link', is_admin: true, oauth_name: 'Harmony Link', email: 'hibelle@hibelleconsulting.com' }),
    '하이벨'
  );
});

test('the new migration stops folding raw_user_meta_data into display_name and returns oauth_name as its own column', () => {
  assert.doesNotMatch(
    newMigration,
    /coalesce\(nullif\(btrim\(profile\.display_name\), ''\), nullif\(user_account\.raw_user_meta_data ->> 'full_name', ''\)/
  );
  assert.match(newMigration, /nullif\(btrim\(profile\.display_name\), ''\)::text,/);
  assert.match(newMigration, /nullif\(btrim\(user_account\.raw_user_meta_data ->> 'full_name'\), ''\)::text/);
  assert.match(newMigration, /application_completed boolean, oauth_name text/);
});

test('the old, superseded migration file is left untouched (a new migration file was used instead)', () => {
  assert.match(
    oldMigration,
    /coalesce\(nullif\(btrim\(profile\.display_name\), ''\), nullif\(user_account\.raw_user_meta_data ->> 'full_name', ''\), split_part\(user_account\.email::text, '@', 1\)\)::text,/
  );
});

test('every other admin_list_members column keeps its exact prior expression -- only display_name/oauth_name changed', () => {
  const unchangedFragments = [
    'metadata.nickname, metadata.full_name,',
    'user_account.created_at, user_account.last_sign_in_at, profile.role, profile.member_type,',
    'profile.user_type, profile.membership, profile.approved_at, profile.account_status,',
    'profile.updated_at, profile.changed_by, profile.role = \'admin\', profile.access_migration_review,',
    'profile.legacy_access_role, metadata.member_number, metadata.phone, metadata.specialty,',
    'metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, false,',
    'metadata.application_completed,',
  ];
  unchangedFragments.forEach(fragment => {
    assert.ok(newMigration.includes(fragment), `expected unchanged fragment missing: ${fragment}`);
  });
  // The archived/withdrawn branch's columns are untouched too; only a
  // trailing null::text (oauth_name) was appended for that branch.
  assert.match(newMigration, /metadata\.teaching_subjects, metadata\.enrolled_subject, metadata\.assigned_instructor, true,\s*\n\s*metadata\.application_completed, null::text/);
  assert.match(newMigration, /grant execute on function public\.admin_list_members\(text, text\) to authenticated;/);
});

test('no English-to-Korean transliteration table or guessing logic was added anywhere in admin.js', () => {
  // Guard against a lookup-table style fix (e.g. mapping known English
  // names to a guessed Korean spelling) rather than using verified sources.
  assert.doesNotMatch(admin, /Yeonhee['"]?\s*:\s*['"]박연희/);
  assert.doesNotMatch(admin, /['"]sangup[^'"]*['"]\s*:\s*['"][가-힣]/i);
  assert.doesNotMatch(admin, /['"]Tae ?Hwa[^'"]*['"]\s*:\s*['"][가-힣]/i);
});

test('admin.js and admin.html asset versions advance together', () => {
  const buildMatch = admin.match(/const BUILD = '(20260917-\d+)';/);
  assert.ok(buildMatch, 'admin.js BUILD constant not found');
  assert.match(html, new RegExp(`admin\\.js\\?v=${buildMatch[1]}`));
});
