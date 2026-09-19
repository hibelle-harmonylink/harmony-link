const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const appPage = read('app/index.html');
const appScript = read('app/app.js');
const sharedContent = read('shared-content.js');
const webScript = read('script.js');
const serviceWorker = read('app/service-worker-v95.js');

test('app menu links to the existing Senior Learning web page instead of duplicating it', () => {
  assert.match(appPage, /<a href="\.\.\/senior-learning\.html" data-ko="시니어 배움터" data-en="Senior Learning">시니어 배움터<\/a>/);
  // No new Senior Learning screen, auth gate, or lesson data was built inside the app.
  assert.doesNotMatch(appScript, /senior/i);
  assert.doesNotMatch(appPage, /data-screen="senior/);
  // The app's bottom tab bar (5 items) is left untouched, per scope.
  assert.match(appPage, /<nav class="bottom-nav" aria-label="앱 메뉴">/);
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((bottomNav.match(/data-go=|<a /g) || []).length, 5);
});

test('app community links all use same-window navigation so the back gesture returns to the app', () => {
  assert.match(appPage, /<a class="community-card-link" href="\.\.\/community\.html"><span data-ko="커뮤니티 보기"/);
  assert.doesNotMatch(appPage, /class="community-card-link" href="\.\.\/community\.html" target="_blank"/);
  assert.match(appPage, /<a href="\.\.\/community\.html"><span>◎<\/span>/);
  assert.match(appPage, /data-ko="커뮤니티" data-en="Community">커뮤니티<\/a>/);
});

test('shared-content.js accurately describes its own scope', () => {
  assert.doesNotMatch(sharedContent, /Homepage and app shared content/);
  assert.match(sharedContent, /mirrored from the public website/);
});

test('app Business Spotlight includes all 6 Production businesses, matching web script.js data', () => {
  const advertising = (sharedContent.match(/kind:"advertising"/g) || []).length;
  const community = (sharedContent.match(/kind:"community"/g) || []).length;
  assert.equal(advertising + community, 6);
  // DMS added with the exact Production fields from script.js's dmsCareBusiness / businessSpotlights.
  assert.match(sharedContent, /titleKo:"DMS Care Training Center",titleEn:"DMS Care Training Center"/);
  assert.match(sharedContent, /미국 의료 직업 학교/);
  assert.match(sharedContent, /Professional care workforce education/);
  assert.match(sharedContent, /469-605-6035/);
  assert.match(sharedContent, /1933 E Frankford Rd\. Suite 165, Carrollton, TX 75007/);
  assert.match(sharedContent, /url:"https:\/\/dmscare\.org\/ko"/);
  assert.match(sharedContent, /image:"\/assets\/images\/dms-care-logo\.webp"/);
  // No SNS link fabricated for DMS.
  const dmsEntry = sharedContent.match(/\{kind:"advertising"[^}]*DMS Care Training Center[^}]*\}/)?.[0] || '';
  assert.doesNotMatch(dmsEntry, /instagram|facebook|threads/i);
  // DMS phone/address/homepage match the web's authoritative record exactly (no invented mapUrl or data).
  assert.match(webScript, /phoneHref:'tel:\+14696056035'/);
  assert.match(webScript, /address:'1933 E Frankford Rd\. Suite 165, Carrollton, TX 75007'/);
  assert.match(webScript, /brokerUrl:'https:\/\/dmscare\.org\/ko'/);
  // AALEAC display name now matches web Production (adRooms.community displayNameKo/En: 'AALEAC').
  assert.match(sharedContent, /titleKo:"AALEAC",titleEn:"AALEAC"/);
  assert.doesNotMatch(sharedContent, /아시안 아메리칸 사법 경찰자문위원회/);
});

test('app events include the current Production 3 upcoming + 3 past classes', () => {
  assert.match(sharedContent, /id:"ai-business-automation"/);
  assert.match(sharedContent, /titleKo:"AI 업무자동화 무료 특강",titleEn:"Free AI Business Automation Workshop"/);
  assert.match(sharedContent, /date:"2026-09-11",endDate:"2026-09-11"/);
  assert.match(sharedContent, /image:"\/assets\/events\/ai-business-automation-free-class-20260911\.webp"/);
  // Messiah was already present in app.js with matching title/dates/venue/contact -- left untouched.
  assert.match(appScript, /id:"messiah".*titleKo:"미란멜로디와 함께하는 헨델의 메시아"/);
  assert.match(appScript, /date:"2026-12-09",endDate:"2026-12-13"/);
  // Total distinct event ids across the app's active data source: messiah (app.js) +
  // hole19-tournament, ai-business-automation, free-music-class, one-day-class,
  // finance-ai-seminar (shared-content.js, excluding the seminars-coming placeholder) = 6.
  const eventsBlock = sharedContent.match(/events: \[([\s\S]*?)\],\n  promotions:/)?.[1] || '';
  const sharedEventIds = [...eventsBlock.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(sharedEventIds.sort(), ['ai-business-automation', 'finance-ai-seminar', 'free-music-class', 'hole19-tournament', 'one-day-class', 'seminars-coming'].sort());
});

test('service worker v95 precaches the restyled app.css/overrides.css without changing the caching strategy', () => {
  assert.match(serviceWorker, /const CACHE="harmony-link-app-v95"/);
  assert.match(serviceWorker, /"\.\.\/assets\/events\/ai-business-automation-free-class-20260911\.webp"/);
  assert.match(serviceWorker, /"\.\.\/assets\/images\/dms-care-logo\.webp"/);
  assert.match(serviceWorker, /"\.\/app\.css\?v=62"/);
  assert.match(serviceWorker, /"\.\/overrides\.css\?v=97"/);
  assert.match(serviceWorker, /"\.\/app\.js\?v=94"/);
  // Same network-first, cache-as-fallback strategy as v94 -- not rewritten.
  assert.match(serviceWorker, /fetch\(event\.request,\{cache:"no-store"\}\)/);
  assert.match(appScript, /register\("service-worker-v95\.js",\{updateViaCache:"none"\}\)/);
  // Older versions are kept on disk (asset safety), not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v94.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v93.js')), true);
});

test('app design-unification pass: bottom nav, contact focus, page background, and partner/specialty tints are blue-family, not the stale green leftovers', () => {
  const appCss = read('app/app.css');
  const overridesCss = read('app/overrides.css');
  // The old sage-green leftovers from the original app.css skeleton are gone.
  assert.doesNotMatch(appCss, /background:#dde4df/);
  assert.doesNotMatch(appCss, /color:#8b9793/);
  assert.doesNotMatch(appCss, /border-color:#7ca395/);
  assert.doesNotMatch(appCss, /rgba\(124,163,149/);
  assert.doesNotMatch(appCss, /rgba\(23,63,58/);
  // Replaced with tokens/values from the same blue-family palette already used elsewhere in the app.
  assert.match(appCss, /body\{margin:0;background:var\(--cream\)/);
  assert.match(appCss, /\.bottom-nav button\{border:0;background:none;color:#8290a3/);
  assert.match(appCss, /border-color:#1155d9;box-shadow:0 0 0 3px rgba\(17,85,217,\.08\)/);
  // The pale-cyan image/logo container tint is unified with the web's sky-blue token.
  assert.doesNotMatch(overridesCss, /#c1f9ff/);
  assert.equal((overridesCss.match(/#dbeaff/g) || []).length >= 5, true);
  // Card hover lift is gated to fine-pointer devices and disabled under reduced motion,
  // so a tap on a touchscreen never leaves a card stuck in its hover state.
  assert.match(overridesCss, /@media\(hover:hover\) and \(pointer:fine\)\{[\s\S]*\.program-card,\.app-specialty-card,\.event-card,\.app-partner-card\{transition:transform/);
  assert.match(overridesCss, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]*transition:none!important/);
});
