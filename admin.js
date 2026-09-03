(() => {
  'use strict';
  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const access = window.HarmonyAccess;
  const loading = document.getElementById('adminLoading'); const denied = document.getElementById('adminDenied'); const deniedMessage = document.getElementById('adminDeniedMessage');
  const app = document.getElementById('adminApp'); const list = document.getElementById('memberList'); const empty = document.getElementById('memberEmpty'); const message = document.getElementById('adminMessage');
  const filters = document.getElementById('adminFilters'); const search = document.getElementById('memberSearch'); const typeFilter = document.getElementById('typeFilter'); const membershipFilter = document.getElementById('membershipFilter'); const statusFilter = document.getElementById('statusFilter');
  const refreshButton = document.getElementById('adminRefresh'); const signOutButton = document.getElementById('adminSignOut'); const dialog = document.getElementById('memberDialog'); const detail = document.getElementById('memberDetail');
  const TYPE_LABELS = { student: '수강생', partner: '파트너' }; const MEMBERSHIP_LABELS = { free: 'FREE', basic: 'BASIC $20', premium: 'PREMIUM $50' }; const STATUS_LABELS = { active: '활성', expiring: '만료 예정', expired: '만료', suspended: '중지' };
  let currentUserId = ''; let allMembers = [];
  const setMessage = (text = '', isError = false) => { message.textContent = text; message.classList.toggle('error', isError); };
  const deny = text => { loading.hidden = true; app.hidden = true; denied.hidden = false; deniedMessage.textContent = text; };
  const normalize = member => access.normalizeUser({ ...member, is_admin: member.is_admin || member.role === 'admin' });
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const formatDate = value => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '없음';
  const badge = (label, className = '') => `<span class="member-badge ${className}">${label}</span>`;
  const setCounts = members => {
    const counts = { all: members.length, student: 0, partner: 0, admin: 0 };
    members.forEach(raw => { const member = normalize(raw); if (member.is_admin) counts.admin += 1; else counts[member.user_type] += 1; });
    Object.entries(counts).forEach(([key, value]) => { const target = document.querySelector(`[data-count="${key}"]`); if (target) target.textContent = String(value); });
  };
  const renderMembers = members => {
    list.replaceChildren(...members.map(raw => {
      const member = normalize(raw); const row = document.createElement('tr'); const name = member.display_name || (member.email || '').split('@')[0] || '이름 없음';
      const cells = [['이름', escapeHtml(name) + (member.access_migration_review ? '<span class="member-review">검토 필요</span>' : '')], ['이메일', escapeHtml(member.email || '이메일 없음')], ['회원유형', member.is_admin ? badge('관리자') : badge(TYPE_LABELS[member.user_type], `type-${member.user_type}`)], ['멤버십', badge(MEMBERSHIP_LABELS[member.membership], member.membership)], ['상태', badge(STATUS_LABELS[member.account_status] || member.account_status, member.account_status)], ['가입일', formatDate(member.created_at)]];
      cells.forEach(([label, html]) => { const cell = document.createElement('td'); cell.dataset.label = label; cell.innerHTML = html; row.appendChild(cell); });
      const actionCell = document.createElement('td'); actionCell.dataset.label = '관리'; const button = document.createElement('button'); button.type = 'button'; button.className = 'member-manage'; button.textContent = '상세 관리'; button.addEventListener('click', () => openDetail(raw)); actionCell.appendChild(button); row.appendChild(actionCell); return row;
    })); empty.hidden = members.length > 0;
  };
  const applyFilters = () => {
    const term = search.value.trim().toLowerCase();
    renderMembers(allMembers.filter(raw => { const member = normalize(raw); return (!term || `${member.display_name || ''} ${member.email || ''}`.toLowerCase().includes(term)) && (!typeFilter.value || member.user_type === typeFilter.value) && (!membershipFilter.value || member.membership === membershipFilter.value) && (!statusFilter.value || member.account_status === statusFilter.value); }));
  };
  const featureHtml = member => {
    const features = access.getFeatureAccess(member); const renderList = allowed => features.filter(item => item.allowed === allowed).map(item => `<li>${item.label}</li>`).join('') || '<li>없음</li>';
    return `<div class="feature-columns"><section class="feature-box allowed"><h3>이용 가능한 기능</h3><ul>${renderList(true)}</ul></section><section class="feature-box denied"><h3>이용 불가능한 기능</h3><ul>${renderList(false)}</ul></section></div>`;
  };
  const openDetail = raw => {
    const member = normalize(raw); const protectedAccount = member.is_admin || member.id === currentUserId; const name = member.display_name || (member.email || '').split('@')[0] || '이름 없음';
    detail.className = 'member-detail'; detail.innerHTML = `<div class="member-detail-summary"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(member.email || '')}</span>${badge(member.is_admin ? '관리자' : TYPE_LABELS[member.user_type], `type-${member.user_type}`)}${badge(MEMBERSHIP_LABELS[member.membership], member.membership)}${badge(STATUS_LABELS[member.account_status], member.account_status)}</div>${protectedAccount ? '<div class="member-protected-copy">관리자 계정과 현재 로그인한 계정은 이 화면에서 변경할 수 없습니다.</div>' : `<div class="member-edit-grid"><label>회원유형<select id="detailType"><option value="student">수강생</option><option value="partner">파트너</option></select></label><label>멤버십<select id="detailMembership"><option value="free">FREE</option><option value="basic">BASIC</option><option value="premium">PREMIUM</option></select></label><label>계정 상태<select id="detailStatus"><option value="active">활성</option><option value="expiring">만료 예정</option><option value="expired">만료</option><option value="suspended">중지</option></select></label></div>`}<div id="detailFeatures">${featureHtml(member)}</div><dl class="member-dates"><div><dt>가입일</dt><dd>${formatDate(member.created_at)}</dd></div><div><dt>최근 로그인</dt><dd>${formatDate(member.last_sign_in_at)}</dd></div><div><dt>파트너 승인일</dt><dd>${formatDate(member.approved_at)}</dd></div><div><dt>마지막 변경일</dt><dd>${formatDate(member.updated_at)}</dd></div></dl>${protectedAccount ? '' : '<div class="member-detail-actions"><button type="button" class="member-resend">안내메일 다시 보내기</button><button type="button" class="btn btn-primary" id="detailSave">변경 저장</button></div>'}`;
    const type = detail.querySelector('#detailType'); const membership = detail.querySelector('#detailMembership'); const status = detail.querySelector('#detailStatus');
    if (type) { type.value = member.user_type; membership.value = member.membership; status.value = member.account_status; const preview = () => { detail.querySelector('#detailFeatures').innerHTML = featureHtml({ ...member, user_type: type.value, membership: membership.value, account_status: status.value }); }; [type, membership, status].forEach(select => select.addEventListener('change', preview)); detail.querySelector('#detailSave').addEventListener('click', () => updateMember(raw, type.value, membership.value, status.value)); detail.querySelector('.member-resend').addEventListener('click', event => resendNotification(raw, event.currentTarget)); }
    dialog.showModal();
  };
  const resendNotification = async (member, button) => { button.disabled = true; button.textContent = '메일 보내는 중…'; const { error } = await client.rpc('admin_queue_role_email', { p_member_id: member.id }); setMessage(error ? `안내메일 등록 실패: ${error.message}` : '안내메일 발송 대기열에 등록했습니다.', Boolean(error)); button.disabled = false; button.textContent = '안내메일 다시 보내기'; };
  const updateMember = async (raw, userType, membership, accountStatus) => {
    const member = normalize(raw); const changes = [`회원유형: ${TYPE_LABELS[member.user_type]} → ${TYPE_LABELS[userType]}`, `멤버십: ${MEMBERSHIP_LABELS[member.membership]} → ${MEMBERSHIP_LABELS[membership]}`, `계정 상태: ${STATUS_LABELS[member.account_status]} → ${STATUS_LABELS[accountStatus]}`];
    if (!window.confirm(`${member.email} 회원을 변경할까요?\n\n${changes.join('\n')}`)) return;
    setMessage('회원 정보를 변경하고 있습니다.'); const { error } = await client.rpc('admin_update_member_access', { p_member_id: member.id, p_user_type: userType, p_membership: membership, p_account_status: accountStatus });
    if (error) { setMessage(`변경에 실패했습니다: ${error.message}`, true); return; } dialog.close(); setMessage('회원유형, 멤버십, 계정 상태를 저장했습니다.'); await loadMembers();
  };
  const loadMembers = async () => {
    setMessage('회원 명단을 불러오고 있습니다.'); refreshButton.disabled = true; const { data, error } = await client.rpc('admin_list_members', { p_search: null, p_role: null }); refreshButton.disabled = false;
    if (error) { if (error.code === '42501') deny('관리자 권한이 확인되지 않아 접근할 수 없습니다.'); else setMessage(`회원 명단을 불러오지 못했습니다: ${error.message}`, true); return; }
    allMembers = data || []; setCounts(allMembers); applyFilters(); setMessage(`최근 가입 순서로 ${allMembers.length}명의 회원을 표시합니다.`);
  };
  filters.addEventListener('submit', event => { event.preventDefault(); applyFilters(); }); [search, typeFilter, membershipFilter, statusFilter].forEach(control => control.addEventListener(control === search ? 'input' : 'change', applyFilters)); refreshButton.addEventListener('click', loadMembers); signOutButton.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('./'); });
  if (!client || !access) { deny('회원관리 기능을 불러오지 못했습니다.'); return; }
  client.auth.getSession().then(async ({ data, error }) => {
    if (error || !data.session?.user) { deny('로그인하지 않은 사용자는 관리자 페이지에 접근할 수 없습니다.'); return; }
    currentUserId = data.session.user.id; const { data: profile, error: profileError } = await client.from('member_profiles').select('role,account_status').eq('id', currentUserId).maybeSingle();
    if (profileError || profile?.role !== 'admin' || profile.account_status !== 'active') { deny('활성 관리자 계정으로 로그인해야 이용할 수 있습니다.'); return; }
    loading.hidden = true; denied.hidden = true; app.hidden = false; signOutButton.hidden = false; await loadMembers();
  });
})();
