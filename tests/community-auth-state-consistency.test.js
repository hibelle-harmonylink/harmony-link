const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const community = fs.readFileSync(path.join(root, 'community.js'), 'utf8');

// Regression coverage for the "로그아웃" (logged-in header) shown at the same
// time as "게시글을 작성하려면 로그인이 필요합니다" (guest-only body prompt) bug:
// signOutButton/communityHomeButton were hidden based on raw Supabase session
// presence, before the member_profiles/hasFeatureAccess check that showGuestView()
// depends on had resolved, so a signed-in-but-not-approved session left the
// header showing "로그아웃" while the guest prompt was also reachable.

test('guest view hides every logged-in-only header control, not just the login prompt', () => {
  const guestView = community.match(/const showGuestView = \(\) => \{([\s\S]*?)\};/)?.[1] || '';
  assert.match(guestView, /signOutButton'\)\.hidden = true/);
  assert.match(guestView, /communityHomeButton'\)\.hidden = true/);
  assert.match(guestView, /communityLoginPrompt'\)\.hidden = true/);
});

test('signOutButton/communityHomeButton visibility is derived from the resolved access check, not raw session presence', () => {
  // The old bug: `signOutButton.hidden = !user` ran right after getSession(),
  // before member_profiles/hasFeatureAccess had a chance to reject the session.
  assert.doesNotMatch(community, /signOutButton'\)\.hidden = !user/);
  assert.doesNotMatch(community, /communityHomeButton'\)\.hidden = !user/);
  // They are only ever shown inside the branch where access was confirmed allowed.
  const resolveAccess = community.match(/const resolveAccess = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
  assert.match(resolveAccess, /if \(!allowed\) \{\s*showGuestView\(\);/);
  assert.match(resolveAccess, /\} else \{[\s\S]*?signOutButton'\)\.hidden = false;[\s\S]*?communityHomeButton'\)\.hidden = false;/);
});

test('community.js reuses the Supabase SDK onAuthStateChange listener for live login/logout transitions', () => {
  assert.match(community, /client\?\.auth\.onAuthStateChange\(event => \{/);
  assert.match(community, /if \(event !== 'SIGNED_IN' && event !== 'SIGNED_OUT'\) return;/);
  assert.match(community, /resolveAccess\(\)\.then\(/);
});

test('auth-init failure (no Supabase client) still falls back to the safe guest view', () => {
  const resolveAccess = community.match(/const resolveAccess = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
  assert.match(resolveAccess, /if \(!client\) \{ showGuestView\(\); return; \}/);
});

test('initial page load resolves access exactly once through the shared resolveAccess function', () => {
  const initialize = community.match(/const initialize = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
  assert.match(initialize, /showLoading\(\);/);
  assert.match(initialize, /await resolveAccess\(\);/);
});
