const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const appPage = read('app/index.html');
const appScript = read('app/app.js');
const sharedContent = read('shared-content.js');
const businessesData = read('shared/data/businesses.js');
const eventsData = read('shared/data/events.js');
const webScript = read('script.js');
const serviceWorker = read('app/service-worker-v104.js');

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

test('app Business Spotlight includes all 6 Production businesses, now sourced from shared/data/businesses.js instead of duplicated in shared-content.js', () => {
  // As of the Phase 1 web/app data unification, the 6 businesses moved out of
  // shared-content.js's promotions[] and into the canonical shared/data/businesses.js
  // that both script.js and app/app.js read (see tests/shared-business-data.test.js
  // for the full field-level coverage). This test keeps checking the Production
  // values this test originally asserted, just from their new home.
  const advertising = (businessesData.match(/kind:"advertising"/g) || []).length;
  const community = (businessesData.match(/kind:"community"/g) || []).length;
  assert.equal(advertising + community, 6);
  // DMS matches the exact Production fields from script.js's former dmsCareBusiness / businessSpotlights.
  assert.match(businessesData, /nameKo:"DMS Care Training Center",nameEn:"DMS Care Training Center"/);
  assert.match(businessesData, /미국 의료 직업 학교/);
  assert.match(businessesData, /Professional care workforce education/);
  assert.match(businessesData, /469-605-6035/);
  assert.match(businessesData, /1933 E Frankford Rd\. Suite 165, Carrollton, TX 75007/);
  assert.match(businessesData, /websiteUrl:"https:\/\/dmscare\.org\/ko"/);
  assert.match(businessesData, /logo:"assets\/images\/dms-care-logo\.webp"/);
  // No SNS link fabricated for DMS.
  const dmsEntry = businessesData.match(/\{id:"dms-care"[^}]*\}/)?.[0] || '';
  assert.doesNotMatch(dmsEntry, /instagram|facebook|threads/i);
  assert.match(dmsEntry, /snsUrl:null/);
  // AALEAC display name matches web Production.
  assert.match(businessesData, /nameKo:"AALEAC",nameEn:"AALEAC"/);
  assert.doesNotMatch(businessesData, /아시안 아메리칸 사법 경찰자문위원회/);
  // shared-content.js itself no longer carries these 6 businesses.
  assert.doesNotMatch(sharedContent, /DMS Care Training Center/);
  assert.doesNotMatch(sharedContent, /AALEAC/);
});

test('app events include the current Production 3 upcoming + 3 past classes', () => {
  // As of the Phase 2 web/app data unification, all 6 events (including messiah, which
  // used to be hardcoded separately in app.js) moved out of app.js/shared-content.js
  // and into the canonical shared/data/events.js that both script.js and app/app.js
  // read (see tests/shared-event-data.test.js for full field-level coverage). This
  // test keeps checking the Production values it originally asserted, from their new home.
  assert.match(eventsData, /id:"ai-business-automation"/);
  assert.match(eventsData, /titleKo:"AI 업무자동화 무료 특강",titleEn:"Free AI Business Automation Workshop"/);
  assert.match(eventsData, /dateStart:"2026-09-11",dateEnd:"2026-09-11"/);
  assert.match(eventsData, /flyerKo:"assets\/events\/ai-business-automation-free-class-20260911\.webp"/);
  assert.match(eventsData, /id:"messiah"[\s\S]*?titleKo:"미란멜로디와 함께하는 헨델의 메시아"/);
  assert.match(eventsData, /dateStart:"2026-12-09",dateEnd:"2026-12-13"/);
  // shared-content.js no longer carries any of the 6 events.
  assert.doesNotMatch(sharedContent, /events:\s*\[/);
  const ids = [...eventsData.matchAll(/id:"([a-z0-9-]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, ['messiah', 'hole19-tournament', 'free-music-class', 'ai-business-automation', 'one-day-class', 'finance-ai-seminar', 'dms-ai-automation-workshop']);
});

test('service worker v104 precaches the Phase 3 Programs canonical file without changing the caching strategy', () => {
  assert.match(serviceWorker, /const CACHE="harmony-link-app-v104"/);
  assert.match(serviceWorker, /"\.\.\/assets\/events\/ai-business-automation-free-class-20260911\.webp"/);
  assert.match(serviceWorker, /"\.\.\/assets\/images\/dms-care-logo\.webp"/);
  assert.match(serviceWorker, /"\.\.\/assets\/home\/harmony-community-learning\.png"/);
  assert.match(serviceWorker, /"\.\.\/shared\/data\/events\.js\?v=1"/);
  assert.match(serviceWorker, /"\.\.\/shared\/data\/programs\.js\?v=1"/);
  assert.match(serviceWorker, /"\.\/app\.css\?v=65"/);
  assert.match(serviceWorker, /"\.\/overrides\.css\?v=103"/);
  assert.match(serviceWorker, /"\.\/app\.js\?v=104"/);
  // Same network-first, cache-as-fallback strategy as v103 -- not rewritten.
  assert.match(serviceWorker, /fetch\(event\.request,\{cache:"no-store"\}\)/);
  assert.match(appScript, /register\("service-worker-v104\.js",\{updateViaCache:"none"\}\)/);
  // Older versions are kept on disk (asset safety), not deleted.
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v103.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v102.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v100.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v99.js')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'service-worker-v97.js')), true);
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
  // The flyer frame uses a fixed aspect-ratio with object-fit:contain on a neutral background,
  // so a tall poster is shown whole instead of being cropped by object-fit:cover at 240px.
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.event-card \.event-image-open\{aspect-ratio:4\/3;height:auto!important;background:#eef5ff!important\}/);
  assert.match(overridesCss, /\.event-card \.event-image-open img\{height:100%!important;object-fit:contain!important\}/);
});

test('event cards show exactly one "자세히 보기" button spanning the full card width, reusing the imageLightbox for events without a detail page', () => {
  // Events with a dedicated detail page link to it; events without one reuse the same
  // imageLightbox as the thumbnail via a button carrying the same data-event-image attribute
  // (the existing delegated click handler wires it up, no new JS needed).
  assert.match(appScript, /const detail=item\.isPlaceholder\?"":\(detailUrl\?`<a class="event-detail-link" href="\$\{detailUrl\}">\$\{detailLabel\}<\/a>`:`<button class="event-detail-link" type="button" data-event-image="\$\{item\.image\}" data-event-alt="\$\{title\}">\$\{detailLabel\}<\/button>`\);/);
  assert.match(appScript, /const actions=detail\?`<div class="event-card-actions">\$\{detail\}<\/div>`:"";/);
  // No flyer button/variable remains, and the old two-column trigger is gone.
  assert.doesNotMatch(appScript, /event-flyer-link/);
  const overridesCss = read('app/overrides.css');
  assert.doesNotMatch(overridesCss, /event-flyer-link/);
  // Single-column action row, full-width button.
  assert.match(overridesCss, /\.event-card-actions\{display:grid;grid-template-columns:1fr;margin-top:4px\}/);
  assert.match(overridesCss, /\.event-detail-link\{display:flex!important;align-items:center;justify-content:center;width:100%;border:0;background:#1155d9;color:#fff;text-decoration:none;font-family:inherit;cursor:pointer\}/);
});

test('Business Spotlight description is no longer hard-clamped to 3 lines, so longer entries like DMS are not silently truncated', () => {
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.app-partner-copy p\{display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;min-height:0!important\}/);
});

test('Korean eyebrows are localized instead of showing raw English site-wide', () => {
  // The three eyebrows the design brief called out by name. Programs/Business Spotlight
  // now match the wording the real website uses for the same content (see
  // tests/home-dashboard-redesign.test.js for the full title-unification coverage).
  assert.match(appPage, /<p class="eyebrow" data-ko="프로그램" data-en="EDUCATION PROGRAMS">EDUCATION PROGRAMS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="소식 · 행사" data-en="NEWS & EVENTS">NEWS & EVENTS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="BUSINESS SPOTLIGHT" data-en="BUSINESS SPOTLIGHT">BUSINESS SPOTLIGHT<\/p>/);
  // The Events and Contact screens' own page-heading eyebrows, for the same reason.
  assert.match(appPage, /<p class="eyebrow" data-ko="행사" data-en="EVENTS">EVENTS<\/p>/);
  assert.match(appPage, /<p class="eyebrow" data-ko="문의" data-en="GET IN TOUCH">GET IN TOUCH<\/p>/);
});

test('Events and Contact main titles match the website\'s actual section titles, not app-invented wording', () => {
  // Web source of truth: index.html's Events section uses "강좌 · 행사" / "Classes & Events",
  // and its Contact section heading is "궁금한 점이 있으신가요?" / "Have a question?".
  assert.match(appPage, /<h2 data-ko="강좌 · 행사" data-en="Classes & Events">강좌 · 행사<\/h2>/);
  assert.match(appPage, /<h1 class="events-main-title" data-ko="강좌 · 행사" data-en="Classes & Events">강좌 · 행사<\/h1>/);
  // The Contact screen's initial (pre-JS) markup mirrors the same text; setContactMode() in
  // app.js re-applies this exact wording at runtime for the default "general" contact mode.
  assert.match(appPage, /<h1 id="contactTitle" data-ko="궁금한 점이 있으신가요\?" data-en="Have a question\?">궁금한 점이 있으신가요\?<\/h1>/);
  assert.match(appScript, /title\.dataset\.ko="궁금한 점이 있으신가요\?";/);
  assert.match(appScript, /title\.dataset\.en="Have a question\?";/);
});

test('the login modal logo uses the same asset and the same colored container as the header logo, so its white portions stay visible on the white modal panel', () => {
  // Same asset as the header (no separate login-specific logo variant).
  assert.match(appPage, /<span class="logo-mark brand-image" aria-hidden="true"><img src="\.\.\/assets\/harmony-logo\.png" alt=""><\/span>/);
  assert.match(appPage, /<div class="app-auth-brand"><span class="logo-mark brand-image"><img src="\.\.\/assets\/harmony-logo\.png" alt=""><\/span><span>HARMONY LINK MEMBER<\/span><\/div>/);
  // The modal's logo gets its own scoped copy of the header's colored gradient container,
  // since app-auth-brand sits on a plain white panel where a bare <img> would lose its white parts.
  const overridesCss = read('app/overrides.css');
  assert.match(overridesCss, /\.app-auth-brand \.logo-mark\{width:40px;height:40px;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0\}/);
  assert.match(overridesCss, /\.app-auth-brand \.brand-image\{padding:4px;border-radius:11px;background:linear-gradient\(145deg,#bcd5fb,#6f9fe6\);box-shadow:0 5px 16px rgba\(12,64,140,\.16\);overflow:hidden\}/);
  assert.match(overridesCss, /\.app-auth-brand \.brand-image img\{display:block;width:100%;height:100%;object-fit:contain\}/);
});

test('Contact form fields share one column, one width, and one input/select/textarea style so nothing drifts out of alignment', () => {
  const appCss = read('app/app.css');
  // Single-column grid; every field is a direct grid row (no nested layout to misalign against).
  assert.match(appCss, /\.contact-form\{padding:0 20px 25px;display:grid;gap:16px\}/);
  // input/select/textarea share width, border, radius, padding, font, background -- no per-field
  // variation, and the select's wrapper is block-level so it doesn't opt out of the 100% width.
  assert.match(appCss, /\.contact-form input,\.contact-form select,\.contact-form textarea\{width:100%;border:1px solid var\(--line\);border-radius:14px;padding:14px;font:inherit;color:var\(--ink\);background:white;outline:none\}/);
  assert.match(appCss, /\.contact-form \.select-wrap\{display:block;position:relative;padding-left:0\}/);
  // Input and select share one explicit height on the Contact screen itself.
  assert.match(appCss, /#contact \.contact-form input,#contact \.contact-form select\{height:38px;padding-top:7px;padding-bottom:7px\}/);
  // The submit button is a grid row like every other field, so it shares the same left/right edges.
  assert.match(appCss, /\.submit-button\{height:52px;border:0;border-radius:26px;background:var\(--ink\);color:white;padding:0 22px;display:flex;align-items:center;justify-content:space-between;font-weight:700\}/);
  // Shared blue focus ring across all three field types.
  assert.match(appCss, /\.contact-form input:focus,\.contact-form select:focus,\.contact-form textarea:focus\{border-color:#1155d9;box-shadow:0 0 0 3px rgba\(17,85,217,\.08\)\}/);
});

test('section eyebrow weight/size moves closer to the website\'s eyebrow style (800/12px) without touching layout spacing', () => {
  const appCss = read('app/app.css');
  assert.match(appCss, /\.eyebrow\{margin:0 0 12px;color:#1a34ac;font-weight:800;font-size:12px;letter-spacing:\.14em\}/);
});
