import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = new Set(['https://hibelleharmony.com', 'https://www.hibelleharmony.com']);

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://hibelleharmony.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = request.headers.get('Authorization') || '';
    if (!authorization) return json({ error: 'Authentication required' }, 401, headers);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401, headers);

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from('member_profiles')
      .select('role,account_status')
      .eq('id', user.id)
      .maybeSingle();
    const allowedRoles = ['member', 'partner0', 'partner20', 'partner50', 'admin'];
    if (profileError || !profile || profile.account_status !== 'active' || !allowedRoles.includes(profile.role)) {
      return json({ error: 'Active member access required' }, 403, headers);
    }

    const { data: posts, error: postsError } = await adminClient
      .from('partner_community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (postsError) return json({ error: postsError.message }, 500, headers);

    const postIds = (posts || []).map((post) => post.id);
    let comments: Record<string, unknown>[] = [];
    if (postIds.length) {
      const { data, error } = await adminClient
        .from('partner_community_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });
      if (error) return json({ error: error.message }, 500, headers);
      comments = data || [];
    }

    const result = (posts || []).map((post) => ({
      ...post,
      comments: comments.filter((comment) => comment.post_id === post.id),
    }));
    return json({ posts: result }, 200, headers);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500, headers);
  }
});

function json(payload: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
