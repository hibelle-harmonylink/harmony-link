(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const AI_SHORTS_URL = 'https://ai-shorts-maker-production.up.railway.app/';

  const button = document.getElementById('aiShortsExecButton');
  const status = document.getElementById('aiShortsGateStatus');
  const authLibrary = window.supabase;
  const accessControl = window.HarmonyAccess;
  if (!button || !status || !authLibrary?.createClient || !accessControl) return;

  const client = authLibrary.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  const showStatus = html => {
    status.innerHTML = html;
    status.hidden = false;
  };

  // Loads the signed-in user's membership the same way auth.js does: prefer
  // the RPC (works even if direct-select grants are stale), fall back to a
  // direct member_profiles read if the RPC isn't available.
  const loadMemberAccess = async session => {
    if (!session?.user) return { role: 'guest', status: 'active', membership: 'free' };
    const { data: rpcData, error: rpcError } = await client.rpc('get_own_member_profile');
    if (!rpcError) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (row) return accessControl.normalizeUser(row);
    }
    const { data, error } = await client
      .from('member_profiles')
      .select('role,account_status,user_type,membership')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) return { role: 'member', account_status: 'active', user_type: 'student', membership: 'free' };
    return accessControl.normalizeUser(data);
  };

  let signedIn = false;
  let hasPremiumAccess = false;
  let session = null;

  const refresh = async () => {
    const { data } = await client.auth.getSession();
    session = data?.session || null;
    signedIn = Boolean(session?.user);
    const user = await loadMemberAccess(session);
    hasPremiumAccess = signedIn && accessControl.hasFeatureAccess(user, 'ai_shorts');
  };

  button.addEventListener('click', event => {
    if (hasPremiumAccess) {
      if (session?.access_token && session?.refresh_token) {
        event.preventDefault();
        window.open(`${AI_SHORTS_URL}#hl_at=${encodeURIComponent(session.access_token)}&hl_rt=${encodeURIComponent(session.refresh_token)}`, '_blank', 'noopener');
      }
      return;
    }
    event.preventDefault();
    if (!signedIn) {
      showStatus('회원 로그인이 필요합니다. <a href="../index.html?auth=login" target="_blank" rel="noopener">로그인하러 가기 ↗</a>');
    } else {
      showStatus('이 기능은 Premium($50) 회원 전용입니다. <a href="../index.html#contact" target="_blank" rel="noopener">Premium 회원 안내 보기 ↗</a>');
    }
  });

  refresh();
  client.auth.onAuthStateChange(() => { status.hidden = true; refresh(); });
})();
