// Canonical HarmonyLink Program Categories data.
// This file is the single source of truth for the 12 "배움과 서비스" category
// cards (icon, Korean/English title, 운영중/준비중 status, and the link for the
// 5 "운영중" categories). It mirrors index.html's existing static
// #program-categories markup byte-for-byte -- that section stays static HTML,
// unchanged and untouched by this file, so there is zero risk to already-shipped
// Production markup. tests/career-app-ui-cleanup.test.js asserts the two stay in
// sync. The app's own "배움과 서비스" home section is the first real consumer of
// this canonical file, reusing the exact same 12 entries instead of a second,
// separately hardcoded copy.
window.HARMONY_LINK_CATEGORIES = [
  {id:"digital",titleKo:"디지털",titleEn:"Digital",icon:"💻",status:"available",url:"digital-classes/index.html"},
  {id:"language",titleKo:"언어",titleEn:"Language",icon:"🌍",status:"available",url:"online-english/index.html"},
  {id:"music",titleKo:"음악",titleEn:"Music",icon:"🎵",status:"available",url:"meeran-melody/index.html"},
  {id:"art",titleKo:"미술",titleEn:"Art",icon:"🎨",status:"preparing",url:null},
  {id:"health",titleKo:"건강",titleEn:"Health",icon:"🧘",status:"preparing",url:null},
  {id:"lifestyle",titleKo:"생활",titleEn:"Lifestyle",icon:"🍳",status:"preparing",url:null},
  {id:"family",titleKo:"가족",titleEn:"Family",icon:"👨‍👩‍👧",status:"preparing",url:null},
  {id:"finance",titleKo:"금융",titleEn:"Finance",icon:"💰",status:"preparing",url:null},
  {id:"culture",titleKo:"문화",titleEn:"Culture",icon:"🎭",status:"preparing",url:null},
  {id:"hobby",titleKo:"취미",titleEn:"Hobby",icon:"🧩",status:"preparing",url:null},
  {id:"career",titleKo:"직업",titleEn:"Career",icon:"💼",status:"available",url:"career.html"},
  {id:"admissions",titleKo:"진학",titleEn:"Admissions",icon:"🎓",status:"available",url:"us-admissions.html"}
];
