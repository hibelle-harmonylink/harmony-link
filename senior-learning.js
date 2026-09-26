(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const legacySmartphoneSlides = Array.from({ length: 10 }, (_, index) => `assets/digital-program/slide-${index + 1}.png`);
  const sourceLearningData = [
    { id:'smartphone', icon:'📱', title:'스마트폰', description:'아이폰 · 갤럭시 · 전화 · 문자 · 카카오톡 · 사진', accessLevel:'free', lessons:[
      { id:'smartphone-basics', title:'스마트폰 앱 기초', description:'앱을 찾고 사용하는 기본 방법을 그림으로 다시 봅니다.', status:'ready', accessLevel:'free', slides:legacySmartphoneSlides },
      { id:'app-install', title:'앱 설치하기', description:'필요한 앱을 안전하게 설치하는 방법입니다.', status:'preparing', accessLevel:'free' },
      { id:'app-move', title:'앱 이동하기', description:'앱 위치를 옮기고 정리하는 방법입니다.', status:'preparing', accessLevel:'free' },
      { id:'app-folder', title:'폴더 만들기', description:'자주 쓰는 앱을 폴더에 모아봅니다.', status:'preparing', accessLevel:'free' },
      { id:'app-update', title:'앱 업데이트', description:'앱을 최신 상태로 유지하는 방법입니다.', status:'preparing', accessLevel:'free' },
      { id:'app-delete', title:'앱 삭제하기', description:'필요 없는 앱을 안전하게 지우는 방법입니다.', status:'preparing', accessLevel:'free' }
    ]},
    { id:'settings', icon:'⚙️', title:'설정과 화면', description:'글씨 크기 · Wi-Fi · 소리 · 화면 · 업데이트', accessLevel:'free', lessons:[
      { id:'text-size', title:'글씨 크게 보기', description:'휴대폰 글씨와 화면을 편하게 조절합니다.', status:'preparing', accessLevel:'free' },
      { id:'wifi', title:'Wi-Fi 연결하기', description:'집과 밖에서 인터넷을 연결합니다.', status:'preparing', accessLevel:'free' },
      { id:'sound', title:'소리와 화면 설정', description:'알림 소리와 화면 밝기를 조절합니다.', status:'preparing', accessLevel:'free' }
    ]},
    { id:'daily-digital', icon:'🧭', title:'생활 디지털', description:'인터넷 · 지도 · QR · 온라인 예약 · 생활 앱', accessLevel:'free', lessons:[
      { id:'internet', title:'인터넷 찾아보기', description:'필요한 정보를 안전하게 찾습니다.', status:'preparing', accessLevel:'free' },
      { id:'map', title:'지도와 길 찾기', description:'지도 앱으로 목적지를 찾습니다.', status:'preparing', accessLevel:'free' },
      { id:'qr', title:'QR 코드 사용하기', description:'QR 코드를 열고 정보를 확인합니다.', status:'preparing', accessLevel:'free' }
    ]},
    { id:'ai', icon:'✨', title:'AI 배우기', description:'ChatGPT · 질문하기 · 사진 활용 · 생활 AI', accessLevel:'basic', lessons:[
      { id:'chatgpt', title:'ChatGPT에게 질문하기', description:'생활에 도움이 되는 질문을 쉽게 해봅니다.', status:'preparing', accessLevel:'basic' },
      { id:'ai-photo', title:'AI로 사진 활용하기', description:'사진을 보고 설명을 받는 방법입니다.', status:'preparing', accessLevel:'basic' }
    ]},
    { id:'digital-hobby', icon:'🎨', title:'디지털 취미', description:'Canva · 사진편집 · 영상 · YouTube', accessLevel:'basic', lessons:[
      { id:'canva', title:'Canva 시작하기', description:'간단한 카드와 안내문을 만들어 봅니다.', status:'preparing', accessLevel:'basic' },
      { id:'youtube', title:'YouTube 즐기기', description:'관심 있는 영상을 찾고 저장합니다.', status:'preparing', accessLevel:'basic' }
    ]},
    { id:'safety', icon:'🛡️', title:'디지털 안전', description:'스미싱 · 피싱 · 가짜 문자 · 개인정보 보호', accessLevel:'free', lessons:[
      { id:'smishing', title:'수상한 문자 알아보기', description:'스미싱과 피싱 문자를 구별합니다.', status:'preparing', accessLevel:'free' },
      { id:'privacy', title:'개인정보 지키기', description:'비밀번호와 개인정보를 안전하게 관리합니다.', status:'preparing', accessLevel:'free' }
    ]}
  ];
  // Text lessons are ready independently of optional picture delivery.
  const smartphoneFolders = window.HarmonySmartphoneLessons || [];
  const smartphoneLessons = smartphoneFolders.flatMap(folder => folder.lessons);
  // Approved textbook PDFs from Muse (Drive 03_승인완료), placed as-is under
  // downloads/senior-learning/. Never edit the PDF content here.
  const smartphoneTextbooks = [
    { id:'smartphone-01', title:'01. 스마트폰, 이것만 알기', href:'downloads/senior-learning/01_스마트폰_이것만알기.pdf' }
  ];
  const learningData = [
    {
      id:'smartphone',
      icon:'📱',
      image:'assets/senior-learning/material-smartphone.svg',
      title:'스마트폰',
      description:'스마트폰 기본 사용법을 쉽게 배워보세요.',
      lessons:smartphoneLessons
    },
    {
      id:'computer',
      icon:'💻',
      image:'assets/senior-learning/material-computer.svg',
      title:'컴퓨터',
      description:'컴퓨터 기본 사용법을 쉽게 배워보세요.',
      lessons:[...sourceLearningData.find(category => category.id === 'digital-hobby').lessons]
    },
    {
      id:'ai-tools',
      icon:'✨',
      image:'assets/senior-learning/material-ai.svg',
      title:'AI 도구',
      description:'생활에 유용한 AI 도구를 쉽게 배워보세요.',
      lessons:[...sourceLearningData.find(category => category.id === 'ai').lessons]
    }
  ];
  // Keep mini apps data-driven so new member tools can be added without
  // changing the learning-home structure.
  const miniApps = [
    { id:'easy-hanja', image:'assets/senior-learning/mini-hanja.svg', title:'한자 변환기', description:'한자 정보를 쉽게 확인해보세요.', href:'easy-hanja.html' }
  ];

  const app = document.getElementById('seniorLearningApp');
  const gate = document.getElementById('seniorLearningGate');
  const loading = document.getElementById('seniorLearningLoading');
  const content = document.getElementById('seniorLearningContent');
  const breadcrumb = document.getElementById('seniorBreadcrumb');
  const signoutButton = document.getElementById('seniorSignout');
  const signinButton = document.getElementById('seniorSignin');
  const pageMode = document.body.dataset.seniorPage || 'home';
  const pagePath = pageMode === 'materials' ? 'senior-learning-materials.html' : pageMode === 'mini-apps' ? 'senior-mini-apps.html' : 'senior-learning.html';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  let state = { categoryId:null, folderId:null, lessonId:null, slideIndex:0 };
  let memberCheckId = 0;

  const findCategory = id => learningData.find(category => category.id === id);
  const findLesson = (categoryId, lessonId) => findCategory(categoryId)?.lessons.find(lesson => lesson.id === lessonId);
  const isLessonAvailable = lesson => ['ready', 'available'].includes(lesson?.status);
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
  const showLoading = () => { loading.hidden = false; gate.hidden = true; app.hidden = true; signoutButton.hidden = true; signinButton.hidden = false; };
  const showGate = () => { loading.hidden = true; app.hidden = true; gate.hidden = false; signoutButton.hidden = true; signinButton.hidden = false; };
  const showApp = () => { loading.hidden = true; gate.hidden = true; app.hidden = false; signoutButton.hidden = false; signinButton.hidden = true; render(); };
  const updateHistory = () => {
    const params = new URLSearchParams();
    if (state.categoryId) params.set('category', state.categoryId);
    if (state.folderId) params.set('folder', state.folderId);
    if (state.lessonId) params.set('lesson', state.lessonId);
    if (state.lessonId) params.set('page', String(state.slideIndex + 1));
    const query = params.toString();
    history.pushState(state, '', `${pagePath}${query ? `?${query}` : ''}`);
  };
  const setState = next => {
    state = { ...state, ...next }; updateHistory(); render();
    content.querySelector('h2')?.focus({ preventScroll:true });
    document.getElementById('seniorLearningMain').scrollIntoView({ block:'start' });
  };
  const renderBreadcrumb = () => {
    if (pageMode !== 'materials') { breadcrumb.innerHTML = ''; return; }
    const category = findCategory(state.categoryId);
    breadcrumb.hidden = !category;
    if (!category) { breadcrumb.innerHTML = ''; return; }
    const lesson = state.lessonId && findLesson(state.categoryId, state.lessonId);
    const folder = category?.id === 'smartphone' && smartphoneFolders.find(item => item.id === (lesson?.folderId || state.folderId));
    const parts = ['<button type="button" data-senior-home>교재</button>'];
    if (category) parts.push(`<span>›</span><button type="button" data-senior-category="${category.id}">${escapeHtml(category.title)}</button>`);
    if (folder) parts.push(`<span>›</span><button type="button" data-senior-folder="${folder.id}">${escapeHtml(folder.title)}</button>`);
    if (lesson) parts.push(`<span>›</span><strong>${escapeHtml(lesson.title)}</strong>`);
    breadcrumb.innerHTML = parts.join('');
  };
  const renderHomeChoices = () => '<section class="senior-content-tabs" aria-label="시니어 배움터 선택">' +
    '<a class="senior-section-choice" href="senior-learning-materials.html"><img src="assets/senior-learning/textbook-card.svg" alt=""><strong>교재</strong><span>스마트폰과 디지털 사용법을 다시 확인해보세요.</span><b>교재 보기</b></a>' +
    '<a class="senior-section-choice" href="senior-mini-apps.html"><img src="assets/senior-learning/mini-app-card.svg" alt=""><strong>미니앱</strong><span>생활에 도움이 되는 간편한 디지털 도구</span><b>미니앱 보기</b></a></section>';
  const renderCategories = () => {
    content.innerHTML = `<section class="senior-category-view"><div class="senior-category-grid">${learningData.map(category => `<button class="senior-category-card" type="button" data-senior-category="${category.id}"><img src="${category.image}" alt=""><strong>${category.title}</strong><small>${category.description}</small><b>교재 보기</b></button>`).join('')}</div></section>`;
  };
  const renderMiniApps = () => `<section class="senior-mini-apps"><div class="senior-mini-app-grid">${miniApps.map(app => `<a class="senior-mini-app-card" data-mini-app-card href="${app.href}" aria-label="${app.title} 사용하기"><img src="${app.image}" alt=""><div><h3>${app.title}</h3><p>${app.description}</p></div><span class="senior-primary-button" aria-hidden="true">사용하기</span></a>`).join('')}</div></section>`;
  const renderLessons = category => {
    if (category.id === 'smartphone') { renderSmartphone(); return; }
    content.innerHTML = `<section class="senior-lesson-view"><div class="senior-view-heading"><span aria-hidden="true">${category.icon}</span><div><h2>${category.title}</h2><p>${category.description}</p></div></div><div class="senior-lesson-list">${category.lessons.map(lesson => { const available = isLessonAvailable(lesson); return `<article class="senior-lesson-card ${available ? 'is-ready' : 'is-preparing'}"${available ? '' : ' aria-disabled="true"'}><div><h3>${lesson.title}</h3><p>${lesson.description}</p></div>${available ? `<button class="senior-primary-button" type="button" data-senior-lesson="${lesson.id}">교재 보기</button>` : '<span class="senior-preparing">자료 준비중</span>'}</article>`; }).join('')}</div></section>`;
  };
  const formatCopy = text => escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const listCopy = (items, ordered = false) => `<${ordered ? 'ol' : 'ul'}>${items.map(item => `<li>${formatCopy(item)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
  const renderSmartphone = () => {
    const folder = smartphoneFolders.find(item => item.id === state.folderId);
    if (!folder) {
      // Muse's new PDF textbook series is now the only smartphone content
      // shown here. The folder/lesson browsing UI below (and its render
      // code) stays reachable by direct link/state for now -- only its
      // entry points on this screen are removed. Do not delete
      // smartphoneFolders data or this branch's sibling render functions.
      content.innerHTML = `<section class="smartphone-folders"><h2 tabindex="-1">스마트폰</h2><section class="smartphone-textbooks" aria-labelledby="smartphoneTextbooksTitle"><h3 id="smartphoneTextbooksTitle">스마트폰 교재</h3><div class="smartphone-textbook-grid">${smartphoneTextbooks.map(book => `<article class="smartphone-textbook-card"><strong>${escapeHtml(book.title)}</strong><a class="senior-primary-button" href="${book.href}" target="_blank" rel="noopener noreferrer">교재 보기</a></article>`).join('')}</div></section></section>`;
      return;
    }
    content.innerHTML = `<section class="smartphone-folder"><header><h2 tabindex="-1">${folder.title}</h2><p>${escapeHtml(folder.introduction)}<br>20개 학습 · 필요한 내용부터 골라 배우세요.</p></header><div class="smartphone-lesson-grid">${folder.lessons.map(lesson => `<article class="smartphone-lesson-card"><span class="smartphone-number">${lesson.number}</span><h3 title="${escapeHtml(lesson.title)}">${escapeHtml(lesson.cardTitle || lesson.title)}</h3><p title="${escapeHtml(lesson.description)}">${escapeHtml(lesson.description)}</p><button type="button" class="senior-primary-button" data-senior-lesson="${lesson.id}" aria-label="${escapeHtml(lesson.title)} 배우기">배우기 →</button></article>`).join('')}</div><button type="button" class="senior-secondary-button" data-senior-category="smartphone">← 스마트폰 폴더</button></section>`;
  };
  // Never attach an img until its local file has loaded successfully. A missing
  // PNG does not gate the text, and adding the file later needs no HTML changes.
  const loadLessonPicture = lesson => {
    const slot = content.querySelector('[data-lesson-picture]');
    if (!slot) return;
    const picture = new Image();
    picture.alt = `${lesson.title} 그림 교재`;
    picture.onload = () => {
      if (!slot.isConnected || !picture.naturalWidth) return;
      slot.innerHTML = '<h3>그림으로 확인하기</h3><p>글로 배운 내용을 그림으로 다시 확인해 보세요.</p><div class="senior-viewer"><figure><figcaption>1 / 1</figcaption></figure><div class="senior-viewer-actions"><button class="senior-secondary-button" type="button" data-senior-previous disabled>◀ 이전</button><button class="senior-secondary-button" type="button" data-senior-fullscreen>그림 크게 보기</button><button class="senior-secondary-button" type="button" data-senior-next disabled>다음 ▶</button></div></div>';
      slot.querySelector('figure').prepend(picture);
    };
    picture.onerror = () => { if (slot.isConnected) slot.innerHTML = '<h3>그림으로 확인하기</h3><p><strong>그림 교재 준비 중</strong><br>위의 글 설명으로 먼저 배워보세요.</p>'; };
    picture.src = lesson.slides[0];
  };
  const renderSmartphoneLesson = lesson => {
    content.innerHTML = `<article class="smartphone-detail"><header><p class="smartphone-number">학습 ${lesson.number}</p><h2 tabindex="-1">${escapeHtml(lesson.title)}</h2><p>${formatCopy(lesson.description)}</p></header><section><h3>오늘 배울 내용</h3><p>${formatCopy(lesson.learn || lesson.description)}</p></section><section><h3>언제 사용하나요?</h3><p>${formatCopy(lesson.when)}</p></section><section class="smartphone-device"><h3>갤럭시에서 알아보기</h3>${listCopy(lesson.galaxy, true)}<p class="smartphone-version-note">기종·OS 버전에 따라 메뉴 이름과 위치가 조금 다를 수 있어요. 찾기 어려우면 설정의 검색을 이용하세요.</p></section><section class="smartphone-device"><h3>아이폰에서 알아보기</h3>${listCopy(lesson.iphone, true)}</section><section class="smartphone-picture" data-lesson-picture aria-live="polite"><h3>그림으로 확인하기</h3><p>그림 교재를 확인하고 있어요. 글 설명은 바로 이용할 수 있어요.</p></section><section class="smartphone-remember"><h3>기억하세요</h3>${listCopy(lesson.remember)}</section>${lesson.trouble.length ? `<section><h3>잘 안 될 때</h3>${listCopy(lesson.trouble)}</section>` : ''}<button class="senior-secondary-button" type="button" data-senior-folder="${lesson.folderId}">← 학습 목록으로 돌아가기</button></article>`;
    loadLessonPicture(lesson);
  };
  const renderViewer = (category, lesson) => {
    if (lesson.folderId) { renderSmartphoneLesson(lesson); return; }
    const total = lesson.slides.length;
    const index = Math.max(0, Math.min(state.slideIndex, total - 1));
    state.slideIndex = index;
    content.innerHTML = `<section class="senior-viewer" aria-labelledby="seniorViewerTitle"><header><h2 id="seniorViewerTitle">${lesson.title}</h2><p>${lesson.description}</p></header><figure><img src="${lesson.slides[index]}" alt="${lesson.title} ${index + 1}번째 그림 교재"><figcaption>${index + 1} / ${total}</figcaption></figure><div class="senior-viewer-actions"><button class="senior-secondary-button" type="button" data-senior-previous ${index === 0 ? 'disabled' : ''}>◀ 이전</button><button class="senior-secondary-button" type="button" data-senior-fullscreen>크게 보기</button><button class="senior-primary-button" type="button" data-senior-next ${index === total - 1 ? 'disabled' : ''}>다음 ▶</button></div><button class="senior-back-link" type="button" data-senior-category="${category.id}">교재 목록으로 돌아가기</button></section>`;
  };
  const render = () => {
    renderBreadcrumb();
    if (pageMode === 'home') { content.innerHTML = renderHomeChoices(); return; }
    if (pageMode === 'mini-apps') { content.innerHTML = renderMiniApps(); return; }
    const category = findCategory(state.categoryId);
    const lesson = state.lessonId && findLesson(state.categoryId, state.lessonId);
    const materialsIntro = document.getElementById('seniorMaterialsIntro');
    if (materialsIntro) materialsIntro.hidden = category?.id === 'smartphone';
    if (category && isLessonAvailable(lesson)) renderViewer(category, lesson);
    else if (category) renderLessons(category);
    else renderCategories();
  };
  const getMemberProfile = async session => {
    const { data: rpcData, error: rpcError } = await client.rpc('get_own_member_profile');
    const profile = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (profile && !rpcError) return profile;
    const { data, error } = await client.from('member_profiles').select('account_status').eq('id', session.user.id).maybeSingle();
    return error ? null : data;
  };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const checkMember = async suppliedSession => {
    const checkId = ++memberCheckId;
    showLoading();
    if (!client) { if (checkId === memberCheckId) showGate(); return; }
    let session = suppliedSession;
    if (!session?.user) { const { data } = await client.auth.getSession(); session = data.session; }
    if (!session?.user) { if (checkId === memberCheckId) showGate(); return; }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const profile = await getMemberProfile(session);
      if (checkId !== memberCheckId) return;
      if (['active', 'expiring'].includes(profile?.account_status || '')) { showApp(); return; }
      if (attempt < 2) await pause(350);
    }
    if (checkId === memberCheckId) showGate();
  };
  content.addEventListener('click', event => {
    const home = event.target.closest('[data-senior-home]');
    const categoryButton = event.target.closest('[data-senior-category]');
    const lessonButton = event.target.closest('[data-senior-lesson]');
    const folderButton = event.target.closest('[data-senior-folder]');
    if (home) setState({ categoryId:null, folderId:null, lessonId:null, slideIndex:0 });
    else if (categoryButton) setState({ categoryId:categoryButton.dataset.seniorCategory, folderId:null, lessonId:null, slideIndex:0 });
    else if (folderButton) setState({ categoryId:'smartphone', folderId:folderButton.dataset.seniorFolder, lessonId:null, slideIndex:0 });
    else if (lessonButton) {
      const lesson = findLesson(state.categoryId, lessonButton.dataset.seniorLesson);
      if (isLessonAvailable(lesson)) setState({ folderId:lesson.folderId || null, lessonId:lesson.id, slideIndex:0 });
    }
    else if (event.target.closest('[data-senior-previous]')) setState({ slideIndex:state.slideIndex - 1 });
    else if (event.target.closest('[data-senior-next]')) setState({ slideIndex:state.slideIndex + 1 });
    else if (event.target.closest('[data-senior-fullscreen]')) content.querySelector('.senior-viewer figure')?.requestFullscreen?.();
  });
  breadcrumb.addEventListener('click', event => {
    const home = event.target.closest('[data-senior-home]');
    const categoryButton = event.target.closest('[data-senior-category]');
    const folderButton = event.target.closest('[data-senior-folder]');
    if (home) setState({ categoryId:null, folderId:null, lessonId:null, slideIndex:0 });
    if (categoryButton) setState({ categoryId:categoryButton.dataset.seniorCategory, folderId:null, lessonId:null, slideIndex:0 });
    if (folderButton) setState({ categoryId:'smartphone', folderId:folderButton.dataset.seniorFolder, lessonId:null, slideIndex:0 });
  });
  document.addEventListener('keydown', event => {
    const miniAppCard = event.target.closest?.('[data-mini-app-card]');
    if (miniAppCard && event.key === ' ') { event.preventDefault(); miniAppCard.click(); return; }
    if (!state.lessonId || event.target.matches('input, textarea')) return;
    const lesson = findLesson(state.categoryId, state.lessonId);
    if (!isLessonAvailable(lesson) || !lesson.slides?.length) return;
    if (event.key === 'ArrowLeft' && state.slideIndex > 0) setState({ slideIndex:state.slideIndex - 1 });
    if (event.key === 'ArrowRight' && state.slideIndex < lesson.slides.length - 1) setState({ slideIndex:state.slideIndex + 1 });
  });
  signoutButton.addEventListener('click', async () => { await client?.auth.signOut(); });
  window.addEventListener('popstate', () => { const params = new URLSearchParams(location.search); state = { categoryId:params.get('category'), folderId:params.get('folder'), lessonId:params.get('lesson'), slideIndex:Math.max(0, Number(params.get('page') || 1) - 1) }; render(); });
  const params = new URLSearchParams(location.search);
  state = { categoryId:params.get('category'), folderId:params.get('folder'), lessonId:params.get('lesson'), slideIndex:Math.max(0, Number(params.get('page') || 1) - 1) };
  client?.auth.onAuthStateChange((event, session) => { if (event !== 'INITIAL_SESSION') void checkMember(session); });
  void checkMember();
})();
