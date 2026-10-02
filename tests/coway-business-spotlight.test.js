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
  assert.equal(coway.nameKo, '코웨이');
  assert.equal(coway.nameEn, 'Coway');
  assert.equal(coway.websiteUrl, 'https://www.cowayunited.com/');
  assert.equal(coway.phoneKo, '917-628-6139');
  assert.equal(`tel:${coway.phoneHref}`, 'tel:+19176286139');
  assert.equal(coway.snsUrl, 'https://www.instagram.com/coway.usa.ny/');
  assert.deepEqual(coway.socialLinks.map(({label,url}) => ({label,url})), [
    {label:'Instagram',url:'https://www.instagram.com/coway.usa.ny/'},
    {label:'Threads',url:'https://www.threads.com/@coway.usa.ny'}
  ]);
  assert.equal(coway.address, 'H Mart Jericho 내');
  assert.equal(coway.mapUrl, mapUrl);
});

test('Coway uses the single approved 16:9 PNG everywhere without a carousel or extra asset', () => {
  const asset = 'assets/ads/coway/coway-banner-16x9.png';
  assert.equal(coway.logo, asset);
  assert.equal(coway.spotlightImage, asset);
  assert.equal(coway.appLogo, `/${asset}`);
  assert.deepEqual(coway.flyers, [asset]);
  assert.deepEqual(fs.readdirSync(path.join(root, 'assets/ads/coway')), ['coway-banner-16x9.png']);
  const bytes = fs.readFileSync(path.join(root, asset));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), '2c6d52b79846c61681c8ec35285ddae89aa8c7f5500823da13bc0bc5ded14b51');
  assert.equal(bytes.readUInt32BE(16), 1672);
  assert.equal(bytes.readUInt32BE(20), 941);
});

test('the original seven canonical business objects remain byte-for-byte unchanged', () => {
  const digest = crypto.createHash('sha256').update(JSON.stringify(businesses.slice(0, 7))).digest('hex');
  assert.equal(digest, 'b33bd4676486c078dd4697be1cf3d896a1644c69802adaf86e79b4d93b84dff6');
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
  const app = read('app/app.js');
  assert.match(web, /navigation\.hidden=flyers\.length<2/);
  assert.match(web, /\(id==='boxd-kitchen'\|\|id==='coway'\)&&phoneHref&&contact/);
  assert.match(app, /business\.flyers\.map\(\(image,index\)=>/);
  assert.match(app, /business\.phoneHref&&\{label:language==="ko"\?"전화하기":"Call",url:`tel:\$\{business\.phoneHref\}`\}/);
  assert.match(app, /business\.mapUrl&&\{label:language==="ko"\?"지도 보기":"View Map",url:business\.mapUrl\}/);
  assert.doesNotMatch(web, /coway-carousel|coway.*previous|coway.*next/i);
  assert.doesNotMatch(app, /coway-carousel|coway.*previous|coway.*next/i);
});
