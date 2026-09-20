const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Regression guard for the homepage-ui.css?v=20260916-18 vs ?v=20260920-1 drift found
// after PR #314: root service-worker.js's APP_SHELL had fallen behind index.html's
// actual <link> version, so an offline/cached visitor could keep serving stale CSS.
// Rather than pinning one hardcoded date string (which itself goes stale the next time
// either file bumps), these tests read index.html's real href/src at run time and
// compare it against service-worker.js's precache entry for the same asset, so any
// future version drift between the two fails here instead of shipping silently.
test('root service worker precaches homepage-ui.css at the exact version index.html currently loads', () => {
  const homepage = read('index.html');
  const sw = read('service-worker.js');
  const homepageHref = homepage.match(/<link rel="stylesheet" href="(homepage-ui\.css\?v=[^"]+)">/)?.[1];
  assert.ok(homepageHref, 'index.html should link homepage-ui.css with a version query');
  const swEntry = sw.match(/'\/(homepage-ui\.css\?v=[^']+)'/)?.[1];
  assert.ok(swEntry, 'service-worker.js APP_SHELL should precache homepage-ui.css');
  assert.equal(swEntry, homepageHref, 'service-worker.js APP_SHELL homepage-ui.css version must match the version index.html actually loads');
});

test('root service worker APP_SHELL versions match index.html for every other shared-version asset (styles.css, script.js, shared/data/*)', () => {
  const homepage = read('index.html');
  const sw = read('service-worker.js');
  const assetsToCheck = ['styles.css', 'script.js', 'shared/data/businesses.js', 'shared/data/events.js', 'shared/data/programs.js'];
  assetsToCheck.forEach(asset => {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const homepageHref = homepage.match(new RegExp(`${escaped}\\?v=[^"'\\s]+`))?.[0];
    const swEntry = sw.match(new RegExp(`${escaped}\\?v=[^'"\\s]+`))?.[0];
    assert.ok(homepageHref, `index.html should reference ${asset} with a version`);
    assert.ok(swEntry, `service-worker.js should precache ${asset} with a version`);
    assert.equal(swEntry, homepageHref, `${asset} version mismatch between index.html and service-worker.js`);
  });
});

test('app service worker (v104) precache versions match app/index.html for every shared-version asset', () => {
  const appPage = read('app/index.html');
  const appSw = read('app/service-worker-v104.js');
  const assetsToCheck = ['app.js', 'app.css', 'overrides.css', 'shared-content.js', 'shared/data/businesses.js', 'shared/data/events.js', 'shared/data/programs.js'];
  assetsToCheck.forEach(asset => {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const appHref = appPage.match(new RegExp(`${escaped}\\?v=[^"'\\s]+`))?.[0];
    const swEntry = appSw.match(new RegExp(`${escaped}\\?v=[^'"\\s]+`))?.[0];
    assert.ok(appHref, `app/index.html should reference ${asset} with a version`);
    assert.ok(swEntry, `app/service-worker-v104.js should precache ${asset} with a version`);
    assert.equal(swEntry, appHref, `${asset} version mismatch between app/index.html and app/service-worker-v104.js`);
  });
});
