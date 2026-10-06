const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appJs = read('app/app.js');
const appIndex = read('app/index.html');
const appSw = read('app/service-worker-v104.js');
const auth = read('auth.js');

// 1. App has a roster registration function.
test('app.js defines ensureAppMemberRosterRegistration', () => {
  assert.match(appJs, /async function ensureAppMemberRosterRegistration\(user\)\{/);
});

// 2. Web/App endpoint is byte-for-byte the same Apps Script /exec URL.
test('App uses the exact same Apps Script endpoint as the Web signup pipeline', () => {
  const webUrl = fs.readFileSync(path.join(root, 'script.js'), 'utf8').match(/signupAutomationUrl='([^']+)'/)?.[1];
  const appUrl = appJs.match(/const APP_SIGNUP_AUTOMATION_URL="([^"]+)"/)?.[1];
  assert.ok(webUrl, 'script.js should define signupAutomationUrl');
  assert.ok(appUrl, 'app.js should define APP_SIGNUP_AUTOMATION_URL');
  assert.equal(appUrl, webUrl);
});

// 3. Same member UUID is sent under the same field name auth.js uses.
test('the same member UUID (회원 ID) is forwarded, matching auth.js\'s field contract', () => {
  assert.match(auth, /record\.set\('회원 ID', user\.id\)/);
  assert.match(appJs, /record\.set\("회원 ID",user\.id\)/);
});

// 4. Email is forwarded.
test('member email is forwarded', () => {
  assert.match(appJs, /record\.set\("이메일",user\.email\)/);
});

// 5. Same idempotency key/state machine as auth.js.
test('App registration uses the exact same sessionStorage idempotency key and pending/sent contract as auth.js', () => {
  assert.match(auth, /const requestKey = `harmony-member-number-requested:\$\{user\.id\}`/);
  assert.match(appJs, /const requestKey=`harmony-member-number-requested:\$\{user\.id\}`/);
  assert.match(appJs, /if\(sessionStorage\.getItem\(requestKey\)\)return;/);
  assert.match(appJs, /sessionStorage\.setItem\(requestKey,"pending"\)/);
  assert.match(appJs, /sessionStorage\.setItem\(requestKey,"sent"\)/);
  assert.match(appJs, /sessionStorage\.removeItem\(requestKey\)/);
});

// 6 & 7. Called on initial session load and on every subsequent auth state change.
test('registration is requested on initial App auth load and on every onAuthStateChange firing', () => {
  assert.match(appJs, /await ensureAppMemberRosterRegistration\(appAuthSession\?\.user\)/);
  assert.match(appJs, /onAuthStateChange\(\(_event,session\)=>\{appAuthSession=session;setAppSignedIn\(Boolean\(session\?\.user\)\);window\.setTimeout\(\(\)=>\{completePendingSignup\(session\);ensureAppMemberRosterRegistration\(session\?\.user\)\},0\)\}\)/);
});

// 8. No registration call is reachable while signed out: the function's own
// guard requires both user.id and user.email, so a null/undefined session
// user (the SIGNED_OUT shape) always short-circuits before any fetch.
test('a signed-out session (no user) never reaches the fetch call', () => {
  const body = appJs.slice(appJs.indexOf('async function ensureAppMemberRosterRegistration'), appJs.indexOf('async function completePendingSignup'));
  assert.match(body, /if\(!user\?\.id\|\|!user\?\.email\)return;/);
});

// 9. No client-side number generation.
test('the App never computes or guesses a member number itself', () => {
  assert.doesNotMatch(appJs, /HL-\$\{/);
  assert.doesNotMatch(appJs, /HL-\d/);
});

// 10. No overwrite risk: the App payload carries identity fields only, never
// a member_number value -- the Apps Script/Supabase side (unchanged) is the
// sole place that assigns or preserves it.
test('the App registration payload never includes a member_number field', () => {
  const body = appJs.slice(appJs.indexOf('async function ensureAppMemberRosterRegistration'), appJs.indexOf('async function completePendingSignup'));
  assert.doesNotMatch(body, /회원번호/);
  assert.doesNotMatch(body, /member_number/);
});

// 11. This fix has zero dependency on the (separate, unrelated) education-request bridge.
test('the App registration fix has no dependency on the education-request Google Form bridge', () => {
  assert.doesNotMatch(appJs, /education-request/i);
  assert.equal(fs.existsSync(path.join(root, 'automation', 'education-request-forward.gs')), false);
});

// 12. No member is special-cased by name or email.
test('no member is hardcoded by name or email in the App registration path', () => {
  assert.doesNotMatch(appJs, /if \(name === /);
  assert.doesNotMatch(appJs, /if \(email === /);
  assert.doesNotMatch(appJs, /염나영|Yeonhee|Jong Bae/);
});

test('app.js, app/index.html, and the service worker precache agree on the bumped cache-busting version', () => {
  const scriptVersion = appIndex.match(/app\.js\?v=(\d+)/)?.[1];
  const swVersion = appSw.match(/\.\/app\.js\?v=(\d+)/)?.[1];
  assert.ok(scriptVersion, 'app/index.html should reference app.js with a version');
  assert.equal(swVersion, scriptVersion, 'service worker precache version must match app/index.html');
});

test('service worker install/activate/fetch strategy is untouched -- only the app.js precache version changed', () => {
  assert.match(appSw, /const CACHE="harmony-link-app-v109"/);
  assert.match(appSw, /self\.addEventListener\("install",event=>event\.waitUntil\(caches\.open\(CACHE\)/);
  assert.match(appSw, /self\.addEventListener\("activate",event=>event\.waitUntil\(caches\.keys\(\)/);
  assert.match(appSw, /fetch\(event\.request,\{cache:"no-store"\}\)/);
});
