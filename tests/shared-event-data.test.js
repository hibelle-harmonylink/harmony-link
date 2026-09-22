const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const loadEvents = () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('shared/data/events.js'), sandbox);
  // Round-trip through JSON so every array/object is a plain, current-realm value --
  // vm.createContext produces a separate realm whose Array/Object prototypes differ
  // from this file's, which breaks strict deepEqual comparisons otherwise.
  return JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_EVENTS));
};

const events = loadEvents();
const byId = id => events.find(e => e.id === id);
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('canonical event data has exactly the 7 Production events with unique stable IDs, in Production order', () => {
  assert.equal(events.length, 7);
  const ids = events.map(e => e.id);
  assert.deepEqual(ids, ['messiah', 'hole19-tournament', 'free-music-class', 'ai-business-automation', 'one-day-class', 'finance-ai-seminar', 'dms-ai-automation-workshop']);
  assert.equal(new Set(ids).size, 7);
});

test('upcoming/past split is date-driven (dateEnd vs today), not a static field, so the automatic migration keeps working', () => {
  events.forEach(e => {
    assert.ok(e.dateStart, `${e.id} missing dateStart`);
    assert.ok(e.dateEnd, `${e.id} missing dateEnd`);
    assert.doesNotMatch(JSON.stringify(e), /"status":/, `${e.id} should not carry a static status field`);
  });
  const today = todayKey();
  const upcoming = events.filter(e => e.dateEnd >= today);
  const past = events.filter(e => e.dateEnd < today);
  assert.equal(upcoming.length, 4);
  assert.equal(past.length, 3);
  assert.deepEqual(upcoming.map(e => e.id), ['messiah', 'hole19-tournament', 'free-music-class', 'dms-ai-automation-workshop']);
  // Past events sort most-recently-ended first, matching script.js's existing sort.
  const pastSorted = [...past].sort((a, b) => b.dateEnd.localeCompare(a.dateEnd)).map(e => e.id);
  assert.deepEqual(pastSorted, ['ai-business-automation', 'one-day-class', 'finance-ai-seminar']);
});

test('Korean/English fields exist for every event (title/description/badge)', () => {
  events.forEach(e => {
    ['titleKo', 'titleEn', 'descriptionKo', 'descriptionEn', 'badgeKo', 'badgeEn'].forEach(key => {
      assert.ok(e[key] && e[key].length, `${e.id} missing ${key}`);
    });
  });
});

test('flyerKo/flyerEn are preserved per event, with no invented English flyer where Production only has one asset', () => {
  const withSeparateEnFlyer = ['messiah', 'hole19-tournament', 'free-music-class'];
  const withSharedFlyer = ['ai-business-automation', 'one-day-class', 'finance-ai-seminar'];
  withSeparateEnFlyer.forEach(id => {
    const e = byId(id);
    assert.ok(e.flyerKo && e.flyerEn, `${id} missing flyerKo/flyerEn`);
    assert.notEqual(e.flyerKo, e.flyerEn, `${id} should have distinct KO/EN flyers`);
  });
  withSharedFlyer.forEach(id => {
    const e = byId(id);
    assert.equal(e.flyerKo, e.flyerEn, `${id} should use the same single asset for both languages`);
  });
});

test('detailUrl policy matches Production exactly: 4 events link to a dedicated page, 3 rely on the flyer/lightbox fallback', () => {
  assert.equal(byId('messiah').detailUrl, 'special-event-messiah.html');
  assert.equal(byId('hole19-tournament').detailUrl, 'special-event-hole19.html');
  assert.equal(byId('free-music-class').detailUrl, 'special-event-music-class.html');
  assert.equal(byId('ai-business-automation').detailUrl, null);
  assert.equal(byId('one-day-class').detailUrl, null);
  assert.equal(byId('finance-ai-seminar').detailUrl, null);
  assert.equal(byId('dms-ai-automation-workshop').detailUrl, 'special-event-dms-ai-workshop.html');
});

test('the one known web/app title wording difference (free-music-class) is preserved as an explicit override, not silently unified', () => {
  const e = byId('free-music-class');
  assert.equal(e.titleKo, '무료 음악 클래스');
  assert.equal(e.titleEn, 'Free Music Class');
  assert.equal(e.appTitleKo, '3개월 무료 음악 클래스');
  assert.equal(e.appTitleEn, 'Three-Month Free Music Class');
  // Every other event has no override (web and app titles already matched).
  ['messiah', 'hole19-tournament', 'ai-business-automation', 'one-day-class', 'finance-ai-seminar', 'dms-ai-automation-workshop'].forEach(id => {
    const other = byId(id);
    assert.equal(other.appTitleKo, null, `${id} should not need a title override`);
    assert.equal(other.appTitleEn, null, `${id} should not need a title override`);
  });
});

test('app-specific fields (appTextKo/appTextEn/appImage/appBadgeDark) are preserved for every event', () => {
  events.forEach(e => {
    assert.ok(e.appTextKo && e.appTextEn, `${e.id} missing appTextKo/appTextEn`);
    assert.ok(e.appImage, `${e.id} missing appImage`);
    assert.equal(typeof e.appBadgeDark, 'boolean', `${e.id} appBadgeDark should be a boolean`);
  });
  // Only finance-ai-seminar uses the app's dark badge variant.
  assert.equal(byId('finance-ai-seminar').appBadgeDark, true);
  ['messiah', 'hole19-tournament', 'free-music-class', 'ai-business-automation', 'one-day-class', 'dms-ai-automation-workshop'].forEach(id => {
    assert.equal(byId(id).appBadgeDark, false);
  });
});

test('script.js (web) reads the Events grid from the canonical file instead of static per-event HTML', () => {
  const webScript = read('script.js');
  assert.match(webScript, /function eventToWebHtml\(event\)\s*\{/);
  assert.match(webScript, /eventGrid\.innerHTML\s*=\s*\(window\.HARMONY_LINK_EVENTS\s*\|\|\s*\[\]\)\.map\(eventToWebHtml\)\.join\(''\)/);
  // The past-migration, Google Maps auto-link, and detail/flyer-button injection logic
  // -- and the flyer modal's delegated click handler -- are all untouched.
  assert.match(webScript, /const currentEventGrid = document\.querySelector\('\.event-grid'\)/);
  assert.match(webScript, /\.filter\(card => card\.dataset\.eventEnd < todayKey\)/);
  assert.match(webScript, /event\.target\.closest\('#events \.event-poster, #events \.event-flyer-button'\)/);
});

test('index.html no longer hand-authors the 6 event cards; the grid container is reused, now empty', () => {
  const homepage = read('index.html');
  assert.match(homepage, /<div class="event-grid"><\/div>/);
  assert.doesNotMatch(homepage, /class="event-card/);
  assert.doesNotMatch(homepage, /미란멜로디와 함께하는 헨델의 메시아/);
});

test('index.html loads shared/data/events.js before script.js', () => {
  const homepage = read('index.html');
  const eventsIndex = homepage.indexOf('shared/data/events.js');
  const scriptIndex = homepage.indexOf('src="script.js');
  assert.ok(eventsIndex > -1, 'index.html does not load shared/data/events.js');
  assert.ok(eventsIndex < scriptIndex, 'shared/data/events.js must load before script.js');
});

test('app/app.js (app) reads events from the canonical file via eventToAppModel() instead of messiahEvent/shared-content.js', () => {
  const appScript = read('app/app.js');
  assert.match(appScript, /function eventToAppModel\(event\)\{/);
  assert.match(appScript, /const events\s*=\s*\(window\.HARMONY_LINK_EVENTS\s*\|\|\s*\[\]\)\.map\(eventToAppModel\);/);
  assert.doesNotMatch(appScript, /const messiahEvent\s*=/);
  assert.doesNotMatch(appScript, /const sharedEvents\s*=/);
  // eventCard()/renderEvents()/renderHomeEvents() themselves are untouched.
  assert.match(appScript, /function eventCard\(item\)\{/);
  assert.match(appScript, /function renderEvents\(\)\{/);
});

test('app/index.html loads ../shared/data/events.js before app.js', () => {
  const appPage = read('app/index.html');
  const eventsIndex = appPage.indexOf('../shared/data/events.js');
  const appJsIndex = appPage.indexOf('src="app.js');
  assert.ok(eventsIndex > -1, 'app/index.html does not load ../shared/data/events.js');
  assert.ok(eventsIndex < appJsIndex, '../shared/data/events.js must load before app.js');
});

test('shared-content.js no longer hardcodes any of the 6 events or the inert placeholder', () => {
  const sharedContent = read('shared-content.js');
  assert.doesNotMatch(sharedContent, /events:\s*\[/);
  assert.doesNotMatch(sharedContent, /hole19-tournament/);
  assert.doesNotMatch(sharedContent, /seminars-coming/);
  // featuredPrograms moved to shared/data/programs.js in Phase 3 (see
  // tests/shared-program-data.test.js); only the benefit promotion remains here.
  assert.doesNotMatch(sharedContent, /featuredPrograms:\s*\[/);
  assert.match(sharedContent, /kind:"benefit"/);
});

test('no representative event value is hardcoded a second time outside the canonical file and its known adapters', () => {
  const needles = [
    '817-905-3468',                 // Messiah/free-music-class contact
    'David Geffen Hall',            // Messiah venue
    '재정과 AI의 협력, 더 나은 미래 설계', // finance-ai-seminar title
  ];
  const searchTargets = {
    'index.html': read('index.html'),
    'app/index.html': read('app/index.html'),
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

test('root and app service workers precache the new canonical events file with a matching version', () => {
  const rootSw = read('service-worker.js');
  assert.match(rootSw, /'\/shared\/data\/events\.js\?v=1'/);
  const appSw = read('app/service-worker-v103.js');
  assert.match(appSw, /"\.\.\/shared\/data\/events\.js\?v=1"/);
  assert.match(appSw, /const CACHE="harmony-link-app-v103"/);
  // Old SW versions are kept on disk, not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v102.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v101.js')), true);
});
