(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const signupAutomationUrl = window.signupAutomationUrl || '';
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
  let activeMemberStatus = 'active';
  let activeMemberName = '';
  let activeMemberType = 'general';
  let activeMemberPremium = false;
  let selectedSignupType = 'general';

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
      <div class="auth-mode-tabs" role="tablist" aria-label="회원 접속 방식">
        <button type="button" role="tab" data-auth-mode-tab="login" data-ko="로그인" data-en="Sign In">로그인</button>
        <button type="button" role="tab" data-auth-mode-tab="signup" data-ko="가입하기" data-en="Join">가입하기</button>
      </div>
      <h2 id="authTitle" data-ko="간편하게 로그인하세요" data-en="Sign in to Harmony Link">간편하게 로그인하세요</h2>
      <p data-ko="Google 또는 카카오 계정으로 안전하게 시작할 수 있습니다." data-en="Continue securely with your Google or Kakao account.">Google 또는 카카오 계정으로 안전하게 시작할 수 있습니다.</p>
      <div class="auth-member-type" hidden>
        <span data-ko="가입 유형을 선택해 주세요" data-en="Choose your membership type">가입 유형을 선택해 주세요</span>
        <div>
          <button type="button" class="active" data-signup-type="general"><b data-ko="일반회원" data-en="General member">일반회원</b><small data-ko="소식과 무료 프로그램 확인" data-en="News and free programs">소식과 무료 프로그램 확인</small></button>
          <button type="button" data-signup-type="student"><b data-ko="수강생" data-en="Learner">수강생</b><small data-ko="교육 신청과 수강 안내" data-en="Learning requests and class updates">교육 신청과 수강 안내</small></button>
        </div>
      </div>
      <div class="auth-provider-list">
        <button type="button" class="auth-provider google" data-auth-provider="google"><img src="assets/auth/google.svg" alt="Google"><span data-ko="Google로 로그인" data-en="Continue with Google">Google로 로그인</span></button>
        <button type="button" class="auth-provider kakao" data-auth-provider="kakao"><img src="assets/auth/kakao.svg" alt="Kakao"><span data-ko="카카오로 로그인" data-en="Continue with Kakao">카카오로 로그인</span></button>
      </div>
      <p class="auth-status" role="status"></p>
      <small data-ko="로그인하면 이용약관과 개인정보처리방침에 동의한 것으로 간주됩니다." data-en="By signing in, you agree to the Terms and Privacy Policy.">로그인하면 이용약관과 개인정보처리방침에 동의한 것으로 간주됩니다.</small>
    </section>`;
  document.body.appendChild(authModal);

  const footerAccountLinks = document.querySelector('.footer-bottom div');
  const footerDeleteButton = document.getElementById('footerDeleteAccount');

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
    <span class="partner-auth-icon" aria-hidden="true">💬</span>
    <p class="eyebrow">MEMBER COMMUNITY</p>
    <h3 data-ko="회원 커뮤니티를 이용하세요" data-en="Enter the member community">회원 커뮤니티를 이용하세요</h3>
    <p data-ko="일반회원과 수강생은 승인 대기 없이 가입 즉시 커뮤니티에서 공지와 게시글을 확인할 수 있습니다." data-en="General members and learners can enter the community immediately without waiting for approval.">일반회원과 수강생은 승인 대기 없이 가입 즉시 커뮤니티에서 공지와 게시글을 확인할 수 있습니다.</p>
    <a class="btn btn-primary" href="community.html?refresh=20260815-301"><span data-ko="커뮤니티 입장" data-en="Enter Community">커뮤니티 입장</span><b>→</b></a>`;
  accessCard.insertBefore(approvalGate, downloads);

  const setAuthMode = mode => {
    activeAuthMode = mode === 'signup' ? 'signup' : 'login';
    const signup = activeAuthMode === 'signup';
    const memberTypePicker = authModal.querySelector('.auth-member-type');
    if (memberTypePicker) memberTypePicker.hidden = !signup;
    authModal.querySelector('.auth-panel')?.classList.toggle('signup-mode', signup);
    authModal.querySelectorAll('[data-auth-mode-tab]').forEach(tab => {
      const selected = tab.dataset.authModeTab === activeAuthMode;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
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

  const requestedAuthMode = new URLSearchParams(location.search).get('auth');
  if (requestedAuthMode === 'signup' || requestedAuthMode === 'login') {
    window.setTimeout(() => setModalOpen(true, requestedAuthMode), 250);
  }

  const getProfile = user => {
    const metadata = user?.user_metadata || {};
    const name = activeMemberName || metadata.full_name || metadata.name || metadata.nickname || user?.email?.split('@')[0] || t('회원', 'Member');
    const avatar = metadata.custom_avatar || metadata.avatar_url || metadata.picture || metadata.profile_image_url || '';
    return { name, avatar, email: user?.email || '' };
  };

  const safeAvatar = avatar => {
    if (!avatar) return '';
    if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(avatar)) return avatar;
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
      footerDeleteButton.hidden = false;
      footerDeleteButton.textContent = t('회원 탈퇴', 'Delete Account');
      const signupButton = document.createElement('button');
      signupButton.type = 'button';
      signupButton.className = 'header-signup auth-open';
      signupButton.dataset.authMode = 'signup';
      signupButton.innerHTML = `<span data-ko="가입" data-en="Join">${t('가입', 'Join')}</span>`;
      const loginButton = document.createElement('button');
      loginButton.type = 'button';
      loginButton.className = 'header-login auth-open';
      loginButton.dataset.authMode = 'login';
      loginButton.innerHTML = `<span data-ko="로그인" data-en="Sign In">${t('로그인', 'Sign In')}</span>`;
      authSlot.append(signupButton, loginButton);
      return;
    }

    const profile = getProfile(session.user);
    footerDeleteButton.hidden = false;
    footerDeleteButton.textContent = t('회원 탈퇴', 'Delete Account');
    const roleLabel = activeMemberStatus === 'suspended'
      ? t('이용 중지', 'Suspended')
      : activeMemberRole === 'admin'
      ? t('관리자', 'Administrator')
      : activeMemberRole === 'partner50'
        ? t('PREMIUM 파트너 · $50', 'PREMIUM Partner · $50')
        : activeMemberRole === 'partner20'
          ? t('BASIC 파트너 · $20', 'BASIC Partner · $20')
          : activeMemberRole === 'partner0'
            ? t('무료 파트너', 'Free Partner')
        : activeMemberRole === 'loading'
          ? t('회원 확인 중', 'Checking Membership')
          : activeMemberType === 'student'
            ? t('수강생', 'Learner')
            : t('일반회원', 'General Member');
    const wrapper = document.createElement('div');
    wrapper.className = `auth-user${activeMemberRole === 'admin' ? ' admin-auth-user' : ''}`;
    const avatar = safeAvatar(profile.avatar);
    const picture = avatar
      ? `<img src="${avatar}" alt="">`
      : `<span class="auth-avatar-fallback">${profile.name.trim().charAt(0).toUpperCase() || 'H'}</span>`;
    wrapper.innerHTML = `<button type="button" class="auth-avatar-edit" title="${t('프로필 사진 변경', 'Change profile photo')}" aria-label="${t('프로필 사진 변경', 'Change profile photo')}">${picture}</button><input class="auth-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" hidden><span class="auth-user-copy"><b></b><small></small></span><button type="button" class="auth-signout" data-ko="로그아웃" data-en="Sign Out">${t('로그아웃', 'Sign Out')}</button>`;
    wrapper.querySelector('.auth-user-copy b').textContent = profile.name;
    wrapper.querySelector('.auth-user-copy small').textContent = roleLabel;
    const avatarButton = wrapper.querySelector('.auth-avatar-edit');
    const avatarInput = wrapper.querySelector('.auth-avatar-input');
    avatarButton.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) { window.alert(t('8MB 이하의 사진을 선택해 주세요.', 'Please choose an image under 8MB.')); return; }
      avatarButton.disabled = true;
      try {
        const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = source; });
        const size = 240; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const context = canvas.getContext('2d'); const scale = Math.max(size / image.width, size / image.height); const width = image.width * scale; const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        const customAvatar = canvas.toDataURL('image/jpeg', .82);
        const { error } = await client.auth.updateUser({ data: { custom_avatar: customAvatar } });
        if (error) throw error;
        const { data } = await client.auth.getSession(); activeSession = data.session; renderHeader(activeSession);
      } catch (error) { window.alert(t('프로필 사진을 변경하지 못했습니다. 다시 시도해 주세요.', 'Could not change the profile photo. Please try again.')); }
      finally { avatarButton.disabled = false; }
    });
    if (activeMemberRole === 'admin' && activeMemberStatus === 'active') {
      const adminLink = document.createElement('a');
      adminLink.className = 'admin-member-link';
      adminLink.href = 'admin.html';
      adminLink.textContent = t('회원관리', 'Members');
      authSlot.appendChild(adminLink);
    }
    authSlot.appendChild(wrapper);
  };

  const renderPartnerCenter = session => {
    const signedIn = Boolean(session?.user);
    const accountActive = activeMemberStatus !== 'suspended';
    const isAdmin = signedIn && accountActive && activeMemberRole === 'admin';
    const isFreePartner = signedIn && accountActive && activeMemberRole === 'partner0';
    const isBasicPartner = signedIn && accountActive && activeMemberRole === 'partner20';
    const isPremiumPartner = signedIn && accountActive && activeMemberRole === 'partner50';
    const isPartner = isFreePartner || isBasicPartner || isPremiumPartner;
    const approvedPartner = isAdmin || isPartner;
    authGate.hidden = signedIn;
    approvalGate.hidden = !signedIn || approvedPartner;
    downloads.hidden = !approvedPartner;
    if (accessForm) accessForm.hidden = true;
    const securityTitle = partnerCenter.querySelector('.partner-security-note b');
    const securityCopy = partnerCenter.querySelector('.partner-security-note span');
    const lock = partnerCenter.querySelector('.partner-lock');

    if (securityTitle) {
      securityTitle.dataset.ko = !accountActive ? '계정 이용 중지' : isAdmin ? '관리자' : isPremiumPartner ? 'PREMIUM 파트너 · $50' : isBasicPartner ? 'BASIC 파트너 · $20' : isFreePartner ? '무료 파트너' : signedIn && activeMemberType === 'student' ? '수강생' : signedIn ? '일반회원' : '회원 로그인 필요';
      securityTitle.dataset.en = !accountActive ? 'ACCOUNT SUSPENDED' : isAdmin ? 'ADMINISTRATOR' : isPremiumPartner ? 'PREMIUM PARTNER · $50' : isBasicPartner ? 'BASIC PARTNER · $20' : isFreePartner ? 'FREE PARTNER' : signedIn && activeMemberType === 'student' ? 'LEARNER' : signedIn ? 'GENERAL MEMBER' : 'MEMBER SIGN-IN REQUIRED';
      securityTitle.textContent = t(securityTitle.dataset.ko, securityTitle.dataset.en);
    }
    if (securityCopy) {
      const profile = signedIn ? getProfile(session.user) : null;
      securityCopy.dataset.ko = !accountActive ? `${profile.name}님의 홈페이지 이용이 중지되었습니다. 관리자에게 문의해 주세요.` : isAdmin ? `${profile.name}님, 관리자 권한으로 접속했습니다.` : isPremiumPartner ? `${profile.name}님, $50 PREMIUM 파트너 자료실에 접속했습니다.` : isBasicPartner ? `${profile.name}님, $20 BASIC 파트너 자료실에 접속했습니다.` : isFreePartner ? `${profile.name}님, 무료 파트너 자료실에 접속했습니다.` : signedIn && activeMemberType === 'student' ? `${profile.name}님은 수강생 회원입니다. 이 자료실은 승인된 입점 파트너 전용입니다.` : signedIn ? `${profile.name}님은 일반회원입니다. 이 자료실은 승인된 입점 파트너 전용입니다.` : 'Google 또는 카카오 계정으로 로그인해 주세요.';
      securityCopy.dataset.en = !accountActive ? `${profile.name}'s website access is suspended. Please contact an administrator.` : isAdmin ? `${profile.name} is signed in as an administrator.` : isPremiumPartner ? `Welcome ${profile.name}. Your $50 PREMIUM partner resources are available.` : isBasicPartner ? `Welcome ${profile.name}. Your $20 BASIC partner resources are available.` : isFreePartner ? `Welcome ${profile.name}. Your free partner resources are available.` : signedIn && activeMemberType === 'student' ? `${profile.name} is a learner. This resource center is for approved partners.` : signedIn ? `${profile.name} is a general member. This resource center is for approved partners.` : 'Sign in with your Google or Kakao account.';
      securityCopy.textContent = t(securityCopy.dataset.ko, securityCopy.dataset.en);
    }
    const accessBadge = downloads.querySelector('.unlocked-badge');
    if (accessBadge) {
      accessBadge.textContent = isAdmin ? t('관리자 전체 이용', 'ADMIN FULL ACCESS') : isPremiumPartner ? t('PREMIUM · $50', 'PREMIUM · $50') : isBasicPartner ? t('BASIC · $20', 'BASIC · $20') : t('무료 파트너', 'FREE PARTNER');
      accessBadge.classList.toggle('premium-tier-badge', isPremiumPartner);
      accessBadge.classList.toggle('basic-tier-badge', isBasicPartner);
    }
    const resourceTier = isAdmin || isPremiumPartner ? 50 : isBasicPartner ? 20 : 0;
    if (approvedPartner) window.HarmonyPartnerResources?.setAccessTier(resourceTier, resourceTier);
    if (lock) {
      lock.textContent = approvedPartner ? '✓' : signedIn ? '⏳' : '🔒';
      lock.classList.toggle('partner-lock-action', approvedPartner);
      lock.tabIndex = approvedPartner ? 0 : -1;
      lock.setAttribute('role', approvedPartner ? 'button' : 'img');
      lock.setAttribute('aria-label', approvedPartner ? t('시작하기 필수 자료 열기', 'Open required getting-started resources') : t('파트너 자료실 접근 상태', 'Partner resource access status'));
    }
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
    publishAuthState();
  };

  const partnerStatusMark = partnerCenter.querySelector('.partner-lock');
  if (partnerStatusMark) {
    const openPartnerStart = () => {
      if (downloads.hidden) return;
      const firstToggle = downloads.querySelector('.partner-resource-toggle');
      const firstPanel = firstToggle
        ? downloads.querySelector(`#${firstToggle.getAttribute('aria-controls')}`)
        : null;
      if (firstPanel?.hidden) firstToggle.click();
      downloads.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    partnerStatusMark.addEventListener('click', openPartnerStart);
    partnerStatusMark.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openPartnerStart();
    });
  }

  const loadMemberAccess = async session => {
    if (!session?.user) return { role: 'guest', status: 'active' };
    const { data, error } = await client
      .from('member_profiles')
      .select('role,account_status,display_name,member_type,premium_member')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) {
      console.error('Member access could not be loaded.', error);
      return { role: 'member', status: 'active', type: 'general', premium: false };
    }
    return { role: data?.role || 'member', status: data?.account_status || 'active', name: data?.display_name || '', type: data?.member_type || 'general', premium: data?.premium_member === true };
  };

  const refreshMemberAccess = async session => {
    const access = await loadMemberAccess(session);
    activeMemberRole = access.role;
    activeMemberStatus = access.status;
    activeMemberName = access.name || '';
    activeMemberType = access.type || 'general';
    activeMemberPremium = access.premium === true;
    render(session);
  };

  // Lets other on-page scripts (e.g. the AI Shorts card) react to sign-in
  // state without re-implementing Supabase auth: a single source of truth
  // published on window and re-broadcast on every render.
  const publishAuthState = () => {
    const hasPremiumAccess = activeMemberStatus === 'active'
      && (activeMemberRole === 'admin' || activeMemberPremium === true);
    const state = {
      loading: activeMemberRole === 'loading',
      signedIn: Boolean(activeSession?.user),
      role: activeMemberRole,
      status: activeMemberStatus,
      memberType: activeMemberType,
      premium: activeMemberPremium,
      isAdmin: activeMemberRole === 'admin',
      hasPremiumAccess
    };
    window.HarmonyAuthState = state;
    document.dispatchEvent(new CustomEvent('harmony-auth-change', { detail: state }));
  };

  window.HarmonyAuthGetSession = () => client.auth.getSession();

  const applyPendingMemberType = async session => {
    if (!session?.user) return;
    const pendingType = localStorage.getItem('harmonyPendingMemberType');
    if (pendingType !== 'general' && pendingType !== 'student') return;
    const { error } = await client.rpc('set_own_member_type', { p_member_type: pendingType });
    if (!error) localStorage.removeItem('harmonyPendingMemberType');
    else console.error('Member type could not be saved.', error);
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

    const signupRecord = new FormData();
    const profile = getProfile(user);
    signupRecord.set('기록 유형', '회원가입');
    signupRecord.set('회원 ID', user.id);
    signupRecord.set('가입 시각', user.created_at || new Date().toISOString());
    signupRecord.set('이름', profile.name);
    signupRecord.set('이메일', profile.email);
    signupRecord.set('가입 방식', user.app_metadata?.provider || 'social');
    signupRecord.set('회원 유형', activeMemberType === 'student' ? '수강생' : '일반회원');
    signupRecord.set('파트너 등급', '');
    signupRecord.set('회원 구분', activeMemberType === 'student' ? '수강생' : '일반회원');
    signupRecord.set('가입 경로', 'Harmony Link 홈페이지');

    try {
      const deliveries = [fetch('https://formsubmit.co/ajax/hibelle@hibelleconsulting.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: notification
      })];
      if (signupAutomationUrl) {
        deliveries.push(fetch(signupAutomationUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: signupRecord
        }));
      }
      const [response] = await Promise.all(deliveries);
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
    if (activeAuthMode === 'signup') localStorage.setItem('harmonyPendingMemberType', selectedSignupType);
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
    const signupTypeButton = event.target.closest('[data-signup-type]');
    if (signupTypeButton) {
      event.preventDefault();
      selectedSignupType = signupTypeButton.dataset.signupType === 'student' ? 'student' : 'general';
      authModal.querySelectorAll('[data-signup-type]').forEach(button => button.classList.toggle('active', button === signupTypeButton));
      return;
    }
    const modeTab = event.target.closest('[data-auth-mode-tab]');
    if (modeTab) {
      setAuthMode(modeTab.dataset.authModeTab);
      updateLanguage();
      return;
    }
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
      if (!activeSession?.user) {
        setModalOpen(true, 'login');
        authModal.querySelector('.auth-status').textContent = t(
          '회원 탈퇴를 하려면 먼저 로그인해 주세요.',
          'Please sign in before deleting your account.'
        );
        return;
      }
      const confirmed = window.confirm(t(
        '정말 회원 탈퇴를 원하시나요?\n\n탈퇴하면 계정과 회원 정보가 모두 영구 삭제되며 다시 복구할 수 없습니다.\n계속하려면 확인을 눌러 주세요.',
        'Are you sure you want to delete your account?\n\nYour account and membership information will be permanently deleted and cannot be restored.\nSelect OK to continue.'
      ));
      if (!confirmed) return;
      deleteButton.disabled = true;
      const { error: rosterError } = await client.functions.invoke('notify-role-change', {
        body: { action: 'member_withdrawal' }
      });
      if (rosterError) {
        deleteButton.disabled = false;
        window.alert(t('회원명단 변경에 실패하여 탈퇴를 중단했습니다. 잠시 후 다시 시도해 주세요.', 'The member roster could not be updated, so account deletion was stopped. Please try again.'));
        return;
      }
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
    activeMemberStatus = data.session ? 'loading' : 'active';
    render(data.session);
    await applyPendingMemberType(data.session);
    await refreshMemberAccess(data.session);
    if (data.session && localStorage.getItem('harmonyAuthReturn') === 'partner-center') {
      localStorage.removeItem('harmonyAuthReturn');
      window.setTimeout(() => partnerCenter.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
  });

  client.auth.onAuthStateChange(async (event, session) => {
    activeMemberRole = session ? 'loading' : 'guest';
    activeMemberStatus = session ? 'loading' : 'active';
    render(session);
    await applyPendingMemberType(session);
    await refreshMemberAccess(session);
    if (event === 'SIGNED_IN') {
      setModalOpen(false);
      await notifyAdminOfNewSignup(session?.user);
    }
  });

  let accessRefreshRunning = false;
  const refreshAccessFromServer = async () => {
    if (accessRefreshRunning) return;
    accessRefreshRunning = true;
    try {
      const { data } = await client.auth.getSession();
      await refreshMemberAccess(data.session || null);
    } finally {
      accessRefreshRunning = false;
    }
  };
  window.addEventListener('focus', refreshAccessFromServer);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshAccessFromServer();
  });

  new MutationObserver(updateLanguage).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
})();
