(() => {
  'use strict';
  const SUPABASE_URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const client = window.supabase?.createClient(SUPABASE_URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const access = document.getElementById('accessState');
  const app = document.getElementById('communityApp');
  const list = document.getElementById('postList');
  const empty = document.getElementById('postEmpty');
  const message = document.getElementById('communityMessage');
  const modal = document.getElementById('composerModal');
  const form = document.getElementById('postForm');
  const template = document.getElementById('postTemplate');
  const categoryFilter = document.getElementById('categoryFilter');
  const search = document.getElementById('postSearch');
  const labels = { notice: '공지사항', question: '질문과 답변', info: '정보 공유', review: '정보 공유', free: '자유 게시판', intro: '자유 게시판', jobs: '구인구직', resource: '자료방' };
  const roleLabels = { member: '회원 커뮤니티', partner0: '무료 파트너', partner20: '$20 BASIC 파트너', partner50: '$50 PREMIUM 파트너', admin: '관리자' };
  let user = null;
  let profile = null;
  let posts = [];
  const PUBLIC_POST_COOLDOWN_MS = 30000;
  const legacyPostLinks = {
    '1일 무료 체험 후기': 'https://www.youtube.com/shorts/zr_CoDfcEbI',
    '미란멜로디 소개합니다.': 'https://www.instagram.com/meeranmelody',
    '미란멜로디 소개합니다': 'https://www.instagram.com/meeranmelody'
  };

  const setMessage = (text, error = false) => { message.textContent = text; message.classList.toggle('error', error); };
  const displayAuthorName = value => /^(harmony\s*link|하모니\s*링크)$/i.test(String(value || '').trim()) ? '하이벨' : String(value || '익명').trim();
  const matchesCategory = (postCategory, selected) => !selected || postCategory === selected || (selected === 'info' && postCategory === 'review') || (selected === 'free' && postCategory === 'intro');
  const getPublicClientToken = () => {
    const storageKey = 'harmony-community-public-writer';
    let token = localStorage.getItem(storageKey);
    if (!token) { token = crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`; localStorage.setItem(storageKey, token); }
    return token;
  };
  const escapeUrl = value => { try { const raw = String(value || '').trim(); const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
  const extractUrls = value => {
    const matches = String(value || '').match(/(?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?/gi) || [];
    const urls = matches.map(item => item.replace(/[),.!?]+$/, '')).map(escapeUrl).filter(Boolean);
    const instagramHandles = [...String(value || '').matchAll(/(?:^|\s)@([a-z0-9._]{2,30})\b/gi)]
      .map(match => `https://www.instagram.com/${match[1]}/`);
    return [...urls, ...instagramHandles];
  };
  const renderLinkedText = (target, value) => {
    const text = String(value || '');
    const pattern = /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      if (match.index > cursor) target.append(document.createTextNode(text.slice(cursor, match.index)));
      const trailing = match[0].match(/[),.!?]+$/)?.[0] || '';
      const rawUrl = trailing ? match[0].slice(0, -trailing.length) : match[0];
      const safeUrl = escapeUrl(rawUrl);
      if (safeUrl) { const link = document.createElement('a'); link.href = safeUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = rawUrl; target.append(link); }
      else target.append(document.createTextNode(rawUrl));
      if (trailing) target.append(document.createTextNode(trailing));
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) target.append(document.createTextNode(text.slice(cursor)));
  };
  const closeComposer = () => { modal.hidden = true; document.body.style.overflow = ''; form.reset(); document.getElementById('editingPostId').value = ''; };
  const openComposer = (post = null) => {
    form.reset();
    document.getElementById('editingPostId').value = post?.id || '';
    document.getElementById('composerTitle').textContent = post ? '글 수정' : '새 글 작성';
    document.getElementById('postCategory').value = post?.category || 'free';
    const authorInput = document.getElementById('postAuthorName');
    authorInput.value = post ? displayAuthorName(post.author_name) : profile ? (profile.role === 'admin' ? '하이벨' : profile.display_name) : (localStorage.getItem('harmony-community-guest-name') || '');
    authorInput.readOnly = !!profile;
    document.getElementById('postTitle').value = post?.title || '';
    document.getElementById('postContent').value = post?.content || '';
    document.getElementById('postResourceUrl').value = post?.resource_url || '';
    modal.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('postTitle').focus();
  };

  const deleteComment = async id => {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    const { error } = await client.from('partner_community_comments').delete().eq('id', id);
    if (error) setMessage(`댓글 삭제 실패: ${error.message}`, true); else await loadPosts();
  };

  const renderComments = (target, comments, postId) => {
    target.replaceChildren(...comments.map(comment => {
      const row = document.createElement('div'); row.className = 'comment-item';
      const author = document.createElement('strong'); author.textContent = comment.author_name;
      const content = document.createElement('p'); content.textContent = comment.content;
      row.append(author, content);
      if (user && (comment.author_id === user.id || profile.role === 'admin')) { const button = document.createElement('button'); button.type = 'button'; button.textContent = '삭제'; button.addEventListener('click', () => deleteComment(comment.id)); row.append(button); }
      return row;
    }));
  };

  const createCard = post => {
    const card = template.content.firstElementChild.cloneNode(true);
    const category = card.querySelector('.post-category'); category.textContent = labels[post.category]; category.classList.add(post.category);
    const titleText = card.querySelector('.post-title-text') || card.querySelector('.post-title');
    titleText.textContent = post.title;
    const contentElement = card.querySelector('.post-content');
    renderLinkedText(contentElement, post.content);
    const visibleAuthorName = displayAuthorName(post.author_name);
    card.querySelector('.post-list-author').textContent = `작성자: ${visibleAuthorName}`;
    card.querySelector('.post-author').textContent = `${visibleAuthorName} · ${post.comments.length}개의 댓글`;
    let links = card.querySelector('.post-links');
    if (!links) {
      links = document.createElement('span');
      links.className = 'post-links';
      titleText.parentElement.append(links);
    }
    const normalizedTitle = String(post.title || '').trim();
    const fixedPostUrl = normalizedTitle.includes('1일 무료 체험 후기')
      ? 'https://www.youtube.com/shorts/zr_CoDfcEbI'
      : normalizedTitle.includes('미란멜로디') && normalizedTitle.includes('소개')
        ? 'https://www.instagram.com/meeranmelody/'
        : '';
    const fallbackUrl = fixedPostUrl || legacyPostLinks[normalizedTitle] || '';
    const relatedUrls = [...new Map(
      [fallbackUrl, ...extractUrls(post.content), ...extractUrls(post.resource_url)]
        .filter(Boolean)
        .map(url => {
          const safeUrl = escapeUrl(url);
          return [safeUrl.replace(/\/$/, ''), safeUrl];
        })
    ).values()];
    relatedUrls.forEach(safeUrl => {
      const anchor = document.createElement('a');
      const host = new URL(safeUrl).hostname.replace(/^www\./, '');
      const label = /youtu\.be|youtube\.com/i.test(host) ? 'YouTube' : /instagram\.com/i.test(host) ? 'Instagram' : host;
      anchor.className = 'post-link'; anchor.href = safeUrl; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = `${label} 보기 ↗`;
      links.append(anchor);

    });
    links.hidden = relatedUrls.length === 0;
    const editable = !!user && (post.author_id === user.id || profile.role === 'admin');
    card.querySelector('.post-actions').hidden = !editable;
    card.querySelector('.edit-post').addEventListener('click', () => openComposer(post));
    card.querySelector('.delete-post').addEventListener('click', async () => { if (!confirm('이 게시글과 댓글을 모두 삭제할까요?')) return; const { error } = await client.from('partner_community_posts').delete().eq('id', post.id); if (error) setMessage(`삭제 실패: ${error.message}`, true); else await loadPosts(); });
    const toggle = card.querySelector('.comment-toggle'); toggle.querySelector('b').textContent = String(post.comments.length);
    const panel = card.querySelector('.comment-panel');
    toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    const accordionToggle = card.querySelector('.post-accordion-toggle');
    const postBody = card.querySelector('.post-body');
    const postBodyId = `post-body-${String(post.id).replace(/[^a-z0-9_-]/gi, '-')}`;
    postBody.id = postBodyId;
    accordionToggle.setAttribute('aria-controls', postBodyId);
    accordionToggle.addEventListener('click', () => {
      const willOpen = postBody.hidden;
      list.querySelectorAll('.post-card').forEach(otherCard => {
        const otherBody = otherCard.querySelector('.post-body');
        const otherToggle = otherCard.querySelector('.post-accordion-toggle');
        if (!otherBody || !otherToggle) return;
        otherBody.hidden = true;
        otherToggle.setAttribute('aria-expanded', 'false');
      });
      postBody.hidden = !willOpen;
      accordionToggle.setAttribute('aria-expanded', String(willOpen));
    });
    renderComments(card.querySelector('.comment-list'), post.comments, post.id);
    card.querySelector('.comment-form').addEventListener('submit', async event => { event.preventDefault(); if (!user) { setMessage('댓글 작성은 로그인 후 이용할 수 있습니다.', true); return; } const input = event.currentTarget.querySelector('input'); const content = input.value.trim(); if (!content) return; const { error } = await client.from('partner_community_comments').insert({ post_id: post.id, author_id: user.id, author_name: profile.display_name, content }); if (error) setMessage(`댓글 등록 실패: ${error.message}`, true); else { input.value = ''; await loadPosts(); } });
    return card;
  };

  const renderPosts = () => {
    const term = search.value.trim().toLowerCase(); const selected = categoryFilter.value;
    const filtered = posts.filter(post => matchesCategory(post.category, selected) && (!term || `${post.title} ${post.content}`.toLowerCase().includes(term)));
    list.replaceChildren(...filtered.map(createCard)); empty.hidden = filtered.length > 0;
  };

  const loadPosts = async () => {
    setMessage('게시글을 불러오고 있습니다.');
    // get_community_posts_public() is readable by anyone (anon included);
    // the board itself is public, only writing requires an active member.
    const { data, error } = await client.rpc('get_community_posts_public');
    if (error) { console.error('get_community_posts_public failed:', error); setMessage('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true); return; }
    if (!Array.isArray(data)) { setMessage('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true); return; }
    posts = (data || []).map(post => ({ ...post, comments: (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) })); renderPosts(); setMessage(`최근 게시글 ${posts.length}건을 표시합니다.`);
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('editingPostId').value;
    const authorName = document.getElementById('postAuthorName').value.trim();
    const payload = { category: document.getElementById('postCategory').value, title: document.getElementById('postTitle').value.trim(), content: document.getElementById('postContent').value.trim(), resource_url: document.getElementById('postResourceUrl').value.trim() || null };
    if (authorName.length < 2 || payload.title.length < 2 || payload.content.length < 2) { document.getElementById('composerMessage').textContent = '작성자, 제목, 내용을 모두 입력해 주세요.'; return; }
    let error;
    if (profile) {
      const request = id ? client.from('partner_community_posts').update(payload).eq('id', id) : client.from('partner_community_posts').insert({ ...payload, author_id: user.id, author_name: profile.display_name });
      ({ error } = await request);
    } else {
      if (id) { document.getElementById('composerMessage').textContent = '비회원 게시글의 수정과 삭제는 관리자에게 문의해 주세요.'; return; }
      const lastSubmitted = Number(localStorage.getItem('harmony-community-last-public-post') || 0);
      if (Date.now() - lastSubmitted < PUBLIC_POST_COOLDOWN_MS) { document.getElementById('composerMessage').textContent = '잠시 후 다시 등록해 주세요.'; return; }
      localStorage.setItem('harmony-community-guest-name', authorName);
      const result = await client.rpc('create_public_community_post', { p_category: payload.category, p_author_name: authorName, p_title: payload.title, p_content: payload.content, p_resource_url: payload.resource_url, p_client_token: getPublicClientToken() });
      error = result.error;
      if (!error) localStorage.setItem('harmony-community-last-public-post', String(Date.now()));
    }
    if (error) { document.getElementById('composerMessage').textContent = `저장 실패: ${error.message}`; return; }
    closeComposer(); await loadPosts(); setMessage(id ? '게시글을 수정했습니다.' : '새 게시글을 등록했습니다.');
  });

  document.getElementById('openComposer').addEventListener('click', () => openComposer());
  document.querySelectorAll('[data-close-composer]').forEach(button => button.addEventListener('click', closeComposer));
  document.getElementById('refreshPosts').addEventListener('click', loadPosts);
  categoryFilter.addEventListener('change', renderPosts); search.addEventListener('input', renderPosts);
  document.getElementById('signOutButton').addEventListener('click', async () => { await client.auth.signOut(); location.replace('https://hibelleharmony.com/'); });

  const showGuestView = () => {
    user = null; profile = null;
    document.getElementById('openComposer').hidden = false;
    document.querySelector('[data-admin-only]').hidden = true;
    document.getElementById('memberBadge').textContent = '게스트';
    document.getElementById('welcomeName').textContent = '';
  };

  // Session state is judged the same way every other page (auth.js,
  // youtube-start/access.js) judges it: account_status in the shared
  // ACTIVE_STATUSES set ('active' or 'expiring') and community/feature
  // access itself decided by HarmonyAccess.hasFeatureAccess() rather than a
  // hand-rolled role whitelist here, so this page can't quietly drift out
  // of sync with the canonical access rules in access-control.js.
  const showLoading = () => {
    const heading = access.querySelector('h1');
    const copy = access.querySelector('p');
    if (heading) heading.textContent = '커뮤니티를 불러오고 있습니다';
    if (copy) copy.textContent = '로그인 상태를 확인하고 있습니다.';
    access.hidden = false; app.hidden = true;
  };

  // Community posts, public post creation, and the digital-volunteer section
  // are public. Comments and member-owned edit/delete actions still require
  // an approved signed-in member. A signed-out visitor gets the same board
  // with the restricted public composer instead of being blocked. The
  // guest/loading view is never replaced by a "sign in required" prompt --
  // it stays a neutral loading state until the session check resolves, so
  // a signed-in user navigating in from index.html never sees a stale
  // login prompt while their session is still being confirmed.
  const initialize = async () => {
    showLoading();
    if (!client) { showGuestView(); access.hidden = true; app.hidden = false; setMessage('게시글을 불러오지 못했습니다.', true); return; }
    const { data } = await client.auth.getSession(); user = data.session?.user || null;
    document.getElementById('signOutButton').hidden = !user;
    if (user) {
      const { data: member, error } = await client.from('member_profiles').select('role,account_status,display_name,member_type').eq('id', user.id).maybeSingle();
      const allowed = !error && member && window.HarmonyAccess?.hasFeatureAccess(member, 'community');
      if (!allowed) {
        showGuestView();
      } else {
        profile = { ...member, display_name: member.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] };
        document.getElementById('openComposer').hidden = false;
        document.querySelector('[data-admin-only]').hidden = profile.role !== 'admin'; document.getElementById('memberBadge').textContent = profile.role === 'member' ? (profile.member_type === 'student' ? '수강생 커뮤니티' : '일반회원 커뮤니티') : (roleLabels[profile.role] || '회원 커뮤니티'); document.getElementById('welcomeName').textContent = profile.role === 'admin' ? '하이벨님' : `${profile.display_name}님, 반갑습니다.`;
      }
    } else {
      showGuestView();
    }
    const requestedCategory = new URLSearchParams(location.search).get('category');
    if ([...categoryFilter.options].some(option => option.value === requestedCategory)) categoryFilter.value = requestedCategory;
    access.hidden = true; app.hidden = false; await loadPosts();
  };
  initialize();
})();
