(() => {
  'use strict';
  console.log('[admin] admin.js loaded — build 20260902-2');

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
  const typeFilter = document.getElementById('typeFilter');
  const roleFilter = document.getElementById('roleFilter');
  const refreshButton = document.getElementById('adminRefresh');
  const signOutButton = document.getElementById('adminSignOut');

  const ROLE_LABELS = {
    member: '파트너 등급 없음', partner0: '무료 파트너', partner20: '$20 BASIC 파트너', partner50: '$50 PREMIUM 파트너', admin: '관리자'
  };
  const TYPE_LABELS = { general: '일반회원', student: '수강생', partner: '입점 파트너', admin: '관리자' };
  let currentUserId = '';
  let currentUserName = '';
  let allMembers = [];

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
  const setMessage = (text = '', error = false) => {
    message.textContent = text;
    message.classList.toggle('error', error);
  };
  // window.confirm() is used only here, for the save flow's "are you sure"
  // step. After a user dismisses several native confirm()/alert() dialogs
  // on the same page in a row, Chrome offers to (and once checked, will)
  // silently disable all further ones for that page: every later
  // window.confirm() call then returns false instantly, with no dialog
  // shown and nothing thrown -- which looks exactly like the save button
  // doing nothing at all. A custom in-page dialog can't be suppressed that
  // way, so it replaces window.confirm() for this flow.
  const askConfirm = text => new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-confirm-overlay';
    overlay.innerHTML = '<div class="admin-confirm-box"><pre class="admin-confirm-message"></pre><div class="admin-confirm-actions"><button type="button" class="admin-confirm-cancel">취소</button><button type="button" class="admin-confirm-ok btn btn-primary">확인</button></div></div>';
    overlay.querySelector('.admin-confirm-message').textContent = text;
    document.body.appendChild(overlay);
    const finish = result => { overlay.remove(); resolve(result); };
    overlay.querySelector('.admin-confirm-ok').addEventListener('click', () => finish(true));
    overlay.querySelector('.admin-confirm-cancel').addEventListener('click', () => finish(false));
    overlay.addEventListener('click', event => { if (event.target === overlay) finish(false); });
    overlay.querySelector('.admin-confirm-ok').focus();
  });
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
    const counts = { all: members.length, general: 0, student: 0, partner0: 0, partner20: 0, partner50: 0, premium: 0 };
    members.forEach(member => {
      if (member.member_type === 'general') counts.general += 1;
      if (member.member_type === 'student') counts.student += 1;
      if (Object.hasOwn(counts, member.role)) counts[member.role] += 1;
      if (member.premium_member === true) counts.premium += 1;
    });
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
    const typeLabel = TYPE_LABELS[member.member_type] || (member.role === 'member' ? '일반회원' : '입점 파트너');
    const tierLabel = member.role === 'member' || member.role === 'admin' ? '' : ` · ${ROLE_LABELS[member.role]}`;
    const premiumLabel = member.premium_member === true ? ' · Premium' : '';
    badge.textContent = `${typeLabel}${tierLabel}${premiumLabel} · ${displayName}`;
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
    const typeSelect = card.querySelector('.member-type-select');
    typeSelect.value = member.member_type || (member.role === 'member' ? 'general' : 'partner');
    const syncFromType = () => {
      const isPartner = typeSelect.value === 'partner';
      select.disabled = !isPartner;
      if (isPartner && select.value === 'member') select.value = 'partner0';
      if (!isPartner) select.value = 'member';
    };
    const syncFromRole = () => {
      if (select.value !== 'member') typeSelect.value = 'partner';
      syncFromType();
    };
    typeSelect.disabled = false;
    typeSelect.addEventListener('change', syncFromType);
    select.addEventListener('change', syncFromRole);
    syncFromType();
    const nameInput = card.querySelector('.member-name-input');
    nameInput.value = displayName;
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
    const premiumButton = card.querySelector('.member-premium-button');
    const isPremium = member.premium_member === true;
    premiumButton.dataset.premium = String(isPremium);
    premiumButton.textContent = isPremium ? 'Premium 승인됨' : 'Premium 미승인';
    premiumButton.classList.toggle('is-approved', isPremium);
    premiumButton.addEventListener('click', () => {
      const next = premiumButton.dataset.premium !== 'true';
      premiumButton.dataset.premium = String(next);
      premiumButton.textContent = next ? 'Premium 승인 예정' : 'Premium 해제 예정';
      premiumButton.classList.toggle('is-approved', next);
      console.log('[admin] Premium toggle clicked', { memberId: member.id, pendingPremium: next });
    });
    const saveButton = card.querySelector('.member-save');
    saveButton.addEventListener('click', async () => {
      console.log('[admin] Save button clicked', { memberId: member.id, pendingPremium: premiumButton.dataset.premium });
      saveButton.disabled = true;
      try {
        await updateMember(member, select.value, statusButton.dataset.status, nameInput.value, typeSelect.value, premiumButton.dataset.premium === 'true');
      } finally {
        saveButton.disabled = false;
      }
    });
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
    console.log('[admin] rendered cards', { count: members.length, saveButtonsWired: list.querySelectorAll('.member-save').length });
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

  const applyFilters = () => {
    const term = search.value.trim().toLowerCase();
    const type = typeFilter.value;
    const role = roleFilter.value;
    renderMembers(allMembers.filter(member => (!term || (member.email || '').toLowerCase().includes(term)) && (!type || member.member_type === type) && (!role || member.role === role)));
  };

  const sendRoleNotification = async (member, oldRole = '') => {
    const { data: notificationId, error } = await client.rpc('admin_queue_role_email', { p_member_id: member.id });
    if (error) throw new Error(error.message || '메일 발송 대기열 등록에 실패했습니다.');
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 1000));
      const { data: rows, error: statusError } = await client.rpc('admin_get_role_email_status', {
        p_notification_id: notificationId
      });
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
      const { data: rows, error } = await client.rpc('admin_get_latest_role_email_status', {
        p_member_id: memberId,
        p_after: changedAfter
      });
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

  const updateMember = async (member, nextRole, nextStatus, requestedName, requestedType, nextPremium) => {
    const nextName = requestedName.trim();
    const nextType = ['general', 'student', 'partner'].includes(requestedType) ? requestedType : 'general';
    const roleChanged = nextRole !== member.role;
    const typeChanged = nextType !== member.member_type;
    const statusChanged = nextStatus !== member.account_status;
    const nameChanged = nextName !== (member.display_name || '');
    const premiumChanged = nextPremium !== (member.premium_member === true);
    if (!roleChanged && !typeChanged && !statusChanged && !nameChanged && !premiumChanged) {
      setMessage('변경된 내용이 없습니다.', true);
      return;
    }
    if (nextName.length < 2 || nextName.length > 50) {
      setMessage('회원 이름은 2자 이상 50자 이하로 입력해 주세요.', true);
      return;
    }
    const detail = [nameChanged ? `회원 이름 → ${nextName}` : '', typeChanged ? `회원 유형 → ${TYPE_LABELS[nextType]}` : '', roleChanged ? `${ROLE_LABELS[member.role]} → ${ROLE_LABELS[nextRole]}` : '', statusChanged ? `${member.account_status === 'active' ? '활성' : '중지'} → ${nextStatus === 'active' ? '활성' : '중지'}` : '', premiumChanged ? `Premium 회원(AI 쇼츠) → ${nextPremium ? '승인' : '미승인'}` : ''].filter(Boolean).join('\n');
    console.log('[admin] asking for confirmation', { memberId: member.id, detail });
    const confirmed = await askConfirm(`${member.email} 회원을 다음과 같이 변경할까요?\n\n${detail}`);
    console.log('[admin] confirmation result', confirmed);
    if (!confirmed) {
      setMessage('변경이 취소되었습니다.', true);
      return;
    }
    setMessage(`${member.email} 회원 정보를 변경하고 있습니다.`);
    console.log('[admin] updateMember start', { memberId: member.id, email: member.email, roleChanged, typeChanged, statusChanged, nameChanged, premiumChanged, nextPremium });

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
      // Each field is saved independently so one failing RPC (e.g. a
      // migration that hasn't been applied yet) can't silently block the
      // other, unrelated fields from being saved. `field` is a stable key
      // used by the post-save verification step below; `label` is just
      // display text.
      const results = [];
      if (nameChanged) {
        const { error } = await callRpc('admin_update_member_name', { p_member_id: member.id, p_display_name: nextName });
        results.push({ field: 'name', label: '회원 이름', ok: !error, error });
      }
      if (premiumChanged) {
        const { error } = await callRpc('admin_update_member_premium', { p_member_id: member.id, p_premium: nextPremium });
        results.push({ field: 'premium', label: 'Premium 승인 상태', ok: !error, error });
      }
      if (typeChanged) {
        const { error } = await callRpc('admin_update_member_type', { p_member_id: member.id, p_member_type: nextType });
        results.push({ field: 'type', label: '회원 유형', ok: !error, error });
      }
      const roleChangedAt = new Date(Date.now() - 2000).toISOString();
      if (roleChanged || statusChanged) {
        const { error } = await callRpc('admin_update_member', { p_member_id: member.id, p_role: nextRole, p_account_status: nextStatus });
        results.push({ field: 'roleStatus', label: roleChanged && statusChanged ? '파트너 등급/활성 상태' : roleChanged ? '파트너 등급' : '활성 상태', ok: !error, error });
      }

      // Never trust an RPC's { error: null } alone as proof the value
      // actually changed -- re-read the member from the database (via the
      // same admin_list_members() the list itself uses, so there's no
      // second copy of the data to fall out of sync) and only count a
      // field as saved if the fresh value actually matches what was asked
      // for.
      await loadMembers();
      const freshMember = allMembers.find(candidate => candidate.id === member.id);
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
        if (premiumChanged && (freshMember.premium_member === true) !== nextPremium) {
          markUnverified('premium', `DB에 실제로 반영되지 않았습니다 (요청값: ${nextPremium ? '승인' : '미승인'}, 실제값: ${freshMember.premium_member ? '승인' : '미승인'})`);
        }
        if (typeChanged && freshMember.member_type !== nextType) {
          markUnverified('type', `DB에 실제로 반영되지 않았습니다 (요청값: ${TYPE_LABELS[nextType] || nextType}, 실제값: ${TYPE_LABELS[freshMember.member_type] || freshMember.member_type})`);
        }
        if (roleChanged && freshMember.role !== nextRole) {
          markUnverified('roleStatus', `파트너 등급이 DB에 실제로 반영되지 않았습니다 (요청값: ${ROLE_LABELS[nextRole] || nextRole}, 실제값: ${ROLE_LABELS[freshMember.role] || freshMember.role})`);
        }
        if (statusChanged && freshMember.account_status !== nextStatus) {
          markUnverified('roleStatus', `활성 상태가 DB에 실제로 반영되지 않았습니다 (요청값: ${nextStatus}, 실제값: ${freshMember.account_status})`);
        }
      }

      const failed = results.filter(result => !result.ok);
      const succeeded = results.filter(result => result.ok);
      console.log('[admin] updateMember results (after DB verification)', results);
      let resultMessage;
      let resultIsError;
      if (failed.length === 0) {
        resultMessage = '저장되었습니다. (DB 재조회로 확인함)';
        resultIsError = false;
      } else {
        const failureText = failed.map(result => `${result.label}: ${describeError(result.error)}`).join(' / ');
        resultIsError = true;
        resultMessage = succeeded.length === 0
          ? `저장에 실패했습니다. ${failureText}`
          : `일부 항목만 저장되었습니다 (${succeeded.map(result => result.label).join(', ')}). 실패: ${failureText}`;
      }

      // Show the completion notification right now, based only on the DB
      // verification above. The automatic-email confirmation (polls for up
      // to 20s) and the Sheet sync webhook (no timeout of its own) are
      // both best-effort follow-ups; previously this notification waited
      // on both of them to finish before ever appearing, so any hang or
      // slow response from either one -- e.g. a slow/cold Apps Script
      // deployment -- silently swallowed the "저장되었습니다" message
      // entirely, even though the DB save itself had already succeeded
      // and been verified. Each follow-up now appends its own note to the
      // same banner once (and only once) it resolves, instead of gating
      // whether the banner appears at all.
      let emailNote = '';
      let sheetSyncNote = '';
      const renderResult = () => setMessage(`${resultMessage}${emailNote}${sheetSyncNote}`, resultIsError);
      renderResult();

      // A follow-up step can't be allowed to hang forever and keep the
      // notification from ever picking up its note -- bound it so a dead
      // network call becomes a visible failure note instead of silence.
      const withTimeout = (promise, ms, timeoutMessage) => Promise.race([
        promise,
        new Promise((resolve, reject) => window.setTimeout(() => reject(new Error(timeoutMessage)), ms))
      ]);

      const tierSaved = results.some(result => result.field === 'roleStatus' && result.ok);
      const emailTask = (roleChanged && tierSaved) ? (async () => {
        console.log('[admin] waiting for the automatic role-change email', { memberId: member.id, roleChangedAt });
        try {
          await withTimeout(waitForAutomaticRoleEmail(member.id, roleChangedAt), 25000, '메일 발송 확인이 시간 초과되었습니다.');
          console.log('[admin] automatic role-change email confirmed sent', { memberId: member.id });
          emailNote = ' 안내메일도 정상 발송되었습니다.';
        } catch (automaticError) {
          console.error('[admin] automatic role-change email was not confirmed; falling back to a direct send', { memberId: member.id, error: automaticError.message });
          try {
            await withTimeout(sendDirectRoleNotification({ ...member, role: nextRole }, member.role), 10000, '안내메일 직접 발송이 시간 초과되었습니다.');
            console.log('[admin] direct role-change email sent', { memberId: member.id });
            emailNote = ' 안내메일도 정상 발송되었습니다.';
          } catch (directError) {
            console.error('[admin] direct role-change email also failed', { memberId: member.id, error: directError.message });
            emailNote = ` 다만 안내메일 발송에는 실패했습니다: ${directError.message}`;
          }
        }
        renderResult();
      })() : Promise.resolve();

      // Sync the (now-verified) member profile to the existing member
      // roster Google Sheet -- reusing the same notify-role-change Edge
      // Function and Apps Script webhook the role-change email already
      // goes through, not a separate system. This must never affect
      // whether the DB save itself is reported as successful: it only
      // runs after a save actually succeeded, and its own failure is
      // reported as a separate, additional note.
      const anyFieldSaved = results.some(result => result.ok && ['name', 'type', 'premium', 'roleStatus'].includes(result.field));
      const sheetTask = anyFieldSaved ? (async () => {
        console.log('[admin] syncing profile to member roster sheet', { memberId: member.id });
        try {
          const { error: syncError } = await withTimeout(
            client.functions.invoke('notify-role-change', { body: { action: 'profile_sync', memberId: member.id } }),
            15000,
            '회원 명단 시트 업데이트 요청이 시간 초과되었습니다.'
          );
          console.log('[admin] roster sheet sync result', { error: syncError });
          sheetSyncNote = syncError
            ? ` 회원 정보는 저장되었지만 회원 명단 시트 업데이트에 실패했습니다: ${describeError(syncError)}`
            : ' 회원 명단 시트에도 반영되었습니다.';
        } catch (syncTimeoutError) {
          console.error('[admin] roster sheet sync timed out or threw', { memberId: member.id, error: syncTimeoutError.message });
          sheetSyncNote = ` 회원 정보는 저장되었지만 회원 명단 시트 업데이트에 실패했습니다: ${syncTimeoutError.message}`;
        }
        renderResult();
      })() : Promise.resolve();

      await Promise.all([emailTask, sheetTask]);
    } catch (unexpected) {
      console.error('[admin] updateMember failed unexpectedly', unexpected);
      setMessage(`예기치 않은 오류로 저장하지 못했습니다: ${describeError(unexpected)}`, true);
    }
  };

  filters.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  roleFilter.addEventListener('change', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  search.addEventListener('input', applyFilters);
  refreshButton.addEventListener('click', loadMembers);
  signOutButton.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('./'); });

  const initialize = async () => {
    if (!client) { deny('로그인 기능을 불러오지 못했습니다.'); return; }
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
