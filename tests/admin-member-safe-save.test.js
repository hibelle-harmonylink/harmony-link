const assert = require('node:assert/strict');
const { inspect } = require('node:util');
const test = require('node:test');
const { createAdminHarness } = require('./helpers/admin-harness');

const member = {
  id: 'test-member', email: 'member@example.test', display_name: '한글 이름',
  nickname: 'Old nickname', full_name: null, phone: null, specialty: null,
  teaching_subjects: null, enrolled_subject: null, assigned_instructor: null,
  user_type: 'student', membership: 'free', account_status: 'active', role: 'member',
};
const metadataFields = ['full_name', 'phone', 'specialty', 'teaching_subjects', 'enrolled_subject', 'assigned_instructor'];
const payloadCall = harness => harness.calls.find(call => call.name === 'admin_update_member_metadata');

for (const [label, overrides, expected] of [
  ['profile display name wins', { full_name: 'Application Name' }, '한글 이름'],
  ['missing profile name uses metadata', { display_name: null, full_name: 'Application Name' }, 'Application Name'],
  ['whitespace profile name uses metadata', { display_name: '  ', full_name: 'Application Name' }, 'Application Name'],
  ['missing full name uses email', { display_name: '', full_name: null }, 'member'],
  ['nickname alone is not a person name', { display_name: '', full_name: '', nickname: 'Business' }, 'member'],
  ['separate Auth metadata is not a frontend name source', { display_name: '', full_name: 'Application Name', user_metadata: { full_name: 'Auth Name' } }, 'Application Name'],
  // Current RPC already coalesces the Auth name into display_name. The frontend
  // cannot infer that its source was Auth rather than member_profiles.
  ['RPC-coalesced Auth name remains opaque (RPC limitation)', { display_name: 'Auth Name', full_name: 'Application Name' }, 'Auth Name'],
  ['admin brand placeholder has the existing exception', { display_name: 'Harmony Link', is_admin: true }, '하이벨'],
  ['archived name follows the same frontend policy', { display_name: 'Archived Name', is_withdrawn: true, account_status: 'withdrawn' }, 'Archived Name'],
  ['archive fallback still excludes nickname', { display_name: null, full_name: 'Archived Full Name', is_withdrawn: true }, 'Archived Full Name'],
]) {
  test(label, () => {
    const app = createAdminHarness();
    const row = { ...member, ...overrides };
    assert.equal(app.memberPersonName(row), expected);
    assert.equal(app.resolveDisplayName(row), expected);
  });
}

test('withdrawn detail remains read-only and displays its archived identity', () => {
  const app = createAdminHarness();
  app.openDetail({ ...member, is_withdrawn: true, account_status: 'withdrawn', display_name: 'Archived Name' });
  const html = app.get('memberDetail').innerHTML;
  assert.match(html, /Archived Name/);
  assert.match(html, /탈퇴 회원은/);
  assert.doesNotMatch(html, /id="detailName"/);
  assert.match(html, /id="detailSave" disabled/);
  assert.match(html, /id="detailNickname"[^>]*disabled/);
});

test('nickname-only save preserves empty full_name and never writes display fallbacks into metadata', async () => {
  let stored = { ...member };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_list_members') return { data: [{ ...stored }], error: null };
    if (name === 'admin_update_member_metadata') {
      stored.nickname = params.p_nickname;
      return { data: [], error: null };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  } });
  await app.save(member, { nickname: 'New nickname' });
  const { params } = payloadCall(app);
  for (const field of metadataFields) assert.equal(params[`p_${field}`], '');
  assert.equal(params.p_nickname, 'New nickname');
  assert.equal(app.calls.some(call => call.name === 'admin_update_member_name'), false);
  assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
});

test('nickname save uses freshly read raw metadata, not stale or formatted modal values', async () => {
  const latest = { ...member, full_name: 'Latest Name', phone: '+1 212 555 0101', specialty: 'Latest specialty',
    teaching_subjects: 'Latest teaching', enrolled_subject: 'Latest course', assigned_instructor: 'Latest instructor' };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_list_members') return { data: [{ ...latest }], error: null };
    if (name === 'admin_update_member_metadata') { latest.nickname = params.p_nickname; return { error: null }; }
    throw new Error(`Unexpected RPC: ${name}`);
  } });
  await app.save({ ...member, full_name: 'Stale Name', phone: '2125550100' }, { nickname: 'New nickname' });
  const { params } = payloadCall(app);
  for (const field of metadataFields) assert.equal(params[`p_${field}`], latest[field]);
  assert.equal(app.calls[0].name, 'admin_list_members');
  assert.deepEqual(Object.keys(params).sort(), ['p_member_id', 'p_nickname', ...metadataFields.map(field => `p_${field}`)].sort());
});

test('nickname-only change does not persist a name prefilled from full_name', async () => {
  const row = { ...member, display_name: null, full_name: 'Application Name' };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_list_members') return { data: [{ ...row }], error: null };
    if (name === 'admin_update_member_metadata') { row.nickname = params.p_nickname; return { error: null }; }
    return { error: null };
  } });
  await app.save(row, { nickname: 'New nickname' });
  assert.equal(app.calls.some(call => call.name === 'admin_update_member_name'), false);
});

for (const [label, response] of [
  ['RPC error', { data: null, error: { message: 'read failed' } }],
  ['missing member', { data: [], error: null }],
  ['missing metadata field', { data: [{ id: member.id, full_name: null }], error: null }],
  ['withdrawn member', { data: [{ ...member, is_withdrawn: true }], error: null }],
]) {
  test(`metadata pre-read fails closed: ${label}`, async () => {
    const app = createAdminHarness({ rpc: async () => response });
    app.setMembers([{ ...member, nickname: 'New nickname' }]);
    await app.save(member, { nickname: 'New nickname' });
    assert.equal(payloadCall(app), undefined);
    assert.equal(app.followups.length, 0);
    assert.equal(app.timers.some(timer => timer.ms === 1000), false);
    assert.doesNotMatch(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  });
}

test('clearing nickname verifies the raw empty value, not its display fallback', async () => {
  let stored = { ...member };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_list_members') return { data: [{ ...stored }], error: null };
    stored.nickname = params.p_nickname || null;
    return { error: null };
  } });
  await app.save(member, { nickname: '' });
  assert.equal(payloadCall(app).params.p_nickname, '');
  assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
});

for (const failure of ['returned error', 'thrown error', 'malformed data', 'missing row']) {
  test(`post-save verification cannot use matching stale cache: ${failure}`, async () => {
    const app = createAdminHarness({ rpc: async name => {
      if (name !== 'admin_list_members') return { error: null };
      if (failure === 'thrown error') throw new Error('network failed');
      if (failure === 'malformed data') return { data: null, error: null };
      if (failure === 'missing row') return { data: [], error: null };
      return { data: null, error: { message: 'read failed' } };
    } });
    app.setMembers([{ ...member, display_name: 'New name' }]);
    await app.save(member, { name: 'New name' });
    assert.match(app.get('adminMessage').textContent, /확인하지 못했습니다/);
    assert.doesNotMatch(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
    assert.equal(app.followups.length, 0);
    assert.equal(app.timers.some(timer => timer.ms === 1000), false);
    assert.equal(app.get('adminRefresh').disabled, false);
    assert.equal(app.get('memberDetail').querySelector('#detailSave').disabled, false);
  });
}

test('successful fresh reread still verifies a real name edit', async () => {
  const stored = { ...member };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_update_member_name') { stored.display_name = params.p_display_name; return { error: null }; }
    if (name === 'admin_list_members') return { data: [{ ...stored }], error: null };
    throw new Error(`Unexpected RPC: ${name}`);
  } });
  await app.save(member, { name: 'New name' });
  assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  assert.equal(app.timers.some(timer => timer.ms === 1000), true);
});

test('unchanged display fallbacks do not cause any save request', async () => {
  const app = createAdminHarness();
  await app.save({ ...member, display_name: '', nickname: null, full_name: 'Application Name' });
  assert.equal(app.calls.length, 0);
});

function assertVerificationIncomplete(app) {
  assert.match(app.get('adminMessage').textContent, /확인하지 못했습니다.*일부 변경이 반영되었을 수 있으므로 새로고침 후 확인/);
  assert.doesNotMatch(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  assert.equal(app.get('memberDetail').querySelector('#detailSaveFeedback').className, 'member-save-feedback error');
  assert.equal(app.get('memberDetail').querySelector('#detailSave').disabled, false);
  assert.equal(app.get('memberDialog').open, true);
  assert.equal(app.timers.some(timer => timer.ms === 1000), false);
  assert.equal(app.followups.length, 0);
}

for (const field of ['user_type', 'membership', 'account_status']) {
  for (const invalid of ['missing', 'null', 'undefined', 'unsupported']) {
    test(`verification contract rejects ${invalid} access field: ${field}`, async () => {
      const original = { ...member, user_type: 'partner', membership: 'premium', account_status: 'suspended', role: 'partner50' };
      const response = { ...member };
      if (invalid === 'missing') delete response[field];
      else response[field] = { null: null, undefined: undefined, unsupported: 'unsupported' }[invalid];
      const app = createAdminHarness({ rpc: async name => name === 'admin_list_members'
        ? { data: [response], error: null } : { error: null } });
      await app.save(original, { userType: 'student', membership: 'free', status: 'active' });
      assert.equal(app.calls[0].name, 'admin_update_member_access');
      assertVerificationIncomplete(app);
    });
  }
}

for (const invalid of ['missing', 'undefined', 'number', 'inherited']) {
  test(`verification contract rejects ${invalid} nickname after a clear request`, async () => {
    let reads = 0;
    const app = createAdminHarness({ rpc: async name => {
      if (name !== 'admin_list_members') return { error: null };
      const response = { ...member };
      if (++reads > 1) {
        delete response.nickname;
        if (invalid === 'undefined') response.nickname = undefined;
        if (invalid === 'number') response.nickname = 0;
        if (invalid === 'inherited') Object.setPrototypeOf(response, { nickname: '' });
      }
      return { data: [response], error: null };
    } });
    await app.save(member, { nickname: '' });
    assert.equal(payloadCall(app).params.p_nickname, '');
    assertVerificationIncomplete(app);
  });
}

for (const invalid of ['missing', 'object']) {
  test(`verification contract rejects ${invalid} display_name after a name edit`, async () => {
    const response = { ...member };
    if (invalid === 'missing') delete response.display_name;
    else response.display_name = { value: 'New name' };
    const app = createAdminHarness({ rpc: async name => name === 'admin_list_members'
      ? { data: [response], error: null } : { error: null } });
    await app.save(member, { name: 'New name' });
    assertVerificationIncomplete(app);
  });
}

test('verification contract accepts an explicitly empty nickname, unlike a missing property', async () => {
  const stored = { ...member };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_list_members') return { data: [{ ...stored }], error: null };
    if (name === 'admin_update_member_metadata') { stored.nickname = params.p_nickname; return { error: null }; }
    throw new Error(`Unexpected RPC: ${name}`);
  } });
  await app.save(member, { nickname: '' });
  assert.equal(Object.hasOwn(stored, 'nickname'), true);
  assert.equal(stored.nickname, '');
  assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  const closeTimer = app.timers.find(timer => timer.ms === 1000);
  assert.ok(closeTimer);
  closeTimer.callback();
  assert.equal(app.get('memberDialog').open, false);
  assert.equal(app.followups.length, 1);
  assert.equal(app.followups[0][1].body.action, 'profile_sync');
});

test('verification contract accepts valid raw access fields without requiring unchanged nickname', async () => {
  const stored = { ...member, account_status: 'suspended' };
  const app = createAdminHarness({ rpc: async (name, params) => {
    if (name === 'admin_update_member_access') { stored.account_status = params.p_account_status; return { error: null }; }
    if (name === 'admin_list_members') { const response = { ...stored }; delete response.nickname; return { data: [response], error: null }; }
    throw new Error(`Unexpected RPC: ${name}`);
  } });
  await app.save({ ...stored }, { status: 'active' });
  assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  assert.equal(app.timers.some(timer => timer.ms === 1000), true);
  assert.equal(app.followups.length, 1);
});

for (const outcome of ['success', 'returned error', 'thrown error']) {
  test(`save-path console logging excludes member data and raw RPC bodies: ${outcome}`, async () => {
    const sensitive = { ...member, email: 'privacy-sentinel@example.test', full_name: 'Synthetic Private Full Name', phone: '212-555-0100' };
    const other = { ...sensitive, id: 'other-member', email: 'other-sentinel@example.test' };
    const error = Object.assign(new Error('private-error-sentinel'), { details: sensitive, code: 'private-code-sentinel' });
    const stored = { ...sensitive };
    const app = createAdminHarness({ rpc: async (name, params) => {
      if (name === 'admin_list_members') return { data: [{ ...stored }, other], error: null };
      if (outcome === 'thrown error') throw error;
      if (outcome === 'returned error') return { data: [sensitive], error };
      if (name === 'admin_update_member_name') stored.display_name = params.p_display_name;
      if (name === 'admin_update_member_metadata') stored.nickname = params.p_nickname;
      return { data: [stored], error: null };
    } });
    await app.save(sensitive, { name: 'Synthetic Private New Name', nickname: 'Synthetic Private Nickname' });
    const output = inspect(app.logs, { depth: null });
    for (const value of [sensitive.email, sensitive.full_name, sensitive.phone, other.email,
      'Synthetic Private New Name', 'Synthetic Private Nickname', 'private-error-sentinel', 'private-code-sentinel']) {
      assert.equal(output.includes(value), false, 'console must not receive member values or raw errors');
    }
    assert.ok(app.logs.some(entry => entry.args[0].includes('RPC')));
    if (outcome === 'success') assert.match(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
    else assert.doesNotMatch(app.get('adminMessage').textContent, /^변경사항이 저장되었습니다/);
  });
}
