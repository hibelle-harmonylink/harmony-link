const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '202609130003_backfill_member_full_names.sql'),
  'utf8',
);

test('production identity backfill migration remains a documented no-op transaction', () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /commit;\s*$/m);
  assert.match(migration, /production identity backfills[\s\S]*outside[\s\S]*repository migrations/i);
  assert.match(migration, /Google Sheet remains the member-number source of truth/i);
});

test('production identity backfill migration contains no data mutation or identity literals', () => {
  assert.doesNotMatch(migration, /update\s+public\.member_admin_metadata/i);
  assert.doesNotMatch(migration, /\b(?:update|insert\s+into|delete\s+from)\b/i);
  assert.doesNotMatch(migration, /\braise\s+exception\b/i);
  assert.doesNotMatch(migration, /\bHL-\d{2}-\d{3}\b/);
  assert.doesNotMatch(migration, /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
  assert.doesNotMatch(migration, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
});
