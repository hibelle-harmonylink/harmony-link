const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'community.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'community.html'), 'utf8');

// Regression coverage for this round's Community request: 게시글의 수정/삭제
// 버튼을 모바일/PC 모두 누르기 쉽게 확대. Before this change both buttons were
// 9px text with zero padding and no explicit height (.post-actions
// button,.comment-toggle{font-size:9px;...}), well under any reasonable
// touch-target size. Styling only -- no change to edit-post/delete-post
// click handlers or their underlying Supabase calls.

test('.edit-post and .delete-post exist inside .post-actions in the post card template', () => {
  const cardTemplate = html.slice(html.indexOf('post-actions'), html.indexOf('post-actions') + 200);
  assert.match(cardTemplate, /<button class="edit-post" type="button">수정<\/button>/);
  assert.match(cardTemplate, /<button class="delete-post" type="button">삭제<\/button>/);
});

test('both post-action buttons meet a >=44px minimum touch target with 14-18px horizontal padding', () => {
  assert.match(css, /\.post-actions button\.edit-post,\.post-actions button\.delete-post\{min-height:44px;padding:0 (1[4-8])px;/);
});

test('edit and delete share identical height, radius, and baseline (one rule, both selectors)', () => {
  assert.match(css, /\.post-actions button\.edit-post,\.post-actions button\.delete-post\{min-height:44px;padding:0 \d+px;font-size:13px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center\}/);
});

test('the action row keeps at least an 8px gap between buttons', () => {
  assert.match(css, /\.post-actions\{display:flex;gap:8px\}/);
});

test('delete keeps a distinct "dangerous action" red treatment, separate from edit', () => {
  assert.match(css, /\.post-actions button\.delete-post\{background:#fdecec;color:#c0392b\}/);
  assert.doesNotMatch(css, /\.post-actions button\.edit-post\{background:#fdecec/);
});
