(function () {
  'use strict';
  var SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  var button = document.querySelector('.ytlab-ai-shorts-addon-btn');
  var notice = document.querySelector('.ytlab-ai-shorts-addon-notice');
  var access = window.HarmonyAccess;
  var client = window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  var state = { signedIn: false, premium: false };

  function setState(signedIn, profile) {
    var member = access.normalizeUser(profile || {});
    state.signedIn = signedIn;
    state.premium = signedIn && member.account_status === 'active' && member.membership === 'premium';
    notice.textContent = !signedIn
      ? '회원 로그인이 필요합니다.'
      : state.premium
        ? 'Premium($50) 회원 이용 가능'
        : '이 기능은 Premium($50) 회원 전용입니다.';
    button.classList.toggle('is-locked', !state.premium);
    button.setAttribute('aria-disabled', String(!state.premium));
  }

  async function loadAccess() {
    if (!client || !access || !button || !notice) return;
    var sessionResult = await client.auth.getSession();
    var session = sessionResult.data && sessionResult.data.session;
    if (!session || !session.user) { setState(false); return; }
    var profileResult = await client.rpc('get_own_member_profile');
    var profile = Array.isArray(profileResult.data) ? profileResult.data[0] : profileResult.data;
    if (profileResult.error || !profile) {
      var fallback = await client.from('member_profiles').select('role,account_status,member_type,user_type,membership').eq('id', session.user.id).maybeSingle();
      profile = fallback.data;
    }
    setState(true, profile);
  }

  button.addEventListener('click', function (event) {
    event.preventDefault();
    if (!state.signedIn) { window.alert('회원 로그인이 필요합니다.'); return; }
    if (!state.premium) { window.alert('이 기능은 Premium($50) 회원 전용입니다.'); return; }
    window.open(button.dataset.premiumHref, '_blank', 'noopener,noreferrer');
  });
  loadAccess();
})();
