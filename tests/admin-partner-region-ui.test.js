const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const readerMigration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609170002_admin_partner_region_reader.sql'), 'utf8');

test('activity region is a compact, partner-only summary reached through the 지역정보 관리 popup', () => {
  // 활동 지역/수업 범위 no longer render as their own rows in the main
  // grid at all -- they are computed fresh (partnerRegionSummary/
  // partnerRegionDetailText) each time the 지역정보 관리 popup opens, and
  // shown there alongside 전문분야.
  assert.match(admin, /활동 지역/);
  assert.match(admin, /<span>수업 범위<\/span><strong>\$\{escapeHtml\(partnerRegionDetailText\(partnerRegion\)\)\}<\/strong>/);
  assert.match(admin, /id="detailManagePartnerRegion" class="member-region-manage partner-metadata" hidden>지역정보 관리/);
  assert.doesNotMatch(admin, /id="detailCountryCode"/);
  assert.match(admin, /field\.hidden = selectedType !== 'partner'/);
});

test('hidden .member-readonly rows (활동 지역/수업 범위 for non-partners) actually disappear, not just carry the hidden attribute', () => {
  // .member-readonly{display:grid} (base) and .member-group--info
  // .member-readonly{display:flex} (desktop) both have the same or higher
  // specificity than the UA [hidden]{display:none} default and sit later in
  // the cascade, so either one would silently win and keep a hidden row
  // visible -- the same bug class as .member-region-compact[hidden] and
  // .member-group-grid label[hidden] elsewhere in this file (found by
  // actually rendering a student account in a browser, not just regex).
  assert.match(css, /\.member-readonly\[hidden\]\{display:none\}/);
  assert.match(css, /\.member-group--info \.member-readonly\[hidden\]\{display:none\}/);
});

test('region choices use extensible country and state data with current US, New York, and Texas choices', () => {
  assert.match(admin, /const COUNTRY_OPTIONS = \[\{ code: 'US', name: 'United States' \}\]/);
  assert.match(admin, /US: \[/);
  assert.match(admin, /code: 'NY', name: 'New York'/);
  assert.match(admin, /code: 'TX', name: 'Texas'/);
  assert.match(admin, /const setStateOptions = selectedCountry/);
});

test('region manager preserves trimmed, de-duplicated, removable service-area chips', () => {
  assert.match(admin, /const normalizeServiceAreas = values/);
  assert.match(admin, /toLocaleLowerCase\('en-US'\)/);
  assert.match(admin, /regionAddServiceArea/);
  assert.match(admin, /\$\{area\} 제거/);
  assert.match(admin, /serviceAreas = serviceAreas\.filter/);
  assert.match(admin, /p_service_area: requested\.service_area/);
});

test('region summary separates the location from the service-mode detail', () => {
  assert.match(admin, /지역 미등록/);
  assert.match(admin, /region\.city \|\| region\.service_area\.length \? '방문 가능'/);
  assert.match(admin, /region\.online_available \? '온라인 수업 가능'/);
  assert.match(admin, /region\.nationwide_available \? '미국 전역 가능'/);
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

test('the independent region manager has responsive, non-overflowing fields', () => {
  assert.match(css, /\.partner-region-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.partner-service-area-controls\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css, /\.partner-region-dialog\{width:min\(640px,calc\(100vw - 32px\)\);max-height:80vh/);
  assert.match(css, /\.partner-region-dialog-body \.partner-region-grid\{grid-template-columns:1fr\}/);
  assert.match(css, /\.partner-region-dialog-body \.partner-service-area-controls\{grid-template-columns:1fr\}/);
});

test('only partners receive a compact region summary and management action', () => {
  assert.match(admin, /id="detailManagePartnerRegion" class="member-region-manage partner-metadata" hidden/);
  assert.match(admin, /manageRegionButton\.addEventListener\('click', openRegionManager\)/);
  // The manage button sits bottom-right in 회원·파트너 정보's own footer
  // slot (shared with the student-only 수강 정보 보기 button), not inline
  // in any grid row any more.
  assert.match(css, /\.member-region-manage\{min-height:30px/);
  assert.match(css, /\.member-group-footer\{display:flex;justify-content:flex-end/);
});

test('region manager is a separate modal and uses only the existing region RPC', () => {
  assert.match(adminHtml, /id="partnerRegionDialog"/);
  assert.match(adminHtml, /id="partnerRegionDialogClose"/);
  assert.match(admin, /regionDialog\.showModal\(\)/);
  assert.match(admin, /admin_update_partner_region/);
  assert.match(admin, /p_country_code: requested\.country_code/);
  assert.match(admin, /p_service_area: requested\.service_area/);
  const managerStart = admin.indexOf('const openRegionManager = () =>');
  const managerAction = admin.slice(managerStart, admin.indexOf('const showRoleMetadata', managerStart));
  assert.doesNotMatch(managerAction, /admin_update_member_(?:metadata|access|name)/);
});

test('region save prevents duplicates, re-reads persistence, closes the modal, and clears toast feedback', () => {
  const managerStart = admin.indexOf('const openRegionManager = () =>');
  const managerAction = admin.slice(managerStart, admin.indexOf('const showRoleMetadata', managerStart));
  assert.match(managerAction, /if \(saveButton\.disabled\) return/);
  assert.match(managerAction, /saveButton\.textContent = '저장 중…'/);
  assert.match(managerAction, /const saved = await readPartnerRegion\(\)/);
  assert.match(managerAction, /samePartnerRegion\(saved, requested\)/);
  assert.match(managerAction, /regionDialog\.close\(\)/);
  assert.match(managerAction, /showToast\('지역정보가 저장되었습니다\.'\)/);
  assert.match(adminHtml, /id="memberDialog"[\s\S]*id="adminToast"/);
  assert.match(managerAction, /지역정보 저장에 실패했습니다:/);
  assert.match(admin, /window\.setTimeout\(\(\) => \{[\s\S]*adminToast\.hidden = true/);
});

test('region manager supports close, cancel, overlay, escape, and compact mobile actions', () => {
  assert.match(admin, /regionDialogClose\.onclick = closeRegionManager/);
  assert.match(admin, /regionDialogCancel/);
  assert.match(admin, /regionDialog\.onclick = event => \{ if \(event\.target === regionDialog\) closeRegionManager\(\); \}/);
  assert.match(admin, /regionDialog\.oncancel = event => \{ if \(saving\) event\.preventDefault\(\); \}/);
  assert.match(css, /\.partner-region-dialog-actions \.btn\{min-height:42px;flex:1\}/);
});
