(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const slides = Array.from({ length: 10 }, (_, index) => `assets/digital-program/slide-${index + 1}.png`);
  const learningData = [
    { id:'smartphone', icon:'📱', title:'스마트폰', description:'아이폰 · 갤럭시 · 전화 · 문자 · 카카오톡 · 사진', accessLevel:'free', lessons:[
      { id:'smartphone-basics', title:'스마트폰 앱 기초', description:'앱을 찾고 사용하는 기본 방법을 그림으로 다시 봅니다.', status:'ready', accessLevel:'free', slides },
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
  // Keep mini apps data-driven so new member tools can be added without
  // changing the learning-home structure.
  const miniApps = [
    { id:'easy-hanja', icon:'漢', title:'쉬운 한자 찾기', description:'한글이나 한자를 입력하면 뜻과 읽는 법을 쉽게 찾아드려요.', href:'easy-hanja.html' }
  ];

  const app = document.getElementById('seniorLearningApp');
  const gate = document.getElementById('seniorLearningGate');
  const loading = document.getElementById('seniorLearningLoading');
  const content = document.getElementById('seniorLearningContent');
  const breadcrumb = document.getElementById('seniorBreadcrumb');
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  let state = { categoryId:null, lessonId:null, slideIndex:0 };
  let memberCheckId = 0;

  const findCategory = id => learningData.find(category => category.id === id);
  const findLesson = (categoryId, lessonId) => findCategory(categoryId)?.lessons.find(lesson => lesson.id === lessonId);
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
  const showLoading = () => { loading.hidden = false; gate.hidden = true; app.hidden = true; };
  const showGate = () => { loading.hidden = true; app.hidden = true; gate.hidden = false; };
  const showApp = () => { loading.hidden = true; gate.hidden = true; app.hidden = false; render(); };
  const updateHistory = () => {
    const params = new URLSearchParams();
    if (state.categoryId) params.set('category', state.categoryId);
    if (state.lessonId) params.set('lesson', state.lessonId);
    if (state.lessonId) params.set('page', String(state.slideIndex + 1));
    const query = params.toString();
    history.pushState(state, '', `senior-learning.html${query ? `?${query}` : ''}`);
  };
  const setState = next => { state = { ...state, ...next }; updateHistory(); render(); };
  const renderBreadcrumb = () => {
    const category = findCategory(state.categoryId);
    const lesson = state.lessonId && findLesson(state.categoryId, state.lessonId);
    const parts = ['<button type="button" data-senior-home>시니어 배움터</button>'];
    if (category) parts.push(`<span>›</span><button type="button" data-senior-category="${category.id}">${escapeHtml(category.title)}</button>`);
    if (lesson) parts.push(`<span>›</span><strong>${escapeHtml(lesson.title)}</strong>`);
    breadcrumb.innerHTML = parts.join('');
  };
  const renderCategories = () => {
    content.innerHTML = `<section class="senior-category-view"><h2>무엇을 다시 배우고 싶으세요?</h2><p>원하는 분야를 누르면 교재 목록을 볼 수 있어요.</p><div class="senior-category-grid">${learningData.map(category => `<button class="senior-category-card" type="button" data-senior-category="${category.id}"><span aria-hidden="true">${category.icon}</span><strong>${category.title}</strong><small>${category.description}</small></button>`).join('')}</div></section><section class="senior-mini-apps" aria-labelledby="seniorMiniAppsTitle"><div class="senior-mini-apps-heading"><h2 id="seniorMiniAppsTitle">미니앱</h2><p>배운 내용을 바로 활용할 수 있는 쉬운 디지털 도구</p></div><div class="senior-mini-app-grid">${miniApps.map(app => `<article class="senior-mini-app-card"><span class="senior-mini-app-icon" aria-hidden="true">${app.icon}</span><div><h3>${app.title}</h3><p>${app.description}</p></div><a class="senior-primary-button" href="${app.href}">사용하기</a></article>`).join('')}</div></section>`;
  };
  const renderLessons = category => {
    content.innerHTML = `<section class="senior-lesson-view"><div class="senior-view-heading"><span aria-hidden="true">${category.icon}</span><div><h2>${category.title}</h2><p>${category.description}</p></div></div><div class="senior-lesson-list">${category.lessons.map(lesson => `<article class="senior-lesson-card ${lesson.status === 'ready' ? 'is-ready' : 'is-preparing'}"><div><h3>${lesson.title}</h3><p>${lesson.description}</p></div>${lesson.status === 'ready' ? `<button class="senior-primary-button" type="button" data-senior-lesson="${lesson.id}">교재 보기</button>` : '<span class="senior-preparing">자료 준비 중</span>'}</article>`).join('')}</div></section>`;
  };
  const renderViewer = (category, lesson) => {
    const total = lesson.slides.length;
    const index = Math.max(0, Math.min(state.slideIndex, total - 1));
    state.slideIndex = index;
    content.innerHTML = `<section class="senior-viewer" aria-labelledby="seniorViewerTitle"><header><h2 id="seniorViewerTitle">${lesson.title}</h2><p>${lesson.description}</p></header><figure><img src="${lesson.slides[index]}" alt="${lesson.title} ${index + 1}번째 그림 교재"><figcaption>${index + 1} / ${total}</figcaption></figure><div class="senior-viewer-actions"><button class="senior-secondary-button" type="button" data-senior-previous ${index === 0 ? 'disabled' : ''}>◀ 이전</button><button class="senior-secondary-button" type="button" data-senior-fullscreen>크게 보기</button><button class="senior-primary-button" type="button" data-senior-next ${index === total - 1 ? 'disabled' : ''}>다음 ▶</button></div><button class="senior-back-link" type="button" data-senior-category="${category.id}">교재 목록으로 돌아가기</button></section>`;
  };
  const render = () => {
    renderBreadcrumb();
    const category = findCategory(state.categoryId);
    const lesson = state.lessonId && findLesson(state.categoryId, state.lessonId);
    if (category && lesson?.status === 'ready') renderViewer(category, lesson);
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
    if (home) setState({ categoryId:null, lessonId:null, slideIndex:0 });
    else if (categoryButton) setState({ categoryId:categoryButton.dataset.seniorCategory, lessonId:null, slideIndex:0 });
    else if (lessonButton) setState({ lessonId:lessonButton.dataset.seniorLesson, slideIndex:0 });
    else if (event.target.closest('[data-senior-previous]')) setState({ slideIndex:state.slideIndex - 1 });
    else if (event.target.closest('[data-senior-next]')) setState({ slideIndex:state.slideIndex + 1 });
    else if (event.target.closest('[data-senior-fullscreen]')) content.querySelector('.senior-viewer figure')?.requestFullscreen?.();
  });
  breadcrumb.addEventListener('click', event => {
    const home = event.target.closest('[data-senior-home]');
    const categoryButton = event.target.closest('[data-senior-category]');
    if (home) setState({ categoryId:null, lessonId:null, slideIndex:0 });
    if (categoryButton) setState({ categoryId:categoryButton.dataset.seniorCategory, lessonId:null, slideIndex:0 });
  });
  document.addEventListener('keydown', event => {
    if (!state.lessonId || event.target.matches('input, textarea')) return;
    const lesson = findLesson(state.categoryId, state.lessonId);
    if (event.key === 'ArrowLeft' && state.slideIndex > 0) setState({ slideIndex:state.slideIndex - 1 });
    if (event.key === 'ArrowRight' && state.slideIndex < lesson.slides.length - 1) setState({ slideIndex:state.slideIndex + 1 });
  });
  window.addEventListener('popstate', () => { const params = new URLSearchParams(location.search); state = { categoryId:params.get('category'), lessonId:params.get('lesson'), slideIndex:Math.max(0, Number(params.get('page') || 1) - 1) }; render(); });
  const params = new URLSearchParams(location.search);
  state = { categoryId:params.get('category'), lessonId:params.get('lesson'), slideIndex:Math.max(0, Number(params.get('page') || 1) - 1) };
  client?.auth.onAuthStateChange((event, session) => { if (event !== 'INITIAL_SESSION') void checkMember(session); });
  void checkMember();
})();
