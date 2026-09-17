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
  assert.match(homepageScript, /const dmsCareBusiness/);
  assert.match(homepageScript, /name:'DMS Care Training Center'/);
  assert.match(homepageScript, /image:'assets\/images\/dms-care-logo\.webp'/);
  assert.match(homepageScript, /brokerUrl:'https:\/\/dmscare\.org\/ko'/);
  assert.doesNotMatch(homepageScript, /instagramUrl:'https:\/\/www\.instagram\.com\/dmscarekorea'/);
  assert.match(homepageScript, /phoneHref:'tel:\+14696056035'/);
  assert.match(homepageScript, /\{region:'tx',item:dmsCareBusiness/);
  assert.match(homepageScript, /summaryKo:'전문 케어 인력 교육'/);
  assert.match(homepageScript, /categoryKo:'케어 전문 교육센터'/);
  assert.match(homepageScript, /assets\/images\/dms-care-flyer-en\.png/);
  assert.doesNotMatch(homepageScript, /flyers:\['assets\/images\/dms-care-flyer-ko\.png'/);
  assert.match(homepageScript, /summaryKo:'골프 레슨과 실전 교육'/);
  assert.match(homepageScript, /summaryKo:'시니어를 위한 데이케어 서비스'/);
  assert.match(homepageScript, /locationKo:'Manhattan, New York'/);
  assert.match(homepageScript, /locationKo:'Flushing, New York'/);
  assert.match(homepageScript, /const businessFlyerModal/);
  assert.match(homepageScript, /data-business-flyer-open/);
  assert.doesNotMatch(homepageScript, /flyerLabels:/);
  assert.match(homepageScript, /business-flyer-navigation/);
  assert.match(homepageScript, /navigation\.hidden=flyers\.length<2/);
  assert.match(homepageScript, /previous\.disabled=flyerIndex===0/);
  assert.match(homepageScript, /next\.disabled=flyerIndex===flyers\.length-1/);
  assert.match(homepageScript, /showFlyer\(0\)/);
  assert.match(homepageScript, /event\.key==='Escape'&&!businessFlyerModal\.hidden/);
  assert.match(homepageScript, /businessFlyerReturnFocus/);
  assert.match(homepageScript, /address:'154-05 Northern Blvd, 2F, Flushing, NY 11354'/);
  assert.match(homepageScript, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=\$\{encodeURIComponent\(address\)\}/);
  assert.match(homepageScript, /class="business-address"[\s\S]*?target="_blank" rel="noopener noreferrer"/);
  assert.match(homepageScript, /const displayLocation=currentLanguage==='en'\?locationEn:locationKo/);
  assert.match(homepageScript, /:`<p class="business-address" data-ko="\$\{locationKo\}" data-en="\$\{locationEn\}">\$\{displayLocation\}<\/p>`/);
  assert.match(homepageScript, /item:\{\.\.\.adRooms\.community\.items\[1\],url:''/);
  assert.match(homepageScript, /className='floating-message'/);
  assert.match(homepageScript, /무엇이든 물어보세요/);
  assert.match(homepageScript, /placeholder="메시지를 입력하세요\."/);
  assert.match(homepageScript, /https:\/\/formsubmit\.co\/ajax\/hibelle@hibelleconsulting\.com/);
  assert.match(homepageScript, /if\(!response\.ok\)throw new Error\('send failed'\)/);
  assert.match(homepageScript, /const form=event\.currentTarget,status=form\.querySelector\('small'\),button=form\.querySelector\('button'\),message=form\.message\.value\.trim\(\)/);
  assert.match(homepageScript, /if\(button\.disabled\)return/);
  assert.match(homepageScript, /if\(!message\)\{status\.textContent='메시지를 입력해주세요\.'/);
  assert.match(homepageScript, /button\.textContent='보내는 중\.\.\.'/);
  assert.match(homepageScript, /메시지가 전송되었습니다\./);
  assert.match(homepageScript, /전송하지 못했습니다\. 다시 시도해주세요\./);
  assert.match(homepageScript, /const resetMessagePanel=.*?form\.reset\(\).*?textContent=''/);
  assert.match(homepageScript, /closeMessagePanel\?\.\(\)/);
  assert.match(homepageScript, /const adRooms=/);
  const homepageStyles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(homepageStyles, /\.business-summary\{height:21px;overflow:hidden;[\s\S]*?white-space:nowrap;text-overflow:ellipsis\}/);
  assert.match(homepageStyles, /\.business-flyer-modal\{position:fixed/);
  assert.match(homepageStyles, /\.business-flyer-scroll\{min-height:0;overflow-y:auto/);
  assert.match(homepageStyles, /\.business-flyer-navigation\{display:grid/);
  assert.match(homepageStyles, /\.business-flyer-modal \.business-flyer-actions\{[\s\S]*?padding:16px 32px!important/);
  assert.match(homepageStyles, /@media\(max-width:540px\)\{[\s\S]*?\.business-flyer-modal \.business-flyer-actions\{[\s\S]*?padding:14px 20px!important/);
  assert.match(homepageStyles, /\.floating-message\{position:fixed;right:24px;bottom:24px;z-index:90\}/);
  assert.match(homepageStyles, /\.floating-message-panel\{position:absolute;right:0;bottom:60px;width:330px/);
  assert.match(homepageStyles, /\.business-address\{display:block;margin:3px 0 0;[\s\S]*?font-weight:700/);
  assert.match(homepageStyles, /\.business-flyer-modal:not\(\[hidden\]\)~\.floating-message\{display:none\}/);
});
