(() => {
  'use strict';
  const URL = 'https://ricndeoiomzjacmrsjtg.supabase.co';
  const KEY = 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  const client = window.supabase?.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
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
  const labels = { notice: '공지사항', intro: '파트너 소개', question: '질문과 답변', review: '수업 후기·성공 사례', resource: '자료 공유' };
  const roleLabels = { member: '회원 커뮤니티', partner0: '무료 파트너', partner20: '$20 BASIC 파트너', partner50: '$50 PREMIUM 파트너', admin: '관리자' };
  let user = null;
  let profile = null;
  let posts = [];
  const legacyPostLinks = {
    '1일 무료 체험 후기': 'https://www.youtube.com/shorts/zr_CoDfcEbI',
    '미란멜로디 소개합니다.': 'https://www.instagram.com/meeranmelody',
    '미란멜로디 소개합니다': 'https://www.instagram.com/meeranmelody'
  };

  const setMessage = (text, error = false) => { message.textContent = text; message.classList.toggle('error', error); };
  const showAccessMessage = (title, copy) => { access.querySelector('h1').textContent = title; access.querySelector('p').textContent = copy; access.hidden = false; app.hidden = true; };
  const formatDate = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
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
    document.getElementById('postCategory').value = post?.category || 'intro';
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
      if (comment.author_id === user.id || profile.role === 'admin') { const button = document.createElement('button'); button.type = 'button'; button.textContent = '삭제'; button.addEventListener('click', () => deleteComment(comment.id)); row.append(button); }
      return row;
    }));
  };

  const createCard = post => {
    const card = template.content.firstElementChild.cloneNode(true);
    const category = card.querySelector('.post-category'); category.textContent = labels[post.category]; category.classList.add(post.category);
    card.querySelector('time').textContent = formatDate(post.created_at);
    card.querySelector('.post-title').textContent = post.title;
    const contentElement = card.querySelector('.post-content');
    renderLinkedText(contentElement, post.content);
    const isExistingHarmonyLinkPost = new Date(post.created_at) < new Date('2026-08-06T04:00:00Z');
    const visibleAuthorName = isExistingHarmonyLinkPost ? '하모니링크' : post.author_name;
    card.querySelector('.post-author').textContent = `${visibleAuthorName} · ${post.comments.length}개의 댓글`;
    const links = card.querySelector('.post-links');
    const normalizedTitle = String(post.title || '').trim();
    const fallbackUrl = legacyPostLinks[normalizedTitle]
      || (/1일\s*(무료\s*)?체험.*후기/.test(normalizedTitle) ? 'https://www.youtube.com/shorts/zr_CoDfcEbI' : '')
      || (/미란멜로디.*소개/.test(normalizedTitle) ? 'https://www.instagram.com/meeranmelody/' : '');
    const relatedUrls = [...new Set([...extractUrls(post.content), ...extractUrls(post.resource_url), ...extractUrls(fallbackUrl)])];
    relatedUrls.forEach(safeUrl => {
      const anchor = document.createElement('a');
      const host = new URL(safeUrl).hostname.replace(/^www\./, '');
      const label = /youtu\.be|youtube\.com/i.test(host) ? 'YouTube' : /instagram\.com/i.test(host) ? 'Instagram' : host;
      anchor.className = 'post-inline-link'; anchor.href = safeUrl; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = `${label} 바로가기: ${safeUrl}`;
      contentElement.append(document.createElement('br'), anchor);

    });
    links.hidden = true;
    const editable = post.author_id === user.id || profile.role === 'admin';
    card.querySelector('.post-actions').hidden = !editable;
    card.querySelector('.edit-post').addEventListener('click', () => openComposer(post));
    card.querySelector('.delete-post').addEventListener('click', async () => { if (!confirm('이 게시글과 댓글을 모두 삭제할까요?')) return; const { error } = await client.from('partner_community_posts').delete().eq('id', post.id); if (error) setMessage(`삭제 실패: ${error.message}`, true); else await loadPosts(); });
    const toggle = card.querySelector('.comment-toggle'); toggle.querySelector('b').textContent = String(post.comments.length);
    const panel = card.querySelector('.comment-panel');
    toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    renderComments(card.querySelector('.comment-list'), post.comments, post.id);
    card.querySelector('.comment-form').addEventListener('submit', async event => { event.preventDefault(); const input = event.currentTarget.querySelector('input'); const content = input.value.trim(); if (!content) return; const { error } = await client.from('partner_community_comments').insert({ post_id: post.id, author_id: user.id, author_name: profile.display_name, content }); if (error) setMessage(`댓글 등록 실패: ${error.message}`, true); else { input.value = ''; await loadPosts(); } });
    return card;
  };

  const renderPosts = () => {
    const term = search.value.trim().toLowerCase(); const selected = categoryFilter.value;
    const filtered = posts.filter(post => (!selected || post.category === selected) && (!term || `${post.title} ${post.content}`.toLowerCase().includes(term)));
    list.replaceChildren(...filtered.map(createCard)); empty.hidden = filtered.length > 0;
  };

  const loadPosts = async () => {
    setMessage('게시글을 불러오고 있습니다.');
    const { data, error } = await client.from('partner_community_posts').select('*,comments:partner_community_comments(*)').order('created_at', { ascending: false });
    if (error) { setMessage(`게시글을 불러오지 못했습니다: ${error.message}`, true); return; }
    posts = (data || []).map(post => ({ ...post, comments: (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) })); renderPosts(); setMessage(`최근 게시글 ${posts.length}건을 표시합니다.`);
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('editingPostId').value;
    const payload = { category: document.getElementById('postCategory').value, title: document.getElementById('postTitle').value.trim(), content: document.getElementById('postContent').value.trim(), resource_url: document.getElementById('postResourceUrl').value.trim() || null };
    const request = id ? client.from('partner_community_posts').update(payload).eq('id', id) : client.from('partner_community_posts').insert({ ...payload, author_id: user.id, author_name: profile.display_name });
    const { error } = await request;
    if (error) { document.getElementById('composerMessage').textContent = `저장 실패: ${error.message}`; return; }
    closeComposer(); await loadPosts(); setMessage(id ? '게시글을 수정했습니다.' : '새 게시글을 등록했습니다.');
  });

  document.getElementById('openComposer').addEventListener('click', () => openComposer());
  document.querySelectorAll('[data-close-composer]').forEach(button => button.addEventListener('click', closeComposer));
  document.getElementById('refreshPosts').addEventListener('click', loadPosts);
  categoryFilter.addEventListener('change', renderPosts); search.addEventListener('input', renderPosts);
  document.getElementById('signOutButton').addEventListener('click', async () => { await client.auth.signOut(); location.replace('https://hibelleharmony.com/'); });

  const initialize = async () => {
    if (!client) return;
    const { data } = await client.auth.getSession(); user = data.session?.user;
    if (!user) { window.location.replace('https://hibelleharmony.com/?refresh=20260809-277#partner-center'); return; }
    const { data: member, error } = await client.from('member_profiles').select('role,account_status,display_name,member_type').eq('id', user.id).maybeSingle();
    if (error || !member || member.account_status !== 'active' || !['member','partner0','partner20','partner50','admin'].includes(member.role)) { showAccessMessage('커뮤니티를 이용할 수 없습니다', '활성 상태의 Harmony Link 회원만 이용할 수 있습니다.'); return; }
    profile = { ...member, display_name: member.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] };
    document.querySelector('[data-admin-only]').hidden = profile.role !== 'admin'; document.getElementById('memberBadge').textContent = profile.role === 'member' ? (profile.member_type === 'student' ? '수강생 커뮤니티' : '일반회원 커뮤니티') : roleLabels[profile.role]; document.getElementById('welcomeName').textContent = `${profile.display_name}님, 반갑습니다.`;
    const requestedCategory = new URLSearchParams(location.search).get('category');
    if (Object.hasOwn(labels, requestedCategory)) categoryFilter.value = requestedCategory;
    access.hidden = true; app.hidden = false; await loadPosts();
  };
  initialize();
})();
