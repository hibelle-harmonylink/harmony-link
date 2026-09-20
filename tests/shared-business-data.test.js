const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const loadBusinesses = () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('shared/data/businesses.js'), sandbox);
  // Round-trip through JSON so every array/object is a plain, current-realm value --
  // vm.createContext produces a separate realm whose Array/Object prototypes differ
  // from this file's, which breaks strict deepEqual comparisons otherwise.
  return JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_BUSINESSES));
};

const businesses = loadBusinesses();
const byId = id => businesses.find(b => b.id === id);

test('canonical business data has exactly the 6 Business Spotlight companies with unique stable IDs', () => {
  assert.equal(businesses.length, 6);
  const ids = businesses.map(b => b.id);
  assert.deepEqual(ids, ['yura-kim', 'organic-one', 'hole19', 'aaleac', 'jangsu-daycare', 'dms-care']);
  assert.equal(new Set(ids).size, 6);
});

test('region counts match Production: 5 NEW YORK, 1 TEXAS', () => {
  assert.equal(businesses.filter(b => b.region === 'ny').length, 5);
  assert.equal(businesses.filter(b => b.region === 'tx').length, 1);
});

test('every business has a structured phone field (phoneKo/phoneEn), not just phone text buried in copy', () => {
  businesses.forEach(b => {
    assert.ok(b.phoneKo && b.phoneKo.length, `${b.id} missing phoneKo`);
    assert.ok(b.phoneEn && b.phoneEn.length, `${b.id} missing phoneEn`);
  });
});

test('Google Maps policy is preserved: mapUrl only where Production had one, no address-search fallback', () => {
  // Yura Kim and AALEAC have no map link on Production -- must stay null, not a
  // synthesized "search by address" URL.
  assert.equal(byId('yura-kim').mapUrl, null);
  assert.equal(byId('aaleac').mapUrl, null);
  // The 4 businesses that DO have a map link must keep the exact Place URL (not a
  // generic maps/search?query= fallback).
  ['organic-one', 'hole19', 'jangsu-daycare', 'dms-care'].forEach(id => {
    const business = byId(id);
    assert.ok(business.mapUrl, `${id} should have a mapUrl`);
    assert.match(business.mapUrl, /^https:\/\/www\.google\.com\/maps\/place\//, `${id} mapUrl should be an exact Place URL`);
    assert.doesNotMatch(business.mapUrl, /maps\/search/, `${id} mapUrl must not be a generic search fallback`);
  });
});

test('Jangsu Daycare has no homepage on Production and none was invented here', () => {
  assert.equal(byId('jangsu-daycare').websiteUrl, null);
});

test('DMS Care Training Center matches the specified Production values exactly', () => {
  const dms = byId('dms-care');
  assert.equal(dms.nameKo, 'DMS Care Training Center');
  assert.equal(dms.nameEn, 'DMS Care Training Center');
  assert.equal(dms.categoryKo, '미국 의료 직업 학교');
  assert.equal(dms.summaryKo, '미국 의료 직업 학교');
  assert.equal(dms.categoryEn, 'Care Training Center');
  assert.equal(dms.summaryEn, 'Professional care workforce education');
  assert.equal(dms.phoneKo, '469-605-6035');
  assert.equal(dms.address, '1933 E Frankford Rd. Suite 165, Carrollton, TX 75007');
  assert.equal(dms.websiteUrl, 'https://dmscare.org/ko');
  assert.equal(dms.region, 'tx');
  assert.equal(dms.snsUrl, null);
  assert.match(dms.mapUrl, /DMS\+Care\+Training\+Center/);
});

test('Korean and English fields exist for every business (name/category/summary/phone)', () => {
  businesses.forEach(b => {
    ['nameKo', 'nameEn', 'categoryKo', 'categoryEn', 'summaryKo', 'summaryEn', 'phoneKo', 'phoneEn'].forEach(key => {
      assert.ok(b[key] && b[key].length, `${b.id} missing ${key}`);
    });
  });
});

test('the app-specific card copy (appTitle/appText/appBadge/appLogo/appCta) is preserved for every business, with appCtaField pointing at a real canonical field instead of duplicating the URL', () => {
  businesses.forEach(b => {
    ['appTitleKo', 'appTitleEn', 'appTextKo', 'appTextEn', 'appBadgeKo', 'appBadgeEn', 'appLogo', 'appCtaKo', 'appCtaEn', 'appCtaField'].forEach(key => {
      assert.ok(b[key] !== undefined && b[key] !== '', `${b.id} missing ${key}`);
    });
    assert.ok(['websiteUrl', 'snsUrl', 'phone'].includes(b.appCtaField), `${b.id} has an unrecognized appCtaField`);
  });
});

test('script.js (web) reads Business Spotlight data from the canonical file instead of hardcoding it', () => {
  const webScript = read('script.js');
  assert.match(webScript, /const businessSpotlights\s*=\s*\(window\.HARMONY_LINK_BUSINESSES\s*\|\|\s*\[\]\)\.map\(/);
  // The old hand-duplicated 6-entry literal (with adRooms spreads and inline Google
  // Maps URLs) is gone.
  assert.doesNotMatch(webScript, /const dmsCareBusiness\s*=/);
  assert.doesNotMatch(webScript, /\.\.\.adRooms\.premium\.items\[0\]/);
  // adRooms itself must still exist -- it also powers the separate partner-directory
  // modal and must not be removed.
  assert.match(webScript, /const adRooms\s*=\s*\{/);
});

test('index.html loads shared/data/businesses.js before script.js', () => {
  const webPage = read('index.html');
  const businessesIndex = webPage.indexOf('shared/data/businesses.js');
  const scriptIndex = webPage.indexOf('src="script.js');
  assert.ok(businessesIndex > -1, 'index.html does not load shared/data/businesses.js');
  assert.ok(businessesIndex < scriptIndex, 'shared/data/businesses.js must load before script.js');
});

test('app/app.js (app) reads Business Spotlight data from the canonical file instead of shared-content.js promotions', () => {
  const appScript = read('app/app.js');
  assert.match(appScript, /function businessToPromotion\(business\)\{/);
  assert.match(appScript, /const businessPromotions\s*=\s*\(window\.HARMONY_LINK_BUSINESSES\s*\|\|\s*\[\]\)\.map\(businessToPromotion\);/);
  assert.match(appScript, /const partners\s*=\s*businessPromotions;/);
  // The home news popup still rotates through all 10 original cards (1 benefit +
  // 3 programs + 6 businesses), just recombined instead of read as one hardcoded
  // array -- programPromotions (Phase 3) sits between the two, matching the
  // original hand-authored order.
  assert.match(appScript, /const popupNews\s*=\s*sharedContent\.promotions\?\.length\?\[\.\.\.sharedContent\.promotions,\.\.\.programPromotions,\.\.\.businessPromotions\]:fallbackPopupNews;/);
});

test('app/index.html loads ../shared/data/businesses.js before app.js', () => {
  const appPage = read('app/index.html');
  const businessesIndex = appPage.indexOf('../shared/data/businesses.js');
  const appJsIndex = appPage.indexOf('src="app.js');
  assert.ok(businessesIndex > -1, 'app/index.html does not load ../shared/data/businesses.js');
  assert.ok(businessesIndex < appJsIndex, '../shared/data/businesses.js must load before app.js');
});

test('shared-content.js no longer hardcodes the 6 Business Spotlight companies as separate promotions', () => {
  const sharedContent = read('shared-content.js');
  // "HOLE19" alone would also match the unrelated hole19-tournament *event* entry
  // (a golf tournament, legitimately still in this file), so the needle for that
  // business is its full display name instead.
  ['Yura Kim', 'OrganicOne', '올가닉 원', 'HOLE19 골프라운지', 'AALEAC', '장수 데이케어', 'DMS Care Training Center'].forEach(name => {
    assert.doesNotMatch(sharedContent, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `shared-content.js should no longer contain "${name}"`);
  });
  // The benefit CTA promotion must remain untouched; the 3 program promotions moved
  // to shared/data/programs.js in Phase 3 (see tests/shared-program-data.test.js).
  assert.match(sharedContent, /kind:"benefit"/);
  assert.doesNotMatch(sharedContent, /titleKo:"하이벨 디지털"/);
  assert.doesNotMatch(sharedContent, /titleKo:"하이벨 화상영어"/);
  assert.doesNotMatch(sharedContent, /titleKo:"미란멜로디"/);
});

test('no Business Spotlight phone/address/URL values are hardcoded a second time outside the canonical file and its known adapters', () => {
  // A handful of representative, hard-to-coincidentally-collide values.
  const needles = [
    '469-605-6035',            // DMS phone
    '32-38 148th St',          // Jangsu address
    'https://www.organiconestore.com/', // OrganicOne website
    'https://hole19golflounge.com/',    // HOLE19 website
  ];
  const searchTargets = {
    'index.html': read('index.html'),
    'community.html': read('community.html'),
    'community.js': read('community.js'),
    'senior-learning.js': read('senior-learning.js'),
  };
  Object.entries(searchTargets).forEach(([file, content]) => {
    needles.forEach(needle => {
      assert.doesNotMatch(content, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} should not hardcode "${needle}"`);
    });
  });
});

test('root and app service workers precache the new canonical data file with a matching version', () => {
  const rootSw = read('service-worker.js');
  assert.match(rootSw, /'\/shared\/data\/businesses\.js\?v=1'/);
  const appSw = read('app/service-worker-v99.js');
  assert.match(appSw, /"\.\.\/shared\/data\/businesses\.js\?v=1"/);
  assert.match(appSw, /const CACHE="harmony-link-app-v99"/);
  // Old SW versions are kept on disk, not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v98.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v97.js')), true);
});
