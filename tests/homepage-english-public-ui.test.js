const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('English Hero keeps a real space before the emphasized with phrase', () => {
  assert.match(homepage, /data-en="Connecting people who want to learn <em>with people ready to teach\.<\/em>"/);
  assert.doesNotMatch(homepage, /data-en="Connecting people who want to learn<br><em>with people ready to teach\.<\/em>"/);
});

test('English header labels remain sourced from their bilingual markup', () => {
  assert.match(homepage, /href="senior-learning\.html" data-ko="시니어 배움터" data-en="Senior Learning"/);
  assert.match(homepage, /class="nav-community" href="community\.html" data-ko="커뮤니티" data-en="Community"/);
  assert.match(script, /document\.querySelectorAll\('\[data-ko\]\[data-en\]'\)\.forEach/);
});

test('floating message UI uses bilingual strings without changing FormSubmit delivery', () => {
  assert.match(script, /trigger:'메시지 보내기'.*?trigger:'Send Message'/);
  assert.match(script, /title:'Ask us anything'.*?description:'Leave us a message\.'.*?placeholder:'Type your message\.'.*?send:'Send'/);
  assert.match(script, /sending:'Sending\.\.\.'.*?success:'Your message has been sent\.'/);
  assert.match(script, /https:\/\/formsubmit\.co\/ajax\/hibelle@hibelleconsulting\.com/);
  assert.match(script, /button\.textContent=copy\.sending/);
  assert.match(script, /button\.textContent=copy\.send/);
});

test('public PWA help and footer use the same Korean and English source pattern', () => {
  assert.match(homepage, /data-en="Open in Chrome"/);
  assert.match(homepage, /data-en="Copy website address"/);
  assert.match(homepage, /data-en="© 2026 Hibelle Consulting · Harmony Link \/ E-eum Culture Center"/);
  assert.match(script, /currentLanguage === 'en' \? 'Address copied' : '주소가 복사되었습니다'/);
});
