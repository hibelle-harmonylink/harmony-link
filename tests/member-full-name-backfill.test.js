const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '202609130003_backfill_member_full_names.sql'),
  'utf8',
);

test('backfills only the seven confirmed member real names in one transaction', () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /commit;\s*$/m);
  assert.match(migration, /expected exactly seven member metadata rows for full-name backfill/);

  const expected = {
    'HL-26-001': '하이벨',
    'HL-26-002': '김미란',
    'HL-26-003': '노혜경',
    'HL-26-004': '노혜경',
    'HL-26-005': '신영숙',
    'HL-26-006': '염명재',
    'HL-26-007': '윤형준',
  };

  for (const [memberNumber, fullName] of Object.entries(expected)) {
    assert.match(migration, new RegExp(`when '${memberNumber}' then '${fullName}'`));
  }
});

test('does not update identity or account fields other than full_name', () => {
  const update = migration.match(/update public\.member_admin_metadata[\s\S]*?\ncommit;/)?.[0] ?? '';
  assert.match(update, /set full_name = case member_number/);
  assert.doesNotMatch(
    update,
    /set[\s\S]*\b(nickname|phone|member_id|member_number|joined_at|archived_at|specialty|teaching_subjects|enrolled_subject|assigned_instructor)\s*=/,
  );
  assert.doesNotMatch(migration, /update public\.member_profiles/);
});
