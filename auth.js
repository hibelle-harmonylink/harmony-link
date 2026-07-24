(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const authLibrary = window.supabase;
  const nav = document.getElementById('primary-nav');
  const partnerCenter = document.getElementById('partner-center');
  const accessCard = partnerCenter?.querySelector('.partner-access-card');
  const accessForm = partnerCenter?.querySelector('#partnerAccessForm');
  const downloads = partnerCenter?.querySelector('.partner-downloads');
  const partnerNav = nav?.querySelector('a[href="#partner-center"]');

  if (!authLibrary?.createClient || !nav || !partnerCenter || !accessCard || !downloads) {
    console.error('Harmony Link authentication could not be initialized.');
    return;
  }

  const client = authLibrary.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const language = () => document.documentElement.lang === 'en' ? 'en' : 'ko';
  const t = (ko, en) => language() === 'en' ? en : ko;
  let activeSession = null;

  const authSlot = document.createElement('div');
  authSlot.className = 'auth-nav-slot';
  const navCta = nav.querySelector('.nav-cta');
  nav.insertBefore(authSlot, navCta || null);

  const authModal = document.createElement('div');
  authModal.className = 'auth-modal';
  authModal.hidden = true;
  authModal.innerHTML = `
    <div class="auth-backdrop" data-auth-close></div>
    <section class="auth-panel" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="auth-close" type="button" data-auth-close aria-label="닫기">×</button>
      <div class="auth-brand"><img src="assets/harmony-logo.png" alt=""><span>HARMONY LINK MEMBER</span></div>
      <h2 id="authTitle" data-ko="간편하게 로그인하세요" data-en="Sign in to Harmony Link">간편하게 로그인하세요</h2>
      <p data-ko="Google 또는 카카오 계정으로 안전하게 시작할 수 있습니다." data-en="Continue securely with your Google or Kakao account.">Google 또는 카카오 계정으로 안전하게 시작할 수 있습니다.</p>
      <div class="auth-provider-list">
        <button type="button" class="auth-provider google" data-auth-provider="google"><b>G</b><span data-ko="Google로 로그인" data-en="Continue with Google">Google로 로그인</span></button>
        <button type="button" class="auth-provider kakao" data-auth-provider="kakao"><b aria-hidden="true">●</b><span data-ko="카카오로 로그인" data-en="Continue with Kakao">카카오로 로그인</span></button>
      </div>
      <p class="auth-status" role="status"></p>
      <small data-ko="로그인하면 이용약관과 개인정보처리방침에 동의한 것으로 간주됩니다." data-en="By signing in, you agree to the Terms and Privacy Policy.">로그인하면 이용약관과 개인정보처리방침에 동의한 것으로 간주됩니다.</small>
    </section>`;
  document.body.appendChild(authModal);

  const authGate = document.createElement('div');
  authGate.className = 'partner-auth-gate';
  authGate.innerHTML = `
    <span class="partner-auth-icon" aria-hidden="true">🔐</span>
    <p class="eyebrow">SECURE MEMBER ACCESS</p>
    <h3 data-ko="로그인 후 자료실을 이용하세요" data-en="Sign in to access partner resources">로그인 후 자료실을 이용하세요</h3>
    <p data-ko="기존 접근코드 대신 Google 또는 카카오 계정으로 안전하게 접속합니다." data-en="Use your Google or Kakao account instead of a shared access code.">기존 접근코드 대신 Google 또는 카카오 계정으로 안전하게 접속합니다.</p>
    <button type="button" class="btn btn-primary auth-open"><span data-ko="로그인하기" data-en="Sign In">로그인하기</span><b>→</b></button>`;
  accessCard.insertBefore(authGate, downloads);
  if (accessForm) accessForm.hidden = true;

  const setModalOpen = open => {
    authModal.hidden = !open;
    document.body.classList.toggle('modal-open', open);
    if (open) {
      updateLanguage();
      authModal.querySelector('[data-auth-provider="google"]')?.focus();
    }
  };

  const getProfile = user => {
    const metadata = user?.user_metadata || {};
    const name = metadata.full_name || metadata.name || metadata.nickname || user?.email?.split('@')[0] || t('회원', 'Member');
    const avatar = metadata.avatar_url || metadata.picture || metadata.profile_image_url || '';
    return { name, avatar, email: user?.email || '' };
  };

  const safeAvatar = avatar => {
    if (!avatar) return '';
    try {
      const parsed = new URL(avatar);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch {
      return '';
    }
  };

  const renderHeader = session => {
    authSlot.replaceChildren();
    if (!session?.user) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'header-login auth-open';
      button.innerHTML = `<span data-ko="로그인" data-en="Sign In">${t('로그인', 'Sign In')}</span>`;
      authSlot.appendChild(button);
      return;
    }

    const profile = getProfile(session.user);
    const wrapper = document.createElement('div');
    wrapper.className = 'auth-user';
    const avatar = safeAvatar(profile.avatar);
    const picture = avatar
      ? `<img src="${avatar}" alt="">`
      : `<span class="auth-avatar-fallback">${profile.name.trim().charAt(0).toUpperCase() || 'H'}</span>`;
    wrapper.innerHTML = `${picture}<span class="auth-user-copy"><b></b><small></small></span><button type="button" class="auth-signout" data-ko="로그아웃" data-en="Sign Out">${t('로그아웃', 'Sign Out')}</button>`;
    wrapper.querySelector('.auth-user-copy b').textContent = profile.name;
    wrapper.querySelector('.auth-user-copy small').textContent = profile.email || t('카카오 회원', 'Kakao member');
    authSlot.appendChild(wrapper);
  };

  const renderPartnerCenter = session => {
    const signedIn = Boolean(session?.user);
    authGate.hidden = signedIn;
    downloads.hidden = !signedIn;
    if (accessForm) accessForm.hidden = true;
    const securityTitle = partnerCenter.querySelector('.partner-security-note b');
    const securityCopy = partnerCenter.querySelector('.partner-security-note span');
    const lock = partnerCenter.querySelector('.partner-lock');

    if (securityTitle) {
      securityTitle.dataset.ko = signedIn ? '로그인 완료' : '회원 로그인 필요';
      securityTitle.dataset.en = signedIn ? 'SIGNED IN' : 'MEMBER SIGN-IN REQUIRED';
      securityTitle.textContent = t(securityTitle.dataset.ko, securityTitle.dataset.en);
    }
    if (securityCopy) {
      const profile = signedIn ? getProfile(session.user) : null;
      securityCopy.dataset.ko = signedIn ? `${profile.name}님, 파트너 자료실에 접속했습니다.` : 'Google 또는 카카오 계정으로 로그인해 주세요.';
      securityCopy.dataset.en = signedIn ? `Welcome ${profile.name}. Partner resources are now available.` : 'Sign in with your Google or Kakao account.';
      securityCopy.textContent = t(securityCopy.dataset.ko, securityCopy.dataset.en);
    }
    if (lock) lock.textContent = signedIn ? '✓' : '🔒';
    if (partnerNav) {
      partnerNav.dataset.ko = signedIn ? '파트너센터 ✓' : '파트너센터 🔒';
      partnerNav.dataset.en = signedIn ? 'Partner Center ✓' : 'Partner Center 🔒';
      partnerNav.textContent = t(partnerNav.dataset.ko, partnerNav.dataset.en);
    }
  };

  const render = session => {
    activeSession = session;
    renderHeader(session);
    renderPartnerCenter(session);
  };

  const updateLanguage = () => {
    authModal.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.textContent = element.dataset[language()];
    });
    authGate.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.textContent = element.dataset[language()];
    });
    render(activeSession);
  };

  const signIn = async provider => {
    const status = authModal.querySelector('.auth-status');
    status.textContent = t('로그인 화면으로 이동합니다…', 'Opening secure sign-in…');
    localStorage.setItem('harmonyAuthReturn', 'partner-center');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
    if (error) status.textContent = t(`로그인 오류: ${error.message}`, `Sign-in error: ${error.message}`);
  };

  document.addEventListener('click', async event => {
    if (event.target.closest('.auth-open')) {
      event.preventDefault();
      setModalOpen(true);
      return;
    }
    if (event.target.closest('[data-auth-close]')) {
      event.preventDefault();
      setModalOpen(false);
      return;
    }
    const providerButton = event.target.closest('[data-auth-provider]');
    if (providerButton) {
      event.preventDefault();
      providerButton.disabled = true;
      await signIn(providerButton.dataset.authProvider);
      providerButton.disabled = false;
      return;
    }
    if (event.target.closest('.auth-signout')) {
      event.preventDefault();
      await client.auth.signOut();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !authModal.hidden) setModalOpen(false);
  });

  const memberPortal = document.querySelector('.member-portal-preview button');
  if (memberPortal) {
    memberPortal.disabled = false;
    memberPortal.classList.add('auth-open');
    const label = memberPortal.querySelector('span');
    if (label) {
      label.dataset.ko = '회원 로그인';
      label.dataset.en = 'Member Sign In';
      label.textContent = t(label.dataset.ko, label.dataset.en);
    }
  }

  const callbackError = new URLSearchParams(window.location.search).get('error_description')
    || new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description');
  if (callbackError) {
    setModalOpen(true);
    authModal.querySelector('.auth-status').textContent = t(`로그인 오류: ${callbackError}`, `Sign-in error: ${callbackError}`);
  }

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      render(null);
      return;
    }
    render(data.session);
    if (data.session && localStorage.getItem('harmonyAuthReturn') === 'partner-center') {
      localStorage.removeItem('harmonyAuthReturn');
      window.setTimeout(() => partnerCenter.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
  });

  client.auth.onAuthStateChange((event, session) => {
    render(session);
    if (event === 'SIGNED_IN') setModalOpen(false);
  });

  new MutationObserver(updateLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
})();
