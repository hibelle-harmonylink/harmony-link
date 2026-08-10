import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://hibelleharmony.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const allowedRoles = ['member', 'partner0', 'partner20', 'partner50'];

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
      const { data: memberProfile } = await adminClient.from('member_profiles').select('display_name').eq('id', user.id).maybeSingle();
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
      const rosterResponse = await fetch(webhookUrl, { method: 'POST', body: formData, redirect: 'follow' });
      const rosterResult = await rosterResponse.text();
      const rosterJson = parseWebhookResult(rosterResult);
      if (!rosterResponse.ok || rosterJson?.ok !== true) {
        console.error('Withdrawal roster webhook failed', rosterResponse.status, rosterResult.slice(0, 500));
        return json({ error: rosterJson?.error || `Roster update failed (${rosterResponse.status})` }, 502);
      }
      return json({ ok: true });
    }
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
    let storedRole = queuedRole;
    if (!storedRole) {
      const { data: profile } = await adminClient.from('member_profiles').select('role,display_name').eq('id', resolvedMemberId).maybeSingle();
      storedRole = profile?.role || '';
    }
    if (!allowedRoles.includes(storedRole)) return json({ error: 'Stored member role cannot be notified' }, 409);

    const metadata = targetUser.user_metadata || {};
    const { data: memberProfile } = await adminClient.from('member_profiles').select('display_name').eq('id', resolvedMemberId).maybeSingle();
    const memberName = memberProfile?.display_name || metadata.full_name || metadata.name || metadata.nickname || targetUser.email.split('@')[0];
    const formData = new FormData();
    formData.set('action', 'role_change');
    formData.set('webhook_secret', webhookSecret);
    formData.set('member_id', resolvedMemberId);
    formData.set('member_email', targetUser.email);
    formData.set('member_name', memberName);
    formData.set('old_role', allowedRoles.includes(oldRole) ? oldRole : '');
    formData.set('new_role', storedRole);
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
