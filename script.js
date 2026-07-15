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
    <article class="program-card category-card ${index === 0 ? 'digital-gallery-card' : ''} ${index > 2 ? 'coming-soon' : ''} reveal" ${index === 0 ? 'role="button" tabindex="0" aria-label="디지털 교육안 보기"' : ''}>
      <div class="program-art category-art" style="--category-hue:${205 + index * 17}"><span>${String(index + 1).padStart(2, '0')}</span><b>${category.emoji}</b></div>
      <div class="program-info"><p>${category.kicker}</p><h3 data-ko="${category.ko}" data-en="${category.en}">${category.ko}</h3><div class="tags">${category.tags.map(tag => `<span data-ko="${tag[0]}" data-en="${tag[1]}">${tag[0]}</span>`).join('')}</div></div>
    </article>`).join('');
}

const heroTopics = document.querySelector('.hero-topics');
if (heroTopics) {
  heroTopics.innerHTML = learningCategories.map((category, index) => `<span style="--i:${index}">${category.emoji} <b data-ko="${category.ko}" data-en="${category.en}">${category.ko}</b></span>`).join('');
}

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

const digitalGalleryCard = document.querySelector('.digital-gallery-card');
digitalGalleryCard?.addEventListener('click', openDigitalGallery);
digitalGalleryCard?.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDigitalGallery(); }
});
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

const specialtyPrograms = [
  {id:'digital',titleKo:'하이벨 디지털',titleEn:'Hibelle Digital',image:'assets/specialty/hibelle-digital.jpg',form:'https://docs.google.com/forms/d/1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M/viewform',tone:'blue'},
  {id:'english',titleKo:'하이벨 화상영어',titleEn:'Hibelle Online English',image:'assets/specialty/hibelle-online-english.jpg',form:'https://docs.google.com/forms/d/1kN5-d09smqU_UO9rUO91SdQqco7ABYDzWTgpv74EUsc/viewform',tone:'orange'},
  {id:'melody',titleKo:'미란멜로디 합창',titleEn:'Meeran Melody Choir',image:'assets/specialty/meeran-melody.jpg',form:null,tone:'pink'}
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
  specialtyModal.innerHTML = `<div class="specialty-modal-backdrop" data-specialty-close></div><div class="specialty-modal-panel" role="dialog" aria-modal="true" aria-labelledby="specialtyModalTitle"><div class="specialty-modal-head"><div><p>PREMIUM SPECIALTY PROGRAM</p><h2 id="specialtyModalTitle"></h2></div><button type="button" class="specialty-close" data-specialty-close aria-label="닫기">×</button></div><div class="specialty-modal-scroll"><img class="specialty-modal-image" src="" alt=""></div><div class="specialty-modal-actions"><p data-ko="프로그램 내용을 확인하셨다면 아래 버튼을 눌러 신청서를 작성해주세요." data-en="After reviewing the program, use the button below to complete the application.">프로그램 내용을 확인하셨다면 아래 버튼을 눌러 신청서를 작성해주세요.</p><a class="btn btn-primary specialty-form-link" href="#" target="_blank" rel="noopener noreferrer"><span data-ko="신청서 작성" data-en="Complete Application">신청서 작성</span><b>↗</b></a></div></div>`;
  document.body.append(specialtyModal);
  const closeSpecialtyModal=()=>{specialtyModal.hidden=true;document.body.classList.remove('modal-open');};
  specialtySection.querySelectorAll('[data-specialty]').forEach(button=>button.addEventListener('click',()=>{
    const program=specialtyPrograms.find(item=>item.id===button.dataset.specialty);if(!program)return;
    specialtyModal.querySelector('#specialtyModalTitle').textContent=currentLanguage==='en'?program.titleEn:program.titleKo;
    const modalImage=specialtyModal.querySelector('.specialty-modal-image');modalImage.src=program.image;modalImage.alt=`${program.titleKo} 프로그램 전단지`;
    const formLink=specialtyModal.querySelector('.specialty-form-link');
    formLink.hidden=!program.form;
    if(program.form) formLink.href=program.form;
    specialtyModal.querySelector('.specialty-modal-actions p').textContent=program.form
      ? (currentLanguage==='ko'?'프로그램 내용을 확인하셨다면 아래 버튼을 눌러 신청서를 작성해주세요.':'After reviewing the program, use the button below to complete the application.')
      : (currentLanguage==='ko'?'미란멜로디 신청서는 준비 중입니다. 새로운 신청서가 완성되면 연결됩니다.':'The Meeran Melody application is coming soon.');
    specialtyModal.hidden=false;document.body.classList.add('modal-open');
  }));
  specialtyModal.querySelectorAll('[data-specialty-close]').forEach(button=>button.addEventListener('click',closeSpecialtyModal));
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
const contactWrap=document.querySelector('.contact-wrap');
contactWrap?.insertAdjacentHTML('afterbegin','<div class="contact-illustration" aria-hidden="true"><span>✉</span><i></i><b></b><em>♥</em></div>');
const eventGrid=document.querySelector('.event-grid');
if(eventGrid){
  eventGrid.insertAdjacentHTML('beforeend','<article class="event-card event-coming reveal"><div class="event-coming-icon">＋</div><span class="event-badge" data-ko="준비 중" data-en="COMING SOON">준비 중</span><h3 data-ko="새로운 무료강좌를 준비하고 있습니다" data-en="A new free class is coming soon">새로운 무료강좌를 준비하고 있습니다</h3><p data-ko="디지털·언어·음악을 비롯한 새로운 체험 강좌가 곧 공개됩니다." data-en="New trial classes in digital learning, language, music, and more will be announced soon.">디지털·언어·음악을 비롯한 새로운 체험 강좌가 곧 공개됩니다.</p></article>');
  eventGrid.querySelectorAll('.reveal').forEach(item=>item.classList.add('visible'));
}
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
