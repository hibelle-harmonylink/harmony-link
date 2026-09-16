const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');

test('homepage category cards route only to prepared detail pages', () => {
  assert.match(html, /href="digital-classes\/index\.html"/);
  assert.match(html, /href="special-event-music-class\.html"/);
  assert.match(html, /href="online-english\/index\.html"/);
  assert.doesNotMatch(html.slice(html.indexOf('id="program-categories"'), html.indexOf('id="specialty-banners"')), /href="#specialty-banners"/);
});

test('unprepared category cards open an accessible coming-soon modal without navigation', () => {
  assert.equal((html.match(/data-program-coming-soon/g) || []).length, 9);
  assert.match(script, /programComingSoonModal\.className = 'program-coming-soon-modal'/);
  assert.match(script, /data-ko="준비중입니다"/);
  assert.match(script, /더 좋은 프로그램으로 곧 찾아뵙겠습니다\./);
  assert.match(script, /data-program-coming-soon-close/);
  assert.match(script, /event\.key === 'Escape' && !programComingSoonModal\.hidden/);
  assert.match(script, /programComingSoonReturnFocus\?\.focus\(\)/);
  assert.doesNotMatch(script, /alert\(/);
});

test('category cards and modal retain keyboard focus and mobile-safe styling', () => {
  assert.match(css, /\.program-category-card\.is-coming-soon\{appearance:none;font:inherit\}/);
  assert.match(css, /\.program-category-card\.is-linked:focus-visible,\.program-category-card\.is-coming-soon:focus-visible/);
  assert.match(css, /\.program-coming-soon-modal\{position:fixed;inset:0/);
  assert.match(css, /@media\(max-width:480px\)\{\.program-coming-soon-modal\{padding:14px\}/);
});
