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
const boxd = businesses.find(business => business.id === 'boxd-kitchen');
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

test('BOXD remains seventh and Coway is appended without reordering the original businesses', () => {
  assert.deepEqual(businesses.map(b=>b.id), ['yura-kim','organic-one','hole19','aaleac','jangsu-daycare','dms-care','boxd-kitchen','coway']);
  // JSON hash captured from clean main 5ef4959, including every original field and order.
  assert.equal(hash(JSON.stringify(businesses.slice(0,6))), '9cef8e790cec1a12d78d41a7711801acdb1d68d796aeef92ef6afcb393c14cc0');
});

test('original six app cards keep identical data, links, phone and order -- now wrapped in the same tappable detail button BOX\'D already used (Business Spotlight mobile-detail unification round)', () => {
  // The div-vs-button wrapper changed (every business card is now tappable to open
  // its own detail view, not just BOX'D -- see openImageLightbox()), but this hash
  // still pins the six businesses' actual content: names, order, phone numbers,
  // hrefs and CTA text must be byte-for-byte the same as before that wrapper change.
  assert.equal(hash(render().slice(0,6).join('')), 'ce49902f4fdf20b61df973352271bda67537ec51604207390ed85a1b06fbf410');
});

test('BOXD name, category, location, address, phone and map are exact (Business Spotlight PC card round)', () => {
  assert.equal(boxd.nameKo, "BOX'D KITCHEN");assert.equal(boxd.nameEn, "BOX'D KITCHEN");
  assert.equal(boxd.categoryEn, 'Restaurant / Catering');
  assert.equal(boxd.locationEn, 'Charlottesville, Virginia');
  assert.equal(boxd.address, '909 West Main Street, Charlottesville, VA');
  assert.equal(boxd.summaryEn, 'Fresh Mediterranean Bowls & Catering');
  assert.equal(boxd.appTextEn, boxd.summaryEn);
  assert.equal(boxd.summaryKo, '신선한 지중해식 보울 & 케이터링');
  assert.equal(boxd.appTextKo, boxd.summaryKo);
  // The PC card shows a phone number and a clickable map address using the exact
  // tel: target and the hand-verified Google Maps Place URL (Business Spotlight
  // 2nd UI round replaced the earlier maps/search/?api=1&query= fallback).
  assert.equal(boxd.phoneKo, '434-202-2749');assert.equal(boxd.phoneEn, '434-202-2749');
  assert.equal(boxd.phoneHref, '+14342022749');
  assert.equal(boxd.mapUrl, "https://www.google.com/maps/place/Box'd+Kitchen/@38.0326919,-78.4968453,17z/data=!3m1!4b1!4m6!3m5!1s0x89b38639a51e15c3:0xfdd3d48c782e4c7a!8m2!3d38.0326877!4d-78.4942704!16s%2Fg%2F11f2bdqz9g?hl=ko&entry=ttu&g_ep=EgoyMDI2MDkyNy4xIKXMDSoASAFQAw%3D%3D");
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
  // No spotlightImage override any more -- the Spotlight card (web + app) falls
  // back to the official logo above instead of a flyer being used as a logo.
  assert.equal(boxd.spotlightImage,undefined);
  // flyerLayout was removed in the 2nd UI round -- BOX'D's PC detail is back to
  // the same single-image carousel every other business uses (see openBusinessFlyer()).
  assert.equal(boxd.flyerLayout,undefined);
  assert.equal(boxd.flyers.length,3);
});

test('both languages keep BOX\'D as the seventh card using the official black logo (not a flyer) and Toast CTA in a safe new tab', () => {
  for(const language of ['ko','en']) {
    const cards=render(language);assert.equal(cards.length,8);
    assert.match(cards[6],/data-business-id="boxd-kitchen"/);
    assert.ok(cards[6].includes('/'+boxd.logo));
    assert.ok(!cards[6].includes('/'+boxd.flyers[0]) && !cards[6].includes('/'+boxd.flyers[1]) && !cards[6].includes('/'+boxd.flyers[2]), 'the card image must be the logo, never a flyer');
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
  assert.match(css,/#lightboxBusinessInfo \.app-contact-social a,#lightboxBusinessInfo \.business-contact-actions a\{[^}]*min-height:44px;[^}]*white-space:nowrap/);
  assert.match(css,/\.has-business-details #lightboxImage\{[^}]*max-width:min\(100%,760px\)/);
});

test('app BOX\'D detail shows all 3 flyers stacked (never the single-image picker), no website CTA, exactly 4 real-data CTAs split into an SNS row and a matched 2-column phone/map row, and no repeated logo/address/summary header', () => {
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,innerHTML:'',classList:{toggle(){}},querySelector(){return{textContent:''}}});return nodes.get(id)};
  const context=vm.createContext({$:node,language:'ko',business:boxd});
  vm.runInContext(source('openImageLightbox')+'\nopenImageLightbox("/"+(business.flyers?.[0]||business.logo),business.nameKo,null,business)',context);
  assert.equal(node('#imageLightbox').hidden,false);assert.equal(node('#lightboxBusinessInfo').hidden,false);
  // Every business's detail (not just BOX'D any more) hides the single #lightboxImage + picker entirely.
  assert.equal(node('#lightboxImage').hidden,true);
  const html=node('#lightboxBusinessInfo').innerHTML;
  // No duplicate logo/address/summary intro -- just the business name as a title.
  assert.ok(html.includes(`<h2>${boxd.nameKo}</h2>`));
  assert.ok(!html.includes(boxd.address));
  assert.ok(!html.includes('business-detail-logo'));
  // All 3 flyers render as full images in a vertical stack, not a picker.
  assert.ok(!html.includes('business-image-choices'));
  assert.ok(html.includes('business-flyer-stack'));
  for(const file of boxd.flyers)assert.ok(html.includes(`src="/${file}"`));
  // No 홈페이지 보기/website CTA any more -- the list card's own "업체 바로가기"
  // link already covers that role (Business Spotlight 3rd UI round).
  assert.ok(!html.includes(`href="${boxd.websiteUrl}"`));
  // Exactly the 4 CTAs BOX'D's own data actually has: Instagram + Threads in the
  // SNS row, 전화하기 + 지도 보기 in a matched 2-column row.
  for(const social of boxd.socialLinks)assert.ok(html.includes(`href="${social.url}" target="_blank" rel="noopener noreferrer"`));
  assert.ok(html.includes(`href="tel:${boxd.phoneHref}"`));
  assert.ok(html.includes(`href="${boxd.mapUrl}"`));
  assert.equal((html.match(/<a href=/g)||[]).length,4);
  assert.match(html,/<div class="business-contact-actions has-two">/);
  vm.runInContext('openImageLightbox("event.png","Event")',context);
  assert.equal(node('#lightboxBusinessInfo').hidden,true);assert.equal(node('#lightboxBusinessInfo').innerHTML,'');
});

test('app detail for a non-BOX\'D business (Jangsu Daycare) only shows the links its own data actually has -- phone and map, never a fabricated website/Instagram/Threads', () => {
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,innerHTML:'',classList:{toggle(){}},querySelector(){return{textContent:''}}});return nodes.get(id)};
  const jangsu=businesses.find(b=>b.id==='jangsu-daycare');
  assert.equal(jangsu.websiteUrl,null);assert.equal(jangsu.snsUrl,null);
  const context=vm.createContext({$:node,language:'ko',business:jangsu});
  vm.runInContext(source('openImageLightbox')+'\nopenImageLightbox("/"+business.flyers[0],business.nameKo,null,business)',context);
  const html=node('#lightboxBusinessInfo').innerHTML;
  assert.ok(html.includes(`href="tel:${jangsu.phoneHref}"`));
  assert.ok(html.includes(`href="${jangsu.mapUrl}"`));
  assert.equal((html.match(/<a href=/g)||[]).length,2);
});

test('website keeps its existing detail renderer while adapting optional shared images, logos and social links', () => {
  assert.match(web,/image: business\.spotlightImage \|\| business\.logo/);
  assert.match(web,/socialLinks: business\.socialLinks \|\| \[\]/);
  assert.match(web,/business\.socialLinks\.map\(link=>/);
  assert.match(web,/class="business-flyer-sns" href="\$\{link\.url\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(web,/websiteLabelKo=business\.websiteCtaKo\|\|'홈페이지 보기'/);
  assert.match(web,/id:'va',labelKo:'VA',labelEn:'VA'/);
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
