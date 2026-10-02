const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('shared/data/businesses.js'), sandbox);
const businesses = JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_BUSINESSES));
const coway = businesses.at(-1);
const mapUrl = 'https://www.google.com/maps/place/H+Mart+Jericho/@40.7808989,-73.5472529,15z/data=!3m1!5s0x89c281170fb0b027:0xb0258b9f81734aaf!4m10!1m2!2m1!1sh+mart!3m6!1s0x89c28117086812b5:0x4dfa1287747efb04!8m2!3d40.7808964!4d-73.5337761!15sCgZoIG1hcnQiA4gBAVoIIgZoIG1hcnSSARRrb3JlYW5fZ3JvY2VyeV9zdG9yZeABAA!16s%2Fg%2F1tpn3hb1?hl=ko&entry=ttu&g_ep=EgoyMDI2MDkyOS4wIKXMDSoASAFQAw%3D%3D';

test('Coway is the eighth NY business with the exact approved contact and location data', () => {
  assert.equal(businesses.length, 8);
  assert.deepEqual(businesses.map(item => item.id), ['yura-kim','organic-one','hole19','aaleac','jangsu-daycare','dms-care','boxd-kitchen','coway']);
  assert.equal(coway.id, 'coway');
  assert.equal(coway.region, 'ny');
  assert.equal(coway.nameKo, 'Coway');
  assert.equal(coway.nameEn, 'Coway');
  assert.equal(coway.appTitleKo, 'Coway');
  assert.equal(coway.summaryKo, '깨끗한 물, 건강한 생활을 위한 코웨이');
  assert.equal(coway.copyKo, coway.summaryKo);
  assert.equal(coway.appTextKo, coway.summaryKo);
  assert.equal(coway.websiteUrl, 'https://www.cowayunited.com/');
  assert.equal(coway.phoneKo, '917-628-6139');
  assert.equal(`tel:${coway.phoneHref}`, 'tel:+19176286139');
  assert.equal(coway.snsUrl, 'https://www.instagram.com/coway.usa.ny/');
  assert.deepEqual(coway.socialLinks.map(({label,url}) => ({label,url})), [
    {label:'Instagram',url:'https://www.instagram.com/coway.usa.ny/'},
    {label:'Threads',url:'https://www.threads.com/@coway.usa.ny'}
  ]);
  assert.equal(coway.address, '336 N Broadway Unit 6, Jericho, NY 11753 (H Mart Jericho 내)');
  assert.equal(coway.mapUrl, mapUrl);
});

test('Coway uses the supplied logo for cards and keeps the single approved 16:9 flyer for detail', () => {
  const logo = 'assets/ads/coway/coway-logo.png';
  const flyer = 'assets/ads/coway/coway-banner-16x9.png';
  assert.equal(coway.logo, logo);
  assert.equal(coway.spotlightImage, logo);
  assert.equal(coway.appLogo, `/${logo}`);
  assert.equal(coway.logoDisplay, 'wide');
  assert.deepEqual(coway.flyers, [flyer]);
  assert.deepEqual(fs.readdirSync(path.join(root, 'assets/ads/coway')).sort(), ['coway-banner-16x9.png','coway-logo.png']);
  const logoBytes = fs.readFileSync(path.join(root, logo));
  assert.equal(crypto.createHash('sha256').update(logoBytes).digest('hex'), 'c58f1b58574b18a94c6238adfbbd10d5211655e734ca6d21b4f21c0b98643d76');
  assert.equal(logoBytes.length, 48828);
  assert.deepEqual([...logoBytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.equal(logoBytes.readUInt32BE(16), 500);
  assert.equal(logoBytes.readUInt32BE(20), 500);
  assert.equal(logoBytes[25], 6, 'PNG must use RGBA color type with an alpha channel');
  const flyerBytes = fs.readFileSync(path.join(root, flyer));
  assert.equal(crypto.createHash('sha256').update(flyerBytes).digest('hex'), '2c6d52b79846c61681c8ec35285ddae89aa8c7f5500823da13bc0bc5ded14b51');
  assert.equal(flyerBytes.readUInt32BE(16), 1672);
  assert.equal(flyerBytes.readUInt32BE(20), 941);
});

test('the seven pre-Coway canonical business objects change only through the approved DMS Instagram field', () => {
  const digest = crypto.createHash('sha256').update(JSON.stringify(businesses.slice(0, 7))).digest('hex');
  assert.equal(digest, '4c3fd6b6f61cb9a459c04987a3c3fc809c3c5db755ffd4d7f3f842ad24b9535e');
});

test('existing region filtering includes Coway only in ALL and NY', () => {
  const ids = region => (region === 'all' ? businesses : businesses.filter(item => item.region === region)).map(item => item.id);
  assert.ok(ids('all').includes('coway'));
  assert.ok(ids('ny').includes('coway'));
  assert.ok(!ids('tx').includes('coway'));
  assert.ok(!ids('va').includes('coway'));
});

test('web and app reuse existing detail components with no Coway-only carousel', () => {
  const web = read('script.js');
  const webCss = read('styles.css');
  const app = read('app/app.js');
  const appCss = read('app/overrides.css');
  assert.match(web, /navigation\.hidden=flyers\.length<2/);
  assert.match(web, /\(id==='boxd-kitchen'\|\|id==='coway'\)&&phoneHref&&contact/);
  assert.match(app, /business\.flyers\.map\(\(image,index\)=>/);
  assert.match(app, /business\.spotlightImage\?"\/"\+business\.spotlightImage:item\.image/);
  assert.match(app, /business\.phoneHref&&\{label:language==="ko"\?"전화하기":"Call",url:`tel:\$\{business\.phoneHref\}`\}/);
  assert.match(app, /business\.mapUrl&&\{label:language==="ko"\?"지도 보기":"View Map",url:business\.mapUrl\}/);
  assert.doesNotMatch(web, /coway-carousel|coway.*previous|coway.*next/i);
  assert.doesNotMatch(app, /coway-carousel|coway.*previous|coway.*next/i);
  assert.match(web, /item\.logoDisplay\?\` logo-display-\$\{item\.logoDisplay\}\`/);
  assert.match(web, /logoDisplay: business\.logoDisplay \|\| ''/);
  assert.match(app, /business\.logoDisplay\?\` logo-display-\$\{business\.logoDisplay\}\`/);
  assert.match(webCss, /\.business-spotlight-card\.logo-display-wide \.business-spotlight-logo img\{transform:scale\(1\.42\)\}/);
  assert.match(webCss, /\.business-spotlight-card\.logo-display-wide \.business-summary\{height:auto;overflow:visible;white-space:normal;text-overflow:clip\}/);
  assert.match(webCss, /@media\(max-width:760px\)\{\.business-spotlight-card\.logo-display-wide \.business-summary\{margin:1px 0;font-size:12px;line-height:1\.45\}\}/);
  assert.match(appCss, /#partnerPrograms \.app-partner-logo\.logo-display-wide img\{transform:scale\(2\.2\)\}/);
  assert.match(appCss, /#partnerPrograms \.app-partner-card\.logo-display-wide \.app-partner-copy h3\{height:21px;min-height:21px!important\}/);
  assert.match(appCss, /#partnerPrograms \.app-partner-card\.logo-display-wide \.app-partner-copy p\{display:block!important;height:auto!important;min-height:0!important;flex-shrink:0;overflow:visible!important;white-space:normal!important;overflow-wrap:anywhere;text-overflow:clip;-webkit-line-clamp:unset!important\}/);
});
