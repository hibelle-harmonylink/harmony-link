// App-only content data mirrored from the public website (index.html/script.js). The
// homepage does not load this file -- keep event entries and the remaining benefit/
// program promotions here in sync with their Production source by hand when either
// side changes. The 6 Business Spotlight companies are NOT here anymore -- they live
// in shared/data/businesses.js, the canonical source both the website and this app
// read directly (see that file and businessToPromotion() in app/app.js).
window.HARMONY_LINK_SHARED_CONTENT = {
  featuredPrograms: [
    {id:"hibelle-digital",emoji:"💻",ko:"하이벨 디지털",en:"Hibelle Digital",category:"디지털",tagsKo:"스마트폰 · AI · 컴퓨터 교육",tagsEn:"Smartphone · AI · Computer",color:"#dbeaff",image:"/assets/brands/hibelle-digital.png?v=20260822-1",url:"/#specialty-banners"},
    {id:"hibelle-english",emoji:"🌍",ko:"하이벨 화상영어",en:"Hibelle Online English",category:"언어",tagsKo:"1:1 맞춤 화상영어 · 전문 강사진",tagsEn:"Personalized 1:1 online English",color:"#ffe3cf",image:"/assets/brands/hibelle-online-english.png?v=20260822-1",url:"/#specialty-banners"},
    {id:"meeran-melody",emoji:"🎵",ko:"미란멜로디",en:"Meeran Melody",category:"음악",tagsKo:"합창 · 발성 · 음악 교육",tagsEn:"Choir · Voice · Music",color:"#f8dce8",image:"/assets/brands/meeran-melody-logo.png?v=20260822-1",url:"/#specialty-banners"}
  ],
  events: [
    {id:"hole19-tournament",date:"2026-09-30",endDate:"2026-10-19",categoryKo:"지역 행사",categoryEn:"LOCAL EVENT",badgeKo:"지역 행사",badgeEn:"LOCAL EVENT",titleKo:"제1회 HOLE19배 팀대항 스크린골프 토너먼트",titleEn:"1st HOLE19 Team Screen Golf Tournament",textKo:"9월 30일 접수 마감, 10월 19일 예선 시작.<br>4인 1팀·32팀<br>선착순으로 접수합니다.<br>154-05 Northern Blvd, 2F, Flushing, NY 11354<br>문의 929-766-0088",textEn:"Registration closes Sep. 30; qualifying begins Oct. 19.<br>Four-player teams, limited to 32.<br>154-05 Northern Blvd, 2F, Flushing, NY 11354<br>Call 929-766-0088.",image:"/assets/events/hole19-screen-golf-tournament-20260930.png"},
    {id:"ai-business-automation",date:"2026-09-11",endDate:"2026-09-11",categoryKo:"AI · 비즈니스",categoryEn:"AI · Business",badgeKo:"AI · 비즈니스",badgeEn:"AI · Business",titleKo:"AI 업무자동화 무료 특강",titleEn:"Free AI Business Automation Workshop",textKo:"비즈니스 사업자를 위한 실전 AI 업무자동화 무료 특강<br>2026년 9월 11일 오후 10:00 (미국 동부)<br>진행 방식 Google Meet",textEn:"A practical AI workflow automation workshop for business owners.<br>September 11, 2026 · 10:00 PM ET<br>Format: Google Meet",image:"/assets/events/ai-business-automation-free-class-20260911.webp"},
    {id:"free-music-class",date:"2026-08-22",endDate:"2026-11-22",categoryKo:"무료 수업",categoryEn:"FREE CLASS",badgeKo:"무료 수업",badgeEn:"FREE CLASS",titleKo:"3개월 무료 음악 클래스",titleEn:"Three-Month Free Music Class",textKo:"매주 토요일 오전 10시, 할렐루야 교회에서 진행합니다.",textEn:"Every Saturday at 10 AM at Hallelujah Church.",image:"/assets/events/free-music-class-20260822.png"},
    {id:"one-day-class",date:"2026-08-01",endDate:"2026-08-01",badgeKo:"지난 무료 체험",badgeEn:"PAST FREE TRIAL",titleKo:"음악과 디지털 1일 체험 클래스",titleEn:"Music & Digital One-Day Experience",textKo:"2026년 8월 1일 진행된 무료 체험 클래스입니다.",textEn:"A free trial class held on August 1, 2026.",image:"/assets/events/one-day-class.jpg"},
    {id:"finance-ai-seminar",date:"2026-07-10",endDate:"2026-07-24",badgeKo:"지난 무료 세미나",badgeEn:"PAST FREE SEMINAR",badgeDark:true,titleKo:"재정과 AI의 협력, 더 나은 미래 설계",titleEn:"Finance and AI: Designing a Better Future",textKo:"2026년 7월에 진행된 무료 세미나입니다.",textEn:"A free seminar held in July 2026.",image:"/assets/events/finance-ai-seminar.jpg"},
    {id:"seminars-coming",date:"9999-12-31",endDate:"9999-12-31",categoryKo:"세미나·특강",categoryEn:"SEMINARS & TALKS",badgeKo:"세미나·특강",badgeEn:"SEMINARS & TALKS",titleKo:"새로운 세미나와 특별 강좌 소식을 준비하고 있습니다",titleEn:"New seminars and special classes are on the way",textKo:"일정이 확정되는 즉시 이곳과 앱에서<br>가장 먼저 안내해 드립니다.",textEn:"Confirmed dates will be announced here and<br>in the app first.",isPlaceholder:true}
  ],
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
