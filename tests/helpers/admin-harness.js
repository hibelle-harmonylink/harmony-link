const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const access = require('../../access-control.js');

const source = fs.readFileSync(path.join(__dirname, '../../admin.js'), 'utf8');

// Execute the real admin functions with a small DOM/RPC double. No SDK,
// initialization, network, real timers, or production credentials are used.
function createAdminHarness({ rpc = async () => ({ data: [], error: null }) } = {}) {
  function element() {
    const listeners = new Map();
    const selectors = new Map();
    const classes = new Set();
    return {
      value: '', textContent: '', innerHTML: '', className: '', hidden: false,
      disabled: false, open: true, dataset: {}, children: [],
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
        contains: name => classes.has(name),
      },
      addEventListener(name, callback) { listeners.set(name, callback); },
      click() { return listeners.get('click')?.({ currentTarget: this }); },
      querySelector(selector) {
        if (!selectors.has(selector)) selectors.set(selector, element());
        return selectors.get(selector);
      },
      querySelectorAll() { return []; },
      appendChild(child) { this.children.push(child); return child; },
      replaceChildren(...children) { this.children = children; },
      setAttribute() {}, focus() {}, remove() {},
      showModal() { this.open = true; }, close() { this.open = false; },
    };
  }
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const overlays = [];
  const calls = [];
  const followups = [];
  const timers = [];
  const logs = [];
  const context = {
    testApi: null,
    console: {
      log(...args) { logs.push({ level: 'log', args }); },
      error(...args) { logs.push({ level: 'error', args }); },
    },
    document: {
      getElementById: get, querySelector: get, body: element(),
      createElement() { const node = element(); overlays.push(node); return node; },
    },
    window: {
      HarmonyAccess: access,
      supabase: { createClient: () => ({
        rpc: async (name, params) => { calls.push({ name, params }); return rpc(name, params); },
        functions: { invoke: async (...args) => { followups.push(args); return { error: null }; } },
      }) },
      setTimeout(callback, ms) { timers.push({ callback, ms }); return timers.length; },
      clearTimeout() {}, location: { replace() {} },
    },
  };
  const seam = '  initialize();';
  if (!source.includes(seam)) throw new Error('Admin initialization seam not found');
  vm.runInNewContext(source.replace(seam, `
    testApi = {
      memberPersonName, memberFullName, memberNickname, resolveDisplayName,
      openDetail, loadMembers, updateMember,
      setMembers: members => { allMembers = members; },
      getMembers: () => allMembers
    };`), context);
  return {
    ...context.testApi, get, calls, followups, timers, logs,
    async save(member, overrides = {}) {
      const pending = context.testApi.updateMember(
        member, overrides.name ?? context.testApi.resolveDisplayName(member),
        overrides.userType ?? member.user_type, overrides.membership ?? member.membership,
        overrides.status ?? member.account_status,
        { nickname: overrides.nickname ?? context.testApi.memberNickname(member) }
      );
      // askConfirm installs its listeners synchronously before its first await.
      const overlay = overlays.findLast(node => node.className === 'admin-confirm-overlay');
      if (overlay) overlay.querySelector('.admin-confirm-ok').click();
      await pending;
    },
  };
}

module.exports = { createAdminHarness };
