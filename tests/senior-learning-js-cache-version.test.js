// Regression guard for the 02-textbook production caching incident: content
// changed in senior-learning.js across 4 rounds (PR #350-#353: added 01,
// removed the legacy folder UI, simplified the heading, added 02) but the
// ?v=... cache-busting query string on its <script> tag was never bumped, so
// real users' browsers kept serving a stale copy that predated the "02. 버튼과
// 화면 첫걸음" textbook -- 01 rendered, 02 did not.
//
// senior-learning.js and senior-learning.css are both loaded by the same 3
// pages (senior-learning.html, senior-learning-materials.html,
// senior-mini-apps.html). This file checks, without any build-time hashing
// system, that for EACH of the two files:
//   1) all 3 pages use the exact same version string,
//   2) none of them regress to a known-stale version, and
//   3) the file's own content is pinned to a known hash, so any future edit
//      to it fails this test as a forcing function to also bump its ?v=
//      query string in all 3 pages (see the failure message below).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const KNOWN_PAGES = ['senior-learning-materials.html', 'senior-learning.html', 'senior-mini-apps.html'];

// Discovered by scanning every top-level .html file rather than a hardcoded
// list, so a future page wired up the same way is covered automatically.
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));

function findLoaders(tagRe) {
  return htmlFiles
    .map(file => ({ file, match: read(file).match(tagRe) }))
    .filter(({ match }) => match)
    .map(({ file, match }) => ({ file, versionQuery: match[1] || '' }));
}

function describeCacheBustedAsset({ assetLabel, tagRe, currentVersionQuery, knownStaleVersions, contentFile, expectedHash }) {
  const loaders = findLoaders(tagRe);

  test(`${assetLabel} is loaded by exactly the 3 known pages (sanity check for the scan itself)`, () => {
    assert.deepEqual(loaders.map(l => l.file).sort(), [...KNOWN_PAGES].sort());
  });

  test(`every page that loads ${assetLabel} uses the exact same cache-busting version string`, () => {
    const versions = new Set(loaders.map(l => l.versionQuery));
    assert.equal(versions.size, 1, `all ${assetLabel} tags must share one ?v= value, found: ${[...versions].join(', ')}`);
  });

  test(`no known-stale ${assetLabel} version string remains on any loading page`, () => {
    for (const { file, versionQuery } of loaders) {
      for (const stale of knownStaleVersions) {
        assert.ok(!versionQuery.includes(stale), `${file} still references stale ${assetLabel} version "${stale}" -- this is the exact bug that hid the 02 textbook in production`);
      }
    }
  });

  test(`the current ${assetLabel} version string is applied on every loading page`, () => {
    assert.ok(loaders.length > 0, `expected at least one page to load ${assetLabel}`);
    for (const { file, versionQuery } of loaders) {
      assert.equal(versionQuery, currentVersionQuery, `${file} must load ${assetLabel}${currentVersionQuery}`);
    }
  });

  test(`${contentFile} content is pinned to a known hash -- if this fails, you changed the file and MUST also bump its ?v= cache version in all 3 pages above`, () => {
    const hash = crypto.createHash('sha256').update(read(contentFile)).digest('hex');
    assert.equal(hash, expectedHash, `${contentFile} changed since this hash was pinned. Update expectedHash here AND bump the current version string in this file, matching a new ?v=... bump in senior-learning-materials.html, senior-learning.html, and senior-mini-apps.html -- do not update one without the other.`);
  });
}

describeCacheBustedAsset({
  assetLabel: 'senior-learning.js',
  tagRe: /<script src="senior-learning\.js(\?[^"]*)?"><\/script>/,
  currentVersionQuery: '?v=20260926-materials-4cat',
  knownStaleVersions: ['20260926-textbooks-02', '20260921-smartphone-flow', '20260916-25', '20260916-24'],
  contentFile: 'senior-learning.js',
  expectedHash: '3d57a49263eac8c313dff052e0beaca43f753f43b66797088236974f9096e26f',
});

describeCacheBustedAsset({
  assetLabel: 'senior-learning.css',
  tagRe: /<link rel="stylesheet" href="senior-learning\.css(\?[^"]*)?">/,
  currentVersionQuery: '?v=20260926-materials-4cat',
  knownStaleVersions: ['20260926-compact-mobile', '20260921-smartphone-flow', '20260916-25', '20260916-24'],
  contentFile: 'senior-learning.css',
  expectedHash: '45107334effe1278c5b6ebaa3ba3061c092b8c8e8a062c39fca3d38459f5c690',
});
