const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const resourceBlock = script.slice(script.indexOf('const partnerResourceSections'), script.indexOf("document.querySelectorAll('#events"));

test('PREMIUM resource 12 is AI Business Consulting and keeps the 12-card tier contract', () => {
  const sections = [...resourceBlock.matchAll(/\{tier:(?:0|20|50),/g)];
  assert.equal(sections.length, 12);
  assert.match(resourceBlock, /\{tier:50,premium:true,consulting:true,icon:'🤖',title:'AI 비즈니스 컨설팅',copy:'AI Business Check 무료',items:\[\]\}/);
  assert.doesNotMatch(resourceBlock, /title:'파트너 성장 자료'/);
});

test('consulting detail limits the free benefit to Business Check and labels paid services', () => {
  assert.match(resourceBlock, /PREMIUM 회원[\s\S]*?AI Business Check 무료/);
  assert.match(resourceBlock, /AI Business Check[\s\S]*?\$99[\s\S]*?PREMIUM 회원 무료/);
  assert.match(resourceBlock, /AI Business Blueprint[\s\S]*?\$299[\s\S]*?별도 유료/);
  assert.match(resourceBlock, /AI Business Build[\s\S]*?\$600\+[\s\S]*?맞춤 견적 · 별도 유료/);
  assert.doesNotMatch(resourceBlock, /전체 무료|무제한 무료|모든 서비스 무료/);
});

test('consulting detail stays internal and removes the consultant contact panel', () => {
  assert.doesNotMatch(resourceBlock, /상담 방식|Consultation format|Google Meet/);
  assert.doesNotMatch(resourceBlock, /Sally Park|AI Business Consultant|HIBELLE CONSULTING/);
  assert.doesNotMatch(resourceBlock, /929-603-0052|hibelle@hibelleconsulting\.com|www\.hibelleharmony\.com/);
  assert.doesNotMatch(resourceBlock, /ai-consulting-contact/);
  assert.doesNotMatch(resourceBlock, /data-business-spotlight-index|data-business-flyer-open/);
});

test('consulting detail has desktop and mobile layouts without fixed horizontal sizing', () => {
  assert.match(css, /\.ai-consulting-services\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.ai-consulting-services\{grid-template-columns:1fr\}/);
  assert.doesNotMatch(css, /\.ai-consulting-(?:detail|services|contact)\{[^}]*width:\d+px/);
  assert.match(css, /\.ai-consulting-services h4\{[^}]*max-width:15ch[^}]*word-break:keep-all/);
  assert.match(css, /\.ai-consulting-services article\.ai-consulting-service-featured\{[^}]*border-color:[^}]*background:#eef7ff/);
  assert.match(css, /\.ai-consulting-services article>strong\{[^}]*color:#9f2525/);
  assert.match(css, /small\.premium-free\{[^}]*border-radius:999px[^}]*background:#0b5fc2[^}]*color:#fff/);
  assert.doesNotMatch(css, /\.ai-consulting-contact/);
});
