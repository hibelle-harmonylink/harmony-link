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
  let activeAuthMode = 'login';
  let activeMemberRole = 'guest';

  const authSlot = document.createElement('div');
  authSlot.className = 'auth-nav-slot';
  const navCta = nav.querySelector('.nav-cta');
  nav.insertBefore(authSlot, navCta || null);
  navCta?.remove();

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
        <button type="button" class="auth-provider google" data-auth-provider="google"><img src="assets/auth/google.svg" alt="Google"><span data-ko="Google로 로그인" data-en="Continue with Google">Google로 로그인</span></button>
        <button type="button" class="auth-provider kakao" data-auth-provider="kakao"><img src="assets/auth/kakao.svg" alt="Kakao"><span data-ko="카카오로 로그인" data-en="Continue with Kakao">카카오로 로그인</span></button>
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

  const approvalGate = document.createElement('div');
  approvalGate.className = 'partner-auth-gate partner-approval-gate';
  approvalGate.hidden = true;
  approvalGate.innerHTML = `
    <span class="partner-auth-icon" aria-hidden="true">⏳</span>
    <p class="eyebrow">PARTNER APPROVAL REQUIRED</p>
    <h3 data-ko="입점 파트너 승인 대기 중" data-en="Partner approval pending">입점 파트너 승인 대기 중</h3>
    <p data-ko="현재 일반회원입니다. 관리자가 입점 파트너로 승인하면 전용 자료실이 자동으로 열립니다." data-en="You are currently a general member. Partner resources will open automatically after administrator approval.">현재 일반회원입니다. 관리자가 입점 파트너로 승인하면 전용 자료실이 자동으로 열립니다.</p>
    <a class="btn btn-primary" href="https://docs.google.com/forms/d/14CqT8WtIl8Fj2h-M08tNpY0lsXh-GgsBNq5p2tnNjzk/viewform" target="_blank" rel="noopener"><span data-ko="입점 파트너 신청하기" data-en="Apply as a Partner">입점 파트너 신청하기</span><b>→</b></a>`;
  accessCard.insertBefore(approvalGate, downloads);

  const setAuthMode = mode => {
    activeAuthMode = mode === 'signup' ? 'signup' : 'login';
    const signup = activeAuthMode === 'signup';
    const title = authModal.querySelector('#authTitle');
    const description = title?.nextElementSibling;
    const googleLabel = authModal.querySelector('[data-auth-provider="google"] span');
    const kakaoLabel = authModal.querySelector('[data-auth-provider="kakao"] span');
    if (title) {
      title.dataset.ko = signup ? '간편하게 가입하세요' : '간편하게 로그인하세요';
      title.dataset.en = signup ? 'Join Harmony Link' : 'Sign in to Harmony Link';
    }
    if (description) {
      description.dataset.ko = signup ? 'Google 또는 카카오 계정으로 별도의 비밀번호 없이 가입할 수 있습니다.' : 'Google 또는 카카오 계정으로 안전하게 시작할 수 있습니다.';
      description.dataset.en = signup ? 'Join with Google or Kakao—no separate password needed.' : 'Continue securely with your Google or Kakao account.';
    }
    if (googleLabel) {
      googleLabel.dataset.ko = signup ? 'Google로 가입하기' : 'Google로 로그인';
      googleLabel.dataset.en = signup ? 'Join with Google' : 'Continue with Google';
    }
    if (kakaoLabel) {
      kakaoLabel.dataset.ko = signup ? '카카오로 가입하기' : '카카오로 로그인';
      kakaoLabel.dataset.en = signup ? 'Join with Kakao' : 'Continue with Kakao';
    }
  };

  const setModalOpen = (open, mode = activeAuthMode) => {
    authModal.hidden = !open;
    document.body.classList.toggle('modal-open', open);
    if (open) {
      setAuthMode(mode);
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
      const loginButton = document.createElement('button');
      loginButton.type = 'button';
      loginButton.className = 'header-login auth-open';
      loginButton.dataset.authMode = 'login';
      loginButton.innerHTML = `<span data-ko="로그인" data-en="Sign In">${t('로그인', 'Sign In')}</span>`;
      const signupButton = document.createElement('button');
      signupButton.type = 'button';
      signupButton.className = 'header-signup auth-open';
      signupButton.dataset.authMode = 'signup';
      signupButton.innerHTML = `<span data-ko="가입하기" data-en="Join">${t('가입하기', 'Join')}</span>`;
      authSlot.append(loginButton, signupButton);
      return;
    }

    const profile = getProfile(session.user);
    const roleLabel = activeMemberRole === 'admin'
      ? t('관리자', 'Administrator')
      : activeMemberRole === 'partner'
        ? t('승인 파트너', 'Approved Partner')
        : activeMemberRole === 'loading'
          ? t('회원 확인 중', 'Checking Membership')
          : t('일반회원', 'General Member');
    const wrapper = document.createElement('div');
    wrapper.className = 'auth-user';
    const avatar = safeAvatar(profile.avatar);
    const picture = avatar
      ? `<img src="${avatar}" alt="">`
      : `<span class="auth-avatar-fallback">${profile.name.trim().charAt(0).toUpperCase() || 'H'}</span>`;
    wrapper.innerHTML = `${picture}<span class="auth-user-copy"><b></b><small></small></span><span class="auth-user-actions"><button type="button" class="auth-signout" data-ko="로그아웃" data-en="Sign Out">${t('로그아웃', 'Sign Out')}</button><button type="button" class="auth-delete" data-ko="탈퇴하기" data-en="Delete Account">${t('탈퇴하기', 'Delete Account')}</button></span>`;
    wrapper.querySelector('.auth-user-copy b').textContent = profile.name;
    wrapper.querySelector('.auth-user-copy small').textContent = profile.email
      ? `${roleLabel} · ${profile.email}`
      : roleLabel;
    authSlot.appendChild(wrapper);
  };

  const renderPartnerCenter = session => {
    const signedIn = Boolean(session?.user);
    const isAdmin = signedIn && activeMemberRole === 'admin';
    const isPartner = signedIn && activeMemberRole === 'partner';
    const approvedPartner = isAdmin || isPartner;
    authGate.hidden = signedIn;
    approvalGate.hidden = !signedIn || approvedPartner;
    downloads.hidden = !approvedPartner;
    if (accessForm) accessForm.hidden = true;
    const securityTitle = partnerCenter.querySelector('.partner-security-note b');
    const securityCopy = partnerCenter.querySelector('.partner-security-note span');
    const lock = partnerCenter.querySelector('.partner-lock');

    if (securityTitle) {
      securityTitle.dataset.ko = isAdmin ? '관리자' : isPartner ? '승인된 입점 파트너' : signedIn ? '일반회원' : '회원 로그인 필요';
      securityTitle.dataset.en = isAdmin ? 'ADMINISTRATOR' : isPartner ? 'APPROVED PARTNER' : signedIn ? 'GENERAL MEMBER' : 'MEMBER SIGN-IN REQUIRED';
      securityTitle.textContent = t(securityTitle.dataset.ko, securityTitle.dataset.en);
    }
    if (securityCopy) {
      const profile = signedIn ? getProfile(session.user) : null;
      securityCopy.dataset.ko = isAdmin ? `${profile.name}님, 관리자 권한으로 접속했습니다.` : isPartner ? `${profile.name}님, 승인된 파트너 자료실에 접속했습니다.` : signedIn ? `${profile.name}님은 일반회원입니다. 파트너 승인 후 자료실을 이용할 수 있습니다.` : 'Google 또는 카카오 계정으로 로그인해 주세요.';
      securityCopy.dataset.en = isAdmin ? `${profile.name} is signed in as an administrator.` : isPartner ? `Welcome ${profile.name}. Approved partner resources are available.` : signedIn ? `${profile.name} is a general member. Partner approval is required for resource access.` : 'Sign in with your Google or Kakao account.';
      securityCopy.textContent = t(securityCopy.dataset.ko, securityCopy.dataset.en);
    }
    if (lock) lock.textContent = approvedPartner ? '✓' : signedIn ? '⏳' : '🔒';
    if (partnerNav) {
      partnerNav.dataset.ko = approvedPartner ? '파트너센터 ✓' : '파트너센터 🔒';
      partnerNav.dataset.en = approvedPartner ? 'Partner Center ✓' : 'Partner Center 🔒';
      partnerNav.textContent = t(partnerNav.dataset.ko, partnerNav.dataset.en);
    }
  };

  const render = session => {
    activeSession = session;
    renderHeader(session);
    renderPartnerCenter(session);
  };

  const loadMemberRole = async session => {
    if (!session?.user) return 'guest';
    const { data, error } = await client
      .from('member_profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) {
      console.error('Member role could not be loaded.', error);
      return 'member';
    }
    return data?.role || 'member';
  };

  const refreshMemberAccess = async session => {
    activeMemberRole = await loadMemberRole(session);
    render(session);
  };

  const isNewSignup = user => {
    const createdAt = Date.parse(user?.created_at || '');
    const lastSignInAt = Date.parse(user?.last_sign_in_at || '');
    if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) return false;
    return Date.now() - createdAt < 5 * 60 * 1000
      && Math.abs(lastSignInAt - createdAt) < 2 * 60 * 1000;
  };

  const notifyAdminOfNewSignup = async user => {
    if (!user?.id || !isNewSignup(user)) return;
    const notificationKey = `harmony-new-signup-notified:${user.id}`;
    if (localStorage.getItem(notificationKey)) return;

    localStorage.setItem(notificationKey, 'pending');
    const signupTime = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(new Date(user.created_at));
    const notification = new FormData();
    notification.set('_subject', '[Harmony Link] 새 회원 가입 알림');
    notification.set('_captcha', 'false');
    notification.set('알림 유형', '새 회원 가입');
    notification.set('가입 시간 (미동부)', signupTime);
    notification.set('가입자 확인', 'https://supabase.com/dashboard/project/ricndeoiomzjacmrsjtg/auth/users');

    try {
      const response = await fetch('https://formsubmit.co/ajax/hibelle@hibelleconsulting.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: notification
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      localStorage.setItem(notificationKey, 'sent');
    } catch (error) {
      localStorage.removeItem(notificationKey);
      console.error('New signup notification could not be sent.', error);
    }
  };

  const updateLanguage = () => {
    authModal.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.textContent = element.dataset[language()];
    });
    authGate.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.textContent = element.dataset[language()];
    });
    approvalGate.querySelectorAll('[data-ko][data-en]').forEach(element => {
      element.textContent = element.dataset[language()];
    });
    render(activeSession);
  };

  const signIn = async provider => {
    const status = authModal.querySelector('.auth-status');
    status.textContent = t('로그인 서버를 확인하고 있습니다…', 'Checking the secure sign-in service…');
    try {
      const health = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY }
      });
      if (!health.ok) throw new Error(`HTTP ${health.status}`);
    } catch {
      status.textContent = t('현재 로그인 서버에 연결할 수 없습니다. Supabase 프로젝트 상태를 확인해 주세요.', 'The sign-in service is currently unavailable. Please check the Supabase project status.');
      return;
    }
    status.textContent = t('로그인 화면으로 이동합니다…', 'Opening secure sign-in…');
    localStorage.setItem('harmonyAuthReturn', 'partner-center');
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const oauthOptions = { redirectTo };
    if (provider === 'kakao') {
      oauthOptions.scopes = 'profile_nickname profile_image';
    }
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: oauthOptions
    });
    if (error) status.textContent = t(`로그인 오류: ${error.message}`, `Sign-in error: ${error.message}`);
  };

  document.addEventListener('click', async event => {
    const authOpenButton = event.target.closest('.auth-open');
    if (authOpenButton) {
      event.preventDefault();
      setModalOpen(true, authOpenButton.dataset.authMode || 'login');
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
      return;
    }
    const deleteButton = event.target.closest('.auth-delete');
    if (deleteButton) {
      event.preventDefault();
      const confirmed = window.confirm(t(
        '정말 탈퇴하시겠습니까? 계정과 회원 정보가 모두 삭제되며 복구할 수 없습니다.',
        'Delete your account? Your account and membership information will be permanently removed and cannot be restored.'
      ));
      if (!confirmed) return;
      deleteButton.disabled = true;
      const { error } = await client.rpc('delete_own_account');
      if (error) {
        deleteButton.disabled = false;
        window.alert(t('탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'Account deletion failed. Please try again.'));
        return;
      }
      await client.auth.signOut({ scope: 'local' });
      window.alert(t('회원 탈퇴가 완료되었습니다.', 'Your account has been deleted.'));
      window.location.replace(`${window.location.origin}${window.location.pathname}`);
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

  client.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      render(null);
      return;
    }
    activeMemberRole = data.session ? 'loading' : 'guest';
    render(data.session);
    await refreshMemberAccess(data.session);
    if (data.session && localStorage.getItem('harmonyAuthReturn') === 'partner-center') {
      localStorage.removeItem('harmonyAuthReturn');
      window.setTimeout(() => partnerCenter.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
  });

  client.auth.onAuthStateChange((event, session) => {
    activeMemberRole = session ? 'loading' : 'guest';
    render(session);
    void refreshMemberAccess(session);
    if (event === 'SIGNED_IN') {
      setModalOpen(false);
      void notifyAdminOfNewSignup(session?.user);
    }
  });

  new MutationObserver(updateLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
})();
