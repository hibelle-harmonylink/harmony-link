(() => {
  'use strict';

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const loading = document.getElementById('adminLoading');
  const denied = document.getElementById('adminDenied');
  const deniedMessage = document.getElementById('adminDeniedMessage');
  const app = document.getElementById('adminApp');
  const list = document.getElementById('memberList');
  const empty = document.getElementById('memberEmpty');
  const message = document.getElementById('adminMessage');
  const template = document.getElementById('memberCardTemplate');
  const filters = document.getElementById('adminFilters');
  const search = document.getElementById('memberSearch');
  const roleFilter = document.getElementById('roleFilter');
  const refreshButton = document.getElementById('adminRefresh');
  const signOutButton = document.getElementById('adminSignOut');

  const ROLE_LABELS = {
    member: '미승인 일반회원', partner0: '무료 파트너', partner20: '$20 BASIC 파트너', partner50: '$50 PREMIUM 파트너', admin: '관리자'
  };
  let currentUserId = '';
  let currentUserName = '';
  let allMembers = [];

  const setMessage = (text = '', error = false) => {
    message.textContent = text;
    message.classList.toggle('error', error);
  };
  const formatDate = value => {
    if (!value) return '없음';
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date(value));
    const get = type => parts.find(part => part.type === type)?.value || '';
    return `${get('year')}. ${get('month')}. ${get('day')}. <span class="member-time-period">${get('dayPeriod')} ${get('hour')}:${get('minute')}</span>`;
  };
  const deny = text => {
    loading.hidden = true; app.hidden = true; denied.hidden = false;
    deniedMessage.textContent = text;
  };
  const setCounts = members => {
    const counts = { all: members.length, member: 0, partner0: 0, partner20: 0, partner50: 0 };
    members.forEach(member => { if (Object.hasOwn(counts, member.role)) counts[member.role] += 1; });
    Object.entries(counts).forEach(([key, value]) => {
      const target = document.querySelector(`[data-count="${key}"]`);
      if (target) target.textContent = String(value);
    });
  };

  const createCard = member => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.memberId = member.id;
    const displayName = member.display_name || (member.email || '').split('@')[0] || '이름 없음';
    card.querySelector('.member-email').textContent = member.email || '이메일 없음';
    card.querySelector('.member-id').textContent = member.id;
    const badge = card.querySelector('.member-role-badge');
    badge.textContent = `${ROLE_LABELS[member.role] || member.role} · ${displayName}`;
    badge.classList.add(member.role);
    card.querySelectorAll('[data-field]').forEach(field => {
      field.innerHTML = formatDate(member[field.dataset.field]);
    });
    const actions = card.querySelector('.member-actions');
    if (member.role === 'admin' || member.id === currentUserId) {
      card.classList.add('protected');
      actions.innerHTML = '<div class="member-protected-copy">관리자 계정은<br class="admin-mobile-break">이 화면에서는 변경하거나 중지할 수 없습니다.</div>';
      return card;
    }
    const select = card.querySelector('.member-role-select');
    select.value = member.role;
    const statusButton = card.querySelector('.member-status-button');
    statusButton.dataset.status = member.account_status;
    statusButton.textContent = member.account_status === 'suspended' ? '중지 상태' : '활성 상태';
    statusButton.classList.toggle('suspended', member.account_status === 'suspended');
    statusButton.addEventListener('click', () => {
      const next = statusButton.dataset.status === 'active' ? 'suspended' : 'active';
      statusButton.dataset.status = next;
      statusButton.textContent = next === 'suspended' ? '중지 예정' : '활성 예정';
      statusButton.classList.toggle('suspended', next === 'suspended');
    });
    card.querySelector('.member-save').addEventListener('click', () => updateMember(member, select.value, statusButton.dataset.status));
    const resendButton = card.querySelector('.member-resend');
    resendButton.addEventListener('click', async () => {
      resendButton.disabled = true;
      resendButton.textContent = '메일 보내는 중…';
      setMessage(`${member.email} 회원에게 등급 안내메일을 보내고 있습니다.`);
      try {
        await sendRoleNotification(member);
        setMessage(`${member.email} 회원에게 등급 안내메일을 보냈습니다.`);
      } catch (error) {
        setMessage(`안내메일 전송 실패: ${error.message}`, true);
      } finally {
        resendButton.disabled = false;
        resendButton.textContent = '안내메일 다시 보내기';
      }
    });
    return card;
  };

  const renderMembers = members => {
    list.replaceChildren(...members.map(createCard));
    empty.hidden = members.length > 0;
  };

  const loadMembers = async () => {
    setMessage('회원 명단을 불러오고 있습니다.');
    refreshButton.disabled = true;
    refreshButton.classList.add('is-refreshing');
    refreshButton.textContent = '새로고침 중…';
    const { data, error } = await client.rpc('admin_list_members', { p_search: null, p_role: null });
    refreshButton.disabled = false;
    refreshButton.classList.remove('is-refreshing');
    refreshButton.textContent = '새로고침 ↻';
    if (error) {
      if (error.code === '42501') deny('관리자 권한이 확인되지 않아 접근할 수 없습니다.');
      else setMessage(`회원 명단을 불러오지 못했습니다: ${error.message}`, true);
      return;
    }
    allMembers = (data || []).map(member => member.id === currentUserId && currentUserName ? { ...member, display_name: currentUserName } : member);
    setCounts(allMembers);
    applyFilters();
    setMessage(`최근 가입 순서로 ${allMembers.length}명의 회원을 표시합니다.`);
  };

  const applyFilters = () => {
    const term = search.value.trim().toLowerCase();
    const role = roleFilter.value;
    renderMembers(allMembers.filter(member => (!term || (member.email || '').toLowerCase().includes(term)) && (!role || member.role === role)));
  };

  const sendRoleNotification = async (member, oldRole = '') => {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) throw new Error('로그인 세션을 확인할 수 없습니다.');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notify-role-change`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memberId: member.id, oldRole })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || `메일 서버 오류 (${response.status})`);
  };

  const updateMember = async (member, nextRole, nextStatus) => {
    const roleChanged = nextRole !== member.role;
    const statusChanged = nextStatus !== member.account_status;
    if (!roleChanged && !statusChanged) {
      setMessage('변경된 내용이 없습니다.', true);
      return;
    }
    const detail = [roleChanged ? `${ROLE_LABELS[member.role]} → ${ROLE_LABELS[nextRole]}` : '', statusChanged ? `${member.account_status === 'active' ? '활성' : '중지'} → ${nextStatus === 'active' ? '활성' : '중지'}` : ''].filter(Boolean).join('\n');
    if (!window.confirm(`${member.email} 회원을 다음과 같이 변경할까요?\n\n${detail}`)) return;
    setMessage(`${member.email} 회원 정보를 변경하고 있습니다.`);
    const { error } = await client.rpc('admin_update_member', { p_member_id: member.id, p_role: nextRole, p_account_status: nextStatus });
    if (error) {
      setMessage(`변경에 실패했습니다: ${error.message}`, true);
      return;
    }
    if (roleChanged) {
      setMessage('등급이 변경되었습니다. 회원 안내메일을 요청하고 있습니다.');
      try {
        await sendRoleNotification(member, member.role);
        setMessage('회원 등급이 변경되었으며 안내메일 전송을 요청했습니다.');
      } catch {
        setMessage('등급은 변경되었지만 안내메일 요청에 실패했습니다. 다시 새로고침한 후 시도해 주세요.', true);
      }
    } else {
      setMessage('회원 정보가 안전하게 변경되었습니다.');
    }
    await loadMembers();
  };

  filters.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  roleFilter.addEventListener('change', applyFilters);
  search.addEventListener('input', applyFilters);
  refreshButton.addEventListener('click', loadMembers);
  signOutButton.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('./'); });

  const initialize = async () => {
    if (!client) { deny('로그인 기능을 불러오지 못했습니다.'); return; }
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.user) { deny('로그인하지 않은 사용자는 관리자 페이지에 접근할 수 없습니다.'); return; }
    currentUserId = sessionData.session.user.id;
    const metadata = sessionData.session.user.user_metadata || {};
    currentUserName = metadata.full_name || metadata.name || metadata.nickname || sessionData.session.user.email?.split('@')[0] || '관리자';
    const { data: profile, error: profileError } = await client.from('member_profiles').select('role,account_status').eq('id', currentUserId).maybeSingle();
    if (profileError || profile?.role !== 'admin' || profile?.account_status !== 'active') { deny('관리자 권한이 확인되지 않아 접근할 수 없습니다.'); return; }
    loading.hidden = true; denied.hidden = true; app.hidden = false; signOutButton.hidden = false;
    await loadMembers();
  };

  initialize();
})();
