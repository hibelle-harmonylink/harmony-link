const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('shared/data/businesses.js'), sandbox);
const businesses = JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_BUSINESSES));

test('all existing Instagram and Threads destinations remain unchanged', () => {
  const social = businesses.flatMap(business => {
    const links = business.socialLinks || (business.snsUrl ? [{label:'Instagram',url:business.snsUrl,icon:'assets/instagram.svg'}] : []);
    return links.map(link => [business.id, link.label, link.url, link.icon]);
  });
  assert.deepEqual(social, [
    ['organic-one','Instagram','https://www.instagram.com/organicone_/','assets/instagram.svg'],
    ['hole19','Instagram','https://www.instagram.com/hole19_golflounge/','assets/instagram.svg'],
    ['dms-care','Instagram','https://www.instagram.com/dmscaretrainingcenter/','assets/instagram.svg'],
    ['boxd-kitchen','Instagram','https://www.instagram.com/boxdkitchen_uva/','assets/instagram.svg'],
    ['boxd-kitchen','Threads','https://www.threads.com/@boxdkitchen_uva','assets/threads.svg'],
    ['coway','Instagram','https://www.instagram.com/coway.usa.ny/','assets/instagram.svg'],
    ['coway','Threads','https://www.threads.com/@coway.usa.ny','assets/threads.svg']
  ]);
});

test('web detail assigns shared brand modifiers and accessible high-contrast colors', () => {
  const script = read('script.js');
  const css = read('styles.css');
  assert.match(script, /business-flyer-sns business-flyer-sns--\$\{link\.label\.toLowerCase\(\)\}/);
  assert.match(script, /business-flyer-sns business-flyer-sns--instagram/);
  assert.match(css, /\.business-flyer-sns--instagram\{background:#e1306c;color:#fff\}/);
  assert.match(css, /\.business-flyer-sns--threads\{background:#000;color:#fff\}/);
  assert.match(css, /\.business-flyer-website\{background:#0b65c8;color:#fff\}/);
});

test('app detail uses the same brand colors while phone and map remain blue in two columns', () => {
  const app = read('app/app.js');
  const css = read('app/overrides.css');
  assert.match(app, /app-contact-social-link app-contact-social-link--\$\{link\.label\.toLowerCase\(\)\}/);
  assert.match(css, /\.app-contact-social-link--instagram\{background:#e1306c;color:#fff\}/);
  assert.match(css, /\.app-contact-social-link--threads\{background:#000;color:#fff\}/);
  assert.match(css, /#lightboxBusinessInfo \.app-contact-social a,#lightboxBusinessInfo \.business-contact-actions a\{[^}]*background:#0b54c2;color:#fff/);
  assert.match(css, /#lightboxBusinessInfo \.business-contact-actions\.has-two\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
});

test('installed app precaches both the Coway card logo and preserved detail flyer', () => {
  const worker = read('app/service-worker-v104.js');
  assert.match(worker, /"\.\.\/assets\/ads\/coway\/coway-logo\.png"/);
  assert.match(worker, /"\.\.\/assets\/ads\/coway\/coway-banner-16x9\.png"/);
});
