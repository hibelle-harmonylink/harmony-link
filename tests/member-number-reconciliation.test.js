const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130004_member_application_completion.sql'), 'utf8');
const appsScript = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'supabase', 'functions', 'notify-role-change', 'index.ts'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');

function issue(rows, memberId, email) {
  const existing = rows.find(row => row.memberId === memberId) || rows.find(row => row.email === email);
  if (existing) return existing.memberNumber;
  const sequence = rows.reduce((highest, row) => Math.max(highest, Number(row.memberNumber.slice(-3))), 0) + 1;
  const memberNumber = `HL-26-${String(sequence).padStart(3, '0')}`;
  rows.push({ memberId, email, memberNumber });
  return memberNumber;
}

test('preserves HL-26-001 through HL-26-007 and issues HL-26-008 once for a new UUID', () => {
  const rows = Array.from({ length: 7 }, (_, index) => ({
    memberId: `member-${index + 1}`,
    email: `member-${index + 1}@example.com`,
    memberNumber: `HL-26-00${index + 1}`,
  }));
  assert.equal(issue(rows, 'member-8', 'member-8@example.com'), 'HL-26-008');
  assert.deepEqual(rows.slice(0, 7).map(row => row.memberNumber), [
    'HL-26-001', 'HL-26-002', 'HL-26-003', 'HL-26-004',
    'HL-26-005', 'HL-26-006', 'HL-26-007',
  ]);
});

test('retries reuse HL-26-008 by UUID or email instead of creating a second number', () => {
  const rows = [{ memberId: 'member-8', email: 'member-8@example.com', memberNumber: 'HL-26-008' }];
  assert.equal(issue(rows, 'member-8', 'member-8@example.com'), 'HL-26-008');
  assert.equal(issue(rows, '', 'member-8@example.com'), 'HL-26-008');
  assert.equal(rows.length, 1);
});

test('new site-only rows are explicitly pending while historic rows remain unchanged', () => {
  assert.match(migration, /add column if not exists application_completed boolean/);
  assert.match(migration, /values \(p_member_id, p_member_number, p_joined_at, false\)/);
  assert.match(migration, /application_completed = public\.member_admin_metadata\.application_completed/);
  assert.match(migration, /metadata\.application_completed/);
  assert.match(admin, /member-number-pending/);
  assert.match(css, /\.member-number\.member-number-pending\{color:#dc2626\}/);
});

test('a matched supplemental application uses UUID first, email fallback, and changes only mutable metadata', () => {
  assert.match(appsScript, /findMemberRow_\(sheet, memberId, email, columns\)/);
  assert.match(appsScript, /if \(row && !memberId\) memberId = text_\(sheet\.getRange\(row, columns\.systemId\)\.getDisplayValue\(\)\)/);
  assert.match(appsScript, /if \(row && isSupplementalApplication\) updateExistingApplication_/);
  assert.match(appsScript, /const immutable = \[columns\.memberNumber - 1, columns\.joinedAt - 1, columns\.systemId - 1\]/);
  assert.match(appsScript, /action: 'member_application_sync'/);
  assert.match(edge, /requestBody\.action === 'member_application_sync'/);
  assert.match(edge, /internal_sync_member_application_metadata/);
  assert.match(migration, /application_completed = true/);
});

test('every completed login requests idempotent Apps Script registration without browser-side number generation', () => {
  assert.match(auth, /const ensureMemberRosterRegistration = async user/);
  assert.match(auth, /harmony-member-number-requested:/);
  assert.match(auth, /await ensureMemberRosterRegistration\(session\?\.user\)/);
  assert.doesNotMatch(auth, /HL-\$\{/);
});
