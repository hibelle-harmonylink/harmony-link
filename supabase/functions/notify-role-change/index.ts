import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://hibelleharmony.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authorization = request.headers.get('Authorization') || '';
    if (!authorization || !webhookUrl || !webhookSecret) return json({ error: 'Notification service is not configured' }, 503);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);
    const { data: administrator } = await userClient.from('member_profiles').select('role,account_status').eq('id', user.id).maybeSingle();
    if (administrator?.role !== 'admin' || administrator?.account_status !== 'active') return json({ error: 'Administrator access required' }, 403);

    const { memberId, memberEmail, oldRole } = await request.json();
    if (!memberId && !memberEmail) return json({ error: 'Member id or email is required' }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    let account;
    let accountError;
    if (memberId) {
      ({ data: account, error: accountError } = await adminClient.auth.admin.getUserById(memberId));
    } else {
      const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      accountError = usersError;
      account = { user: users?.users.find(user => user.email?.toLowerCase() === String(memberEmail).toLowerCase()) };
    }
    if (accountError || !account.user?.email) return json({ error: 'Member not found' }, 404);
    const resolvedMemberId = account.user.id;
    const { data: profile } = await adminClient.from('member_profiles').select('role').eq('id', resolvedMemberId).maybeSingle();
    const storedRole = profile?.role || '';
    if (!allowedRoles.includes(storedRole)) return json({ error: 'Stored member role cannot be notified' }, 409);

    const metadata = account.user.user_metadata || {};
    const memberName = metadata.full_name || metadata.name || metadata.nickname || account.user.email.split('@')[0];
    const formData = new FormData();
    formData.set('action', 'role_change');
    formData.set('webhook_secret', webhookSecret);
    formData.set('member_email', account.user.email);
    formData.set('member_name', memberName);
    formData.set('old_role', allowedRoles.includes(oldRole) ? oldRole : '');
    formData.set('new_role', storedRole);
    const emailResponse = await fetch(webhookUrl, { method: 'POST', body: formData, redirect: 'follow' });
    const emailResult = await emailResponse.text();
    if (!emailResponse.ok) {
      console.error('Role email webhook failed', emailResponse.status, emailResult.slice(0, 500));
      return json({ error: `Email delivery failed (${emailResponse.status})` }, 502);
    }
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
