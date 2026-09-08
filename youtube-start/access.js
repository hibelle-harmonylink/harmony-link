(function () {
  'use strict';
  var SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  var button = document.querySelector('.ytlab-ai-shorts-addon-btn');
  var access = window.HarmonyAccess;
  var client = window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  var state = { signedIn: false, premium: false };

  // Uses the shared canAccessPremiumApps() helper (access-control.js) so
  // this page's gate can never drift from the one every other page uses --
  // it already returns true for an active admin regardless of membership,
  // which a bare `membership === 'premium'` check here previously missed,
  // showing the admin the Premium($50)-required alert.
  function setState(signedIn, profile) {
    var member = access.normalizeUser(profile || {});
    state.signedIn = signedIn;
    state.premium = signedIn && access.canAccessPremiumApps(member);
  }

  async function loadAccess() {
    if (!client || !access || !button) return;
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

  button.addEventListener('click', async function (event) {
    event.preventDefault();
    if (!state.signedIn) {
      window.alert('회원 로그인이 필요합니다.');
      window.location.href = '../index.html?auth=login';
      return;
    }
    if (!state.premium) { window.alert('이 기능은 Premium($50) 회원 전용입니다.'); return; }

    var programWindow = window.open('about:blank', '_blank');
    if (programWindow) programWindow.opener = null;
    var sessionResult = await client.auth.getSession();
    var session = sessionResult.data && sessionResult.data.session;
    if (sessionResult.error || !session || !session.access_token || !session.refresh_token) {
      if (programWindow) programWindow.close();
      window.alert('회원 로그인이 필요합니다.');
      window.location.href = '../index.html?auth=login';
      return;
    }

    var target = new URL(button.dataset.premiumHref, window.location.href);
    target.hash = new URLSearchParams({
      hl_at: session.access_token,
      hl_rt: session.refresh_token
    }).toString();
    if (programWindow) programWindow.location.replace(target.toString());
    else window.location.href = target.toString();
  });
  loadAccess();
})();
