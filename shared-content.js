// App-only content data mirrored from the public website (index.html/script.js). The
// homepage does not load this file -- keep the remaining benefit/program promotions
// here in sync with their Production source by hand when either side changes. The 6
// Business Spotlight companies and the 6 events are NOT here anymore -- they live in
// shared/data/businesses.js and shared/data/events.js, the canonical sources both the
// website and this app read directly (see those files and businessToPromotion()/
// eventToAppModel() in app/app.js).
window.HARMONY_LINK_SHARED_CONTENT = {
  featuredPrograms: [
    {id:"hibelle-digital",emoji:"💻",ko:"하이벨 디지털",en:"Hibelle Digital",category:"디지털",tagsKo:"스마트폰 · AI · 컴퓨터 교육",tagsEn:"Smartphone · AI · Computer",color:"#dbeaff",image:"/assets/brands/hibelle-digital.png?v=20260822-1",url:"/#specialty-banners"},
    {id:"hibelle-english",emoji:"🌍",ko:"하이벨 화상영어",en:"Hibelle Online English",category:"언어",tagsKo:"1:1 맞춤 화상영어 · 전문 강사진",tagsEn:"Personalized 1:1 online English",color:"#ffe3cf",image:"/assets/brands/hibelle-online-english.png?v=20260822-1",url:"/#specialty-banners"},
    {id:"meeran-melody",emoji:"🎵",ko:"미란멜로디",en:"Meeran Melody",category:"음악",tagsKo:"합창 · 발성 · 음악 교육",tagsEn:"Choir · Voice · Music",color:"#f8dce8",image:"/assets/brands/meeran-melody-logo.png?v=20260822-1",url:"/#specialty-banners"}
  ],
  // The 6 events (Messiah, HOLE19, free-music-class, ai-business-automation,
  // one-day-class, finance-ai-seminar) used to be hardcoded here. They now live in
  // shared/data/events.js (the canonical source both the website and this app read),
  // and app/app.js builds this screen's cards from that file via eventToAppModel(),
  // so they are not duplicated in this file anymore. The inert future-seminars
  // placeholder that lived alongside them was never rendered on either the website
  // (always hidden) or the app (filtered out as a placeholder entry), so it was
  // removed along with them rather than kept as dead data.
  promotions: [
    {kind:"benefit",badgeKo:"기간 한정 혜택",badgeEn:"LIMITED BENEFIT",titleKo:"PREMIUM 파트너",titleEn:"PREMIUM Partners",textKo:"2026년 8월 31일까지 프리미엄 파트너로 접수하면<br>3개월 등록비 면제 혜택을 드립니다.",textEn:"Apply as a PREMIUM partner by August 31, 2026.<br>Receive a three-month registration fee waiver.",image:"/assets/harmony-logo.png",url:"/#community",actionKo:"함께하기",actionEn:"Join Us",endDate:"2026-08-31"},
    {kind:"program",badgeKo:"전문 수업 안내",badgeEn:"SPECIALTY PROGRAM",titleKo:"하이벨 디지털",titleEn:"Hibelle Digital",textKo:"AI와 스마트폰을 실생활에서<br>자신 있게 활용하도록 돕는 맞춤형 디지털 교육입니다.<br>연락처 929-603-0052",textEn:"Practical digital education for using AI and smartphones.<br>Contact 929-603-0052",image:"/assets/brands/hibelle-digital.png?v=20260822-1",url:"/#specialty-banners",actionKo:"수업 보기",actionEn:"View Program"},
    {kind:"program",badgeKo:"전문 수업 안내",badgeEn:"SPECIALTY PROGRAM",titleKo:"하이벨 화상영어",titleEn:"Hibelle Online English",textKo:"시간과 장소의 제약 없이 수준과 목표에 맞춰<br>진행하는 1:1 실용 화상 영어입니다.<br>연락처 929-603-0052",textEn:"Personalized one-to-one practical English lessons.<br>Contact 929-603-0052",image:"/assets/brands/hibelle-online-english.png?v=20260822-1",url:"/#specialty-banners",actionKo:"수업 보기",actionEn:"View Program"},
    {kind:"program",badgeKo:"전문 수업 안내",badgeEn:"SPECIALTY PROGRAM",titleKo:"미란멜로디",titleEn:"Meeran Melody",textKo:"노래·발성·호흡과 다양한 음악 활동으로<br>마음과 공동체를 잇는 힐링 프로그램입니다.<br>연락처 817-905-3468",textEn:"A healing music program connecting hearts and community.<br>Contact 817-905-3468",image:"/assets/brands/meeran-melody-logo.png?v=20260822-1",url:"/#specialty-banners",actionKo:"수업 보기",actionEn:"View Program"}
    // The 6 Business Spotlight companies used to be hardcoded here as separate
    // advertising/community entries. They now live in shared/data/businesses.js (the
    // canonical source both the website and this app read) and app/app.js builds their
    // promotion-shaped cards from that file via businessToPromotion(), so they are not
    // duplicated in this array anymore.
  ]
};
