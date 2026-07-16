const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
const langButton = document.querySelector('.lang-toggle');
const toTop = document.querySelector('.to-top');
const requestFormUrl = 'https://docs.google.com/forms/d/1LfKkCnsfGLgsvs9ptLluwZkkGupY6iJYBzBbA7jMEK8/viewform';
const partnerFormUrl = 'https://docs.google.com/forms/d/14CqT8WtIl8Fj2h-M08tNpY0lsXh-GgsBNq5p2tnNjzk/viewform';
const digitalFormUrl = 'https://docs.google.com/forms/d/1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M/viewform';
const englishFormUrl = 'https://docs.google.com/forms/d/1kN5-d09smqU_UO9rUO91SdQqco7ABYDzWTgpv74EUsc/viewform';
let currentLanguage = localStorage.getItem('harmonyLanguage') || 'ko';

const digitalKicker = document.querySelector('.digital-why .digital-why-copy .eyebrow');
if (digitalKicker) {
  digitalKicker.dataset.ko = 'HIBELLE DIGITAL';
  digitalKicker.dataset.en = 'HIBELLE DIGITAL';
  digitalKicker.textContent = 'HIBELLE DIGITAL';
}

const choirApplyLabel = document.querySelector('.choir-request-btn span');
if (choirApplyLabel) {
  choirApplyLabel.dataset.ko = '합창 신청하기';
  choirApplyLabel.dataset.en = 'Apply for Choir';
  choirApplyLabel.textContent = '합창 신청하기';
}

const learningCategories = [
  {emoji:'💻', ko:'디지털 교육', en:'Digital Education', kicker:'DIGITAL', tags:[['스마트폰','Smartphone'],['AI 활용','AI'],['컴퓨터','Computer']]},
  {emoji:'🌍', ko:'언어 교육', en:'Language Education', kicker:'LANGUAGE', tags:[['영어','English'],['일본어','Japanese'],['생활 회화','Conversation']]},
  {emoji:'🎵', ko:'음악 교육', en:'Music Education', kicker:'MUSIC', tags:[['합창','Choir'],['발성','Voice'],['악기','Instruments']]},
  {emoji:'💃', ko:'댄스 교육', en:'Dance Education', kicker:'DANCE', tags:[['라인댄스','Line dance'],['생활 댄스','Social dance'],['리듬','Rhythm']]},
  {emoji:'💰', ko:'금융 교육', en:'Financial Education', kicker:'FINANCE', tags:[['재무 기초','Finance basics'],['세무','Tax'],['부동산','Real estate']]},
  {emoji:'🎨', ko:'미술·공예', en:'Art & Crafts', kicker:'ART & CRAFT', tags:[['미술','Art'],['캘리그라피','Calligraphy'],['공예','Crafts']]},
  {emoji:'🧘', ko:'건강·운동', en:'Health & Fitness', kicker:'WELLNESS', tags:[['요가','Yoga'],['필라테스','Pilates'],['스트레칭','Stretching']]},
  {emoji:'📚', ko:'문화·교양', en:'Culture & Enrichment', kicker:'CULTURE', tags:[['인문학','Humanities'],['독서','Reading'],['문화 이해','Culture']]},
  {emoji:'💬', ko:'상담·심리', en:'Counseling & Psychology', kicker:'COUNSELING', tags:[['마음 건강','Well-being'],['소통','Communication'],['관계','Relationships']]},
  {emoji:'🧠', ko:'치매예방·인지', en:'Cognitive Wellness', kicker:'COGNITIVE', tags:[['두뇌 건강','Brain health'],['인지 활동','Cognitive activity'],['웃음치료','Laughter']]},
  {emoji:'🗺️', ko:'여행·체험', en:'Travel & Experiences', kicker:'TRAVEL', tags:[['뉴욕 체험','New York'],['문화 탐방','Culture trips'],['맞춤 여행','Custom trips']]},
  {emoji:'💼', ko:'자격증·직업교육', en:'Career & Certification', kicker:'CAREER', tags:[['자격증','Certificates'],['취업','Employment'],['창업','Business']]}
];

const programGrid = document.querySelector('.program-grid');
if (programGrid) {
  programGrid.innerHTML = learningCategories.map((category, index) => `
    <article class="program-card category-card ${index > 2 ? 'coming-soon' : ''} reveal" role="button" tabindex="0" aria-label="${category.ko}이 필요한 이유 보기">
      <div class="program-art category-art" style="--category-hue:${205 + index * 17}"><span>${String(index + 1).padStart(2, '0')}</span><b>${category.emoji}</b></div>
      <div class="program-info"><p>${category.kicker}</p><h3 data-ko="${category.ko}" data-en="${category.en}">${category.ko}</h3><div class="tags">${category.tags.map(tag => `<span data-ko="${tag[0]}" data-en="${tag[1]}">${tag[0]}</span>`).join('')}</div></div>
    </article>`).join('');
}

const heroTopics = document.querySelector('.hero-topics');
if (heroTopics) {
  heroTopics.innerHTML = '';
}
const heroCenterNote=document.querySelector('.center-note');
if(heroCenterNote)heroCenterNote.innerHTML=`<div class="connection-visual" aria-hidden="true"><span>🎓</span><i>↔</i><span>👥</span></div><strong data-ko="교육과 사람을 잇다" data-en="Connecting Learning & People">교육과 사람을 잇다</strong><small>HARMONY LINK</small>`;

document.body.insertAdjacentHTML('beforeend', `
  <div class="digital-gallery-modal" id="digitalGallery" hidden role="dialog" aria-modal="true" aria-labelledby="digitalGalleryTitle">
    <div class="digital-gallery-backdrop" data-gallery-close></div>
    <div class="digital-gallery-panel">
      <div class="digital-gallery-head"><div><p>HIBELLE DIGITAL</p><h2 id="digitalGalleryTitle" data-ko="시니어 디지털 교육 프로그램" data-en="Senior Digital Education Program">시니어 디지털 교육 프로그램</h2></div><button type="button" class="gallery-close" data-gallery-close aria-label="닫기">×</button></div>
      <div class="gallery-stage"><button type="button" class="gallery-nav gallery-prev" aria-label="이전 자료">‹</button><div class="gallery-image-clip"><img src="assets/digital-program/slide-1.png" alt="디지털 교육안 1"></div><button type="button" class="gallery-nav gallery-next" aria-label="다음 자료">›</button></div>
      <div class="gallery-footer"><span class="gallery-counter">1 / 10</span><div class="gallery-thumbs">${Array.from({length:10}, (_, index) => `<button type="button" data-slide="${index}" aria-label="${index + 1}번 교육안"><img src="assets/digital-program/slide-${index + 1}.png" alt=""></button>`).join('')}</div></div>
    </div>
  </div>`);

const digitalGallery = document.getElementById('digitalGallery');
const galleryImage = digitalGallery.querySelector('.gallery-stage img');
const galleryCounter = digitalGallery.querySelector('.gallery-counter');
const galleryThumbs = [...digitalGallery.querySelectorAll('[data-slide]')];
let currentDigitalSlide = 0;

function showDigitalSlide(index) {
  currentDigitalSlide = (index + 10) % 10;
  galleryImage.src = `assets/digital-program/slide-${currentDigitalSlide + 1}.png`;
  galleryImage.alt = `디지털 교육안 ${currentDigitalSlide + 1}`;
  galleryCounter.textContent = `${currentDigitalSlide + 1} / 10`;
  galleryThumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('active', thumbIndex === currentDigitalSlide));
}

function openDigitalGallery() {
  digitalGallery.hidden = false;
  document.body.classList.add('modal-open');
  showDigitalSlide(0);
  digitalGallery.querySelector('.gallery-close').focus();
}

function closeDigitalGallery() {
  digitalGallery.hidden = true;
  document.body.classList.remove('modal-open');
}

digitalGallery.querySelector('.gallery-prev').addEventListener('click', () => showDigitalSlide(currentDigitalSlide - 1));
digitalGallery.querySelector('.gallery-next').addEventListener('click', () => showDigitalSlide(currentDigitalSlide + 1));
galleryThumbs.forEach(thumb => thumb.addEventListener('click', () => showDigitalSlide(Number(thumb.dataset.slide))));
digitalGallery.querySelectorAll('[data-gallery-close]').forEach(button => button.addEventListener('click', closeDigitalGallery));

const eventsSection = document.getElementById('events');
const contactSection = document.getElementById('contact');
if (eventsSection && contactSection) contactSection.before(eventsSection);
document.querySelectorAll('.instructors, .instructor-fields').forEach(section => section.remove());

const primaryNav = document.getElementById('primary-nav');
if (primaryNav) {
  primaryNav.querySelector('a[href="#membership"]:not(.nav-cta)')?.remove();
  const freeEventsLink = primaryNav.querySelector('a[href="#events"]');
  if (freeEventsLink) {
    const communityNavLink = document.createElement('a');
    communityNavLink.href = '#community';
    communityNavLink.dataset.ko = '함께하기';
    communityNavLink.dataset.en = 'Join Us';
    communityNavLink.textContent = '함께하기';
    freeEventsLink.before(communityNavLink);
    const storeNavLink = document.createElement('a');
    storeNavLink.href = '#digital-store';
    storeNavLink.dataset.ko = '디지털 스토어';
    storeNavLink.dataset.en = 'Digital Store';
    storeNavLink.textContent = '디지털 스토어';
    freeEventsLink.after(storeNavLink);
  }
}

const aboutSection = document.getElementById('about');
aboutSection?.insertAdjacentHTML('afterend', `
  <section class="intro-video section" id="intro-video">
    <div class="container intro-video-grid reveal">
      <div class="intro-video-copy"><p class="eyebrow">HARMONY LINK ON YOUTUBE</p><h2 data-ko="영상으로 만나는<br>Harmony Link" data-en="Meet Harmony Link<br>through video">영상으로 만나는<br>Harmony Link</h2><p data-ko="배움과 문화를 지역사회에 연결하는 Harmony Link의 비전과 이야기를 소개영상으로 만나보세요." data-en="Discover the vision and story of Harmony Link, connecting learning and culture with local communities.">배움과 문화를 지역사회에 연결하는 Harmony Link의 비전과 이야기를 소개영상으로 만나보세요.</p><a class="btn youtube-channel-btn" href="https://www.youtube.com/@hibelleconsulting" target="_blank" rel="noopener noreferrer"><span data-ko="하이벨컨설팅 유튜브 채널" data-en="Hibelle Consulting YouTube">하이벨컨설팅 유튜브 채널</span><b>↗</b></a></div>
      <a class="intro-video-frame video-watch-link" href="https://www.youtube.com/watch?v=7jo7Ovnq7Ew" target="_blank" rel="noopener noreferrer" aria-label="Harmony Link 소개영상 유튜브에서 보기"><img src="https://i.ytimg.com/vi/7jo7Ovnq7Ew/maxresdefault.jpg" alt="Harmony Link 소개영상 미리보기"><span class="video-play"><b>▶</b><em data-ko="소개영상 재생" data-en="Play introduction video">소개영상 재생</em></span></a>
    </div>
  </section>`);

const digitalStoreSection = document.createElement('section');
digitalStoreSection.className = 'digital-store section';
digitalStoreSection.id = 'digital-store';
digitalStoreSection.innerHTML = `<div class="container digital-store-wrap reveal"><div class="store-icon" aria-hidden="true">🎨</div><div><p class="eyebrow">HARMONY LINK DIGITAL STORE</p><h2 data-ko="배움에서 탄생한 작품을<br>새로운 가치로 연결합니다" data-en="Connecting creations from learning<br>with new value">배움에서 탄생한 작품을<br>새로운 가치로 연결합니다</h2><p data-ko="그림과 공예 작품, 디지털 창작물을 소개하고 판매하는 온라인 스토어를 준비하고 있습니다." data-en="An online store for artwork, crafts, and digital creations is coming soon.">그림과 공예 작품, 디지털 창작물을 소개하고 판매하는 온라인 스토어를 준비하고 있습니다.</p></div><span class="store-status" data-ko="오픈 준비 중" data-en="COMING SOON">오픈 준비 중</span></div>`;
const eventsForStore = document.getElementById('events');
if (eventsForStore) eventsForStore.after(digitalStoreSection);

function connectForm(link, url) {
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}

document.querySelectorAll('.request-form-link').forEach(link => connectForm(link, requestFormUrl));
document.querySelectorAll('.partner-form-link').forEach(link => connectForm(link, partnerFormUrl));
document.querySelectorAll('[data-program]').forEach(link => {
  const formUrl = link.dataset.program === '디지털 교육'
    ? digitalFormUrl
    : link.dataset.program === '언어 교육'
      ? englishFormUrl
      : requestFormUrl;
  connectForm(link, formUrl);
});
document.querySelectorAll('.digital-request-btn').forEach(link => connectForm(link, digitalFormUrl));

function closeMenu() {
  menuButton.classList.remove('open');
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  menuButton.classList.toggle('open', open);
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-ko][data-en]').forEach(element => {
    element.innerHTML = element.dataset[language];
  });
  document.querySelectorAll('[data-placeholder-ko]').forEach(element => {
    element.placeholder = element.dataset[`placeholder${language === 'ko' ? 'Ko' : 'En'}`];
  });
  langButton.querySelectorAll('span').forEach((item, index) => item.classList.toggle('active', (language === 'ko' && index === 0) || (language === 'en' && index === 1)));
  langButton.setAttribute('aria-label', language === 'ko' ? 'Switch to English' : '한국어로 전환');
  menuButton.setAttribute('aria-label', language === 'ko' ? '메뉴 열기' : 'Open menu');
  toTop.setAttribute('aria-label', language === 'ko' ? '맨 위로' : 'Back to top');
  document.title = language === 'ko' ? 'Harmony Link | 배움으로 이어지는 우리' : 'Harmony Link | Connected through learning';
  localStorage.setItem('harmonyLanguage', language);
}

langButton.addEventListener('click', () => setLanguage(currentLanguage === 'ko' ? 'en' : 'ko'));

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 30;
  header.classList.toggle('scrolled', scrolled);
  toTop.classList.toggle('show', window.scrollY > 500);
});

toTop.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelectorAll('[data-program]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.getElementById('program');
    if (!select) return;
    const wanted = link.dataset.program;
    const option = [...select.options].find(item => item.dataset.ko === wanted || item.textContent.trim() === wanted);
    if (option) select.value = option.value || option.textContent;
  });
});

document.querySelectorAll('[data-role]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.getElementById('role');
    if (!select) return;
    const option = [...select.options].find(item => item.dataset.ko === link.dataset.role || item.textContent.trim() === link.dataset.role);
    if (option) select.value = option.value || option.textContent;
  });
});

document.querySelectorAll('[data-membership]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.getElementById('membershipType');
    if (!select) return;
    const option = [...select.options].find(item => item.dataset.ko === link.dataset.membership || item.textContent.trim() === link.dataset.membership);
    if (option) select.value = option.value || option.textContent;
  });
});

const applyForm = document.getElementById('applyForm');
applyForm?.addEventListener('submit', event => {
  event.preventDefault();
  const status = event.currentTarget.querySelector('.form-status');
  status.textContent = currentLanguage === 'ko' ? '수업 의뢰 신청서를 새 창에서 열고 있습니다.' : 'Opening the class request form in a new tab.';
  window.open(requestFormUrl, '_blank', 'noopener,noreferrer');
});

const upgradeToggle = document.querySelector('.upgrade-toggle');
const paidPlans = document.getElementById('paidPlans');
upgradeToggle?.addEventListener('click', () => {
  const willOpen = paidPlans.hidden;
  paidPlans.hidden = !willOpen;
  upgradeToggle.setAttribute('aria-expanded', String(willOpen));
  upgradeToggle.querySelector('b').textContent = willOpen ? '−' : '＋';
  if (willOpen) paidPlans.scrollIntoView({behavior: 'smooth', block: 'nearest'});
});

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.innerHTML = `
    <div class="signup-form-cta">
      <span class="signup-form-icon" aria-hidden="true">✓</span>
      <h3 data-ko="무료회원 가입 신청서를 작성해 주세요" data-en="Complete the free membership form">무료회원 가입 신청서를 작성해 주세요</h3>
      <p data-ko="이름, 연락처, 이메일과 거주지역을 입력하면 가입 신청이 접수됩니다." data-en="Enter your name, phone, email, and location to submit your membership application.">이름, 연락처, 이메일과 거주지역을 입력하면 가입 신청이 접수됩니다.</p>
      <a class="btn btn-primary signup-submit" href="https://forms.gle/zDCqwkvT9ZdjrEXN6" target="_blank" rel="noopener noreferrer"><span data-ko="무료회원 가입 신청서 작성" data-en="Complete Free Membership Form">무료회원 가입 신청서 작성</span><b>↗</b></a>
      <small data-ko="신청서는 새 탭에서 열립니다." data-en="The form opens in a new tab.">신청서는 새 탭에서 열립니다.</small>
    </div>`;
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
  if (event.key === 'Escape' && !digitalGallery.hidden) closeDigitalGallery();
});

setLanguage(currentLanguage);

// Partner pricing stays behind the comparison control so the page remains calm.
const membershipPricingAnchor = document.querySelector('#membership .upgrade-prompt');
document.querySelector('.partner-price-summary')?.remove();

const promotionModal = document.createElement('div');
promotionModal.className = 'promotion-modal';
promotionModal.hidden = true;
promotionModal.innerHTML = `<div class="promotion-backdrop" data-promotion-close></div><section class="promotion-panel" role="dialog" aria-modal="true" aria-labelledby="promotionTitle"><button class="promotion-close" type="button" data-promotion-close aria-label="닫기">×</button><span class="promotion-badge" data-ko="8월 한정 혜택" data-en="AUGUST SPECIAL">8월 한정 혜택</span><p class="promotion-eyebrow">HARMONY LINK PARTNER</p><h2 id="promotionTitle" data-ko="PREMIUM 회원<br>3개월 등록비 면제" data-en="PREMIUM Partners<br>3 Months Registration Fee Waived">PREMIUM 회원<br>3개월 등록비 면제</h2><p data-ko="2026년 8월 31일까지 프리미엄 회원으로 접수한 입점 강사·교육업체에게 3개월 등록비 면제 혜택을 드립니다." data-en="Partner instructors and education providers who apply for PREMIUM membership by August 31, 2026 receive a three-month registration fee waiver.">2026년 8월 31일까지 프리미엄 회원으로 접수한 입점 강사·교육업체에게 3개월 등록비 면제 혜택을 드립니다.</p><div class="promotion-prices"><span><b>BASIC</b><strong>$20</strong><small data-ko="/ 월" data-en="/ month">/ 월</small></span><span class="featured"><b>PREMIUM</b><strong>$50</strong><small data-ko="/ 월" data-en="/ month">/ 월</small></span></div><button class="btn promotion-action" type="button"><span data-ko="멤버십 혜택 확인하기" data-en="View Membership Benefits">멤버십 혜택 확인하기</span><b>→</b></button><small class="promotion-deadline" data-ko="접수 마감 · 2026년 8월 31일" data-en="Application deadline · August 31, 2026">접수 마감 · 2026년 8월 31일</small></section>`;
document.body.appendChild(promotionModal);
const closePromotion = () => {
  promotionModal.hidden = true;
  document.body.classList.remove('modal-open');
};
promotionModal.querySelectorAll('[data-promotion-close]').forEach(item => item.addEventListener('click', closePromotion));
promotionModal.querySelector('.promotion-action').addEventListener('click', () => {
  closePromotion();
  if (paidPlans) paidPlans.hidden = false;
  if (upgradeToggle) upgradeToggle.setAttribute('aria-expanded', 'true');
  document.getElementById('membership')?.scrollIntoView({behavior:'smooth'});
});
// Show the limited-time promotion again on every page load through August 31, 2026.
const promotionDeadline = new Date('2026-09-01T00:00:00-04:00');
if (new Date() < promotionDeadline) {
  window.setTimeout(() => {
    promotionModal.hidden = false;
    document.body.classList.add('modal-open');
  }, 450);
}
setLanguage(currentLanguage);

const specialtyPrograms = [
  {id:'digital',titleKo:'하이벨 디지털',titleEn:'Hibelle Digital',image:'assets/specialty/hibelle-digital.jpg',teacherImage:'assets/teachers/noh-hyekyung.png',teacherKo:'노혜경',teacherEn:'Hyekyung Noh',teacherRoleKo:'디지털 교육 대표 강사',teacherRoleEn:'Lead Digital Instructor',form:'https://docs.google.com/forms/d/1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M/viewform',tone:'blue'},
  {id:'english',titleKo:'하이벨 화상영어',titleEn:'Hibelle Online English',image:'assets/specialty/hibelle-online-english.jpg',teacherImage:'assets/teachers/rachel.png',teacherKo:'하이벨 화상영어 강사진',teacherEn:'Hibelle Online English Team',teacherRoleKo:'1:1 화상영어 전문 강사',teacherRoleEn:'1:1 Online English Instructors',form:'https://docs.google.com/forms/d/1kN5-d09smqU_UO9rUO91SdQqco7ABYDzWTgpv74EUsc/viewform',tone:'orange'},
  {id:'melody',titleKo:'미란멜로디 합창',titleEn:'Meeran Melody Choir',image:'assets/specialty/meeran-melody.jpg',teacherImage:'assets/teachers/kim-miran.jpg',teacherKo:'김미란',teacherEn:'Miran Kim',teacherRoleKo:'합창·음악 교육 대표 강사',teacherRoleEn:'Lead Choir & Music Instructor',form:null,tone:'pink'}
];

const oldSpecialtyStart = document.getElementById('digital-why');
if (oldSpecialtyStart) {
  const specialtySection = document.createElement('section');
  specialtySection.className = 'specialty-banners section';
  specialtySection.id = 'specialty-banners';
  specialtySection.innerHTML = `<div class="container"><div class="section-heading centered reveal"><p class="eyebrow">PREMIUM SPECIALTY PROGRAMS</p><h2 data-ko="전문 교육 프로그램" data-en="Specialty Programs">전문 교육 프로그램</h2><p data-ko="유료회원과 전문 파트너의 프로그램을 소개하는 프리미엄 배너 공간입니다. 신청하기를 누르면 상세 전단지와 신청서를 확인할 수 있습니다." data-en="A premium banner space featuring paid-member and partner programs. Select Apply to view details and the application form.">유료회원과 전문 파트너의 프로그램을 소개하는 프리미엄 배너 공간입니다. 신청하기를 누르면 상세 전단지와 신청서를 확인할 수 있습니다.</p></div><div class="specialty-banner-grid">${specialtyPrograms.map((program,index)=>`<article class="specialty-banner-card ${program.tone} reveal delay-${Math.min(index,2)}"><div class="specialty-poster-preview"><img src="${program.image}" alt="${program.titleKo} 프로그램 전단지"></div><div class="specialty-banner-info"><span data-ko="유료회원 추천 프로그램" data-en="PREMIUM MEMBER PROGRAM">유료회원 추천 프로그램</span><h3 data-ko="${program.titleKo}" data-en="${program.titleEn}">${program.titleKo}</h3><button type="button" class="btn specialty-open" data-specialty="${program.id}"><span data-ko="신청하기" data-en="View & Apply">신청하기</span><b>↗</b></button></div></article>`).join('')}</div></div>`;
  oldSpecialtyStart.before(specialtySection);
  specialtySection.querySelectorAll('.reveal').forEach(item=>item.classList.add('visible'));
  document.querySelectorAll('#digital-why, .english-feature, .choir-feature').forEach(section=>section.remove());
  document.querySelectorAll('a[href="#digital-why"]').forEach(link=>{link.href='#specialty-banners';});

  const specialtyModal = document.createElement('div');
  specialtyModal.className = 'specialty-modal';
  specialtyModal.hidden = true;
  specialtyModal.innerHTML = `<div class="specialty-modal-backdrop" data-specialty-close></div><div class="specialty-modal-panel" role="dialog" aria-modal="true" aria-labelledby="specialtyModalTitle"><div class="specialty-modal-head"><div><p>PREMIUM SPECIALTY PROGRAM</p><h2 id="specialtyModalTitle"></h2></div><button type="button" class="specialty-close" data-specialty-close aria-label="닫기">×</button></div><div class="specialty-teacher"><img src="" alt=""><div><span data-ko="대표 강사" data-en="FEATURED INSTRUCTOR">대표 강사</span><h3></h3><p></p></div></div><div class="specialty-modal-scroll"><img class="specialty-modal-image" src="" alt=""></div><div class="specialty-modal-actions"><p data-ko="강사와 프로그램 전단지를 확인한 후 신청해 주세요." data-en="Review the instructor and program flyer, then apply.">강사와 프로그램 전단지를 확인한 후 신청해 주세요.</p><div><a class="btn btn-primary specialty-form-link" href="#" target="_blank" rel="noopener noreferrer"><span data-ko="신청서 작성" data-en="Complete Application">신청서 작성</span><b>↗</b></a></div></div></div>`;
  document.body.append(specialtyModal);
  const closeSpecialtyModal=()=>{specialtyModal.hidden=true;document.body.classList.remove('modal-open');};
  specialtySection.querySelectorAll('[data-specialty]').forEach(button=>button.addEventListener('click',()=>{
    const program=specialtyPrograms.find(item=>item.id===button.dataset.specialty);if(!program)return;
    specialtyModal.querySelector('#specialtyModalTitle').textContent=currentLanguage==='en'?program.titleEn:program.titleKo;
    const modalImage=specialtyModal.querySelector('.specialty-modal-image');modalImage.src=program.image;modalImage.alt=`${program.titleKo} 프로그램 전단지`;
    const teacher=specialtyModal.querySelector('.specialty-teacher');
    teacher.hidden=program.id==='english';
    const englishTeachers=specialtyModal.querySelector('.english-teachers');
    if(englishTeachers){
      englishTeachers.hidden=program.id!=='english';
      if(program.id==='english') specialtyModal.querySelector('.specialty-modal-head').after(englishTeachers);
    }
    teacher.querySelector('img').src=program.teacherImage;teacher.querySelector('img').alt=`${program.teacherKo} 강사`;
    teacher.querySelector('h3').textContent=currentLanguage==='en'?program.teacherEn:program.teacherKo;
    teacher.querySelector('p').textContent=currentLanguage==='en'?program.teacherRoleEn:program.teacherRoleKo;
    const formLink=specialtyModal.querySelector('.specialty-form-link');
    specialtyModal.querySelector('.specialty-modal-scroll').hidden=false;
    formLink.hidden=false;
    formLink.href=program.form||'#';
    formLink.setAttribute('aria-disabled',String(!program.form));
    formLink.querySelector('span').textContent=program.form?(currentLanguage==='en'?'Complete Application':'신청서 작성'):(currentLanguage==='en'?'Application Coming Soon':'신청서 작성 (준비 중)');
    specialtyModal.querySelector('.specialty-modal-actions p').textContent=program.form
      ? (currentLanguage==='ko'?'아래 버튼에서 신청서를 작성해 주세요.':'Use the button below to complete the application.')
      : (currentLanguage==='ko'?'합창 신청서 버튼을 준비했습니다. 신청서 주소가 완성되면 연결됩니다.':'The choir application button is ready and will be connected when the form is available.');
    specialtyModal.hidden=false;document.body.classList.add('modal-open');
  }));
  specialtySection.querySelectorAll('.specialty-banner-card').forEach(card=>{
    card.setAttribute('role','button');card.tabIndex=0;
    card.addEventListener('click',event=>{if(!event.target.closest('.specialty-open'))card.querySelector('.specialty-open').click();});
    card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.querySelector('.specialty-open').click();}});
  });
  specialtyModal.querySelectorAll('[data-specialty-close]').forEach(button=>button.addEventListener('click',closeSpecialtyModal));
  specialtyModal.querySelector('.specialty-form-link').addEventListener('click',event=>{if(event.currentTarget.getAttribute('aria-disabled')==='true')event.preventDefault();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!specialtyModal.hidden)closeSpecialtyModal();});
  setLanguage(currentLanguage);
}

// Final page flow and content refinements.
const communitySection=document.getElementById('community');
if(communitySection){
  const communityHeading=communitySection.querySelector('.section-heading h2');
  if(communityHeading){communityHeading.dataset.ko='함께하기';communityHeading.dataset.en='Join Harmony Link';communityHeading.textContent=currentLanguage==='ko'?'함께하기':'Join Harmony Link';}
  const communityCopy=communitySection.querySelector('.section-heading>p:last-child');
  if(communityCopy){communityCopy.dataset.ko='입점 파트너와 교육 수강자가 각자의 목적에 맞는 신청 공간으로 바로 연결됩니다.';communityCopy.dataset.en='Partner providers and learners can go directly to the application that fits their needs.';communityCopy.textContent=currentLanguage==='ko'?communityCopy.dataset.ko:communityCopy.dataset.en;}
}
document.querySelector('.apply')?.remove();
document.querySelector('.hero-actions .request-form-link')?.remove();
document.querySelector('.hero-actions .btn-explore')?.classList.add('btn-primary');
const serviceArea=document.querySelector('.service-note span');
if(serviceArea){serviceArea.dataset.ko='뉴욕시 · 롱아일랜드 · 웨체스터 · 뉴저지';serviceArea.dataset.en='New York City · Long Island · Westchester · New Jersey';serviceArea.textContent=currentLanguage==='ko'?serviceArea.dataset.ko:serviceArea.dataset.en;}
const aboutCopy=document.querySelector('.about-copy');
aboutCopy?.classList.add('about-copy-card');
aboutCopy?.querySelector('p')?.remove();
const contactWrap=document.querySelector('.contact-wrap');
contactWrap?.insertAdjacentHTML('afterbegin','<div class="contact-illustration" aria-hidden="true"><span>✉</span><i></i><b></b><em>♥</em></div>');
const eventGrid=document.querySelector('.event-grid');
if(eventGrid){
  eventGrid.insertAdjacentHTML('beforeend','<article class="event-card event-coming reveal"><div class="event-coming-icon">＋</div><span class="event-badge" data-ko="준비 중" data-en="COMING SOON">준비 중</span><h3 data-ko="새로운 무료강좌를 준비하고 있습니다" data-en="A new free class is coming soon">새로운 무료강좌를 준비하고 있습니다</h3><p data-ko="디지털·언어·음악을 비롯한 새로운 체험 강좌가 곧 공개됩니다." data-en="New trial classes in digital learning, language, music, and more will be announced soon.">디지털·언어·음악을 비롯한 새로운 체험 강좌가 곧 공개됩니다.</p></article>');
  eventGrid.querySelectorAll('.reveal').forEach(item=>item.classList.add('visible'));
}
setLanguage(currentLanguage);

// 2026-07-15: scalable program directory, teachers, memberships, events, and ad spaces.
const serviceExpansion = document.querySelector('.service-note em');
if (serviceExpansion) {
  serviceExpansion.dataset.ko = '향후 미동부 지역 및 온라인 서비스로 확장 예정';
  serviceExpansion.dataset.en = 'Expansion to the U.S. East Coast and online services is planned';
  serviceExpansion.textContent = currentLanguage === 'ko' ? serviceExpansion.dataset.ko : serviceExpansion.dataset.en;
}

const specialtyScroll = document.querySelector('.specialty-modal-scroll');
if (specialtyScroll) {
  specialtyScroll.insertAdjacentHTML('afterbegin', `<section class="english-teachers" hidden>
    <p class="eyebrow">HIBELLE ONLINE ENGLISH TEACHERS</p>
    <h3 data-ko="함께 수업하는 영어 강사" data-en="Meet Our English Teachers">함께 수업하는 영어 강사</h3>
    <p data-ko="수강자가 강사를 선택하는 방식이 아닌, 수업 목표와 일정에 맞춰 배정되는 강사진입니다." data-en="Teachers are assigned according to learning goals and schedules rather than selected by learners.">수강자가 강사를 선택하는 방식이 아닌, 수업 목표와 일정에 맞춰 배정되는 강사진입니다.</p>
    <div class="teacher-grid">
      <figure><img src="assets/teachers/nicky.png" alt="영어 강사 니키"><figcaption>니키 <small>Nikki</small></figcaption></figure>
      <figure><img src="assets/teachers/rachel.png" alt="영어 강사 레이셀"><figcaption>레이셀 <small>Reshel</small></figcaption></figure>
      <figure><img src="assets/teachers/ara.png" alt="영어 강사 아라"><figcaption>아라 <small>Ara</small></figcaption></figure>
    </div>
  </section>`);
}

// Approved partners are registered here once and automatically appear in the matching category room.
const registeredPartners = [
  {category:0,name:'하이벨 디지털',type:'스마트폰·AI·컴퓨터 교육',status:'직영',featured:true,logo:'assets/brands/hibelle-digital.jpg'},
  {category:1,name:'하이벨 화상영어',type:'1:1 맞춤 화상영어',status:'직영',featured:true,logo:'assets/brands/hibelle-online-english.jpg'},
  {category:2,name:'미란멜로디',type:'합창·발성·음악 교육',status:'공동 운영',featured:true,logo:'assets/brands/meeran-melody.jpg'}
];
const categoryResources = {
  0: {titleKo:'디지털 교육 프로그램 자료',titleEn:'Digital Education Resources',descriptionKo:'스마트폰, AI, 컴퓨터 교육 PPT 10장을 확인할 수 있습니다.',descriptionEn:'View 10 presentation slides for smartphone, AI, and computer learning.',action:'gallery'},
  1: {titleKo:'언어 교육 프로그램',titleEn:'Language Program',descriptionKo:'영어·일본어·생활 회화 프로그램 자료가 등록되는 공간입니다.',descriptionEn:'Resources for English, Japanese, and practical conversation appear here.'},
  2: {titleKo:'음악 교육 프로그램',titleEn:'Music Program',descriptionKo:'합창·발성·악기 프로그램 자료가 등록되는 공간입니다.',descriptionEn:'Resources for choir, voice, and instruments appear here.'}
};
const providerDirectoryModal = document.createElement('div');
providerDirectoryModal.className = 'directory-modal category-room-modal';
providerDirectoryModal.hidden = true;
providerDirectoryModal.innerHTML = `<div class="directory-backdrop" data-directory-close></div><div class="directory-panel" role="dialog" aria-modal="true" aria-labelledby="directoryTitle"><div class="directory-head"><div><p>HARMONY LINK CATEGORY ROOM</p><h2 id="directoryTitle"></h2><small class="room-subtitle"></small></div><button type="button" data-directory-close aria-label="닫기">×</button></div><section class="room-resource" hidden></section><div class="room-section-title"><div><span data-ko="APPROVED PARTNERS" data-en="APPROVED PARTNERS">APPROVED PARTNERS</span><h3 data-ko="입점 파트너·강사" data-en="Partner Providers & Instructors">입점 파트너·강사</h3></div><b class="room-partner-count"></b></div><div class="directory-list"></div><div class="directory-foot"><p data-ko="심사가 완료된 새 업체와 강사는 등록 후 해당 카테고리 방에 자동으로 추가됩니다." data-en="New approved providers and instructors are automatically added to the matching category room.">심사가 완료된 새 업체와 강사는 등록 후 해당 카테고리 방에 자동으로 추가됩니다.</p><a href="${partnerFormUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><span data-ko="파트너 등록 신청" data-en="Apply as a Partner">파트너 등록 신청</span><b>↗</b></a></div></div>`;
document.body.appendChild(providerDirectoryModal);
const categoryCards = [...document.querySelectorAll('.program-grid .category-card')];
const categoryReasons = [
  ['디지털 자립','예약·결제·정보 검색이 온라인으로 이동한 일상에서 스스로 안전하게 생활하는 힘을 기릅니다.'],
  ['더 넓은 소통','새로운 언어는 가족, 이웃, 여행지에서 자신 있게 관계를 이어가는 문을 열어줍니다.'],
  ['정서와 연결','노래와 악기 활동은 마음을 편안하게 하고 다른 사람과 자연스럽게 어울리게 합니다.'],
  ['즐거운 활력','리듬에 맞춰 움직이며 균형감각과 체력을 기르고 일상에 활기를 더합니다.'],
  ['현명한 선택','재정·세무·부동산의 기본을 이해해 생활 속 중요한 결정을 더 안전하게 내립니다.'],
  ['표현과 성취','손으로 만들고 표현하는 과정에서 집중력과 자신감, 창작의 기쁨을 발견합니다.'],
  ['건강한 일상','꾸준한 움직임으로 유연성과 근력을 지키고 더 독립적인 생활을 준비합니다.'],
  ['깊이 있는 삶','인문·독서·문화 활동으로 세상을 보는 시야를 넓히고 풍요로운 대화를 만듭니다.'],
  ['마음 돌봄','감정을 이해하고 건강하게 소통하는 방법을 배워 자신과 관계를 함께 돌봅니다.'],
  ['두뇌 건강','즐거운 인지 활동으로 기억력과 집중력을 자극하고 활기찬 생활 습관을 만듭니다.'],
  ['새로운 경험','낯선 장소와 문화를 경험하며 일상에 설렘을 더하고 새로운 관계를 만듭니다.'],
  ['다음 기회','실용적인 기술과 자격을 준비해 취업·창업과 새로운 역할에 도전할 힘을 얻습니다.']
];
const categoryPurposes = [
  '디지털 기기를 두려움 없이 사용하고 일상의 필요한 일을 스스로 해결하는 것이 목표입니다.',
  '실생활에서 바로 쓰는 표현을 익혀 자신 있게 대화하고 관계의 폭을 넓히는 것이 목표입니다.',
  '호흡·발성·악기 활동을 통해 정서적 안정과 함께하는 즐거움을 키우는 것이 목표입니다.',
  '안전하고 즐거운 움직임을 습관으로 만들어 균형감각과 생활 체력을 높이는 것이 목표입니다.',
  '생활에 필요한 금융 지식을 이해하고 내 상황에 맞는 현명한 결정을 내리는 것이 목표입니다.',
  '다양한 재료와 표현 방법을 경험하며 창의성과 성취감을 키우는 것이 목표입니다.',
  '내 몸에 맞는 운동을 익혀 유연성·근력·독립적인 생활 능력을 지키는 것이 목표입니다.',
  '인문·독서·문화 활동을 통해 생각을 깊게 하고 의미 있는 대화를 이어가는 것이 목표입니다.',
  '감정을 이해하고 건강하게 표현하며 관계 속 갈등을 지혜롭게 다루는 것이 목표입니다.',
  '반복적이고 즐거운 두뇌 활동으로 기억력과 집중력을 꾸준히 자극하는 것이 목표입니다.',
  '안전한 문화 체험을 통해 새로운 환경에 대한 자신감과 삶의 활력을 얻는 것이 목표입니다.',
  '실용 역량과 자격을 갖춰 새로운 일과 사회적 역할에 도전하는 것이 목표입니다.'
];
const reasonModal = document.createElement('div');
reasonModal.className = 'reason-modal';
reasonModal.hidden = true;
reasonModal.innerHTML = `<div class="reason-backdrop" data-reason-close></div><div class="reason-panel" role="dialog" aria-modal="true" aria-labelledby="reasonTitle"><button type="button" class="reason-close" data-reason-close aria-label="닫기">×</button><header class="reason-heading"><span class="reason-emoji"></span><div><p>LEARNING GUIDE</p><h2 id="reasonTitle"></h2></div><strong class="reason-lead"></strong></header><div class="reason-summary"><section><span data-ko="배움의 이유" data-en="WHY IT MATTERS">배움의 이유</span><p class="reason-copy"></p></section><section><span data-ko="배움의 목적" data-en="LEARNING GOAL">배움의 목적</span><p class="reason-purpose"></p></section></div><div class="reason-partners"><div><span data-ko="RELATED PARTNERS" data-en="RELATED PARTNERS">RELATED PARTNERS</span><h3 data-ko="관련 업체·강사" data-en="Providers & Instructors">관련 업체·강사</h3></div><div class="reason-partner-list"></div></div></div>`;
document.body.appendChild(reasonModal);
let activeReasonCategory = 0;
function closeReasonModal(){reasonModal.hidden=true;document.body.classList.remove('modal-open');}
function openReasonModal(index){
  activeReasonCategory=index;
  const category=learningCategories[index];
  const reason=categoryReasons[index];
  reasonModal.querySelector('.reason-emoji').textContent=category.emoji;
  reasonModal.querySelector('#reasonTitle').textContent=currentLanguage==='en'?category.en:category.ko;
  reasonModal.querySelector('.reason-lead').textContent=reason[0];
  reasonModal.querySelector('.reason-copy').textContent=reason[1];
  reasonModal.querySelector('.reason-purpose').textContent=categoryPurposes[index];
  const partners=registeredPartners.filter(partner=>partner.category===index);
  reasonModal.querySelector('.reason-partner-list').innerHTML=partners.length?partners.map(partner=>`<article>${partner.logo?`<img src="${partner.logo}" alt="${partner.name} 로고">`:`<b>${partner.name.charAt(0)}</b>`}<div><strong>${partner.name}</strong><small>${partner.type}</small></div><span>${partner.status}</span></article>`).join(''):`<article class="reason-partner-empty"><b>＋</b><div><strong data-ko="입점 파트너 모집 중" data-en="Partners wanted">입점 파트너 모집 중</strong><small data-ko="검증된 업체와 강사가 등록되면 이곳에 표시됩니다." data-en="Approved providers will appear here.">검증된 업체와 강사가 등록되면 이곳에 표시됩니다.</small></div></article>`;
  reasonModal.hidden=false;document.body.classList.add('modal-open');
  setLanguage(currentLanguage);
}
reasonModal.querySelectorAll('[data-reason-close]').forEach(item=>item.addEventListener('click',closeReasonModal));
function openCategoryRoom(index) {
  const category = learningCategories[index];
  const providers = registeredPartners.filter(partner => partner.category === index);
  const resource = categoryResources[index];
  providerDirectoryModal.querySelector('#directoryTitle').textContent = currentLanguage === 'en' ? category.en : category.ko;
  providerDirectoryModal.querySelector('.room-subtitle').textContent = currentLanguage === 'en' ? `${category.kicker} partner room` : `${category.ko} 전용 파트너 방`;
  providerDirectoryModal.querySelector('.room-partner-count').textContent = currentLanguage === 'en' ? `${providers.length} listed` : `${providers.length}곳 등록`;
  const resourceArea = providerDirectoryModal.querySelector('.room-resource');
  resourceArea.hidden = !resource;
  resourceArea.innerHTML = resource ? `<div class="room-resource-icon">${index === 0 ? 'PPT' : category.emoji}</div><div><span data-ko="PROGRAM RESOURCES" data-en="PROGRAM RESOURCES">PROGRAM RESOURCES</span><h3>${currentLanguage === 'en' ? resource.titleEn : resource.titleKo}</h3><p>${currentLanguage === 'en' ? resource.descriptionEn : resource.descriptionKo}</p></div>${resource.action === 'gallery' ? `<button type="button" class="btn btn-primary room-gallery-open"><span data-ko="PPT 자료 보기" data-en="View Slides">${currentLanguage === 'en' ? 'View Slides' : 'PPT 자료 보기'}</span><b>→</b></button>` : '<span class="room-resource-status" data-ko="자료 등록 예정" data-en="Resources coming soon">자료 등록 예정</span>'}` : '';
  resourceArea.querySelector('.room-gallery-open')?.addEventListener('click', () => { closeDirectory(); openDigitalGallery(); });
  providerDirectoryModal.querySelector('.directory-list').innerHTML = providers.length
    ? providers.map(provider => `<article class="partner-profile ${provider.featured ? 'featured' : ''}"><span>${provider.status}</span><div class="partner-avatar">${provider.name.charAt(0)}</div><h3>${provider.name}</h3><p>${provider.type}</p><small data-ko="프로필·프로그램 준비 중" data-en="Profile and programs coming soon">프로필·프로그램 준비 중</small></article>`).join('')
    : `<div class="directory-empty"><b>＋</b><h3 data-ko="첫 입점 파트너를 기다립니다" data-en="Be the first partner here">첫 입점 파트너를 기다립니다</h3><p data-ko="검증된 업체와 강사가 등록되는 순서대로 이 방에 소개됩니다." data-en="Approved providers and instructors will appear here as they join.">검증된 업체와 강사가 등록되는 순서대로 이 방에 소개됩니다.</p><a href="${partnerFormUrl}" target="_blank" rel="noopener noreferrer" data-ko="이 카테고리에 등록 신청 ↗" data-en="Apply for this category ↗">이 카테고리에 등록 신청 ↗</a></div>`;
  providerDirectoryModal.hidden = false;
  document.body.classList.add('modal-open');
  setLanguage(currentLanguage);
}
categoryCards.forEach((card,index) => {
  card.insertAdjacentHTML('beforeend', `<div class="category-action-guide"><button type="button" class="category-primary-action"><span><small data-ko="교육 카테고리" data-en="EDUCATION CATEGORY">교육 카테고리</small><strong data-ko="둘러보기" data-en="Explore">둘러보기</strong></span><b>→</b></button></div>`);
  card.addEventListener('click', () => openReasonModal(index));
  card.addEventListener('keydown', event => {if((event.key === 'Enter' || event.key === ' ') && event.target === card){event.preventDefault();openReasonModal(index);}});
});
const closeDirectory = () => {providerDirectoryModal.hidden = true;document.body.classList.remove('modal-open');};
providerDirectoryModal.querySelectorAll('[data-directory-close]').forEach(item => item.addEventListener('click', closeDirectory));

const membershipSection = document.getElementById('membership');
if (membershipSection) {
  const heading = membershipSection.querySelector('.section-heading h2');
  const headingCopy = membershipSection.querySelector('.section-heading>p:last-child');
  if (heading) {heading.dataset.ko='수강자 플랫폼 이용은 무료, 파트너는 성장 단계에 맞게';heading.dataset.en='Free platform access for learners, growth plans for partners';}
  if (headingCopy) {headingCopy.dataset.ko='수강자는 플랫폼 가입비와 이용 회비가 없습니다. 개별 수업료는 무료가 아니며 해당 강사·교육업체와 직접 상담해 결정합니다.';headingCopy.dataset.en='Learners pay no platform joining or membership fee. Class tuition is separate and is determined directly with each instructor or education provider.';}
  const promptTitle = membershipSection.querySelector('.upgrade-prompt span');
  const promptCopy = membershipSection.querySelector('.upgrade-prompt strong');
  const promptButton = membershipSection.querySelector('.upgrade-toggle span');
  if(promptTitle){promptTitle.dataset.ko='강사·교육업체 입점 파트너 요금제';promptTitle.dataset.en='Plans for instructor and education partners';}
  if(promptCopy){promptCopy.dataset.ko='수강자는 플랫폼 이용 회비가 없습니다. 파트너만 홍보와 운영 지원 범위에 따라 선택합니다.';promptCopy.dataset.en='Learners pay no platform membership fee. Partners choose based on promotion and operational support.';}
  if(promptButton){promptButton.dataset.ko='파트너 요금제 비교';promptButton.dataset.en='Compare Partner Plans';}
  const plans = membershipSection.querySelectorAll('.paid-plan');
  if(plans[0]) plans[0].innerHTML = `<span data-ko="BASIC 파트너" data-en="BASIC PARTNER">BASIC 파트너</span><h3><b>$20</b><small data-ko="/ 월" data-en="/ month">/ 월</small></h3><ul><li data-ko="업체·강사 기본 프로필 등록" data-en="Basic provider profile listing">업체·강사 기본 프로필 등록</li><li data-ko="관련 교육 카테고리에 노출" data-en="Listing in relevant education categories">관련 교육 카테고리에 노출</li><li data-ko="기관·수강 의뢰 매칭 안내" data-en="Organization and learner inquiry matching">기관·수강 의뢰 매칭 안내</li><li data-ko="프로그램 정보 월 1회 수정" data-en="One program information update per month">프로그램 정보 월 1회 수정</li><li data-ko="기본 심사 및 운영 상담" data-en="Standard review and support">기본 심사 및 운영 상담</li></ul><a href="#contact" class="btn btn-outline"><span data-ko="BASIC 입점 상담" data-en="Ask about BASIC">BASIC 입점 상담</span><b>→</b></a>`;
  if(plans[1]) plans[1].innerHTML = `<span data-ko="PREMIUM 파트너" data-en="PREMIUM PARTNER">PREMIUM 파트너</span><h3><b>$50</b><small data-ko="/ 월" data-en="/ month">/ 월</small></h3><ul><li data-ko="BASIC 파트너의 모든 혜택" data-en="Everything in BASIC">BASIC 파트너의 모든 혜택</li><li data-ko="하이벨의 홍보 전단·배너 디자인 지원" data-en="Promotional flyer and banner design by Hibelle">하이벨의 홍보 전단·배너 디자인 지원</li><li data-ko="전문교육 섹션 프리미엄 배너 노출" data-en="Premium specialty-section placement">전문교육 섹션 프리미엄 배너 노출</li><li data-ko="입점·프로그램 심사 우선 처리" data-en="Priority provider and program review">입점·프로그램 심사 우선 처리</li><li data-ko="디지털 스토어 판매 수수료 할인" data-en="Reduced digital-store commission">디지털 스토어 판매 수수료 할인</li><li data-ko="메인·카테고리 추천 영역 우선 노출" data-en="Priority featured placement">메인·카테고리 추천 영역 우선 노출</li></ul><a href="#contact" class="btn btn-primary"><span data-ko="PREMIUM 입점 상담" data-en="Ask about PREMIUM">PREMIUM 입점 상담</span><b>→</b></a>`;
  membershipSection.insertAdjacentHTML('beforeend', `<div class="container member-portal-preview reveal visible"><div><p class="eyebrow">MEMBER COMMUNITY</p><h3 data-ko="회원 로그인과 커뮤니티 공간" data-en="Member Login & Community">회원 로그인과 커뮤니티 공간</h3><p data-ko="로그인 후 희망 프로그램을 남기고 공지와 게시판을 이용하는 회원 공간을 준비하고 있습니다. 안전한 계정 시스템 연결 후 오픈됩니다." data-en="A secure member area for program requests, notices, and community boards is being prepared.">로그인 후 희망 프로그램을 남기고 공지와 게시판을 이용하는 회원 공간을 준비하고 있습니다. 안전한 계정 시스템 연결 후 오픈됩니다.</p></div><button type="button" disabled><span data-ko="로그인·게시판 준비 중" data-en="Login & Board Coming Soon">로그인·게시판 준비 중</span></button></div>`);
  membershipSection.querySelector('.signup-layout')?.insertAdjacentHTML('afterend', `<aside class="learner-fee-notice"><b data-ko="꼭 확인해 주세요" data-en="PLEASE NOTE">꼭 확인해 주세요</b><p data-ko="무료인 것은 Harmony Link 플랫폼의 가입과 이용입니다. 프로그램별 수업료는 강사 또는 교육업체가 수강자와 직접 상담한 후 결정합니다. Harmony Link는 강사를 직접 고용·파견하는 교육기관이 아니라, 검토된 파트너와 수강자·기관을 연결하고 프로그램 정보를 안내하는 플랫폼입니다." data-en="Free access applies only to joining and using the Harmony Link platform. Tuition is discussed and determined directly between the learner and the instructor or education provider. Harmony Link does not employ or dispatch instructors; it is a platform that connects reviewed partners with learners and organizations and provides program information.">무료인 것은 Harmony Link 플랫폼의 가입과 이용입니다. 프로그램별 수업료는 강사 또는 교육업체가 수강자와 직접 상담한 후 결정합니다. Harmony Link는 강사를 직접 고용·파견하는 교육기관이 아니라, 검토된 파트너와 수강자·기관을 연결하고 프로그램 정보를 안내하는 플랫폼입니다.</p></aside>`);
}

const learnerCard = document.querySelector('.audience-card.learner');
if (learnerCard) learnerCard.insertAdjacentHTML('beforeend', `<p class="matching-disclaimer" data-ko="※ Harmony Link는 강사를 직접 파견하지 않습니다. 수업 조건과 수업료는 연결된 강사·교육업체와 직접 협의합니다." data-en="Harmony Link does not dispatch instructors. Class terms and tuition are arranged directly with the connected instructor or provider.">※ Harmony Link는 강사를 직접 파견하지 않습니다. 수업 조건과 수업료는 연결된 강사·교육업체와 직접 협의합니다.</p>`);

const currentEventGrid = document.querySelector('.event-grid');
if (currentEventGrid) {
  const originalEventCards = [...currentEventGrid.querySelectorAll('.event-card:not(.event-coming)')];
  const originalComingCard = currentEventGrid.querySelector('.event-coming');
  currentEventGrid.classList.add('event-type-layout');
  currentEventGrid.innerHTML = `<section class="event-type-block seminar-type"><div class="event-type-head"><span>01</span><div><p data-ko="무료 세미나" data-en="FREE SEMINARS">무료 세미나</p><small data-ko="지식과 정보를 나누는 무료 교육" data-en="Free educational seminars">지식과 정보를 나누는 무료 교육</small></div></div><div class="event-type-grid seminar-grid"></div></section><section class="event-type-block trial-type"><div class="event-type-head"><span>02</span><div><p data-ko="무료 체험" data-en="FREE TRIAL CLASSES">무료 체험</p><small data-ko="처음 경험하는 분을 위한 체험 수업" data-en="Trial sessions for first-time learners">처음 경험하는 분을 위한 체험 수업</small></div></div><div class="event-type-grid trial-grid"></div></section><section class="event-type-block paid-type"><div class="event-type-head"><span>03</span><div><p data-ko="유료 1회 수업" data-en="PAID ONE-TIME CLASSES">유료 1회 수업</p><small data-ko="정규과정 부담 없이 참여하는 단회 수업" data-en="Single paid sessions without a full-course commitment">정규과정 부담 없이 참여하는 단회 수업</small></div></div><div class="event-type-grid paid-grid"></div></section>`;
  if(originalEventCards[0]) currentEventGrid.querySelector('.seminar-grid').appendChild(originalEventCards[0]);
  if(originalEventCards[1]) currentEventGrid.querySelector('.trial-grid').appendChild(originalEventCards[1]);
  if(originalComingCard){
    originalComingCard.querySelector('.event-badge').dataset.ko='유료 수업 준비 중';
    originalComingCard.querySelector('.event-badge').dataset.en='PAID CLASS COMING SOON';
    originalComingCard.querySelector('h3').dataset.ko='새로운 유료 1회 수업을 준비하고 있습니다';
    originalComingCard.querySelector('h3').dataset.en='A new paid one-time class is coming soon';
    originalComingCard.querySelector('p').dataset.ko='관심 있는 수업을 한 번만 부담 없이 경험할 수 있는 단회 프로그램이 공개됩니다.';
    originalComingCard.querySelector('p').dataset.en='Try a topic in a single paid session without committing to a regular course.';
    currentEventGrid.querySelector('.paid-grid').appendChild(originalComingCard);
  }
  const datedCards = currentEventGrid.querySelectorAll('.event-card:not(.event-coming)');
  const endDates = ['2026-07-24','2026-08-01'];
  datedCards.forEach((card,index) => card.dataset.eventEnd = endDates[index]);
  currentEventGrid.insertAdjacentHTML('afterend', `<section class="past-events"><div class="past-events-head"><div><p class="eyebrow">PAST EVENTS</p><h3 data-ko="지난 무료강좌" data-en="Past Free Events">지난 무료강좌</h3></div><button class="past-events-toggle" type="button" aria-expanded="false"><span data-ko="지난 강좌 보기" data-en="View Past Events">지난 강좌 보기</span><b>＋</b></button></div><div class="past-event-grid" hidden></div><p class="past-events-empty" data-ko="아직 지난 강좌가 없습니다." data-en="There are no past events yet.">아직 지난 강좌가 없습니다.</p></section>`);
  const pastSection = currentEventGrid.nextElementSibling;
  const pastGrid = pastSection.querySelector('.past-event-grid');
  const today = new Date();
  datedCards.forEach(card => {
    if (today > new Date(`${card.dataset.eventEnd}T23:59:59`)) pastGrid.appendChild(card);
  });
  pastSection.querySelector('.past-events-empty').hidden = pastGrid.children.length > 0;
  const toggle = pastSection.querySelector('.past-events-toggle');
  toggle.addEventListener('click', () => {
    const open = pastGrid.hidden;
    pastGrid.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('b').textContent = open ? '−' : '＋';
  });
}

const contactSectionForAds = document.getElementById('contact');
if (contactSectionForAds) {
  contactSectionForAds.insertAdjacentHTML('beforebegin', `<section class="advertising section" id="advertising"><div class="container"><div class="section-heading centered reveal visible"><p class="eyebrow">COMMUNITY PARTNERS</p><h2 data-ko="지역 업체 광고·제휴 공간" data-en="Local Business Advertising">지역 업체 광고·제휴 공간</h2><p data-ko="지역사회와 함께 성장할 광고 파트너를 위한 배너 자리입니다." data-en="Banner placements for local partners growing with our community.">지역사회와 함께 성장할 광고 파트너를 위한 배너 자리입니다.</p></div><div class="ad-grid"><a href="#contact"><span>AD 01</span><b data-ko="프리미엄 광고 배너" data-en="Premium Ad Banner">프리미엄 광고 배너</b><small data-ko="광고 문의" data-en="Advertising inquiry">광고 문의</small></a><a href="https://aaleac.org/" target="_blank" rel="noopener noreferrer"><span>PARTNER</span><b data-ko="지역 협력 업체" data-en="Community Partner">지역 협력 업체</b><small>AALEAC ↗</small></a><a href="#contact"><span>AD 03</span><b data-ko="문화·교육 제휴" data-en="Culture & Education Partner">문화·교육 제휴</b><small data-ko="제휴 문의" data-en="Partnership inquiry">제휴 문의</small></a></div></div></section>`);
}
setLanguage(currentLanguage);

// Keep membership visible: learners join free, while partner providers may select BASIC or PREMIUM.
const activeMembershipSection = document.getElementById('membership');
if (activeMembershipSection) activeMembershipSection.hidden = false;
const volunteerAnchor=document.getElementById('events');
if(volunteerAnchor){
  volunteerAnchor.insertAdjacentHTML('beforebegin', `<section class="volunteer section" id="volunteer"><div class="container volunteer-shell"><div class="volunteer-intro reveal visible"><p class="eyebrow">COMMUNITY VOLUNTEERS</p><h2 data-ko="배움과 마음을 나누는 무료 봉사" data-en="Share Your Time and Talents">배움과 마음을 나누는 무료 봉사</h2><p data-ko="지역사회에 따뜻한 연결이 필요한 곳에서 자신의 시간과 재능을 나눠주세요. 작은 참여도 누군가의 새로운 시작이 됩니다." data-en="Share your time and talents where our community needs connection. Every contribution can become someone's new beginning.">지역사회에 따뜻한 연결이 필요한 곳에서 자신의 시간과 재능을 나눠주세요. 작은 참여도 누군가의 새로운 시작이 됩니다.</p><a href="#contact" class="btn btn-primary"><span data-ko="봉사 참여 문의" data-en="Volunteer With Us">봉사 참여 문의</span><b>→</b></a></div><div class="volunteer-grid"><article><span>01</span><b>🤝</b><h3 data-ko="수업 진행 도움" data-en="Class Support">수업 진행 도움</h3><p data-ko="참여자 안내, 준비와 현장 진행을 함께합니다." data-en="Help welcome participants and support class activities.">참여자 안내, 준비와 현장 진행을 함께합니다.</p></article><article><span>02</span><b>💻</b><h3 data-ko="디지털 도움" data-en="Digital Support">디지털 도움</h3><p data-ko="스마트폰과 온라인 이용이 어려운 이웃을 돕습니다." data-en="Help neighbors with smartphones and online services.">스마트폰과 온라인 이용이 어려운 이웃을 돕습니다.</p></article><article><span>03</span><b>🎨</b><h3 data-ko="재능 나눔" data-en="Share a Talent">재능 나눔</h3><p data-ko="음악·미술·언어 등 나만의 재능을 나눕니다." data-en="Share your skills in music, art, languages, and more.">음악·미술·언어 등 나만의 재능을 나눕니다.</p></article></div></div></section>`);
  const volunteerSection=document.getElementById('volunteer');
  volunteerSection.querySelector('.volunteer-grid article')?.remove();
  volunteerSection.querySelector('.volunteer-intro h2').dataset.ko='마음을 잇는 무료 봉사';
  volunteerSection.querySelector('.volunteer-intro h2').textContent=currentLanguage==='en'?'Community Volunteer Support':'마음을 잇는 무료 봉사';
  const oldVolunteerButton=volunteerSection.querySelector('.volunteer-intro .btn');
  oldVolunteerButton.outerHTML=`<div class="volunteer-actions"><button type="button" class="btn btn-primary contact-form-open" data-inquiry="봉사하고 싶어요"><span data-ko="봉사하고 싶어요" data-en="I Want to Volunteer">봉사하고 싶어요</span><b>→</b></button><button type="button" class="btn btn-outline contact-form-open" data-inquiry="도움이 필요해요"><span data-ko="도움이 필요해요" data-en="I Need Volunteer Help">도움이 필요해요</span><b>→</b></button></div>`;
}
const refreshedContact=document.querySelector('.contact-wrap');
if(refreshedContact){
  refreshedContact.innerHTML=`<div class="contact-main"><div><p class="eyebrow">LET'S CONNECT</p><h2 data-ko="문의 및 상담" data-en="Contact & Consultation">문의 및 상담</h2><p data-ko="교육 신청, 입점, 봉사와 제휴 중 필요한 내용을 알려주시면 알맞은 담당자가 안내해 드립니다." data-en="Tell us whether you need learning, partnership, volunteering, or collaboration support and the right person will respond.">교육 신청, 입점, 봉사와 제휴 중 필요한 내용을 알려주시면 알맞은 담당자가 안내해 드립니다.</p></div></div><div class="contact-choices"><a class="contact-primary" href="mailto:hibelle@hibelleconsulting.com"><span data-ko="이메일 문의" data-en="EMAIL US">이메일 문의</span><strong>hibelle@hibelleconsulting.com</strong><b>↗</b></a><div class="contact-call"><span data-ko="전화 상담 · 번호를 누르면 바로 연결됩니다" data-en="CALL US · TAP A NUMBER">전화 상담 · 번호를 누르면 바로 연결됩니다</span><a href="tel:+19296030052"><small data-ko="미국" data-en="USA">미국</small><strong>+1 929-603-0052</strong></a><i></i><a href="tel:+821097730052"><small data-ko="한국" data-en="KOREA">한국</small><strong>+82 10-9773-0052</strong></a></div></div>`;
}
const inquiryModal=document.createElement('div');
inquiryModal.className='inquiry-modal';
inquiryModal.hidden=true;
inquiryModal.innerHTML=`<div class="inquiry-backdrop" data-inquiry-close></div><div class="inquiry-panel" role="dialog" aria-modal="true" aria-labelledby="inquiryTitle"><div class="inquiry-head"><div><p>CONTACT HARMONY LINK</p><h2 id="inquiryTitle" data-ko="문의사항을 남겨주세요" data-en="Send Us Your Inquiry">문의사항을 남겨주세요</h2></div><button type="button" data-inquiry-close aria-label="닫기">×</button></div><form id="inquiryForm"><input type="hidden" name="문의 유형" id="inquiryType" value="일반 문의"><input type="hidden" name="_subject" value="Harmony Link 홈페이지 새 문의"><input type="hidden" name="_captcha" value="false"><div class="inquiry-row"><label><span data-ko="이름 *" data-en="Name *">이름 *</span><input name="이름" required autocomplete="name"></label><label><span data-ko="연락처 *" data-en="Phone *">연락처 *</span><input name="연락처" type="tel" required autocomplete="tel"></label></div><label><span data-ko="이메일 *" data-en="Email *">이메일 *</span><input name="email" type="email" required autocomplete="email"></label><label><span data-ko="문의사항 *" data-en="Message *">문의사항 *</span><textarea name="문의사항" rows="6" required></textarea></label><label class="inquiry-consent"><input type="checkbox" required><span data-ko="답변을 위해 입력한 개인정보를 전달하는 데 동의합니다." data-en="I agree to submit my information for a response.">답변을 위해 입력한 개인정보를 전달하는 데 동의합니다.</span></label><button type="submit" class="btn btn-primary inquiry-submit"><span data-ko="문의 보내기" data-en="Send Inquiry">문의 보내기</span><b>→</b></button><p class="inquiry-status" role="status"></p></form></div>`;
document.body.appendChild(inquiryModal);
const closeInquiryModal=()=>{inquiryModal.hidden=true;document.body.classList.remove('modal-open');};
const openInquiryModal=(type='일반 문의')=>{
  inquiryModal.querySelector('#inquiryType').value=type;
  const title=inquiryModal.querySelector('#inquiryTitle');
  const titleKo=(type==='봉사하고 싶어요'||type==='도움이 필요해요')?type:'문의사항을 남겨주세요';
  const titleEn=type==='봉사하고 싶어요'?'I Want to Volunteer':type==='도움이 필요해요'?'I Need Volunteer Help':'Send Us Your Inquiry';
  title.dataset.ko=titleKo;title.dataset.en=titleEn;title.textContent=currentLanguage==='en'?titleEn:titleKo;
  inquiryModal.hidden=false;document.body.classList.add('modal-open');inquiryModal.querySelector('input[name="이름"]').focus();
};
document.querySelectorAll('.contact-form-open').forEach(button=>button.addEventListener('click',()=>openInquiryModal(button.dataset.inquiry)));
const footerInquiryLink=[...document.querySelectorAll('footer a')].find(link=>link.dataset.ko==='문의하기');
if(footerInquiryLink){footerInquiryLink.href='#contact';footerInquiryLink.addEventListener('click',event=>{event.preventDefault();openInquiryModal('홈페이지 하단 문의');});}
inquiryModal.querySelectorAll('[data-inquiry-close]').forEach(item=>item.addEventListener('click',closeInquiryModal));
inquiryModal.querySelector('#inquiryForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;const status=form.querySelector('.inquiry-status');const submit=form.querySelector('.inquiry-submit');
  status.textContent=currentLanguage==='en'?'Sending...':'보내는 중입니다...';submit.disabled=true;
  try{
    const response=await fetch('https://formsubmit.co/ajax/hibelle@hibelleconsulting.com',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)});
    if(!response.ok)throw new Error('submit failed');
    status.textContent=currentLanguage==='en'?'Your inquiry has been sent.':'문의가 전송되었습니다. 확인 후 연락드리겠습니다.';form.reset();
  }catch(error){status.textContent=currentLanguage==='en'?'Delivery failed. Please email hibelle@hibelleconsulting.com.':'전송에 실패했습니다. hibelle@hibelleconsulting.com으로 이메일을 보내주세요.';}
  finally{submit.disabled=false;}
});
setLanguage(currentLanguage);

// Partner recruitment flyer: show the program details before opening the application form.
const partnerModal = document.createElement('div');
partnerModal.className = 'partner-modal';
partnerModal.hidden = true;
partnerModal.setAttribute('role', 'dialog');
partnerModal.setAttribute('aria-modal', 'true');
partnerModal.setAttribute('aria-labelledby', 'partnerModalTitle');
partnerModal.innerHTML = `
  <div class="partner-modal-backdrop" data-partner-close></div>
  <div class="partner-modal-panel">
    <div class="partner-modal-head">
      <div>
        <p>HARMONY LINK PARTNER</p>
        <h2 id="partnerModalTitle" data-ko="입점 파트너 모집 안내" data-en="Partner Recruitment">입점 파트너 모집 안내</h2>
      </div>
      <button class="partner-modal-close" type="button" data-partner-close aria-label="닫기">×</button>
    </div>
    <div class="partner-modal-scroll">
      <img src="assets/partners/partner-recruitment.png" alt="하모니링크 입점 파트너 모집 전단지">
    </div>
    <div class="partner-modal-actions">
      <p data-ko="모집 내용을 확인하신 후 신청서를 작성해 주세요." data-en="Review the details, then complete the application form.">모집 내용을 확인하신 후 신청서를 작성해 주세요.</p>
      <a class="btn btn-primary" href="${partnerFormUrl}" target="_blank" rel="noopener noreferrer"><span data-ko="신청서 작성" data-en="Complete Application">신청서 작성</span><b>↗</b></a>
    </div>
  </div>`;
document.body.appendChild(partnerModal);

const openPartnerModal = event => {
  event?.preventDefault();
  partnerModal.hidden = false;
  document.body.classList.add('modal-open');
  partnerModal.querySelector('.partner-modal-close')?.focus();
};
const closePartnerModal = () => {
  partnerModal.hidden = true;
  document.body.classList.remove('modal-open');
};
document.querySelectorAll('.partner-form-link').forEach(link => link.addEventListener('click', openPartnerModal));
partnerModal.querySelectorAll('[data-partner-close]').forEach(button => button.addEventListener('click', closePartnerModal));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !partnerModal.hidden) closePartnerModal();
});
setLanguage(currentLanguage);

// Temporary locked Partner Center. Replace with server-side authentication when member login launches.
const partnerCenterHash = 'ace475ae6f4ad97d067897a8829f408df9d17b6308bddd6edefcafac50e460a4';
const contactNavLink = document.querySelector('#primary-nav a[href="#contact"]');
if (contactNavLink) {
  const partnerCenterNav = document.createElement('a');
  partnerCenterNav.href = '#partner-center';
  partnerCenterNav.dataset.ko = '파트너센터 🔒';
  partnerCenterNav.dataset.en = 'Partner Center 🔒';
  partnerCenterNav.textContent = currentLanguage === 'ko' ? partnerCenterNav.dataset.ko : partnerCenterNav.dataset.en;
  contactNavLink.before(partnerCenterNav);
}

const partnerCenter = document.createElement('section');
partnerCenter.className = 'partner-center section';
partnerCenter.id = 'partner-center';
partnerCenter.innerHTML = `<div class="container partner-center-shell"><div class="partner-center-copy"><p class="eyebrow">PARTNER CENTER</p><span class="partner-lock" aria-hidden="true">🔒</span><h2 data-ko="입점 파트너 전용 자료실" data-en="Partner Resource Center">입점 파트너 전용 자료실</h2><p data-ko="HarmonyLink 입점 강사와 교육업체를 위한 운영 정책 및 파트너 자료를 제공합니다." data-en="Policies and resources for approved HarmonyLink instructors and education providers.">HarmonyLink 입점 강사와 교육업체를 위한 운영 정책 및 파트너 자료를 제공합니다.</p><div class="partner-security-note"><b data-ko="파트너 전용" data-en="PARTNERS ONLY">파트너 전용</b><span data-ko="승인된 입점 파트너에게 전달된 접근코드를 입력해 주세요." data-en="Enter the access code provided to approved partners.">승인된 입점 파트너에게 전달된 접근코드를 입력해 주세요.</span></div></div><div class="partner-access-card"><form id="partnerAccessForm"><label for="partnerAccessCode" data-ko="파트너 접근코드" data-en="Partner Access Code">파트너 접근코드</label><div><input id="partnerAccessCode" type="password" autocomplete="current-password" required data-placeholder-ko="접근코드를 입력하세요" data-placeholder-en="Enter access code" placeholder="접근코드를 입력하세요"><button class="btn btn-primary" type="submit"><span data-ko="잠금 해제" data-en="Unlock">잠금 해제</span><b>→</b></button></div><p class="partner-access-status" role="status"></p></form><div class="partner-downloads" hidden><span class="unlocked-badge" data-ko="접근 승인됨" data-en="ACCESS GRANTED">접근 승인됨</span><article><div><b>DOCX</b></div><section><h3 data-ko="입점 파트너 플랫폼 이용 및 운영 정책" data-en="Partner Platform Use & Operations Policy">입점 파트너 플랫폼 이용 및 운영 정책</h3><p>Version 1.0 · Hibelle Consulting Inc.</p><small data-ko="멤버십, 15% 이용수수료, 수업 절차와 운영 원칙" data-en="Memberships, 15% platform fee, class process, and operating principles">멤버십, 15% 이용수수료, 수업 절차와 운영 원칙</small></section><a class="btn btn-primary" href="downloads/HarmonyLink_Partner_Policy_v1.0.docx" download><span data-ko="문서 다운로드" data-en="Download Policy">문서 다운로드</span><b>↓</b></a></article><p class="partner-download-warning" data-ko="이 자료는 입점 파트너 전용입니다. 외부 공유 및 무단 배포를 금지합니다." data-en="This resource is for approved partners only. External sharing or unauthorized distribution is prohibited.">이 자료는 입점 파트너 전용입니다. 외부 공유 및 무단 배포를 금지합니다.</p></div></div></div>`;
const partnerSecurityCopy=partnerCenter.querySelector('.partner-security-note span');
partnerSecurityCopy.dataset.ko='입점 신청 후 이메일로 받은 접근코드를 입력해 주세요.';
partnerSecurityCopy.dataset.en='Enter the access code sent to you by email after applying.';
partnerSecurityCopy.textContent=currentLanguage==='en'?partnerSecurityCopy.dataset.en:partnerSecurityCopy.dataset.ko;
const advertisingSection = document.getElementById('advertising');
const contactForPartnerCenter = document.getElementById('contact');
(advertisingSection || contactForPartnerCenter)?.before(partnerCenter);

const accessForm = partnerCenter.querySelector('#partnerAccessForm');
const downloads = partnerCenter.querySelector('.partner-downloads');
const unlockPartnerCenter = () => {
  accessForm.hidden = true;
  downloads.hidden = false;
  sessionStorage.setItem('harmonyPartnerAccess', 'granted');
};
if (sessionStorage.getItem('harmonyPartnerAccess') === 'granted') unlockPartnerCenter();
accessForm.addEventListener('submit', async event => {
  event.preventDefault();
  const status = accessForm.querySelector('.partner-access-status');
  const code = accessForm.querySelector('input').value.trim();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2,'0')).join('');
  if (hash === partnerCenterHash) {
    status.textContent = '';
    unlockPartnerCenter();
  } else {
    status.textContent = currentLanguage === 'ko' ? '접근코드가 올바르지 않습니다.' : 'The access code is incorrect.';
    accessForm.querySelector('input').select();
  }
});

// Membership presentation: free signup first, partner prices only in the comparison panel.
const partnerMembershipSection = document.getElementById('membership');
if (partnerMembershipSection) {
  const eyebrow = partnerMembershipSection.querySelector('.section-heading .eyebrow');
  const heading = partnerMembershipSection.querySelector('.section-heading h2');
  const copy = partnerMembershipSection.querySelector('.section-heading > p:last-child');
  if (eyebrow) eyebrow.textContent = 'FREE SIGNUP · PARTNER MEMBERSHIP';
  if (heading) {
    heading.dataset.ko = '무료 가입과 파트너 멤버십';
    heading.dataset.en = 'Free Signup & Partner Memberships';
    heading.textContent = currentLanguage === 'en' ? heading.dataset.en : heading.dataset.ko;
  }
  if (copy) {
    copy.dataset.ko = '수강자는 무료로 가입하고, 강사와 교육업체의 요금은 요금제 비교를 눌렀을 때만 확인할 수 있습니다.';
    copy.dataset.en = 'Learners join free. Partner pricing is shown only when Compare Plans is selected.';
    copy.textContent = currentLanguage === 'en' ? copy.dataset.en : copy.dataset.ko;
  }
  const priceIntro = partnerMembershipSection.querySelector('.price-summary-intro small');
  if (priceIntro) {
    priceIntro.dataset.ko = '입점 강사와 교육업체를 위한 파트너 전용 요금제입니다.';
    priceIntro.dataset.en = 'Plans exclusively for partner instructors and education providers.';
    priceIntro.textContent = currentLanguage === 'en' ? priceIntro.dataset.en : priceIntro.dataset.ko;
  }
  const signupLayout=partnerMembershipSection.querySelector('.signup-layout');
  if(signupLayout){
    signupLayout.insertAdjacentHTML('afterend',`<div class="member-benefit-grid"><article><b>01</b><span data-ko="자동 회원 등록" data-en="AUTOMATIC SIGNUP">자동 회원 등록</span><p data-ko="입점 파트너 또는 교육 신청 정보로 회원 등록을 준비합니다." data-en="Partner or class applications can start membership registration.">입점 파트너 또는 교육 신청 정보로 회원 등록을 준비합니다.</p></article><article><b>02</b><span data-ko="간편 본인 확인" data-en="SIMPLE VERIFICATION">간편 본인 확인</span><p data-ko="이메일 또는 문자 인증으로 안전하게 본인을 확인합니다." data-en="Verify securely by email or text message.">이메일 또는 문자 인증으로 안전하게 본인을 확인합니다.</p></article><article><b>03</b><span data-ko="회원 소식과 혜택" data-en="MEMBER UPDATES">회원 소식과 혜택</span><p data-ko="새 프로그램과 무료 강좌 소식을 편리하게 확인합니다." data-en="Receive new program and free-event updates.">새 프로그램과 무료 강좌 소식을 편리하게 확인합니다.</p></article></div>`);
    signupLayout.remove();
  }
  partnerMembershipSection.querySelector('.learner-fee-notice')?.remove();
  partnerMembershipSection.querySelector('.member-portal-preview')?.remove();
}
const finalContactHeading=document.querySelector('.contact-main h2');
if(finalContactHeading){finalContactHeading.dataset.ko='문의 및 상담';finalContactHeading.dataset.en='Contact & Consultation';finalContactHeading.textContent=currentLanguage==='en'?finalContactHeading.dataset.en:finalContactHeading.dataset.ko;}
setLanguage(currentLanguage);
