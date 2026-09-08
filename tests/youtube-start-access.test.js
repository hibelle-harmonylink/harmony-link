const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'youtube-start', 'access.js'), 'utf8');

async function runScenario(profile) {
  let clickHandler;
  const alerts = [];
  const opened = [];
  const button = {
    dataset: { premiumHref: 'https://example.test/ai-shorts' },
    addEventListener(type, handler) { if (type === 'click') clickHandler = handler; }
  };
  const signedIn = profile !== null;
  let getSessionCalls = 0;
  const window = {
    HarmonyAccess: {
      normalizeUser(value) { return value; },
      canAccessPremiumApps(value) {
        return value.account_status === 'active' && (value.role === 'admin' || value.membership === 'premium');
      }
    },
    supabase: {
      createClient() {
        return {
          auth: { async getSession() {
            getSessionCalls += 1;
            return { data: { session: signedIn ? {
              user: { id: 'member-1' },
              access_token: 'access token',
              refresh_token: 'refresh/token'
            } : null } };
          } },
          async rpc() { return { data: profile, error: null }; },
          from() { throw new Error('fallback should not be used'); }
        };
      }
    },
    alert(message) { alerts.push(message); },
    location: { href: 'https://harmony.example/youtube-start/index.html' },
    open() {
      return {
        opener: window,
        location: { replace(url) { opened.push(url); } },
        close() {}
      };
    }
  };
  vm.runInNewContext(source, {
    window,
    URL,
    URLSearchParams,
    document: { querySelector() { return button; } }
  });
  await new Promise(resolve => setImmediate(resolve));
  await clickHandler({ preventDefault() {} });
  return { alerts, opened, href: window.location.href, getSessionCalls };
}

(async function () {
  const anonymous = await runScenario(null);
  assert.deepStrictEqual(anonymous.alerts, ['회원 로그인이 필요합니다.']);
  assert.strictEqual(anonymous.href, '../index.html?auth=login');

  const basic = await runScenario({ account_status: 'active', membership: 'basic' });
  assert.deepStrictEqual(basic.alerts, ['이 기능은 Premium($50) 회원 전용입니다.']);
  assert.deepStrictEqual(basic.opened, []);

  const premium = await runScenario({ account_status: 'active', membership: 'premium' });
  assert.deepStrictEqual(premium.alerts, []);
  assert.deepStrictEqual(premium.opened, [
    'https://example.test/ai-shorts#hl_at=access+token&hl_rt=refresh%2Ftoken'
  ]);
  assert.strictEqual(new URL(premium.opened[0]).search, '');
  assert.strictEqual(premium.getSessionCalls, 2);

  console.log('YouTube Income Lab access scenarios passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
