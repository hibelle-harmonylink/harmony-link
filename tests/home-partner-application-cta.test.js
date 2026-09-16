const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'homepage-ui.css'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('hero partner CTA targets the existing partner application control', () => {
  assert.match(homepage, /class="btn hero-partner-cta" href="#partner-application"/);
  assert.match(script, /const partnerApplicationButton=partnerCenter\.querySelector\('\.partner-guide-actions a'\)/);
  assert.match(script, /partnerApplicationButton\.id='partner-application'/);
  assert.match(script, /href="https:\/\/forms\.gle\/pF4xy5Jz4ycVouKo9"/);
  assert.match(script, /data-ko="파트너 신청서 작성"/);
});

test('hero partner CTA expands, scrolls to, and briefly identifies the application control', () => {
  assert.match(script, /const setPartnerGuideExpanded=expanded=>/);
  assert.match(script, /partnerGuide\?\.classList\.add\('partner-application-focus'\)/);
  assert.match(script, /partnerApplicationButton\.scrollIntoView\(\{behavior,block:'center'\}\)/);
  assert.match(script, /partnerApplicationButton\.classList\.add\('partner-application-highlight'\)/);
  assert.match(script, /window\.history\.pushState\(null,'','#partner-application'\)/);
  assert.match(script, /if\(window\.location\.hash==='#partner-application'\)/);
  assert.match(css, /\.partner-guide-actions \.partner-application-highlight/);
  assert.match(css, /\.partner-upgrade-guide\.partner-application-focus/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('homepage cache version advances with the CTA behavior', () => {
  assert.equal(version.version, '20260916-12');
  assert.match(homepage, /const pageVersion = '20260916-12'/);
  assert.match(homepage, /script\.js\?v=20260916-17/);
  assert.match(homepage, /homepage-ui\.css\?v=20260916-16/);
});
