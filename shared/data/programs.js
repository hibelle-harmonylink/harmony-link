// Canonical HarmonyLink Programs data (Phase 3 of the web/app shared-data project).
// This file is the single source of truth for the 3 named specialty programs
// Harmony Link directly or jointly operates -- Hibelle Digital, Hibelle Online
// English, and Meeran Melody. Both the public website (script.js) and the
// installed app (app/app.js) read this file directly instead of keeping their
// own separate copies of the same data, the same pattern already established
// for Business Spotlight (shared/data/businesses.js) and Events
// (shared/data/events.js).
//
// Schema notes:
// - id is the app's pre-existing stable identifier (already used for
//   data-id/localStorage-saved-program tracking and image-map keys in
//   app/app.js before this file existed) and is kept unchanged here.
// - slug is the website's own pre-existing short identifier ('digital',
//   'english', 'melody'), used only for the exact existing CSS class name
//   (specialty-${slug}) and DOM id on the website's banner cards -- kept
//   separate from id so neither surface's existing class names/URLs had to
//   change.
// - image/url are the website's own values (the banner poster path and the
//   program's dedicated page). appImage/appUrl/appTagsKo/appTagsEn are the
//   app's existing, already-shipped values, which intentionally differ (a
//   small square brand-mark image instead of the full poster, a shared
//   "back to the website" link instead of each program's own page, and
//   short middot-separated tags instead of a full sentence) -- preserved
//   byte-for-byte rather than unified, since that was a deliberate
//   Production difference between the two surfaces, not an oversight.
// - appPromoTextKo/appPromoTextEn are the app's existing home-news-popup
//   promo card body copy (title/badge/action label/image are shared with
//   the rest of the app fields above and are not duplicated here).
// - statusKo/statusEn are the website's "직영"/"공동운영" operation badge.
// - This file intentionally excludes the website's now-unreachable
//   specialty-detail-modal fields (teacher bio, application form link) --
//   no element in the current site triggers that modal ([data-specialty]
//   does not exist in index.html), so that legacy detail content stays
//   local to script.js instead of being promoted into the canonical schema.
window.HARMONY_LINK_PROGRAMS = [
  {id:"hibelle-digital",slug:"digital",titleKo:"하이벨 디지털",titleEn:"Hibelle Digital",descriptionKo:"스마트폰과 AI를 일상에서 활용하는 실용 디지털 교육",descriptionEn:"Practical digital learning for smartphones and AI",image:"assets/specialty/hibelle-digital-20260718.jpg",url:"digital-classes/index.html",statusKo:"직영",statusEn:"DIRECTLY OPERATED",category:"디지털",tone:"blue",appTagsKo:"스마트폰 · AI · 컴퓨터 교육",appTagsEn:"Smartphone · AI · Computer",appImage:"/assets/brands/hibelle-digital.png?v=20260822-1",appColor:"#dbeaff",appUrl:"/#specialty-banners",appPromoTextKo:"AI와 스마트폰을 실생활에서<br>자신 있게 활용하도록 돕는 맞춤형 디지털 교육입니다.<br>연락처 929-603-0052",appPromoTextEn:"Practical digital education for using AI and smartphones.<br>Contact 929-603-0052"},
  {id:"hibelle-english",slug:"english",titleKo:"하이벨 화상영어",titleEn:"Hibelle Online English",descriptionKo:"목표와 수준에 맞춘 1:1 실용 화상영어",descriptionEn:"Practical one-to-one online English for every level",image:"assets/specialty/hibelle-online-english-20260718.jpg",url:"online-english/",statusKo:"직영",statusEn:"DIRECTLY OPERATED",category:"언어",tone:"orange",appTagsKo:"1:1 맞춤 화상영어 · 전문 강사진",appTagsEn:"Personalized 1:1 online English",appImage:"/assets/brands/hibelle-online-english.png?v=20260822-1",appColor:"#ffe3cf",appUrl:"/#specialty-banners",appPromoTextKo:"시간과 장소의 제약 없이 수준과 목표에 맞춰<br>진행하는 1:1 실용 화상 영어입니다.<br>연락처 929-603-0052",appPromoTextEn:"Personalized one-to-one practical English lessons.<br>Contact 929-603-0052"},
  {id:"meeran-melody",slug:"melody",titleKo:"미란멜로디",titleEn:"Meeran Melody",descriptionKo:"노래와 문화로 마음과 공동체를 잇는 음악 프로그램",descriptionEn:"Music programs connecting hearts and community",image:"assets/specialty/meeran-melody.png",url:"meeran-melody/",statusKo:"공동운영",statusEn:"CO-OPERATED",category:"음악",tone:"pink",appTagsKo:"합창 · 발성 · 음악 교육",appTagsEn:"Choir · Voice · Music",appImage:"/assets/brands/meeran-melody-logo.png?v=20260822-1",appColor:"#f8dce8",appUrl:"/#specialty-banners",appPromoTextKo:"노래·발성·호흡과 다양한 음악 활동으로<br>마음과 공동체를 잇는 힐링 프로그램입니다.<br>연락처 817-905-3468",appPromoTextEn:"A healing music program connecting hearts and community.<br>Contact 817-905-3468"}
];
