(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const entries = [
    ['學','학','배울 학'],['校','교','학교 교'],['文','문','글월 문'],['化','화','될 화'],['國','국','나라 국'],['韓','한','한국 한'],['漢','한','한나라 한'],['字','자','글자 자'],['人','인','사람 인'],['生','생','날 생'],['活','활','살 활'],['家','가','집 가'],['可','가','옳을 가'],['價','가','값 가'],['族','족','겨레 족'],['事','사','일 사'],['四','사','넉 사'],['社','사','모일 사'],['師','사','스승 사'],['愛','애','사랑 애'],['情','정','뜻 정'],['正','정','바를 정'],['政','정','정사 정'],['安','안','편안 안'],['全','전','온전 전'],['保','보','보전할 보'],['護','호','도울 호'],['心','심','마음 심'],['身','신','몸 신'],['體','체','몸 체'],['健','건','굳셀 건'],['康','강','편안 강'],['福','복','복 복'],['幸','행','다행 행'],['希','희','바랄 희'],['望','망','바랄 망'],['時','시','때 시'],['間','간','사이 간'],['年','년','해 년'],['月','월','달 월'],['日','일','날 일'],['今','금','이제 금'],['明','명','밝을 명'],['大','대','큰 대'],['小','소','작을 소'],['中','중','가운데 중'],['高','고','높을 고'],['新','신','새 신'],['用','용','쓸 용'],['理','리','다스릴 리'],['解','해','풀 해'],['知','지','알 지'],['識','식','알 식'],['經','경','지날 경'],['驗','험','시험 험'],['技','기','재주 기'],['術','술','재주 술'],['敎','교','가르칠 교'],['育','육','기를 육'],['書','서','글 서'],['道','도','길 도'],['場','장','마당 장'],['館','관','집 관'],['醫','의','의원 의'],['療','료','병 고칠 료'],['金','금','쇠 금'],['融','융','녹을 융'],['電','전','전기 전'],['話','화','말씀 화'],['友','우','벗 우'],['母','모','어미 모'],['父','부','아비 부'],['子','자','아들 자'],['女','여','여자 여'],['男','남','남자 남'],['老','로','늙을 로'],['樂','락','즐길 락'],['音','음','소리 음'],['美','미','아름다울 미'],['成','성','이룰 성'],['功','공','공 공'],['業','업','업 업'],['英','영','꽃부리 영'],['永','영','길 영'],['榮','영','영화 영'],['泳','영','헤엄칠 영'],['映','영','비칠 영'],['迎','영','맞을 영'],['民','민','백성 민'],['敏','민','민첩할 민'],['珉','민','옥돌 민'],['旻','민','하늘 민'],['閔','민','위문할 민'],['玟','민','옥돌 민']
  ];
  const words = [
    ['학교','學校','학교','배울 학 · 학교 교'],['한국','韓國','한국','한국 한 · 나라 국'],['한자','漢字','한자','한나라 한 · 글자 자'],['가족','家族','가족','집 가 · 겨레 족'],['사랑','愛','애','사랑 애'],['안전','安全','안전','편안 안 · 온전 전'],['건강','健康','건강','굳셀 건 · 편안 강'],['행복','幸福','행복','다행 행 · 복 복'],['희망','希望','희망','바랄 희 · 바랄 망'],['문화','文化','문화','글월 문 · 될 화'],['교육','敎育','교육','가르칠 교 · 기를 육'],['시간','時間','시간','때 시 · 사이 간'],['정보','情報','정보','알 정 · 뜻 보'],['금융','金融','금융','쇠 금 · 녹을 융'],['전화','電話','전화','전기 전 · 말씀 화'],['인생','人生','인생','사람 인 · 날 생']
  ];

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[character]));
  const isHanja = value => /[\u3400-\u9fff\uf900-\ufaff]/.test(value);
  const app = document.getElementById('hanjaApp');
  const gate = document.getElementById('hanjaGate');
  const loading = document.getElementById('hanjaLoading');
  const query = document.getElementById('hanjaQuery');
  const searchButton = document.getElementById('hanjaSearchButton');
  const results = document.getElementById('hanjaResults');
  const status = document.getElementById('hanjaStatus');
  const signout = document.getElementById('hanjaSignout');
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

  const gateMessage = '회원가입 또는 로그인 후 바로 이용하실 수 있습니다.';
  let memberCheckId = 0;

  const showLoading = () => {
    loading.hidden = false;
    gate.hidden = true;
    app.hidden = true;
  };
  const showGate = message => {
    loading.hidden = true;
    app.hidden = true;
    gate.hidden = false;
    gate.querySelector('p').textContent = message || gateMessage;
  };
  const showApp = () => {
    loading.hidden = true;
    gate.hidden = true;
    app.hidden = false;
    query.focus();
  };
  const resultCard = item => `<article class="hanja-result"><div class="hanja-character" aria-hidden="true">${escapeHtml(item.character)}</div><div><h3>${escapeHtml(item.character)} <span>(${escapeHtml(item.reading)})</span></h3><p>${escapeHtml(item.meaning)}</p><button class="hanja-copy" type="button" data-hanja-copy="${escapeHtml(item.character)}">한자 복사</button></div></article>`;
  const renderResults = matches => {
    if (!matches.length) {
      results.innerHTML = '';
      status.textContent = '현재 쉬운 한자 목록에서 찾지 못했어요. 한 글자씩 다시 입력해 보세요.';
      return;
    }
    status.textContent = `${matches.length}개의 한자 후보를 찾았어요.`;
    results.innerHTML = matches.map(item => resultCard(item)).join('');
  };
  const search = () => {
    const value = query.value.trim();
    if (!value) {
      results.innerHTML = '';
      status.textContent = '한글이나 한자를 입력해 주세요.';
      query.focus();
      return;
    }
    const exactWords = words.filter(([query, hanja]) => query === value || hanja === value)
      .map(([, hanja, reading, meaning]) => ({ character:hanja, reading, meaning }));
    const perCharacter = [...value].flatMap(character => {
      if (isHanja(character)) return entries.filter(([hanja]) => hanja === character).map(([hanja, reading, meaning]) => ({ character:hanja, reading, meaning }));
      return entries.filter(([, reading]) => reading === character).map(([hanja, reading, meaning]) => ({ character:hanja, reading, meaning }));
    });
    const seen = new Set();
    renderResults([...exactWords, ...perCharacter].filter(item => {
      const key = `${item.character}:${item.reading}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }));
  };
  const copyHanja = async character => {
    try {
      await navigator.clipboard.writeText(character);
      status.textContent = `${character} 한자를 복사했어요.`;
    } catch {
      status.textContent = '복사하지 못했어요. 한자를 길게 눌러 복사해 주세요.';
    }
  };
  searchButton.addEventListener('click', search);
  query.addEventListener('keydown', event => { if (event.key === 'Enter') search(); });
  results.addEventListener('click', event => {
    const button = event.target.closest('[data-hanja-copy]');
    if (button) copyHanja(button.dataset.hanjaCopy);
  });
  signout.addEventListener('click', async () => {
    await client?.auth.signOut();
    showGate();
  });

  const pause = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const getMemberProfile = async session => {
    const { data: rpcData, error: rpcError } = await client.rpc('get_own_member_profile');
    const profile = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (profile && !rpcError) return profile;
    const { data, error } = await client
      .from('member_profiles')
      .select('account_status')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) return null;
    return data || null;
  };
  const checkMember = async suppliedSession => {
    const checkId = ++memberCheckId;
    showLoading();
    if (!client) { if (checkId === memberCheckId) showGate(); return; }
    let session = suppliedSession;
    if (!session?.user) {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.user) { if (checkId === memberCheckId) showGate(); return; }
      session = data.session;
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const profile = await getMemberProfile(session);
      if (checkId !== memberCheckId) return;
      if (['active','expiring'].includes(profile?.account_status || '')) { showApp(); return; }
      if (attempt < 2) await pause(350);
    }
    if (checkId === memberCheckId) showGate();
  };
  client?.auth.onAuthStateChange((event, session) => {
    if (event !== 'INITIAL_SESSION') void checkMember(session);
  });
  void checkMember();
})();
