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
  const window = {
    HarmonyAccess: { normalizeUser(value) { return value; } },
    supabase: {
      createClient() {
        return {
          auth: { async getSession() { return { data: { session: signedIn ? { user: { id: 'member-1' } } : null } }; } },
          async rpc() { return { data: profile, error: null }; },
          from() { throw new Error('fallback should not be used'); }
        };
      }
    },
    alert(message) { alerts.push(message); },
    location: { href: 'index.html' },
    open(url) { opened.push(url); }
  };
  vm.runInNewContext(source, { window, document: { querySelector() { return button; } } });
  await new Promise(resolve => setImmediate(resolve));
  clickHandler({ preventDefault() {} });
  return { alerts, opened, href: window.location.href };
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
  assert.deepStrictEqual(premium.opened, ['https://example.test/ai-shorts']);

  console.log('YouTube Income Lab access scenarios passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
