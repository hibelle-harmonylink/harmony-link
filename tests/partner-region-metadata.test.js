const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migrationPath = path.join(root, 'supabase', 'migrations', '202609170001_partner_region_metadata.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

test('partner region metadata is additive and separates location from service coverage', () => {
  assert.match(migration, /begin;[\s\S]*commit;/i);
  for (const column of [
    'country_code text', 'country_name text', 'state_code text', 'state_name text',
    'city text', 'online_available boolean', 'nationwide_available boolean'
  ]) assert.match(migration, new RegExp(column, 'i'));
  assert.match(migration, /service_area text\[\]/i);
  assert.doesNotMatch(migration, /service_area\s+text\s*,/i);
  assert.match(migration, /using gin \(service_area\)/i);
  assert.match(migration, /\(country_code, state_code, city\)/i);
});

test('New York backfill only uses an existing location/address signal and leaves city/service area unknown', () => {
  assert.match(migration, /to_jsonb\(profile\) ->> 'location'/i);
  assert.match(migration, /to_jsonb\(profile\) ->> 'address'/i);
  assert.match(migration, /country_code = 'US'/i);
  assert.match(migration, /state_code = 'NY'/i);
  assert.match(migration, /state_name = 'New York'/i);
  assert.doesNotMatch(migration, /city\s*=\s*'(Queens|Manhattan|Brooklyn|Bronx|Long Island)'/i);
  assert.doesNotMatch(migration, /service_area\s*=\s*array\[/i);
});

test('future region updates preserve active-admin, self-update, withdrawn, and partner-only safeguards', () => {
  assert.match(migration, /create or replace function public\.admin_update_partner_region/i);
  assert.match(migration, /administrator\.role = 'admin'[\s\S]*administrator\.account_status = 'active'/i);
  assert.match(migration, /p_member_id = auth\.uid\(\)/i);
  assert.match(migration, /withdrawn members are read-only/i);
  assert.match(migration, /profile\.user_type = 'partner'/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = pg_catalog, public, auth/i);
  assert.match(migration, /revoke all on function public\.admin_update_partner_region/i);
  assert.match(migration, /grant execute on function public\.admin_update_partner_region[\s\S]*to authenticated/i);
  assert.doesNotMatch(migration, /grant .* on table public\.member_admin_metadata to authenticated/i);
});

test('current admin metadata RPC remains untouched while business spotlight stays separate from partner access', () => {
  assert.doesNotMatch(migration, /create or replace function public\.admin_update_member_metadata/i);
  const homepageScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  assert.match(homepageScript, /BUSINESS SPOTLIGHT/);
  assert.match(homepageScript, /비즈니스 스포트라이트/);
  assert.match(homepageScript, /const businessRegions/);
  assert.match(homepageScript, /const businessSpotlights/);
  assert.match(homepageScript, /\{id:'tx',labelKo:'TEXAS'/);
  assert.match(homepageScript, /Business listings for/);
  assert.match(homepageScript, /const adRooms=/);
});
