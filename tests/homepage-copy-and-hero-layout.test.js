const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const community = fs.readFileSync(path.join(root, 'community.html'), 'utf8');
const homepageCss = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('homepage events heading matches the navigation label', () => {
  assert.match(homepage, /data-ko="강좌 · 행사" data-en="Classes &amp; Events">강좌 · 행사<\/h2>/);
  assert.doesNotMatch(homepage, /하모니링크 소식 · 행사/);
});

test('community home control keeps its destination and uses the homepage label', () => {
  assert.match(community, /id="communityHomeButton" class="home-button" href="\.\/" hidden>홈페이지<\/a>/);
});

test('laptop hero uses non-overlapping copy and image tracks with matching cache keys', () => {
  assert.equal(version.version, '20260916-10');
  assert.match(homepage, /const pageVersion = '20260916-10'/);
  assert.match(homepage, /homepage-ui\.css\?v=20260916-10/);
  assert.match(homepage, /script\.js\?v=20260916-10/);
  assert.match(homepageCss, /@media\(max-width:1200px\) and \(min-width:901px\)/);
  assert.match(homepageCss, /grid-template-columns:minmax\(0,1fr\) minmax\(0,\.95fr\)!important/);
  assert.match(homepageCss, /white-space:normal!important/);
  assert.match(homepageCss, /\.hero \.hero-copy,\s*\.hero \.hero-visual\{min-width:0!important;\}/);
});
