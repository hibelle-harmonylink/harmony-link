const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const readerMigration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609170002_admin_partner_region_reader.sql'), 'utf8');

test('activity region is a partner-only detail block with country, state, city, service areas, and service modes', () => {
  assert.match(admin, /class="partner-region partner-metadata" hidden/);
  assert.match(admin, /활동 지역/);
  assert.match(admin, /id="detailCountryCode"/);
  assert.match(admin, /id="detailStateCode"/);
  assert.match(admin, /id="detailCity"/);
  assert.match(admin, /id="detailServiceAreaInput"/);
  assert.match(admin, /온라인 수업 가능/);
  assert.match(admin, /미국 전역 가능/);
  assert.match(admin, /field\.hidden = selectedType !== 'partner'/);
});

test('region choices use extensible country and state data with current US, New York, and Texas choices', () => {
  assert.match(admin, /const COUNTRY_OPTIONS = \[\{ code: 'US', name: 'United States' \}\]/);
  assert.match(admin, /US: \[/);
  assert.match(admin, /code: 'NY', name: 'New York'/);
  assert.match(admin, /code: 'TX', name: 'Texas'/);
  assert.match(admin, /const setStateOptions = selectedCountry/);
});

test('service areas are trimmed, de-duplicated, removable chips rather than a comma string', () => {
  assert.match(admin, /const normalizeServiceAreas = values/);
  assert.match(admin, /toLocaleLowerCase\('en-US'\)/);
  assert.match(admin, /detailAddServiceArea/);
  assert.match(admin, /\$\{area\} 제거/);
  assert.match(admin, /serviceAreas = serviceAreas\.filter/);
  assert.match(admin, /p_service_area: nextRegion\.service_area/);
});

test('region summary and inactive toggles preserve the expected admin display semantics', () => {
  assert.match(admin, /지역 미등록/);
  assert.match(admin, /modes\.push\('방문'\)/);
  assert.match(admin, /modes\.push\('온라인'\)/);
  assert.match(admin, /modes\.push\('미국 전역 가능'\)/);
  assert.match(admin, /online_available: Boolean\(region\?\.online_available\)/);
  assert.match(admin, /nationwide_available: Boolean\(region\?\.nationwide_available\)/);
});

test('only the existing region update RPC writes region values, after an access change when necessary', () => {
  assert.match(admin, /const regionChanged = nextUserType === 'partner'/);
  assert.match(admin, /admin_update_member_access/);
  assert.match(admin, /if \(regionChanged\) \{/);
  assert.match(admin, /admin_update_partner_region/);
  assert.match(admin, /회원유형 변경이 저장되지 않아 활동 지역을 저장하지 않았습니다/);
  assert.doesNotMatch(admin, /\.from\('member_admin_metadata'\)\.update/);
});

test('admin detail re-reads a saved partner region on every partner reopen', () => {
  assert.match(admin, /client\.rpc\('admin_get_partner_region', \{ p_member_id: member\.id \}\)/);
  assert.match(admin, /return Array\.isArray\(data\) \? data\[0\] : data/);
  assert.match(admin, /readPartnerRegion\(\)\.then\(renderPartnerRegion\)/);
});

test('reader migration is active-admin-only security definer and leaves the existing list RPC untouched', () => {
  assert.match(readerMigration, /create or replace function public\.admin_get_partner_region/);
  assert.match(readerMigration, /security definer/);
  assert.match(readerMigration, /set search_path = pg_catalog, public, auth/);
  assert.match(readerMigration, /administrator\.role = 'admin'/);
  assert.match(readerMigration, /administrator\.account_status = 'active'/);
  assert.match(readerMigration, /profile\.user_type = 'partner'/);
  assert.match(readerMigration, /revoke all on function public\.admin_get_partner_region\(uuid\) from public/);
  assert.doesNotMatch(readerMigration, /create or replace function public\.admin_list_members/);
});

test('partner region controls have responsive, non-overflowing mobile layout', () => {
  assert.match(css, /\.partner-region-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.partner-service-area-controls\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css, /\.partner-region-grid\{grid-template-columns:1fr\}/);
  assert.match(css, /\.partner-service-area-controls\{grid-template-columns:1fr\}/);
});

test('only partners receive a clear, dedicated region save action', () => {
  assert.match(admin, /class="partner-region partner-metadata" hidden/);
  assert.match(admin, /id="detailRegionSave" type="button" class="btn btn-primary" disabled>지역정보 저장/);
  assert.match(admin, /regionSaveButton\.disabled = !editablePartner/);
  assert.match(css, /\.partner-region-save\{display:flex;align-items:center;justify-content:flex-end/);
});

test('dedicated region save calls only the existing region RPC and never member metadata or access RPCs', () => {
  const start = admin.indexOf('const savePartnerRegion = async () =>');
  const end = admin.indexOf("countryCode.addEventListener", start);
  const saveAction = admin.slice(start, end);
  assert.match(saveAction, /admin_update_partner_region/);
  assert.match(saveAction, /p_country_code: requested\.country_code/);
  assert.match(saveAction, /p_service_area: requested\.service_area/);
  assert.doesNotMatch(saveAction, /admin_update_member_(?:metadata|access|name)/);
});

test('dedicated region save prevents duplicate clicks, verifies persistence, and reports success or failure', () => {
  const start = admin.indexOf('const savePartnerRegion = async () =>');
  const end = admin.indexOf("countryCode.addEventListener", start);
  const saveAction = admin.slice(start, end);
  assert.match(saveAction, /if \(regionSaveButton\.disabled\) return/);
  assert.match(saveAction, /regionSaveButton\.textContent = '저장 중…'/);
  assert.match(saveAction, /const saved = await readPartnerRegion\(\)/);
  assert.match(saveAction, /samePartnerRegion\(saved, requested\)/);
  assert.match(saveAction, /지역정보가 저장되었습니다\./);
  assert.match(saveAction, /지역정보 저장에 실패했습니다:/);
  assert.match(saveAction, /regionSaveButton\.textContent = '지역정보 저장'/);
});

test('region save remains prominent and full-width on a 390px mobile detail dialog', () => {
  assert.match(css, /\.partner-region-save\{display:grid;grid-template-columns:1fr\}/);
  assert.match(css, /\.partner-region-save button\{width:100%;min-height:46px\}/);
});
