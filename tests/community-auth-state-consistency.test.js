const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const community = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
const communityHtml = fs.readFileSync(path.join(root, 'community.html'), 'utf8');
const communityCss = fs.readFileSync(path.join(root, 'community.css'), 'utf8');

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

// Regression coverage for the root cause of the "로그아웃" + "로그인이 필요합니다"
// showing at the same time on real Production: community.js's own hidden-state
// logic was already correct (see the tests above), but community.css set
// .community-login-prompt{display:flex} unconditionally, with no matching
// [hidden] override -- unlike every other toggled element in this file
// (.home-button[hidden], #signOutButton[hidden], .access-state[hidden], etc.).
// An author stylesheet rule always beats the browser's built-in [hidden]{display:none}
// rule regardless of selector specificity, so setting communityLoginPrompt.hidden = true
// had zero visual effect: the prompt (and its login button, since it's a descendant)
// stayed visible even while signOutButton was correctly hidden/shown by the same logic.
test('community.css hides .community-login-prompt when [hidden] is set, matching every other toggled element in this file', () => {
  assert.match(communityCss, /\.community-login-prompt\[hidden\]\{display:none!important\}/);
});

test('the login button lives inside #communityLoginPrompt, so hiding the prompt also hides the button (no separate toggle needed)', () => {
  const promptSection = communityHtml.match(/<section id="communityLoginPrompt"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(promptSection, /class="primary-button"[^>]*>로그인/);
});

test('three real auth states resolve to mutually exclusive, non-contradictory UI: no session, session+allowed, session+denied', () => {
  const resolveAccess = community.match(/const resolveAccess = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
  const guestView = community.match(/const showGuestView = \(\) => \{([\s\S]*?)\};/)?.[1] || '';

  // State 1: no session at all -- getSession() resolves with no user, showGuestView() runs.
  assert.match(resolveAccess, /if \(!user\) \{ showGuestView\(\); return; \}/);

  // State 3: session exists but access is denied (not an approved/active community member)
  // -- also routes straight to showGuestView(), the exact same guest state as no session.
  assert.match(resolveAccess, /if \(!allowed\) \{\s*showGuestView\(\);/);

  // States 1 and 3 both land in showGuestView(), which is the single place that must hide
  // every logged-in-only control: login prompt, (its nested login button along with it),
  // logout, home button. "새 글 작성" stays visible per existing policy -- guests can click
  // it, and openComposer()'s own gate is what surfaces the login prompt on that attempt.
  assert.match(guestView, /signOutButton'\)\.hidden = true/);
  assert.match(guestView, /communityHomeButton'\)\.hidden = true/);
  assert.match(guestView, /communityLoginPrompt'\)\.hidden = true/);
  assert.match(guestView, /openComposer'\)\.hidden = false/);

  // State 2: session exists and access is allowed -- the only branch that reveals the
  // logged-in header controls, and it explicitly re-hides the login prompt in the same
  // branch, so it can never be visible at the same time as a visible logout button.
  const allowedBranch = resolveAccess.match(/\} else \{([\s\S]*?)\n {4}\}/)?.[1] || '';
  assert.match(allowedBranch, /signOutButton'\)\.hidden = false/);
  assert.match(allowedBranch, /communityHomeButton'\)\.hidden = false/);
  assert.match(allowedBranch, /communityLoginPrompt'\)\.hidden = true/);
  assert.match(allowedBranch, /openComposer'\)\.hidden = false/);
});
