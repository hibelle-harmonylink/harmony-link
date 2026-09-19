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
const serviceWorker = read('app/service-worker-v97.js');

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
  assert.match(appPage, /<a href="\.\.\/community\.html"><span class="bn-icon-wrap">/);
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

test('service worker v97 precaches the mobile design-system pass without changing the caching strategy', () => {
  assert.match(serviceWorker, /const CACHE="harmony-link-app-v97"/);
  assert.match(serviceWorker, /"\.\.\/assets\/events\/ai-business-automation-free-class-20260911\.webp"/);
  assert.match(serviceWorker, /"\.\.\/assets\/images\/dms-care-logo\.webp"/);
  assert.match(serviceWorker, /"\.\.\/assets\/home\/harmony-community-learning\.png"/);
  assert.match(serviceWorker, /"\.\/app\.css\?v=64"/);
  assert.match(serviceWorker, /"\.\/overrides\.css\?v=99"/);
  assert.match(serviceWorker, /"\.\/app\.js\?v=96"/);
  // Same network-first, cache-as-fallback strategy as v96 -- not rewritten.
  assert.match(serviceWorker, /fetch\(event\.request,\{cache:"no-store"\}\)/);
  assert.match(appScript, /register\("service-worker-v97\.js",\{updateViaCache:"none"\}\)/);
  // Older versions are kept on disk (asset safety), not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v96.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v95.js')), true);
});

test('app header collapses the always-expanded top menu into a hamburger panel, matching the web pattern', () => {
  // A hamburger toggle exists, wired to the reused nav via aria-controls.
  assert.match(appPage, /<button class="app-menu-toggle" id="appMenuToggle" type="button" aria-expanded="false" aria-controls="appPrimaryNav"/);
  assert.match(appPage, /<nav class="desktop-app-nav" id="appPrimaryNav" aria-label="주요 메뉴">/);
  // Menu order/labels match the web's own hamburger menu exactly (item order + Korean/English copy).
  const nav = appPage.match(/<nav class="desktop-app-nav" id="appPrimaryNav"[\s\S]*?<\/nav>/)?.[0] || '';
  const labels = [...nav.matchAll(/data-ko="([^"]+)"/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  assert.deepEqual(labels, ['프로그램', '시니어 배움터', '강좌·행사', '파트너 🔒', '커뮤니티', '소개', '문의']);
  // Login and language stay visible in the compact header itself, not folded into the hamburger panel.
  assert.match(appPage, /<div class="app-language-toggle"/);
  assert.match(appPage, /id="appAuthButton"/);
  // Off-canvas mobile panel is fine-pointer/coarse-pointer agnostic (CSS-driven), gated under 900px,
  // and disabled under reduced motion so it never gets stuck mid-transition.
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /@media\(max-width:899px\)\{\s*\.app-menu-toggle\{display:block!important/);
  assert.match(overridesCss, /\.desktop-app-nav\{position:fixed!important/);
  assert.match(overridesCss, /\.desktop-app-nav\.open\{opacity:1;visibility:visible;pointer-events:auto/);
  assert.match(overridesCss, /body\.app-menu-open\{overflow:hidden\}/);
  assert.match(overridesCss, /body\.app-menu-open \.bottom-nav\{display:none!important\}/);
});

test('app Home Hero is rebuilt from the current mobile web copy instead of the old intro-card layout', () => {
  const heroBlock = appPage.match(/<div class="hero">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] || appPage;
  // Exact web copy (Korean + English), not an invented headline.
  assert.match(appPage, /data-ko="HARMONY LINK · 이음문화센터" data-en="HARMONY LINK · E-EUM CULTURE CENTER"/);
  assert.match(appPage, /data-ko="배우고 싶은 사람과<br><em>가르치는 사람을 연결합니다\.<\/em>" data-en="Connecting people who want to learn <em>with people ready to teach\.<\/em>"/);
  assert.match(appPage, /디지털 · 음악 · 언어 · 건강 · 문화 · 생활교육까지<br>필요한 교육을 찾고 전문 강사와 연결하세요\./);
  // The old intro-card copy and circular "교육과 사람을 잇다" visual are gone from Home.
  assert.doesNotMatch(appPage, /Harmony Link\(이음문화센터\)는 하이벨컨설팅이/);
  assert.doesNotMatch(appPage, /마음을 잇고,<br><em>가능성을 열다<\/em>/);
  assert.doesNotMatch(appPage, /class="hero-connection-visual"/);
  // Two CTAs matching the web's primary/secondary structure, reusing the app's existing Programs screen.
  assert.match(appPage, /<button class="primary-action app-program-explore" type="button" data-go="programs"><span data-ko="교육 프로그램 찾기" data-en="Find Programs">/);
  assert.match(appPage, /<a class="app-hero-secondary-action" href="\.\.\/#partner-application">/);
  // Web's own hero photo is reused (not a new/invented asset), with the working data-ko-alt/data-en-alt switch.
  assert.match(appPage, /<img src="\.\.\/assets\/home\/harmony-community-learning\.png\?v=20260915-1" alt="함께 배우고 대화하는 Harmony Link 학습 공동체" data-ko-alt="함께 배우고 대화하는 Harmony Link 학습 공동체" data-en-alt="Harmony Link learning community studying and talking together">/);
  assert.match(appScript, /\$\$\("\[data-ko-alt\]"\)\.forEach\(el=>\{el\.alt=el\.dataset\[`\$\{language\}Alt`\]\}\);/);
});

test('app Home Hero renders on a light background with blue-family text, not the old dark navy card', () => {
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.app-shell #home \.hero\{background:linear-gradient\(125deg,#f7fbff 0%,#fff 49%,#eef5ff 100%\)!important;color:#111b36!important;border-color:#e4edf8!important\}/);
  assert.match(overridesCss, /\.app-shell #home \.hero \.eyebrow\{color:#1a34ac!important\}/);
  assert.match(overridesCss, /\.app-shell #home \.hero h1\{color:#111b36!important\}/);
  // The stale cream/ivory leftover (#fffcf0, unrelated to the blue palette) is gone.
  assert.doesNotMatch(overridesCss, /#fffcf0/);
  // The base .eyebrow and .section-title button rules (used by every section label in the app,
  // including "PROFESSIONAL PROGRAMS"/"NEWS & EVENTS"/"PARTNERS") no longer render the old
  // sage-green leftover -- they resolve to the same blue used everywhere else in the app.
  const appCss = read('app/app.css');
  assert.doesNotMatch(appCss, /color:#78998e/);
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
  assert.match(appCss, /\.bottom-nav button\{border:0;background:none;color:#5b6b85/);
  assert.match(appCss, /border-color:#1155d9;box-shadow:0 0 0 3px rgba\(17,85,217,\.08\)/);
  // The pale-cyan image/logo container tint is unified with the web's sky-blue token.
  assert.doesNotMatch(overridesCss, /#c1f9ff/);
  assert.equal((overridesCss.match(/#dbeaff/g) || []).length >= 5, true);
  // Card hover lift is gated to fine-pointer devices and disabled under reduced motion,
  // so a tap on a touchscreen never leaves a card stuck in its hover state.
  assert.match(overridesCss, /@media\(hover:hover\) and \(pointer:fine\)\{[\s\S]*\.program-card,\.app-specialty-card,\.event-card,\.app-partner-card\{transition:transform/);
  assert.match(overridesCss, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]*transition:none!important/);
});

test('bottom nav uses one consistent SVG icon system instead of mismatched glyph characters', () => {
  const bottomNav = appPage.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  // Every one of the 5 items wraps its icon the same way (button and the Community <a> alike),
  // so nothing falls back to the old inconsistent Unicode glyphs (⌂ ▦ ✦ ◎ ✉).
  assert.equal((bottomNav.match(/<span class="bn-icon-wrap"><svg class="bn-icon" viewBox="0 0 24 24"/g) || []).length, 5);
  assert.doesNotMatch(bottomNav, /[⌂▦✦◎✉]/);
  // The <a> (Community) and <button> items share the exact same alignment rule, so their icon
  // centers and label baselines line up -- this was the root cause of the reported misalignment.
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.bottom-nav a\{border:0;background:none;color:#5b6b85;display:flex;flex-direction:column;align-items:center;justify-content:center/);
  const appCss = read('app/app.css');
  assert.match(appCss, /\.bottom-nav button\{border:0;background:none;color:#5b6b85;display:flex;flex-direction:column;align-items:center;justify-content:center/);
  // Active state is HarmonyLink primary blue + bold with a soft pill behind the icon, not the
  // old plain navy; inactive stays a readable muted navy instead of a too-pale gray.
  assert.match(appCss, /\.bottom-nav button\.active\{color:#1155d9;font-weight:700\}/);
  assert.match(overridesCss, /\.bottom-nav button\.active \.bn-icon-wrap\{background:#dbeaff\}/);
  assert.match(overridesCss, /\.bottom-nav button\.active small\{font-weight:700\}/);
  // 44px minimum touch target per item.
  assert.match(overridesCss, /\.bottom-nav button,\.bottom-nav a\{min-height:44px/);
});

test('event cards show the full flyer instead of a cropped sliver, and the "click to enlarge" overlay is replaced by an explicit button', () => {
  // The overlay pill that used to sit on top of the flyer image is gone from the generated markup.
  assert.doesNotMatch(appScript, /이미지 클릭 시 크게 보기/);
  assert.doesNotMatch(appScript, /<span>\$\{zoomLabel\}<\/span>/);
  // A dedicated "전단지 보기" button opens the same lightbox as the thumbnail (reusing the
  // existing data-event-image delegated click handler -- no new JS wiring needed).
  assert.match(appScript, /const flyer=item\.isPlaceholder\?"":`<button class="event-flyer-link" type="button" data-event-image="\$\{item\.image\}" data-event-alt="\$\{title\}">\$\{flyerLabel\}<\/button>`;/);
  assert.match(appScript, /const actions=detail\|\|flyer\?`<div class="event-card-actions">\$\{detail\}\$\{flyer\}<\/div>`:"";/);
  // The flyer frame uses a fixed aspect-ratio with object-fit:contain on a neutral background,
  // so a tall poster is shown whole instead of being cropped by object-fit:cover at 240px.
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.event-card \.event-image-open\{aspect-ratio:4\/3;height:auto!important;background:#eef5ff!important\}/);
  assert.match(overridesCss, /\.event-card \.event-image-open img\{height:100%!important;object-fit:contain!important\}/);
});

test('Business Spotlight description is no longer hard-clamped to 3 lines, so longer entries like DMS are not silently truncated', () => {
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.app-partner-copy p\{display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;min-height:0!important\}/);
});

test('Korean eyebrows are localized instead of showing raw English site-wide', () => {
  // The three eyebrows the design brief called out by name.
  assert.match(appPage, /<p class="eyebrow" data-ko="프로그램" data-en="PROFESSIONAL PROGRAMS">PROFESSIONAL PROGRAMS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="소식 · 행사" data-en="NEWS & EVENTS">NEWS & EVENTS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="파트너" data-en="PARTNERS">PARTNERS<\/p>/);
  // The Events and Contact screens' own page-heading eyebrows, for the same reason.
  assert.match(appPage, /<p class="eyebrow" data-ko="행사" data-en="EVENTS">EVENTS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="문의" data-en="CONTACT">CONTACT<\/p>/);
});
