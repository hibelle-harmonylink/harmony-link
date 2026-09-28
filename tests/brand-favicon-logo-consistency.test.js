const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

// Every user-facing standalone page must reuse the exact canonical favicon set
// index.html uses (all three rel values), so no page falls back to the browser's
// default black-globe icon. admin.html is an internal, noindex-only tool and is
// intentionally out of scope here.
const pages = [
  'index.html',
  'community.html',
  'easy-hanja.html',
  'mini-apps.html',
  'senior-learning.html',
  'senior-learning-materials.html',
  'senior-mini-apps.html',
  'special-event-hole19.html',
  'special-event-messiah.html',
  'special-event-music-class.html',
  'us-admissions.html'
];

for (const pageName of pages) {
  test(`${pageName} declares the full canonical favicon set (icon, shortcut icon, apple-touch-icon)`, () => {
    const html = fs.readFileSync(path.join(root, pageName), 'utf8');
    assert.match(html, /<link rel="icon"[^>]*href="\/?app\/icon-512\.png\?v=2"/, `${pageName} missing rel="icon"`);
    assert.match(html, /<link rel="shortcut icon"[^>]*href="\/?app\/icon-512\.png\?v=2"/, `${pageName} missing rel="shortcut icon"`);
    assert.match(html, /<link rel="apple-touch-icon"[^>]*href="\/?app\/icon-512\.png\?v=2"/, `${pageName} missing rel="apple-touch-icon"`);
  });
}

test('us-admissions.html reuses the canonical Harmony Link header logo markup, not a page-specific brand block', () => {
  const html = fs.readFileSync(path.join(root, 'us-admissions.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'us-admissions.css'), 'utf8');
  assert.doesNotMatch(html, /admissions-brand/);
  assert.match(html, /<a class="logo" href="\.\/" aria-label="Harmony Link 홈"><span class="logo-mark brand-image" aria-hidden="true"><img src="assets\/harmony-logo\.png" alt=""><\/span><span class="logo-name">Harmony <b>Link<\/b><small>이음문화센터<\/small><\/span><\/a>/);
  // The gradient container is required: the source PNG's white artwork
  // disappears without it, which is what caused the washed-out logo bug.
  assert.match(css, /\.brand-image\{[^}]*background:linear-gradient\(145deg,#bcd5fb,#6f9fe6\)/);
  assert.doesNotMatch(css, /\.admissions-brand/);
});

test('us-admissions.css keeps a working mobile logo-size override under the renamed canonical classes', () => {
  const css = fs.readFileSync(path.join(root, 'us-admissions.css'), 'utf8');
  const mobileBlock = css.match(/@media\(max-width:600px\)\{([\s\S]*?)\}$/)?.[1] || '';
  assert.match(mobileBlock, /\.logo\{font-size:17px\}/);
  assert.match(mobileBlock, /\.brand-image\{width:36px;height:36px\}/);
});
