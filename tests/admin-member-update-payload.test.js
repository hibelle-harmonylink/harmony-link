const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminSource = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const functionSource = fs.readFileSync(
  path.join(root, 'supabase', 'functions', 'notify-role-change', 'index.ts'),
  'utf8'
);

test('name updates send only the member id and display name', () => {
  assert.match(adminSource, /admin_update_member_name', \{ p_member_id: member\.id, p_display_name: nextName \}/);
});

test('membership, status, and user-type updates use the dedicated access RPC without role', () => {
  const accessCall = adminSource.match(/admin_update_member_access', \{([^}]+)\}/)?.[1] || '';
  assert.match(accessCall, /p_member_id: member\.id/);
  assert.match(accessCall, /p_user_type: nextUserType/);
  assert.match(accessCall, /p_membership: nextMembership/);
  assert.match(accessCall, /p_account_status: nextStatus/);
  assert.doesNotMatch(accessCall, /\brole\b/);
});

test('saving unchanged values performs no update request', () => {
  const unchangedGuard = adminSource.indexOf('if (!nameChanged && !accessChanged)');
  const firstRpc = adminSource.indexOf("callRpc('admin_update_member_name'", unchangedGuard);
  assert.ok(unchangedGuard >= 0 && firstRpc > unchangedGuard);
  assert.match(adminSource.slice(unchangedGuard, firstRpc), /return;/);
});

test('profile sync never transmits protected role as a mutable field', () => {
  const start = functionSource.indexOf("if (requestBody.action === 'profile_sync')");
  const end = functionSource.indexOf('const isMemberTypeChange', start);
  const profileSync = functionSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(profileSync, /syncFormData\.set\('role'/);
  assert.match(profileSync, /syncFormData\.set\('partner_tier'/);
  assert.match(profileSync, /syncFormData\.set\('membership'/);
  assert.match(profileSync, /syncFormData\.set\('account_status'/);
  assert.doesNotMatch(profileSync, /premium_member/);
  assert.match(profileSync, /syncProfileError/);
  assert.ok(profileSync.indexOf('syncProfileError') < profileSync.indexOf("Member profile not found"));
});

test('profile sync reuses the security-definer admin lookup instead of direct table access', () => {
  const start = functionSource.indexOf("if (requestBody.action === 'profile_sync')");
  const end = functionSource.indexOf('const isMemberTypeChange', start);
  const profileSync = functionSource.slice(start, end);
  assert.match(profileSync, /userClient\.rpc\('admin_list_members'/);
  assert.doesNotMatch(profileSync, /adminClient\s*\.from\('member_profiles'\)/);
  assert.match(profileSync, /profile\.id === syncMemberId/);
});

test('role notifications normalize user types without changing stored member data', () => {
  assert.match(functionSource, /normalizedRole === 'student'/);
  assert.match(functionSource, /normalizedUserType === 'student'/);
  assert.match(functionSource, /return 'member'/);
  assert.match(functionSource, /normalizedUserType === 'partner'/);
  assert.match(functionSource, /return 'partner20'/);
  assert.match(functionSource, /return 'partner50'/);
  assert.match(functionSource, /normalizedQueuedRole !== storedRole/);
});

test('role notification profile lookup distinguishes query errors from missing rows', () => {
  const notificationLookup = functionSource.indexOf('const { data: memberProfile, error: memberProfileError }');
  const missingProfile = functionSource.indexOf("if (!memberProfile) return json({ error: 'Member profile not found' }, 404)", notificationLookup);
  assert.ok(notificationLookup >= 0 && missingProfile > notificationLookup);
  assert.ok(functionSource.indexOf('if (memberProfileError)', notificationLookup) < missingProfile);
});

