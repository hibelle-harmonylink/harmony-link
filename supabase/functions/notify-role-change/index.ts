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

    const { memberId, oldRole, newRole } = await request.json();
    if (!memberId || !allowedRoles.includes(oldRole) || !allowedRoles.includes(newRole)) return json({ error: 'Invalid role notification request' }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: account, error: accountError } = await adminClient.auth.admin.getUserById(memberId);
    if (accountError || !account.user?.email) return json({ error: 'Member not found' }, 404);
    const { data: profile } = await adminClient.from('member_profiles').select('role').eq('id', memberId).maybeSingle();
    if (profile?.role !== newRole) return json({ error: 'Stored role does not match the notification' }, 409);

    const metadata = account.user.user_metadata || {};
    const memberName = metadata.full_name || metadata.name || metadata.nickname || account.user.email.split('@')[0];
    const formData = new FormData();
    formData.set('action', 'role_change');
    formData.set('webhook_secret', webhookSecret);
    formData.set('member_email', account.user.email);
    formData.set('member_name', memberName);
    formData.set('old_role', oldRole);
    formData.set('new_role', newRole);
    const emailResponse = await fetch(webhookUrl, { method: 'POST', body: formData, redirect: 'follow' });
    if (!emailResponse.ok) return json({ error: 'Email delivery failed' }, 502);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
