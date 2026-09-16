const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('separates 20-member client pagination from row rendering', () => {
  assert.match(admin, /const MEMBERS_PER_PAGE = 20;/);
  assert.match(admin, /const getPage = \(members, page\) =>/);
  assert.match(admin, /members\.slice\(start, start \+ MEMBERS_PER_PAGE\)/);
  assert.match(admin, /const renderPagination = \(members, pageData\) =>/);
  assert.match(admin, /전체 \$\{members\.length\}명 · 현재 \$\{start \+ 1\}–\$\{end\}/);
});

test('resets to page one whenever a search or member filter changes', () => {
  assert.match(admin, /const applyFilters = \(\{ resetPage = true \} = \{\}\) => \{\s*if \(resetPage\) currentPage = 1;/);
  assert.match(admin, /applyFilters\(\{ resetPage: false \}\);/);
});

test('renders accessible previous/current/next pagination controls', () => {
  assert.match(html, /id="memberPaginationSummary"/);
  assert.match(html, /id="memberPaginationControls"/);
  assert.match(admin, /appendButton\('이전', page - 1, page === 1\)/);
  assert.match(admin, /appendButton\('다음', page \+ 1, page === totalPages\)/);
  assert.match(admin, /aria-current', 'page'/);
});

test('compacts desktop rows while preserving mobile readability and updates asset versions', () => {
  assert.match(css, /\.member-table td\{padding:12px 12px;font-size:13px\}/);
  assert.match(css, /\.member-badge\{font-size:10px;padding:4px 8px\}/);
  assert.match(css, /\.member-pagination\{[\s\S]*background:linear-gradient\(135deg,#0f5cae,#1768d5\)/);
  assert.match(css, /\.member-pagination-summary\{[\s\S]*font-size:clamp\(13px,1\.2vw,14px\)[\s\S]*font-weight:750/);
  assert.match(css, /\.member-page-button\{[\s\S]*min-width:clamp\(42px,4\.5vw,54px\)[\s\S]*height:clamp\(34px,3\.2vw,38px\)/);
  assert.match(css, /\.member-page-button:disabled\{opacity:1[\s\S]*background:#d9dee5[\s\S]*color:#4b5563/);
  assert.match(css, /@media\(max-width:440px\)\{[\s\S]*\.member-pagination\{align-items:flex-start;flex-direction:column[\s\S]*\.member-pagination-controls\{width:100%;flex-wrap:wrap;justify-content:flex-end;align-items:center;row-gap:6px;column-gap:6px/);
  assert.equal(version.version, '20260916-6');
  assert.match(html, /admin\.css\?v=20260916-6/);
  assert.match(html, /admin\.js\?v=20260916-6/);
});
