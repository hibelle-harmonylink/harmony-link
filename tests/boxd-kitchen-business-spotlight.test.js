const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sandbox = {window: {}};
vm.runInNewContext(read('shared/data/businesses.js'), sandbox);
const businesses = JSON.parse(JSON.stringify(sandbox.window.HARMONY_LINK_BUSINESSES));
const boxd = businesses.at(-1);
const app = read('app/app.js');
const web = read('script.js');
function source(name) {
  return app.match(new RegExp(`function ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`))[0];
}
function render(language='ko') {
  const node = {innerHTML: ''};
  const context = vm.createContext({window: {HARMONY_LINK_BUSINESSES: businesses}, $: () => node});
  vm.runInContext(source('businessToPromotion') + '\nconst businessPromotions=window.HARMONY_LINK_BUSINESSES.map(businessToPromotion);let language=' + JSON.stringify(language) + ';\n' + source('renderPartners') + '\nrenderPartners();', context);
  return node.innerHTML.match(/<article\b[\s\S]*?<\/article>/g);
}

test('BOXD is appended seventh; all six original canonical objects are byte-for-byte preserved', () => {
  assert.deepEqual(businesses.map(b=>b.id), ['yura-kim','organic-one','hole19','aaleac','jangsu-daycare','dms-care','boxd-kitchen']);
  // JSON hash captured from clean main 5ef4959, including every original field and order.
  assert.equal(hash(JSON.stringify(businesses.slice(0,6))), '9cef8e790cec1a12d78d41a7711801acdb1d68d796aeef92ef6afcb393c14cc0');
});

test('original six app cards preserve their exact rendered markup, links, phone and order', () => {
  assert.equal(hash(render().slice(0,6).join('')), '5bfb30f5a1e85923c8e818827f1962acb18fbe7fbe2641a08ade6a4ea00166ac');
});

test('BOXD name, category, location, address and short bilingual descriptions are exact', () => {
  assert.equal(boxd.nameKo, "BOX'D KITCHEN");assert.equal(boxd.nameEn, "BOX'D KITCHEN");
  assert.equal(boxd.categoryEn, 'Restaurant / Catering');
  assert.equal(boxd.locationEn, 'Charlottesville, Virginia');
  assert.equal(boxd.address, '909 West Main Street, Charlottesville, VA');
  assert.equal(boxd.summaryEn, 'Fresh Mediterranean Bowls & Catering');
  assert.equal(boxd.appTextEn, boxd.summaryEn);
  assert.equal(boxd.summaryKo, '신선한 지중해식 보울 & 케이터링');
  assert.equal(boxd.appTextKo, boxd.summaryKo);
  assert.equal(boxd.phoneHref, null);assert.equal(boxd.mapUrl, null);
});

test('Toast, Instagram and Threads are distinct clean canonical URLs with no tracking parameters', () => {
  assert.equal(boxd.websiteUrl, 'https://order.toasttab.com/online/box-d-kitchen-charlottesville-909-w-main-st');
  assert.deepEqual(boxd.socialLinks.map(({label,url})=>({label,url})), [
    {label:'Instagram',url:'https://www.instagram.com/boxdkitchen_uva/'},
    {label:'Threads',url:'https://www.threads.com/@boxdkitchen_uva'}
  ]);
  [boxd.websiteUrl,...boxd.socialLinks.map(s=>s.url)].forEach(url=>assert.equal(new URL(url).search,''));
  for(const url of [boxd.websiteUrl,...boxd.socialLinks.map(s=>s.url)]) {
    assert.ok(!app.includes(url) && !web.includes(url), 'no duplicate business URL literals in renderers');
  }
});

test('all four authorized PNG originals exist unmodified and no substitute/generated image is used', () => {
  const expected = {
    'logo.png':'3df4cd741e6640fd21395d79dca3e23d19e53b3fe320c91e21084aa4c4d60cf0',
    'flyer-1-1.png':'f4bb77dcf982e23af3fae631c8f9a3ea42043ecc87870361e0057ae1debf874e',
    'flyer-2-1.png':'b30d6fca1d495dcd1c39617e6a289f071e158033ab5dfea8e56b0842e23a6f04',
    'flyer-4-1.png':'bff4e2ca7f5fbe71c6f3c3b0122e50d3b75689a9869d0778c134073b91de557a'
  };
  assert.deepEqual(fs.readdirSync(path.join(root,'assets/ads/boxd-kitchen')).sort(),Object.keys(expected).sort());
  for(const [name,sha] of Object.entries(expected)) {
    const bytes=fs.readFileSync(path.join(root,'assets/ads/boxd-kitchen',name));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(hash(bytes),sha,name);
  }
  assert.equal(boxd.logo,'assets/ads/boxd-kitchen/logo.png');
  assert.equal(boxd.spotlightImage,'assets/ads/boxd-kitchen/flyer-2-1.png');
  assert.equal(boxd.flyers.length,3);
});

test('both languages render seventh card using the representative image and Toast CTA in a safe new tab', () => {
  for(const language of ['ko','en']) {
    const cards=render(language);assert.equal(cards.length,7);
    assert.match(cards[6],/data-business-id="boxd-kitchen"/);
    assert.ok(cards[6].includes('/'+boxd.spotlightImage));
    assert.ok(cards[6].includes(`href="${boxd.websiteUrl}" target="_blank" rel="noopener noreferrer"`));
    assert.ok(cards[6].includes(language==='ko'?'업체 바로가기':'Visit Business'));
    assert.match(cards[6],/type="button"[^>]+data-business-detail="boxd-kitchen"/);
  }
});

test('mobile cards preserve native scrolling, snap, identical dimensions and keep the seventh reachable in DOM', () => {
  const css=read('app/overrides.css');
  assert.match(css,/#partnerPrograms\{display:flex;[^}]*overflow-x:auto;[^}]*scroll-snap-type:x proximity/);
  assert.match(css,/flex:0 0 154px;width:154px;height:220px;scroll-snap-align:start/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(min-width:640px\) and \(max-width:899px\)\{#partnerPrograms\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(source('renderPartners'),/slice\(|setInterval|boxd-kitchen/);
  assert.doesNotMatch(css,/\[data-business-id="boxd-kitchen"\]|last-child.*justify/);
  assert.match(css,/#lightboxBusinessInfo \.app-contact-social a\{[^}]*min-height:44px;[^}]*white-space:nowrap/);
  assert.match(css,/\.has-business-details #lightboxImage\{[^}]*max-width:min\(100%,760px\)/);
});

test('app business detail reuses image lightbox, displays original logo and renders canonical SNS links', () => {
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,innerHTML:'',classList:{toggle(){}},querySelector(){return{textContent:''}}});return nodes.get(id)};
  const context=vm.createContext({$:node,language:'ko',business:boxd});
  vm.runInContext(source('openImageLightbox')+'\nopenImageLightbox("/"+business.spotlightImage,business.nameKo,null,business)',context);
  assert.equal(node('#imageLightbox').hidden,false);assert.equal(node('#lightboxBusinessInfo').hidden,false);
  const html=node('#lightboxBusinessInfo').innerHTML;
  assert.ok(html.includes('/'+boxd.logo));assert.ok(html.includes(boxd.address));
  for(const social of boxd.socialLinks)assert.ok(html.includes(`href="${social.url}" target="_blank" rel="noopener noreferrer"`));
  for(const file of boxd.flyers)assert.ok(html.includes(`data-business-image="/${file}"`));
  vm.runInContext('openImageLightbox("event.png","Event")',context);
  assert.equal(node('#lightboxBusinessInfo').hidden,true);assert.equal(node('#lightboxBusinessInfo').innerHTML,'');
});

test('website keeps its existing detail renderer while adapting optional shared images, logos and social links', () => {
  assert.match(web,/image: business\.spotlightImage \|\| business\.logo/);
  assert.match(web,/socialLinks: business\.socialLinks \|\| \[\]/);
  assert.match(web,/business\.socialLinks\.map\(link=>/);
  assert.match(web,/class="business-flyer-sns" href="\$\{link\.url\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(web,/websiteLabelKo=business\.websiteCtaKo\|\|'홈페이지 보기'/);
  assert.match(web,/id:'va',labelKo:'VIRGINIA',labelEn:'VIRGINIA'/);
  assert.match(read('styles.css'),/\.business-flyer-info>img\{[^}]*background:#000;object-fit:contain/);
});

test('HOLE19 website, DMS two-line name, police Korean display and Jangsu telephone remain unchanged', () => {
  const cards=render();
  assert.match(cards[2],/href="https:\/\/hole19golflounge.com\/"/);
  assert.match(cards[3],/아시안 아메리칸/);assert.match(cards[3],/사법 경찰자문위원회/);
  assert.match(cards[4],/href="tel:\+17187990133"/);
  assert.match(cards[5],/>DMS<\/span>/);assert.match(cards[5],/Care Training Center<\/span>/);
  assert.match(cards[5],/href="https:\/\/dmscare.org\/ko"/);
});
