const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const memberSignup = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');

const formatPhone = new Function(`${memberSignup}\nreturn formatPhone_;`)();

test('roster phone formatter normalizes only unambiguous US ten-digit numbers', () => {
  assert.equal(formatPhone('8179053468'), '817-905-3468');
  assert.equal(formatPhone('817 905 3468'), '817-905-3468');
  assert.equal(formatPhone('(817) 905-3468'), '817-905-3468');
  assert.equal(formatPhone('+1 817 905 3468'), '817-905-3468');
  assert.equal(formatPhone('817-905-3468'), '817-905-3468');
});

test('roster phone formatter preserves non-US or uncertain values', () => {
  assert.equal(formatPhone('010-9773-0052'), '010-9773-0052');
  assert.equal(formatPhone('+82 10 9773 0052'), '+82 10 9773 0052');
  assert.equal(formatPhone('817-905'), '817-905');
});

test('new, application, and profile roster paths use the shared phone formatter', () => {
  assert.match(memberSignup, /formatPhone_\(applicationValue_\(values, 'phone', '연락처'\)\)/);
  assert.match(memberSignup, /setValues\(\[\[formatPhone_\(values\.phone\)\]\]\)/);
  assert.match(memberSignup, /text_\(values\.full_name\), email, formatPhone_\(values\.phone\), text_\(values\.member_signup_method\)/);
  assert.match(admin, /const formatPhone = value => \{/);
  assert.match(admin, /escapeHtml\(formatPhone\(member\.phone\)\)/);
});

test('existing roster phone cleanup is opt-in and only writes safely normalized values', () => {
  const backfill = memberSignup.slice(memberSignup.indexOf('function backfillPhoneFormats_'));
  assert.match(backfill, /function backfillPhoneFormats_\(\)/);
  assert.match(backfill, /const formatted = formatPhone_\(row\[0\]\)/);
  assert.match(backfill, /if \(formatted !== row\[0\]\)/);
  assert.match(backfill, /range\.getCell\(index \+ 1, 1\)\.setValue\(formatted\)/);
  assert.doesNotMatch(memberSignup.slice(0, memberSignup.indexOf('function backfillPhoneFormats_')), /backfillPhoneFormats_\(/);
});

test('admin form keeps synchronized application fields display-only while retaining direct and settings controls', () => {
  const detail = admin.slice(admin.indexOf('const openDetail = raw =>'), admin.indexOf('const resendNotification ='));
  ['영문 이름', '연락처', '전문분야', '강의과목', '수강과목', '담당강사'].forEach(label => assert.match(detail, new RegExp(`syncedReadonlyField\\('${label}'`)));
  ['detailFullName', 'detailPhone', 'detailSpecialty', 'detailTeachingSubjects', 'detailEnrolledSubject', 'detailAssignedInstructor'].forEach(id => assert.doesNotMatch(detail, new RegExp(`id="${id}"`)));
  assert.match(detail, /id="detailName"/);
  assert.match(detail, /id="detailNickname"/);
  assert.match(detail, /id="detailType"/);
  assert.match(detail, /id="detailMembership"/);
  assert.match(detail, /id="detailStatus"/);
});

test('provider full name is stored separately from nickname without identity-specific hardcoding', () => {
  const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
  assert.match(auth, /providerMetadata\.full_name \|\| providerMetadata\.name/);
  assert.match(auth, /providerMetadata\.nickname \|\| ''/);
  assert.doesNotMatch(auth, /석은정|서은정|lisa seok/i);
});

test('roster schema makes member numbers bold and aligns roster columns consistently', () => {
  assert.match(memberSignup, /COLUMNS\.memberNumber, rows, 1\)\.setHorizontalAlignment\('center'\)\.setFontWeight\('bold'\)/);
  assert.match(memberSignup, /COLUMNS\.joinedAt, rows, 1\)\.setNumberFormat\('yyyy-mm-dd'\)\.setHorizontalAlignment\('center'\)/);
  assert.match(memberSignup, /COLUMNS\.nickname, rows, HEADERS\.length - COLUMNS\.nickname \+ 1\)\.setHorizontalAlignment\('left'\)/);
  assert.match(memberSignup, /COLUMNS\.memberNumber, 1, 2\)\.setHorizontalAlignment\('center'\)/);
});

test('admin name list policy remains display name then full name then email prefix, never nickname', () => {
  assert.match(admin, /const memberPersonName = member => String\(member\.display_name \|\| ''\)\.trim\(\) \|\| String\(member\.full_name \|\| ''\)\.trim\(\) \|\| fallbackMemberName\(member\)/);
  assert.match(admin, /\['이름', escapeHtml\(memberPersonName\(member\)\)/);
  assert.match(admin, /member\.nickname \|\| ''\} \$\{member\.full_name \|\| ''\} \$\{member\.display_name \|\| ''\} \$\{member\.email \|\| ''\}/);
});
