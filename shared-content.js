// App-only content data mirrored from the public website (index.html/script.js). The
// homepage does not load this file -- keep the remaining benefit promotion here in
// sync with its Production source by hand if it changes. The 6 Business Spotlight
// companies, the 6 events, and the 3 named specialty programs are NOT here anymore --
// they live in shared/data/businesses.js, shared/data/events.js, and
// shared/data/programs.js, the canonical sources both the website and this app read
// directly (see those files and businessToPromotion()/eventToAppModel()/
// programToAppModel()/programToPromotion() in app/app.js).
window.HARMONY_LINK_SHARED_CONTENT = {
  promotions: [
    {kind:"benefit",badgeKo:"기간 한정 혜택",badgeEn:"LIMITED BENEFIT",titleKo:"PREMIUM 파트너",titleEn:"PREMIUM Partners",textKo:"2026년 8월 31일까지 프리미엄 파트너로 접수하면<br>3개월 등록비 면제 혜택을 드립니다.",textEn:"Apply as a PREMIUM partner by August 31, 2026.<br>Receive a three-month registration fee waiver.",image:"/assets/harmony-logo.png",url:"/#community",actionKo:"함께하기",actionEn:"Join Us",endDate:"2026-08-31"}
    // The 3 named specialty programs and the 6 Business Spotlight companies used to be
    // hardcoded here as separate promotions. They now live in shared/data/programs.js
    // and shared/data/businesses.js (the canonical sources both the website and this
    // app read) and app/app.js builds their promotion-shaped cards from those files
    // via programToPromotion()/businessToPromotion(), so they are not duplicated here.
  ]
};
