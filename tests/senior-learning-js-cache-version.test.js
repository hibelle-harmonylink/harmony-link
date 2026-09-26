// Regression guard for the 02-textbook production caching incident: content
// changed in senior-learning.js across 4 rounds (PR #350-#353), but the
// ?v=... cache-busting query string on the <script> tags that load it was
// never bumped, so real users' browsers kept serving a stale copy that
// predated the "02. 버튼과 화면 첫걸음" textbook -- 01 rendered, 02 did not.
//
// senior-learning.js is loaded by exactly 3 pages (senior-learning.html,
// senior-learning-materials.html, senior-mini-apps.html). This file checks,
// without any build-time hashing system, that:
//   1) all of them use the exact same version string,
//   2) none of them regress to a known-stale version, and
//   3) senior-learning.js's own content is pinned to a known hash, so any
//      future edit to it fails this test as a forcing function to also bump
//      the ?v= query string in all 3 pages (see the failure message below).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const CURRENT_VERSION_QUERY = '?v=20260926-textbooks-02';
const KNOWN_STALE_VERSIONS = ['20260921-smartphone-flow', '20260916-25', '20260916-24'];
const SCRIPT_TAG_RE = /<script src="senior-learning\.js(\?[^"]*)?"><\/script>/;

// Discovered by scanning every top-level .html file rather than a hardcoded
// list, so a future page wired up the same way is covered automatically.
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const loaders = htmlFiles
  .map(file => ({ file, match: read(file).match(SCRIPT_TAG_RE) }))
  .filter(({ match }) => match)
  .map(({ file, match }) => ({ file, versionQuery: match[1] || '' }));

test('senior-learning.js is loaded by exactly the 3 known pages (sanity check for the scan itself)', () => {
  assert.deepEqual(
    loaders.map(l => l.file).sort(),
    ['senior-learning-materials.html', 'senior-learning.html', 'senior-mini-apps.html']
  );
});

test('every page that loads senior-learning.js uses the exact same cache-busting version string', () => {
  const versions = new Set(loaders.map(l => l.versionQuery));
  assert.equal(versions.size, 1, `all senior-learning.js <script> tags must share one ?v= value, found: ${[...versions].join(', ')}`);
});

test('no known-stale senior-learning.js version string remains on any loading page', () => {
  for (const { file, versionQuery } of loaders) {
    for (const stale of KNOWN_STALE_VERSIONS) {
      assert.ok(!versionQuery.includes(stale), `${file} still references stale senior-learning.js version "${stale}" -- this is the exact bug that hid the 02 textbook in production`);
    }
  }
});

test('the current senior-learning.js version string is applied on every loading page', () => {
  assert.ok(loaders.length > 0, 'expected at least one page to load senior-learning.js');
  for (const { file, versionQuery } of loaders) {
    assert.equal(versionQuery, CURRENT_VERSION_QUERY, `${file} must load senior-learning.js${CURRENT_VERSION_QUERY}`);
  }
});

test('senior-learning.js content is pinned to a known hash -- if this fails, you changed the file and MUST also bump its ?v= cache version in all 3 pages above', () => {
  const hash = crypto.createHash('sha256').update(read('senior-learning.js')).digest('hex');
  const EXPECTED_HASH = '05f9a37611968eda3742f08fe5970624d7d2fac6d569bea72b19e0a4ed188da9';
  assert.equal(hash, EXPECTED_HASH, 'senior-learning.js changed since this hash was pinned. Update EXPECTED_HASH here AND bump CURRENT_VERSION_QUERY in this file, matching a new ?v=... bump in senior-learning-materials.html, senior-learning.html, and senior-mini-apps.html -- do not update one without the other.');
});
