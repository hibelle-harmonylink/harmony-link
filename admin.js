(() => {
  'use strict';
  const BUILD = '20260917-2';
  console.log(`[admin] admin.js loaded — build ${BUILD}`);
  // Visible without opening devtools -- if this text is missing, blank, or
  // shows an older build number than the one just shipped, the browser (or
  // an intermediate cache) is still running an old admin.js, and no
  // further diagnosis of "the fix didn't do anything" makes sense until
  // that's resolved first.
  const buildTag = document.getElementById('adminBuildTag');
  if (buildTag) buildTag.textContent = `build ${BUILD}`;

  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const access = window.HarmonyAccess;

  const loading = document.getElementById('adminLoading');
  const denied = document.getElementById('adminDenied');
  const deniedMessage = document.getElementById('adminDeniedMessage');
  const app = document.getElementById('adminApp');
  const list = document.getElementById('memberList');
  const empty = document.getElementById('memberEmpty');
  const message = document.getElementById('adminMessage');
  const filters = document.getElementById('adminFilters');
  const search = document.getElementById('memberSearch');
  const typeFilter = document.getElementById('typeFilter');
  const membershipFilter = document.getElementById('membershipFilter');
  const statusFilter = document.getElementById('statusFilter');
  const refreshButton = document.getElementById('adminRefresh');
  const signOutButton = document.getElementById('adminSignOut');
  const dialog = document.getElementById('memberDialog');
  const detail = document.getElementById('memberDetail');
  const pagination = document.getElementById('memberPagination');
  const paginationSummary = document.getElementById('memberPaginationSummary');
  const paginationControls = document.getElementById('memberPaginationControls');

  const TYPE_LABELS = { student: '수강생', partner: '파트너' };
  const MEMBERSHIP_LABELS = { free: 'FREE', basic: 'BASIC $20', premium: 'PREMIUM $50' };
  const STATUS_LABELS = { active: '활성', expiring: '만료 예정', expired: '만료', suspended: '중지', withdrawn: '탈퇴' };
  const TYPE_BADGE_CLASS = { student: 'type-student', partner: 'type-partner' };
  // Only currently supported operational choices are shown in the form.
  // Keep the data objects (rather than hard-coded option markup) so future
  // country/state additions do not change the save payload contract.
  const COUNTRY_OPTIONS = [{ code: 'US', name: 'United States' }];
  const STATE_OPTIONS = {
    US: [
      { code: 'NY', name: 'New York' },
      { code: 'TX', name: 'Texas' }
    ]
  };
  let currentUserId = '';
  let currentUserName = '';
  let allMembers = [];
  let currentPage = 1;
  const MEMBERS_PER_PAGE = 20;

  // Postgrest/Supabase errors carry more than .message -- .code, .details
  // and .hint often say exactly what's wrong (missing function, RLS
  // denial, bad param). Surface all of it on screen, not just the terse
  // message, so a real production failure is diagnosable without opening
  // devtools.
  const describeError = error => {
    if (!error) return '알 수 없는 오류';
    if (typeof error === 'string') return error;
    const parts = [error.message || String(error)];
    if (error.code) parts.push(`code=${error.code}`);
    if (error.details) parts.push(`details=${error.details}`);
    if (error.hint) parts.push(`hint=${error.hint}`);
    return parts.join(' | ');
  };
  // client.functions.invoke() errors are NOT shaped like PostgREST/RPC
  // errors -- they're FunctionsHttpError/FunctionsRelayError/
  // FunctionsFetchError instances with .name/.context (a Response, for the
  // first two) instead of .code/.details/.hint. describeError() above
  // silently drops all of that (falls back to just .message), which is
  // exactly why a Sheet-sync failure only ever showed the bare
  // "Failed to send a request to the Edge Function" with no further
  // detail. This reads the actual HTTP status and response body when the
  // request reached the function at all (FunctionsHttpError/
  // FunctionsRelayError), and the error's name otherwise (FunctionsFetchError
  // -- the fetch never got a response, e.g. the function isn't deployed at
  // this URL, or the request was blocked by CORS; browsers deliberately
  // withhold further detail from JS for that specific failure mode, so the
  // Network tab in devtools -- not this message -- is the way to see the
  // real status/reason when this is what's shown).
  const describeFunctionError = async error => {
    if (!error) return '알 수 없는 오류';
    const parts = [error.message || String(error)];
    if (error.name) parts.push(`type=${error.name}`);
    const response = error.context;
    if (response && typeof response === 'object') {
      if (typeof response.status === 'number') parts.push(`status=${response.status}`);
      if (typeof response.clone === 'function') {
        try {
          const bodyText = await response.clone().text();
          if (bodyText) parts.push(`body=${bodyText.slice(0, 400)}`);
        } catch (readError) {
          parts.push(`(응답 본문을 읽지 못함: ${readError.message})`);
        }
      }
    }
    return parts.join(' | ');
  };
  const setMessage = (text = '', isError = false) => {
    message.textContent = text;
    message.classList.toggle('error', isError);
  };
  // window.confirm() is used only here, for the save flow's "are you sure"
  // step. After a user dismisses several native confirm()/alert() dialogs
  // on the same page in a row, Chrome offers to (and once checked, will)
  // silently disable all further ones for that page: every later
  // window.confirm() call then returns false instantly, with no dialog
  // shown and nothing thrown -- which looks exactly like the save button
  // doing nothing at all. A custom in-page dialog can't be suppressed that
  // way, so it replaces window.confirm() for this flow.
  // Appended inside the open <dialog> (not document.body): a native
  // <dialog> shown via showModal() renders in the browser's top layer,
  // above every regular sibling regardless of z-index or DOM order --
  // a body-level overlay would end up visually and pointer-wise UNDER
  // the still-open member detail dialog, since updateMember() (the only
  // caller) always runs while that dialog is open.
  const askConfirm = text => new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-confirm-overlay';
    overlay.innerHTML = '<div class="admin-confirm-box"><pre class="admin-confirm-message"></pre><div class="admin-confirm-actions"><button type="button" class="admin-confirm-cancel">취소</button><button type="button" class="admin-confirm-ok btn btn-primary">확인</button></div></div>';
    overlay.querySelector('.admin-confirm-message').textContent = text;
    (dialog.open ? dialog : document.body).appendChild(overlay);
    const finish = result => { overlay.remove(); resolve(result); };
    overlay.querySelector('.admin-confirm-ok').addEventListener('click', () => finish(true));
    overlay.querySelector('.admin-confirm-cancel').addEventListener('click', () => finish(false));
    overlay.addEventListener('click', event => { if (event.target === overlay) finish(false); });
    overlay.querySelector('.admin-confirm-ok').focus();
  });
  const formatDate = value => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '없음';
  // Phone numbers may be Korean, US, or international. Preserve the
  // administrator-entered string rather than imposing a regional format.
  const formatPhone = value => String(value || '').trim();
  const deny = text => { loading.hidden = true; app.hidden = true; denied.hidden = false; deniedMessage.textContent = text; };
  const normalize = member => access.normalizeUser({ ...member, is_admin: member.is_admin || member.role === 'admin' });
  // The admin account's stored display_name is a leftover site-brand
  // placeholder ("Harmony Link") from setup, not this admin's own name.
  // The database value is left untouched -- only what's rendered changes.
  const fallbackMemberName = member => {
    const raw = (member.display_name || '').trim();
    if (member.is_admin && raw === 'Harmony Link') return '하이벨';
    return raw || (member.email || '').split('@')[0] || '이름 없음';
  };
  // Identity metadata is optional for people who have finished site signup
  // but have not submitted an application yet.  Never leave those rows
  // anonymous in the admin UI: use the existing display name, then email.
  const memberNickname = member => String(member.nickname || '').trim() || fallbackMemberName(member);
  const memberFullName = member => String(member.full_name || '').trim() || fallbackMemberName(member);
  const resolveDisplayName = member => memberFullName(member);
  const memberNumberClass = member => member.member_number && member.application_completed === false
    ? 'member-number member-number-pending'
    : 'member-number';
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const normalizeServiceAreas = values => {
    const seen = new Set();
    return (Array.isArray(values) ? values : []).reduce((areas, value) => {
      const area = String(value || '').trim();
      const key = area.toLocaleLowerCase('en-US');
      if (area && !seen.has(key)) { seen.add(key); areas.push(area); }
      return areas;
    }, []);
  };
  const normalizePartnerRegion = region => ({
    country_code: String(region?.country_code || '').trim().toUpperCase(),
    country_name: String(region?.country_name || '').trim(),
    state_code: String(region?.state_code || '').trim().toUpperCase(),
    state_name: String(region?.state_name || '').trim(),
    city: String(region?.city || '').trim(),
    service_area: normalizeServiceAreas(region?.service_area),
    online_available: Boolean(region?.online_available),
    nationwide_available: Boolean(region?.nationwide_available)
  });
  const samePartnerRegion = (left, right) => {
    const a = normalizePartnerRegion(left);
    const b = normalizePartnerRegion(right);
    return a.country_code === b.country_code && a.country_name === b.country_name &&
      a.state_code === b.state_code && a.state_name === b.state_name && a.city === b.city &&
      a.online_available === b.online_available && a.nationwide_available === b.nationwide_available &&
      a.service_area.length === b.service_area.length && a.service_area.every((area, index) => area === b.service_area[index]);
  };
  const badge = (label, className = '') => `<span class="member-badge ${className}">${label}</span>`;
  const typeBadge = member => badge(member.is_admin ? '관리자' : TYPE_LABELS[member.user_type], member.is_admin ? 'type-admin' : TYPE_BADGE_CLASS[member.user_type]);
  const membershipBadge = member => member.is_admin ? badge('관리자', 'type-admin') : badge(MEMBERSHIP_LABELS[member.membership], member.membership);

  // Mirrors sync_member_access_compatibility()'s role derivation exactly
  // (202609030001_separate_user_type_membership_access.sql), so the save
  // flow knows whether a user_type/membership change will actually change
  // the underlying legacy `role` column -- and therefore whether to wait
  // for the automatic role-change email, without needing a second round
  // trip just to ask.
  const deriveRole = (userType, membership, isAdmin) => {
    if (isAdmin) return 'admin';
    if (userType !== 'partner') return 'member';
    if (membership === 'premium') return 'partner50';
    if (membership === 'basic') return 'partner20';
    return 'partner0';
  };

  const setCounts = members => {
    const counts = { all: members.length, student: 0, partner: 0, admin: 0, premium: 0, withdrawn: 0 };
    members.forEach(raw => {
      const member = normalize(raw);
      if (member.is_withdrawn || member.account_status === 'withdrawn') {
        counts.withdrawn += 1;
        return;
      }
      if (member.is_admin) counts.admin += 1;
      else counts[member.user_type] += 1;
      // Admin is a separate access tier, not a paid membership -- its
      // membership column is a leftover backfill value, not a real
      // premium grant, so it must never inflate this count.
      if (!member.is_admin && member.membership === 'premium') counts.premium += 1;
    });
    Object.entries(counts).forEach(([key, value]) => {
      const target = document.querySelector(`[data-count="${key}"]`);
      if (target) target.textContent = String(value);
    });
  };

  // Keep the client-side page math separate from filtering/rendering so the
  // source can later switch to a server-page request without changing the
  // member-row renderer or filter UI.
  const getPage = (members, page) => {
    const totalPages = Math.max(1, Math.ceil(members.length / MEMBERS_PER_PAGE));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * MEMBERS_PER_PAGE;
    return { page: safePage, totalPages, start, members: members.slice(start, start + MEMBERS_PER_PAGE) };
  };

  const pageNumbers = (page, totalPages) => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = [1];
    if (page > 4) pages.push('…');
    for (let value = Math.max(2, page - 1); value <= Math.min(totalPages - 1, page + 1); value += 1) pages.push(value);
    if (page < totalPages - 3) pages.push('…');
    pages.push(totalPages);
    return pages;
  };

  const renderPagination = (members, pageData) => {
    const { page, totalPages, start } = pageData;
    pagination.hidden = members.length === 0;
    if (members.length === 0) return;
    const end = Math.min(start + MEMBERS_PER_PAGE, members.length);
    paginationSummary.textContent = `전체 ${members.length}명 · 현재 ${start + 1}–${end}`;
    paginationControls.replaceChildren();
    const appendButton = (label, targetPage, disabled = false, current = false) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'member-page-button'; button.textContent = label;
      button.disabled = disabled; button.dataset.page = String(targetPage);
      if (current) { button.classList.add('is-current'); button.setAttribute('aria-current', 'page'); }
      paginationControls.appendChild(button);
    };
    appendButton('이전', page - 1, page === 1);
    pageNumbers(page, totalPages).forEach(value => {
      if (value === '…') {
        const ellipsis = document.createElement('span'); ellipsis.className = 'member-page-ellipsis'; ellipsis.textContent = value;
        paginationControls.appendChild(ellipsis);
      } else appendButton(String(value), value, false, value === page);
    });
    appendButton('다음', page + 1, page === totalPages);
  };

  const renderMembers = members => {
    const pageData = getPage(members, currentPage);
    currentPage = pageData.page;
    list.replaceChildren(...pageData.members.map(raw => {
      const member = normalize(raw);
      const row = document.createElement('tr');
      const memberNumber = member.member_number || '—';
      const cells = [
        ['회원번호', `<span class="${memberNumberClass(member)}">${escapeHtml(memberNumber)}</span>`],
        ['닉네임', escapeHtml(memberNickname(member))],
        ['이름', escapeHtml(memberFullName(member)) + (member.access_migration_review ? '<span class="member-review">검토 필요</span>' : '')],
        ['이메일', escapeHtml(member.email || '이메일 없음')],
        ['연락처', escapeHtml(formatPhone(member.phone))],
        ['회원유형', typeBadge(member)],
        // Admin's membership column value (backfilled to 'free') is not a
        // real membership -- showing it as FREE reads as a demotion, so
        // the admin row shows its access tier instead of that leftover value.
        ['멤버십', membershipBadge(member)],
        ['상태', badge(STATUS_LABELS[member.account_status] || member.account_status, member.account_status)],
        ['가입일', formatDate(member.created_at)]
      ];
      cells.forEach(([label, html]) => { const cell = document.createElement('td'); cell.dataset.label = label; cell.innerHTML = html; row.appendChild(cell); });
      const actionCell = document.createElement('td');
      actionCell.dataset.label = '관리';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'member-manage'; button.textContent = '상세 관리';
      button.addEventListener('click', () => openDetail(raw));
      actionCell.appendChild(button);
      row.appendChild(actionCell);
      return row;
    }));
    empty.hidden = members.length > 0;
    renderPagination(members, pageData);
    console.log('[admin] rendered rows', { count: pageData.members.length, total: members.length, page: currentPage });
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
      else setMessage(`회원 명단을 불러오지 못했습니다: ${describeError(error)}`, true);
      return;
    }
    allMembers = (data || []).map(member => member.id === currentUserId && currentUserName ? { ...member, display_name: currentUserName } : member);
    setCounts(allMembers);
    applyFilters();
    setMessage(`최근 가입 순서로 ${allMembers.length}명의 회원을 표시합니다.`);
  };

  const applyFilters = ({ resetPage = true } = {}) => {
    if (resetPage) currentPage = 1;
    const term = search.value.trim().toLowerCase();
    renderMembers(allMembers.filter(raw => {
      const member = normalize(raw);
      // The 회원유형/멤버십 filter dropdowns only offer non-admin values
      // (수강생/파트너, FREE/BASIC/PREMIUM) -- admin's user_type/membership
      // are leftover backfill values (student/free), not real answers to
      // either question, so admin must never match a specific selection
      // here. "전체 유형"/"전체 멤버십" (empty value) still show admin.
      return (!term || `${member.nickname || ''} ${member.full_name || ''} ${member.display_name || ''} ${member.email || ''}`.toLowerCase().includes(term))
        && (!typeFilter.value || (!member.is_admin && member.user_type === typeFilter.value))
        && (!membershipFilter.value || (!member.is_admin && member.membership === membershipFilter.value))
        && (!statusFilter.value || member.account_status === statusFilter.value);
    }));
  };

  paginationControls.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    applyFilters({ resetPage: false });
  });

  const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const isTransientFetchError = error => /failed to fetch|networkerror|network request failed/i.test(String(error?.message || error || ''));
  // The email must be queued only once.  A transient browser-to-PostgREST
  // failure while polling its delivery status must therefore retry only the
  // read, never admin_queue_role_email(), which would create a second email.
  const getRoleEmailStatusWithRetry = async notificationId => {
    let lastError;
    for (let retry = 0; retry < 3; retry += 1) {
      try {
        const result = await client.rpc('admin_get_role_email_status', { p_notification_id: notificationId });
        if (!result.error || !isTransientFetchError(result.error) || retry === 2) return result;
        lastError = result.error;
      } catch (error) {
        if (!isTransientFetchError(error) || retry === 2) throw error;
        lastError = error;
      }
      await delay(400 * (retry + 1));
    }
    throw lastError || new Error('메일 발송 상태를 확인하지 못했습니다.');
  };

  const sendRoleNotification = async member => {
    const { data: notificationId, error } = await client.rpc('admin_queue_role_email', { p_member_id: member.id });
    if (error) throw new Error(error.message || '메일 발송 대기열 등록에 실패했습니다.');
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await delay(1000);
      const { data: rows, error: statusError } = await getRoleEmailStatusWithRetry(notificationId);
      if (statusError) throw new Error(statusError.message || '메일 발송 상태를 확인하지 못했습니다.');
      const delivery = rows?.[0];
      if (delivery?.processed_at) return;
      if (delivery?.last_error) throw new Error(`실제 메일 발송 실패: ${delivery.last_error}`);
      if (delivery?.response_error) throw new Error(`서버 내부 호출 실패: ${delivery.response_error}`);
      if (delivery?.response_status >= 400) {
        let serverDetail = delivery.response_content || `HTTP ${delivery.response_status}`;
        try { serverDetail = JSON.parse(serverDetail)?.error || serverDetail; } catch { /* Keep text response. */ }
        throw new Error(`메일 함수 오류: ${serverDetail}`);
      }
    }
    throw new Error('메일 서버의 처리 결과가 확인되지 않았습니다. 서버 내부 호출 기록을 확인해 주세요.');
  };

  const waitForAutomaticRoleEmail = async (memberId, changedAfter) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1000));
      const { data: rows, error } = await client.rpc('admin_get_latest_role_email_status', { p_member_id: memberId, p_after: changedAfter });
      if (error) throw new Error(error.message || '메일 발송 상태를 확인하지 못했습니다.');
      const delivery = rows?.[0];
      if (!delivery) continue;
      if (delivery.last_error) throw new Error(`실제 메일 발송 실패: ${delivery.last_error}`);
      if (delivery.response_error) throw new Error(`서버 내부 호출 실패: ${delivery.response_error}`);
      if (delivery.response_status >= 400) {
        let serverDetail = delivery.response_content || `HTTP ${delivery.response_status}`;
        try { serverDetail = JSON.parse(serverDetail)?.error || serverDetail; } catch { /* Keep text response. */ }
        throw new Error(`메일 함수 오류: ${serverDetail}`);
      }
      if (delivery.processed_at) return;
    }
    throw new Error('등급은 변경됐지만 메일 발송 결과를 확인하지 못했습니다.');
  };

  const sendDirectRoleNotification = async (member, oldRole) => {
    const { data, error } = await client.functions.invoke('notify-role-change', {
      body: { memberId: member.id, memberEmail: member.email, oldRole }
    });
    if (error) {
      let detail = error.message || '등급 변경 메일 서버 호출에 실패했습니다.';
      try {
        const response = error.context;
        if (response && typeof response.clone === 'function') {
          const payload = await response.clone().json();
          detail = payload?.error || detail;
        }
      } catch { /* Keep the available error message. */ }
      throw new Error(detail);
    }
    if (data?.error) throw new Error(data.error);
  };

  const featureHtml = member => {
    const features = access.getFeatureAccess(member);
    const renderList = allowed => features.filter(item => item.allowed === allowed).map(item => `<li>${item.label}</li>`).join('') || '<li>없음</li>';
    return `<div class="feature-columns"><section class="feature-box allowed"><h3>이용 가능한 기능</h3><ul>${renderList(true)}</ul></section><section class="feature-box denied"><h3>이용 불가능한 기능</h3><ul>${renderList(false)}</ul></section></div>`;
  };

  const partnerRegionSummary = region => {
    const value = normalizePartnerRegion(region);
    const place = [value.state_name, value.city].filter(Boolean).join(' · ') || value.country_name;
    const modes = [];
    if (value.city || value.service_area.length > 0) modes.push('방문');
    if (value.online_available) modes.push('온라인');
    if (value.nationwide_available) modes.push('미국 전역 가능');
    return place || modes.length ? [place, modes.join(' · ')].filter(Boolean).join(' · ') : '지역 미등록';
  };

  const openDetail = raw => {
    const member = normalize(raw);
    const withdrawn = member.is_withdrawn || member.account_status === 'withdrawn';
    const protectedAccount = member.is_admin || member.id === currentUserId;
    const name = resolveDisplayName(member);
    detail.className = 'member-detail';
    const metadataFields = `<div class="member-edit-grid member-metadata-grid"><label>닉네임<input id="detailNickname" type="text" maxlength="80" autocomplete="nickname"></label><label>이름<input id="detailFullName" type="text" maxlength="80" autocomplete="name"></label><label>연락처<input id="detailPhone" type="tel" maxlength="30" autocomplete="tel" value="${escapeHtml(formatPhone(member.phone ?? ''))}"></label><label class="partner-metadata">전문분야<input id="detailSpecialty" type="text" maxlength="120"></label><label class="partner-metadata">강의과목<input id="detailTeachingSubjects" type="text" maxlength="240"></label><label class="student-metadata">수강과목<input id="detailEnrolledSubject" type="text" maxlength="120"></label><label class="student-metadata">담당강사<input id="detailAssignedInstructor" type="text" maxlength="120"></label></div>`;
    const partnerRegionFields = `<section class="partner-region partner-metadata" hidden aria-labelledby="detailPartnerRegionTitle"><div class="partner-region-heading"><div><h3 id="detailPartnerRegionTitle">활동 지역</h3><p id="detailPartnerRegionSummary">지역 정보를 불러오는 중…</p></div><span class="partner-region-note">파트너 전용</span></div><div class="partner-region-grid"><label>국가<select id="detailCountryCode"><option value="">선택하세요</option>${COUNTRY_OPTIONS.map(country => `<option value="${country.code}">${country.name}</option>`).join('')}</select></label><label>주(State)<select id="detailStateCode"><option value="">선택하세요</option></select></label><label>도시<input id="detailCity" type="text" maxlength="120" autocomplete="address-level2" placeholder="예: Dallas"></label></div><div class="partner-service-area"><div><h4>서비스 지역</h4><p>여러 지역을 추가할 수 있습니다.</p></div><div class="partner-service-area-controls"><input id="detailServiceAreaInput" type="text" maxlength="120" placeholder="예: Dallas–Fort Worth"><button id="detailAddServiceArea" type="button" class="member-region-add">+ 지역 추가</button></div><div id="detailServiceAreaChips" class="partner-service-area-chips" aria-live="polite"></div></div><div class="partner-region-options"><label class="partner-region-switch"><input id="detailOnlineAvailable" type="checkbox"><span>온라인 수업 가능</span></label><label class="partner-region-switch"><input id="detailNationwideAvailable" type="checkbox"><span>미국 전역 가능</span></label></div><div class="partner-region-save"><p id="detailRegionSaveFeedback" role="status" aria-live="polite"></p><button id="detailRegionSave" type="button" class="btn btn-primary" disabled>지역정보 저장</button></div></section>`;
    const summary = `<dl class="member-dates member-core-fields"><div><dt>회원번호</dt><dd><span class="${memberNumberClass(member)}">${escapeHtml(member.member_number || '—')}</span></dd></div><div><dt>닉네임</dt><dd>${escapeHtml(memberNickname(member))}</dd></div><div><dt>이름</dt><dd>${escapeHtml(memberFullName(member))}</dd></div><div><dt>이메일</dt><dd>${escapeHtml(member.email || '')}</dd></div><div><dt>연락처</dt><dd>${escapeHtml(formatPhone(member.phone))}</dd></div><div><dt>회원유형</dt><dd>${escapeHtml(member.is_admin ? '관리자' : TYPE_LABELS[member.user_type])}</dd></div><div><dt>멤버십</dt><dd>${escapeHtml(member.is_admin ? '관리자' : MEMBERSHIP_LABELS[member.membership])}</dd></div><div><dt>계정상태</dt><dd>${escapeHtml(STATUS_LABELS[member.account_status] || member.account_status || '')}</dd></div><div><dt>가입일</dt><dd>${formatDate(member.created_at)}</dd></div></dl>`;
    const accessFields = withdrawn || protectedAccount ? `<div class="member-protected-copy">${withdrawn ? '탈퇴 회원은 권한·멤버십·계정상태 및 관리정보를 변경할 수 없습니다.' : '관리자 계정과 현재 로그인한 계정은 이 화면에서 변경할 수 없습니다.'}</div>` : `<div class="member-edit-grid"><label class="member-name-field">회원 이름<input id="detailName" type="text" minlength="2" maxlength="50" autocomplete="off"></label><label>회원유형<select id="detailType"><option value="student">수강생</option><option value="partner">파트너</option></select></label><label>멤버십<select id="detailMembership"><option value="free">FREE</option><option value="basic">BASIC</option><option value="premium">PREMIUM</option></select></label><label>계정 상태<select id="detailStatus"><option value="active">활성</option><option value="expiring">만료 예정</option><option value="expired">만료</option><option value="suspended">중지</option></select></label></div>`;
    const actions = withdrawn
      ? '<div class="member-detail-actions"><button type="button" class="btn member-save-disabled" id="detailSave" disabled>변경 불가</button></div>'
      : protectedAccount ? ''
        : '<div class="member-detail-actions"><button type="button" class="btn member-resend">안내메일 다시 보내기</button><button type="button" class="btn btn-primary" id="detailSave">변경 저장</button></div>';
    detail.innerHTML = `<div class="member-detail-summary"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(member.email || '')}</span>${typeBadge(member)}${member.is_admin ? '' : membershipBadge(member)}${badge(STATUS_LABELS[member.account_status], member.account_status)}</div>${summary}${accessFields}${metadataFields}${partnerRegionFields}<div id="detailFeatures">${withdrawn ? '' : featureHtml(member)}</div><div class="member-save-feedback" id="detailSaveFeedback" role="status" aria-live="polite"></div>${actions}`;
    const nameInput = detail.querySelector('#detailName');
    const nicknameInput = detail.querySelector('#detailNickname');
    const fullNameInput = detail.querySelector('#detailFullName');
    const type = detail.querySelector('#detailType');
    const membership = detail.querySelector('#detailMembership');
    const status = detail.querySelector('#detailStatus');
    const phone = detail.querySelector('#detailPhone');
    const specialty = detail.querySelector('#detailSpecialty');
    const teachingSubjects = detail.querySelector('#detailTeachingSubjects');
    const enrolledSubject = detail.querySelector('#detailEnrolledSubject');
    const assignedInstructor = detail.querySelector('#detailAssignedInstructor');
    const countryCode = detail.querySelector('#detailCountryCode');
    const stateCode = detail.querySelector('#detailStateCode');
    const city = detail.querySelector('#detailCity');
    const serviceAreaInput = detail.querySelector('#detailServiceAreaInput');
    const addServiceArea = detail.querySelector('#detailAddServiceArea');
    const serviceAreaChips = detail.querySelector('#detailServiceAreaChips');
    const onlineAvailable = detail.querySelector('#detailOnlineAvailable');
    const nationwideAvailable = detail.querySelector('#detailNationwideAvailable');
    const regionSummary = detail.querySelector('#detailPartnerRegionSummary');
    const regionSaveButton = detail.querySelector('#detailRegionSave');
    const regionSaveFeedback = detail.querySelector('#detailRegionSaveFeedback');
    let partnerRegion = normalizePartnerRegion();
    let serviceAreas = [];
    const setStateOptions = selectedCountry => {
      const states = STATE_OPTIONS[selectedCountry] || [];
      const selected = stateCode.value;
      stateCode.innerHTML = `<option value="">선택하세요</option>${states.map(state => `<option value="${state.code}">${state.name}</option>`).join('')}`;
      stateCode.disabled = states.length === 0;
      stateCode.value = states.some(state => state.code === selected) ? selected : '';
    };
    const renderServiceAreas = () => {
      serviceAreaChips.replaceChildren(...serviceAreas.map(area => {
        const chip = document.createElement('span');
        chip.className = 'partner-service-area-chip';
        chip.textContent = area;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.setAttribute('aria-label', `${area} 제거`); remove.textContent = '×';
        remove.addEventListener('click', () => { serviceAreas = serviceAreas.filter(value => value !== area); renderServiceAreas(); updateRegionSaveButton(); });
        chip.appendChild(remove);
        return chip;
      }));
    };
    const addServiceAreaValue = () => {
      const next = normalizeServiceAreas([...serviceAreas, serviceAreaInput.value]);
      if (next.length !== serviceAreas.length) serviceAreas = next;
      serviceAreaInput.value = '';
      renderServiceAreas();
      updateRegionSaveButton();
    };
    const regionFromControls = () => {
      const country = COUNTRY_OPTIONS.find(option => option.code === countryCode.value);
      const state = (STATE_OPTIONS[countryCode.value] || []).find(option => option.code === stateCode.value);
      return normalizePartnerRegion({ country_code: country?.code, country_name: country?.name, state_code: state?.code, state_name: state?.name, city: city.value, service_area: serviceAreas, online_available: onlineAvailable.checked, nationwide_available: nationwideAvailable.checked });
    };
    const renderPartnerRegion = region => {
      partnerRegion = normalizePartnerRegion(region);
      countryCode.value = partnerRegion.country_code;
      setStateOptions(partnerRegion.country_code);
      stateCode.value = partnerRegion.state_code;
      city.value = partnerRegion.city;
      serviceAreas = partnerRegion.service_area;
      onlineAvailable.checked = partnerRegion.online_available;
      nationwideAvailable.checked = partnerRegion.nationwide_available;
      renderServiceAreas();
      regionSummary.textContent = partnerRegionSummary(partnerRegion);
      updateRegionSaveButton();
    };
    const updateRegionSaveButton = () => {
      if (!regionSaveButton) return;
      const editablePartner = !withdrawn && !protectedAccount && member.user_type === 'partner' && (!type || type.value === 'partner');
      regionSaveButton.disabled = !editablePartner || samePartnerRegion(regionFromControls(), partnerRegion);
    };
    const setRegionFeedback = (text = '', isError = false) => {
      regionSaveFeedback.textContent = text;
      regionSaveFeedback.className = isError ? 'error' : (text ? 'success' : '');
    };
    const readPartnerRegion = async () => {
      const { data, error } = await client.rpc('admin_get_partner_region', { p_member_id: member.id });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    };
    const savePartnerRegion = async () => {
      if (regionSaveButton.disabled) return;
      const requested = regionFromControls();
      regionSaveButton.disabled = true;
      regionSaveButton.textContent = '저장 중…';
      setRegionFeedback();
      try {
        const { error } = await client.rpc('admin_update_partner_region', {
          p_member_id: member.id,
          p_country_code: requested.country_code,
          p_country_name: requested.country_name,
          p_state_code: requested.state_code,
          p_state_name: requested.state_name,
          p_city: requested.city,
          p_service_area: requested.service_area,
          p_online_available: requested.online_available,
          p_nationwide_available: requested.nationwide_available
        });
        if (error) throw error;
        const saved = await readPartnerRegion();
        if (!samePartnerRegion(saved, requested)) throw new Error('저장 후 지역 정보를 다시 확인하지 못했습니다.');
        renderPartnerRegion(saved);
        setRegionFeedback('지역정보가 저장되었습니다.');
      } catch (error) {
        setRegionFeedback(`지역정보 저장에 실패했습니다: ${describeError(error)}`, true);
      } finally {
        regionSaveButton.textContent = '지역정보 저장';
        updateRegionSaveButton();
      }
    };
    countryCode.addEventListener('change', () => { setStateOptions(countryCode.value); updateRegionSaveButton(); });
    stateCode.addEventListener('change', updateRegionSaveButton);
    city.addEventListener('input', updateRegionSaveButton);
    addServiceArea.addEventListener('click', addServiceAreaValue);
    serviceAreaInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addServiceAreaValue(); } });
    onlineAvailable.addEventListener('change', updateRegionSaveButton);
    nationwideAvailable.addEventListener('change', updateRegionSaveButton);
    regionSaveButton.addEventListener('click', savePartnerRegion);
    if (nicknameInput) nicknameInput.value = memberNickname(member);
    if (fullNameInput) fullNameInput.value = memberFullName(member);
    if (specialty) specialty.value = member.specialty || '';
    if (teachingSubjects) teachingSubjects.value = member.teaching_subjects || '';
    if (enrolledSubject) enrolledSubject.value = member.enrolled_subject || '';
    if (assignedInstructor) assignedInstructor.value = member.assigned_instructor || '';
    if (withdrawn) [nicknameInput, fullNameInput, phone, specialty, teachingSubjects, enrolledSubject, assignedInstructor].forEach(input => { if (input) input.disabled = true; });
    if (withdrawn) [countryCode, stateCode, city, serviceAreaInput, addServiceArea, onlineAvailable, nationwideAvailable, regionSaveButton].forEach(input => { if (input) input.disabled = true; });
    const showRoleMetadata = selectedType => {
      detail.querySelectorAll('.partner-metadata').forEach(field => { field.hidden = selectedType !== 'partner'; });
      detail.querySelectorAll('.student-metadata').forEach(field => { field.hidden = selectedType !== 'student'; });
    };
    showRoleMetadata(withdrawn ? 'student' : (member.is_admin ? 'admin' : member.user_type));
    if (type) {
      nameInput.value = name;
      type.value = member.user_type; membership.value = member.membership; status.value = member.account_status;
      const preview = () => { detail.querySelector('#detailFeatures').innerHTML = featureHtml({ ...member, user_type: type.value, membership: membership.value, account_status: status.value }); };
      [type, membership, status].forEach(select => select.addEventListener('change', preview));
      type.addEventListener('change', () => showRoleMetadata(type.value));
      detail.querySelector('#detailSave').addEventListener('click', () => updateMember(raw, nameInput.value, type.value, membership.value, status.value, { nickname: nicknameInput.value, fullName: fullNameInput.value, phone: phone.value, specialty: specialty.value, teachingSubjects: teachingSubjects.value, enrolledSubject: enrolledSubject.value, assignedInstructor: assignedInstructor.value }, regionFromControls(), partnerRegion));
      detail.querySelector('.member-resend').addEventListener('click', event => resendNotification(raw, event.currentTarget));
    } else if (!protectedAccount && !withdrawn) {
      detail.querySelector('#detailSave').addEventListener('click', () => updateMember(raw, name, member.user_type, member.membership, member.account_status, { nickname: nicknameInput.value, fullName: fullNameInput.value, phone: phone.value, specialty: specialty.value, teachingSubjects: teachingSubjects.value, enrolledSubject: enrolledSubject.value, assignedInstructor: assignedInstructor.value }, regionFromControls(), partnerRegion));
    }
    if (!withdrawn && member.user_type === 'partner') {
      readPartnerRegion().then(renderPartnerRegion).catch(() => { regionSummary.textContent = '지역 정보를 불러오지 못했습니다.'; });
    } else {
      renderPartnerRegion();
    }
    dialog.showModal();
  };

  const resendNotification = async (member, button) => {
    if (button.disabled) return;
    const feedback = detail.querySelector('#detailSaveFeedback');
    button.disabled = true;
    button.textContent = '메일 보내는 중…';
    button.classList.add('is-sending');
    if (feedback) { feedback.textContent = ''; feedback.className = 'member-save-feedback'; }
    setMessage(`${member.email} 회원에게 등급 안내메일을 보내고 있습니다.`);
    try {
      await sendRoleNotification(member);
      setMessage(`${member.email} 회원에게 안내메일을 보냈습니다.`);
      if (feedback) {
        feedback.innerHTML = `<strong>안내메일을 성공적으로 보냈습니다.</strong><span>${escapeHtml(member.email)}</span>`;
        feedback.className = 'member-save-feedback success';
        feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } catch (error) {
      const errorText = '안내메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.';
      console.error('[admin] resend notification failed', { memberId: member.id, error: describeError(error) });
      setMessage(errorText, true);
      if (feedback) {
        feedback.textContent = errorText;
        feedback.className = 'member-save-feedback error';
        feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } finally {
      button.disabled = false;
      button.textContent = '안내메일 다시 보내기';
      button.classList.remove('is-sending');
    }
  };

  const updateMember = async (raw, requestedName, nextUserType, nextMembership, nextStatus, nextMetadata = {}, nextRegion = null, currentRegion = null) => {
    const member = normalize(raw);
    const nextName = requestedName.trim();
    const nameChanged = nextName !== (member.display_name || '');
    const accessChanged = nextUserType !== member.user_type || nextMembership !== member.membership || nextStatus !== member.account_status;
    const metadata = { nickname: String(nextMetadata.nickname || '').trim(), fullName: String(nextMetadata.fullName || '').trim(), phone: formatPhone(nextMetadata.phone), specialty: String(nextMetadata.specialty || '').trim(), teachingSubjects: String(nextMetadata.teachingSubjects || '').trim(), enrolledSubject: String(nextMetadata.enrolledSubject || '').trim(), assignedInstructor: String(nextMetadata.assignedInstructor || '').trim() };
    const metadataChanged = metadata.nickname !== memberNickname(member) || metadata.fullName !== memberFullName(member) || metadata.phone !== (member.phone || '') || metadata.specialty !== (member.specialty || '') || metadata.teachingSubjects !== (member.teaching_subjects || '') || metadata.enrolledSubject !== (member.enrolled_subject || '') || metadata.assignedInstructor !== (member.assigned_instructor || '');
    // Region metadata is independent from the normal member metadata. Only
    // save it when the member is (or is becoming) a partner; changing a
    // partner back to another type deliberately leaves the stored region
    // untouched for a later return to partner status.
    const regionChanged = nextUserType === 'partner' && nextRegion !== null && !samePartnerRegion(nextRegion, currentRegion);
    if (!nameChanged && !accessChanged && !metadataChanged) {
      if (!regionChanged) {
        setMessage('변경된 내용이 없습니다.', true);
        return;
      }
    }
    if (nameChanged && (nextName.length < 2 || nextName.length > 50)) {
      setMessage('회원 이름은 2자 이상 50자 이하로 입력해 주세요.', true);
      return;
    }
    const detailLines = [
      nameChanged ? `회원 이름 → ${nextName}` : '',
      nextUserType !== member.user_type ? `회원유형: ${TYPE_LABELS[member.user_type]} → ${TYPE_LABELS[nextUserType]}` : '',
      nextMembership !== member.membership ? `멤버십: ${MEMBERSHIP_LABELS[member.membership]} → ${MEMBERSHIP_LABELS[nextMembership]}` : '',
      nextStatus !== member.account_status ? `계정 상태: ${STATUS_LABELS[member.account_status]} → ${STATUS_LABELS[nextStatus]}` : '',
      metadataChanged ? '관리 정보 변경' : '',
      regionChanged ? '활동 지역 변경' : ''
    ].filter(Boolean).join('\n');
    console.log('[admin] asking for confirmation', { memberId: member.id, detailLines });
    const confirmed = await askConfirm(`${member.email} 회원을 다음과 같이 변경할까요?\n\n${detailLines}`);
    console.log('[admin] confirmation result', confirmed);
    if (!confirmed) {
      setMessage('변경이 취소되었습니다.', true);
      return;
    }
    const saveButton = detail.querySelector('#detailSave');
    const feedback = detail.querySelector('#detailSaveFeedback');
    if (saveButton?.disabled) return;
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = '저장 중…'; }
    if (feedback) { feedback.textContent = ''; feedback.className = 'member-save-feedback'; }
    setMessage(`${member.email} 회원 정보를 변경하고 있습니다.`);
    console.log('[admin] updateMember start', { memberId: member.id, email: member.email, nameChanged, accessChanged, nextUserType, nextMembership, nextStatus });

    // Diagnostic wrapper: logs every RPC call and its result, and makes
    // sure setMessage is always reached even if an RPC call rejects
    // outright (network error, thrown exception) instead of cleanly
    // resolving to { data, error } — previously an unexpected rejection
    // here would abort the whole function with no message ever shown,
    // which looked like the save button silently doing nothing.
    const callRpc = async (name, params) => {
      console.log(`[admin] calling RPC "${name}"`, params);
      try {
        const response = await client.rpc(name, params);
        console.log(`[admin] RPC "${name}" response`, { data: response.data, error: response.error });
        return response;
      } catch (thrown) {
        console.error(`[admin] RPC "${name}" threw instead of returning { data, error }`, thrown);
        return { data: null, error: thrown instanceof Error ? thrown : new Error(String(thrown)) };
      }
    };

    try {
      // Each concern is saved independently so one failing RPC can't
      // silently block the other from being saved. `field` is a stable
      // key used by the post-save verification step below; `label` is
      // just display text.
      const results = [];
      if (nameChanged) {
        const { error } = await callRpc('admin_update_member_name', { p_member_id: member.id, p_display_name: nextName });
        results.push({ field: 'name', label: '회원 이름', ok: !error, error });
      }
      const accessChangedAt = new Date(Date.now() - 2000).toISOString();
      const roleChanged = deriveRole(nextUserType, nextMembership, member.is_admin) !== member.role;
      let regionAccessSaved = !accessChanged;
      if (accessChanged) {
        const { error } = await callRpc('admin_update_member_access', { p_member_id: member.id, p_user_type: nextUserType, p_membership: nextMembership, p_account_status: nextStatus });
        results.push({ field: 'access', label: '회원유형/멤버십/계정 상태', ok: !error, error });
        regionAccessSaved = !error;
      }
      if (metadataChanged) {
        const { error } = await callRpc('admin_update_member_metadata', {
          p_member_id: member.id,
          p_nickname: metadata.nickname,
          p_full_name: metadata.fullName,
          p_phone: metadata.phone,
          p_specialty: metadata.specialty,
          p_teaching_subjects: metadata.teachingSubjects,
          p_enrolled_subject: metadata.enrolledSubject,
          p_assigned_instructor: metadata.assignedInstructor
        });
        results.push({ field: 'metadata', label: '관리 정보', ok: !error, error });
      }
      let savedRegion = null;
      if (regionChanged) {
        if (!regionAccessSaved) {
          results.push({ field: 'region', label: '활동 지역', ok: false, error: { message: '회원유형 변경이 저장되지 않아 활동 지역을 저장하지 않았습니다.' } });
        } else {
          const { data, error } = await callRpc('admin_update_partner_region', {
            p_member_id: member.id,
            p_country_code: nextRegion.country_code,
            p_country_name: nextRegion.country_name,
            p_state_code: nextRegion.state_code,
            p_state_name: nextRegion.state_name,
            p_city: nextRegion.city,
            p_service_area: nextRegion.service_area,
            p_online_available: nextRegion.online_available,
            p_nationwide_available: nextRegion.nationwide_available
          });
          savedRegion = Array.isArray(data) ? data[0] : data;
          results.push({ field: 'region', label: '활동 지역', ok: !error && samePartnerRegion(savedRegion, nextRegion), error: error || (!samePartnerRegion(savedRegion, nextRegion) ? { message: '활동 지역이 DB에 실제로 반영되지 않았습니다.' } : null) });
        }
      }

      // Never trust an RPC's { error: null } alone as proof the value
      // actually changed -- re-read the member from the database (via the
      // same admin_list_members() the list itself uses, so there's no
      // second copy of the data to fall out of sync) and only count a
      // field as saved if the fresh value actually matches what was asked
      // for.
      await loadMembers();
      const freshRaw = allMembers.find(candidate => candidate.id === member.id);
      const freshMember = freshRaw ? normalize(freshRaw) : null;
      console.log('[admin] post-save verification read', freshMember);
      const markUnverified = (field, msg) => {
        const result = results.find(candidate => candidate.field === field && candidate.ok);
        if (result) { result.ok = false; result.error = { message: msg }; }
      };
      if (!freshMember) {
        results.filter(result => result.ok).forEach(result => {
          result.ok = false;
          result.error = { message: '저장 후 회원 정보를 다시 불러오지 못해 DB 반영 여부를 확인할 수 없습니다.' };
        });
      } else {
        if (nameChanged && freshMember.display_name !== nextName) {
          markUnverified('name', `DB에 실제로 반영되지 않았습니다 (요청값: ${nextName}, 실제값: ${freshMember.display_name || '(없음)'})`);
        }
        if (accessChanged) {
          if (freshMember.user_type !== nextUserType) {
            markUnverified('access', `회원유형이 DB에 실제로 반영되지 않았습니다 (요청값: ${TYPE_LABELS[nextUserType]}, 실제값: ${TYPE_LABELS[freshMember.user_type]})`);
          } else if (freshMember.membership !== nextMembership) {
            markUnverified('access', `멤버십이 DB에 실제로 반영되지 않았습니다 (요청값: ${MEMBERSHIP_LABELS[nextMembership]}, 실제값: ${MEMBERSHIP_LABELS[freshMember.membership]})`);
          } else if (freshMember.account_status !== nextStatus) {
            markUnverified('access', `계정 상태가 DB에 실제로 반영되지 않았습니다 (요청값: ${STATUS_LABELS[nextStatus]}, 실제값: ${STATUS_LABELS[freshMember.account_status]})`);
          }
        }
        if (metadataChanged && (
          memberNickname(freshMember) !== metadata.nickname ||
          memberFullName(freshMember) !== metadata.fullName ||
          (freshMember.phone || '') !== metadata.phone ||
          (freshMember.specialty || '') !== metadata.specialty ||
          (freshMember.teaching_subjects || '') !== metadata.teachingSubjects ||
          (freshMember.enrolled_subject || '') !== metadata.enrolledSubject ||
          (freshMember.assigned_instructor || '') !== metadata.assignedInstructor
        )) {
          markUnverified('metadata', '관리 정보가 DB에 실제로 반영되지 않았습니다.');
        }
        // admin_list_members deliberately has no region columns. The
        // dedicated region RPC returns the saved record, which is the
        // equivalent post-save proof without widening the existing list RPC.
        if (regionChanged && !samePartnerRegion(savedRegion, nextRegion)) {
          markUnverified('region', '활동 지역이 DB에 실제로 반영되지 않았습니다.');
        }
      }

      const failed = results.filter(result => !result.ok);
      const succeeded = results.filter(result => result.ok);
      console.log('[admin] updateMember results (after DB verification)', results);
      let resultMessage;
      if (failed.length === 0) {
        resultMessage = '저장되었습니다. (DB 재조회로 확인함)';
      } else {
        const failureText = failed.map(result => `${result.label}: ${describeError(result.error)}`).join(' / ');
        resultMessage = succeeded.length === 0
          ? `저장에 실패했습니다. ${failureText}`
          : `일부 항목만 저장되었습니다 (${succeeded.map(result => result.label).join(', ')}). 실패: ${failureText}`;
      }

      // The database verification above is the user-visible save boundary.
      // Roster sync and role-email confirmation are follow-up work: never
      // keep the dialog in "saving" while an Apps Script execution is cold
      // or slow, and never reclassify a verified database save as failed.
      if (failed.length > 0) {
        setMessage(resultMessage, true);
        if (feedback) {
          feedback.textContent = resultMessage;
          feedback.className = 'member-save-feedback error';
        }
        if (saveButton) { saveButton.disabled = false; saveButton.textContent = '변경 저장'; }
        return;
      }

      setMessage('변경사항이 저장되었습니다.');
      if (feedback) {
        feedback.textContent = '변경사항이 저장되었습니다.';
        feedback.className = 'member-save-feedback success';
      }
      if (saveButton) { saveButton.disabled = false; saveButton.textContent = '변경 저장'; }
      window.setTimeout(() => {
        if (dialog.open) dialog.close();
      }, 1000);

      // A follow-up step can't be allowed to hang forever and keep the
      // notification from ever picking up its note -- bound it so a dead
      // network call becomes a visible failure note instead of silence.
      const withTimeout = (promise, ms, timeoutMessage) => Promise.race([
        promise,
        new Promise((resolve, reject) => window.setTimeout(() => reject(new Error(timeoutMessage)), ms))
      ]);

      const accessSaved = results.some(result => result.field === 'access' && result.ok);
      if (roleChanged && accessSaved) void (async () => {
        console.log('[admin] waiting for the automatic role-change email', { memberId: member.id, accessChangedAt });
        try {
          await withTimeout(waitForAutomaticRoleEmail(member.id, accessChangedAt), 25000, '메일 발송 확인이 시간 초과되었습니다.');
          console.log('[admin] automatic role-change email confirmed sent', { memberId: member.id });
        } catch (automaticError) {
          console.error('[admin] automatic role-change email was not confirmed; falling back to a direct send', { memberId: member.id, error: automaticError.message });
          try {
            await withTimeout(sendDirectRoleNotification({ ...member, role: deriveRole(nextUserType, nextMembership, member.is_admin) }, member.role), 10000, '안내메일 직접 발송이 시간 초과되었습니다.');
            console.log('[admin] direct role-change email sent', { memberId: member.id });
          } catch (directError) {
            console.error('[admin] direct role-change email also failed', { memberId: member.id, error: directError.message });
            setMessage(`변경사항은 저장되었습니다. 다만 안내메일 발송에는 실패했습니다: ${directError.message}`, true);
          }
        }
      })();

      // Sync the (now-verified) member profile to the existing member
      // roster Google Sheet -- reusing the same notify-role-change Edge
      // Function and Apps Script webhook the role-change email already
      // goes through, not a separate system. This must never affect
      // whether the DB save itself is reported as successful: it only
      // runs after a save actually succeeded, and its own failure is
      // reported as a separate, additional note.
      const anyFieldSaved = results.some(result => result.ok);
      if (anyFieldSaved) void (async () => {
        console.log('[admin] syncing profile to member roster sheet', { memberId: member.id });
        try {
          const { error: syncError } = await withTimeout(
            client.functions.invoke('notify-role-change', { body: { action: 'profile_sync', memberId: member.id } }),
            15000,
            '회원 명단 시트 업데이트 요청이 시간 초과되었습니다.'
          );
          if (syncError) {
            const detail = await describeFunctionError(syncError);
            console.error('[admin] roster sheet sync failed', {
              memberId: member.id,
              name: syncError.name,
              message: syncError.message,
              status: syncError.context?.status,
              detail
            });
            setMessage('변경사항은 저장되었습니다. 명단 시트 동기화는 계속 진행 중입니다.');
          } else {
            console.log('[admin] roster sheet sync succeeded', { memberId: member.id });
          }
        } catch (syncTimeoutError) {
          console.error('[admin] roster sheet sync timed out or threw', { memberId: member.id, error: syncTimeoutError.message });
          setMessage('변경사항은 저장되었습니다. 명단 시트 동기화는 계속 진행 중입니다.');
        }
      })();
    } catch (unexpected) {
      console.error('[admin] updateMember failed unexpectedly', unexpected);
      setMessage(`예기치 않은 오류로 저장하지 못했습니다: ${describeError(unexpected)}`, true);
      if (saveButton) { saveButton.disabled = false; saveButton.textContent = '변경 저장'; }
    }
  };

  filters.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  [search, typeFilter, membershipFilter, statusFilter].forEach(control => control.addEventListener(control === search ? 'input' : 'change', applyFilters));
  refreshButton.addEventListener('click', loadMembers);
  signOutButton.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('./'); });

  const initialize = async () => {
    if (!client || !access) { deny('회원관리 기능을 불러오지 못했습니다.'); return; }
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.user) { deny('로그인하지 않은 사용자는 관리자 페이지에 접근할 수 없습니다.'); return; }
    currentUserId = sessionData.session.user.id;
    const metadata = sessionData.session.user.user_metadata || {};
    const { data: profile, error: profileError } = await client.from('member_profiles').select('role,account_status,display_name').eq('id', currentUserId).maybeSingle();
    currentUserName = profile?.display_name || metadata.full_name || metadata.name || metadata.nickname || sessionData.session.user.email?.split('@')[0] || '관리자';
    if (profileError || profile?.role !== 'admin' || profile?.account_status !== 'active') { deny('관리자 권한이 확인되지 않아 접근할 수 없습니다.'); return; }
    loading.hidden = true; denied.hidden = true; app.hidden = false; signOutButton.hidden = false;
    await loadMembers();
  };

  initialize();
})();
