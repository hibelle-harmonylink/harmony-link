import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://hibelleharmony.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const allowedRoles = ['member', 'partner0', 'partner20', 'partner50'];

function normalizeNotifiableRole(role: unknown, userType: unknown, membership: unknown) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const normalizedUserType = String(userType || '').trim().toLowerCase();
  const normalizedMembership = String(membership || '').trim().toLowerCase();

  if (normalizedRole === 'admin') return 'admin';
  if (allowedRoles.includes(normalizedRole)) return normalizedRole;
  if (normalizedRole === 'partner' || normalizedUserType === 'partner') {
    if (normalizedMembership === 'premium') return 'partner50';
    if (normalizedMembership === 'basic') return 'partner20';
    return 'partner0';
  }
  if (
    normalizedRole === 'student'
    || normalizedRole === 'general'
    || normalizedUserType === 'student'
    || normalizedUserType === 'general'
  ) return 'member';

  return normalizedRole;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookUrl = Deno.env.get('ROLE_EMAIL_WEBHOOK_URL')!;
    const webhookSecret = Deno.env.get('ROLE_EMAIL_WEBHOOK_SECRET')!;
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (!webhookUrl || !webhookSecret) return json({ error: 'Notification service is not configured' }, 503);
    const requestBody = await request.json();
    if (requestBody.action === 'member_withdrawal') {
      const authorization = request.headers.get('Authorization') || '';
      if (!authorization) return json({ error: 'Authentication required' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user?.email) return json({ error: 'Authentication required' }, 401);
      const { data: memberProfile } = await adminClient.from('member_profiles').select('display_name,member_type,role').eq('id', user.id).maybeSingle();
      const metadata = user.user_metadata || {};
      const memberName = memberProfile?.display_name || metadata.full_name || metadata.name || metadata.nickname || user.email.split('@')[0];
      const formData = new FormData();
      formData.set('action', 'member_withdrawal');
      formData.set('webhook_secret', webhookSecret);
      formData.set('member_id', user.id);
      formData.set('member_email', user.email);
      formData.set('member_name', memberName);
      formData.set('member_joined_at', user.created_at || '');
      formData.set('member_signup_method', String(user.app_metadata?.provider || user.app_metadata?.providers?.[0] || ''));
      formData.set('member_signup_path', 'Harmony Link 홈페이지');
      formData.set('member_type', String(memberProfile?.member_type || 'general'));
      formData.set('partner_tier', String(memberProfile?.role || 'member'));
      const rosterResponse = await fetch(webhookUrl, { method: 'POST', body: formData, redirect: 'follow' });
      const rosterResult = await rosterResponse.text();
      const rosterJson = parseWebhookResult(rosterResult);
      if (!rosterResponse.ok || rosterJson?.ok !== true) {
        console.error('Withdrawal roster webhook failed', rosterResponse.status, rosterResult.slice(0, 500));
        return json({ ok: true, rosterUpdated: false, warning: rosterJson?.error || `Roster update failed (${rosterResponse.status})` });
      }
      return json({ ok: true, rosterUpdated: true });
    }
    if (requestBody.action === 'profile_sync') {
      const authorization = request.headers.get('Authorization') || '';
      if (!authorization) return json({ error: 'Authentication required' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) return json({ error: 'Authentication required' }, 401);
      const { data: administrator } = await userClient.from('member_profiles').select('role,account_status').eq('id', user.id).maybeSingle();
      if (administrator?.role !== 'admin' || administrator?.account_status !== 'active') return json({ error: 'Administrator access required' }, 403);

      const syncMemberId = String(requestBody.memberId || '');
      if (!syncMemberId) return json({ error: 'Member id is required' }, 400);

      const { data: syncTargetUser, error: syncTargetError } = await adminClient.auth.admin.getUserById(syncMemberId);
      if (syncTargetError || !syncTargetUser?.user?.email) return json({ error: 'Member not found' }, 404);

      // member_profiles intentionally denies direct table SELECT to
      // service_role. Reuse the same narrow, security-definer admin RPC that
      // backs the member-management screen instead of widening table grants.
      const { data: syncProfiles, error: syncProfileError } = await userClient.rpc('admin_list_members', {
        p_search: syncTargetUser.user.email,
        p_role: null,
      });
      if (syncProfileError) {
        console.error('Member profile lookup failed', syncProfileError);
        return json({ error: 'Member profile lookup failed' }, 500);
      }
      const syncProfile = (syncProfiles || []).find((profile: { id?: string }) => profile.id === syncMemberId) || null;
      if (!syncProfile) return json({ error: 'Member profile not found' }, 404);

      const syncMetadata = syncTargetUser.user.user_metadata || {};
      const syncMemberName = syncProfile.display_name || syncMetadata.full_name || syncMetadata.name || syncMetadata.nickname || syncTargetUser.user.email.split('@')[0];

      const syncIsPremium = syncProfile.membership === 'premium';
      const syncPartnerTier = normalizeNotifiableRole(syncProfile.role, syncProfile.user_type, syncProfile.membership);

      const syncFormData = new FormData();
      syncFormData.set('action', 'profile_sync');
      syncFormData.set('webhook_secret', webhookSecret);
      syncFormData.set('member_id', syncMemberId);
      syncFormData.set('member_email', syncTargetUser.user.email);
      syncFormData.set('member_name', syncMemberName);
      syncFormData.set('member_type', String(syncProfile.member_type || 'general'));
      // `role` is a protected compatibility column. Never send it as a
      // mutable profile-sync field: older roster webhooks reject that with
      // HTTP 409 even when the administrator only changed a name, membership,
      // or account status. The roster only needs the derived partner tier, so
      // send that under its own explicit field instead.
      syncFormData.set('partner_tier', syncPartnerTier || 'member');
      syncFormData.set('membership', String(syncProfile.membership || 'free'));
      syncFormData.set('premium', syncIsPremium ? 'true' : 'false');
      syncFormData.set('account_status', String(syncProfile.account_status || 'active'));

      const syncResponse = await fetch(webhookUrl, { method: 'POST', body: syncFormData, redirect: 'follow' });
      const syncResultText = await syncResponse.text();
      const syncJson = parseWebhookResult(syncResultText);
      if (!syncResponse.ok || syncJson?.ok !== true) {
        console.error('Profile sync webhook failed', syncResponse.status, syncResultText.slice(0, 500));
        return json({ error: syncJson?.error || `Roster sync failed (${syncResponse.status})` }, 502);
      }
      return json({ ok: true });
    }

    const isMemberTypeChange = requestBody.action === 'member_type_change';
    let memberId = requestBody.memberId || '';
    let memberEmail = requestBody.memberEmail || '';
    let oldRole = requestBody.oldRole || '';
    let queuedNotificationId = '';
    let queuedRole = '';

    if (requestBody.notificationId) {
      let queued = null;
      let queueError = null;
      for (let attempt = 0; attempt < 8 && !queued; attempt += 1) {
        const result = await adminClient.rpc('internal_get_role_email', {
          p_notification_id: requestBody.notificationId
        });
        queued = result.data?.[0] || null;
        queueError = result.error;
        if (!queued) await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!queued) return json({ error: queueError?.message || 'Queued notification not found' }, 404);
      if (queued.processed_at) return json({ ok: true, duplicate: true });
      queuedNotificationId = queued.id;
      memberId = queued.member_id;
      oldRole = queued.old_role || '';
      queuedRole = queued.new_role || '';
    } else {
      const authorization = request.headers.get('Authorization') || '';
      if (!authorization) return json({ error: 'Authentication required' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) return json({ error: 'Authentication required' }, 401);
      const { data: administrator } = await userClient.from('member_profiles').select('role,account_status').eq('id', user.id).maybeSingle();
      if (administrator?.role !== 'admin' || administrator?.account_status !== 'active') return json({ error: 'Administrator access required' }, 403);
      if (!memberId && !memberEmail) return json({ error: 'Member id or email is required' }, 400);
    }
    let targetUser = null;
    if (memberId) {
      const { data, error } = await adminClient.auth.admin.getUserById(memberId);
      if (error) return json({ error: 'Member lookup failed' }, 404);
      targetUser = data.user;
    } else {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) return json({ error: 'Member lookup failed' }, 404);
      targetUser = data.users.find(user => user.email?.toLowerCase() === String(memberEmail).toLowerCase()) || null;
    }
    if (!targetUser?.email) return json({ error: 'Member not found' }, 404);
    const resolvedMemberId = targetUser.id;
    const { data: memberProfile, error: memberProfileError } = await adminClient
      .from('member_profiles')
      .select('role,display_name,member_type,user_type,membership')
      .eq('id', resolvedMemberId)
      .maybeSingle();
    if (memberProfileError) {
      console.error('Member profile lookup failed', memberProfileError);
      return json({ error: 'Member profile lookup failed' }, 500);
    }
    if (!memberProfile) return json({ error: 'Member profile not found' }, 404);

    const storedRole = normalizeNotifiableRole(memberProfile.role, memberProfile.user_type, memberProfile.membership);
    const normalizedQueuedRole = queuedRole
      ? normalizeNotifiableRole(queuedRole, memberProfile.user_type, memberProfile.membership)
      : '';
    if (normalizedQueuedRole && normalizedQueuedRole !== storedRole) {
      return json({ error: 'Queued member role does not match the stored member role' }, 409);
    }
    if (!allowedRoles.includes(storedRole)) return json({ error: 'Stored member role cannot be notified' }, 409);

    const metadata = targetUser.user_metadata || {};
    const memberName = memberProfile?.display_name || metadata.full_name || metadata.name || metadata.nickname || targetUser.email.split('@')[0];
    const storedMemberType = memberProfile.member_type || memberProfile.user_type || 'general';
    const formData = new FormData();
    formData.set('action', isMemberTypeChange ? 'member_type_change' : 'role_change');
    formData.set('webhook_secret', webhookSecret);
    formData.set('member_id', resolvedMemberId);
    formData.set('member_email', targetUser.email);
    formData.set('member_name', memberName);
    formData.set('member_joined_at', targetUser.created_at || '');
    formData.set('member_signup_method', String(targetUser.app_metadata?.provider || targetUser.app_metadata?.providers?.[0] || ''));
    formData.set('member_signup_path', 'Harmony Link 홈페이지');
    const normalizedOldRole = normalizeNotifiableRole(oldRole, '', '');
    formData.set('old_role', allowedRoles.includes(normalizedOldRole) ? normalizedOldRole : '');
    formData.set('new_role', storedRole);
    formData.set('member_type', storedMemberType);
    formData.set('partner_tier', storedRole);
    const emailResponse = await fetch(webhookUrl, { method: 'POST', body: formData, redirect: 'follow' });
    const emailResult = await emailResponse.text();
    const emailJson = parseWebhookResult(emailResult);
    if (!emailResponse.ok || emailJson?.ok !== true) {
      console.error('Role email webhook failed', emailResponse.status, emailResult.slice(0, 500));
      if (queuedNotificationId) await adminClient.rpc('internal_finish_role_email', {
        p_notification_id: queuedNotificationId,
        p_error: emailJson?.error || `HTTP ${emailResponse.status}`
      });
      return json({ error: emailJson?.error || `Email delivery failed (${emailResponse.status})` }, 502);
    }
    if (queuedNotificationId) await adminClient.rpc('internal_finish_role_email', {
      p_notification_id: queuedNotificationId,
      p_error: null
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function parseWebhookResult(value: string): { ok?: boolean; error?: string } | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
