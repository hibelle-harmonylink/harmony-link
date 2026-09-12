const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const appsScript = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');
const edgeFunction = fs.readFileSync(path.join(root, 'supabase', 'functions', 'notify-role-change', 'index.ts'), 'utf8');

// Models the DB RPC's immutable-on-conflict contract. It intentionally does
// not issue numbers: the Sheet's Script Lock is the sole issuance boundary.
function register(store, memberId, memberNumber, joinedAt) {
  const existing = store.get(memberId);
  if (existing) return existing;
  if ([...store.values()].some(row => row.memberNumber === memberNumber)) throw new Error('member number unique conflict');
  const created = { memberId, memberNumber, joinedAt };
  store.set(memberId, created);
  return created;
}

// Models the distributed recovery order in registerMember_: the locked Sheet
// row is durable first; a failed metadata call returns an error; retrying the
// same UUID reuses that row's number and sends no second signup email.
function registerWithRecovery(sheetRows, metadataStore, memberId, nextNumber, metadataOk) {
  const row = sheetRows.get(memberId);
  const isNewRow = !row;
  const memberNumber = row?.memberNumber || nextNumber();
  if (!row) sheetRows.set(memberId, { memberNumber });
  if (!metadataOk) return { ok: false, memberNumber, isNewRow, signupEmail: false };
  const stored = register(metadataStore, memberId, memberNumber, '2026-09-12T12:00:00.000Z');
  return { ok: stored.memberNumber === memberNumber, memberNumber, isNewRow, signupEmail: isNewRow };
}

test('Apps Script records its single Sheet-issued number through the protected server path', () => {
  assert.match(appsScript, /metadataWebhookUrl: 'https:\/\/ricndeoiomzjacmrsjtg\.supabase\.co\/functions\/v1\/notify-role-change'/);
  assert.match(appsScript, /const metadataResult = registerMemberMetadata_\(memberId, memberNumber, joinedAt\)/);
  assert.match(appsScript, /metadataResult\.memberNumber !== memberNumber/);
  assert.match(appsScript, /action: 'member_metadata_register'/);
  assert.match(appsScript, /webhookSecret: secret/);
  assert.match(edgeFunction, /requestBody\.action === 'member_metadata_register'/);
  assert.match(edgeFunction, /adminClient\.rpc\('internal_register_member_admin_metadata'/);
  assert.match(edgeFunction, /Stored member number conflict/);
});

test('Apps Script sends one UUID, its issued number, and timestamp to the metadata endpoint', () => {
  let request;
  const context = {
    JSON, Date, String, Object, Number, isNaN,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-shared-secret' }) },
    UrlFetchApp: {
      fetch(url, options) {
        request = { url, options };
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ ok: true, memberNumber: 'HL-26-008' }) };
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(appsScript, context);
  const result = context.registerMemberMetadata_('00000000-0000-4000-8000-000000000008', 'HL-26-008', new Date('2026-09-12T12:00:00.000Z'));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, memberNumber: 'HL-26-008' });
  assert.equal(request.url, 'https://ricndeoiomzjacmrsjtg.supabase.co/functions/v1/notify-role-change');
  const body = JSON.parse(request.options.payload);
  assert.deepEqual(body, {
    action: 'member_metadata_register', webhookSecret: 'test-shared-secret',
    memberId: '00000000-0000-4000-8000-000000000008', memberNumber: 'HL-26-008',
    joinedAt: '2026-09-12T12:00:00.000Z'
  });
});

test('HL-26-008 registers identically in Sheet and metadata, then duplicate delivery remains idempotent', () => {
  const store = new Map();
  const first = register(store, '00000000-0000-4000-8000-000000000008', 'HL-26-008', '2026-09-12T12:00:00.000Z');
  const duplicate = register(store, '00000000-0000-4000-8000-000000000008', 'HL-26-008', '2026-09-12T12:00:00.000Z');
  assert.equal(first.memberNumber, 'HL-26-008');
  assert.equal(duplicate.memberNumber, 'HL-26-008');
  assert.equal(store.size, 1);
});

test('Sheet-success and metadata-failure recovery retries HL-26-008 without a duplicate row, number, or email', () => {
  const sheetRows = new Map();
  const metadataStore = new Map();
  let nextSequence = 8;
  const nextNumber = () => `HL-26-${String(nextSequence++).padStart(3, '0')}`;
  const memberId = '00000000-0000-4000-8000-000000000008';

  const failed = registerWithRecovery(sheetRows, metadataStore, memberId, nextNumber, false);
  assert.deepEqual(failed, { ok: false, memberNumber: 'HL-26-008', isNewRow: true, signupEmail: false });
  assert.equal(sheetRows.size, 1);
  assert.equal(metadataStore.size, 0);

  const recovered = registerWithRecovery(sheetRows, metadataStore, memberId, nextNumber, true);
  assert.deepEqual(recovered, { ok: true, memberNumber: 'HL-26-008', isNewRow: false, signupEmail: false });
  assert.equal(sheetRows.size, 1);
  assert.equal(metadataStore.size, 1);
  assert.equal(metadataStore.get(memberId).memberNumber, 'HL-26-008');
  assert.equal(nextSequence, 9);
});

test('metadata registration failures are returned and log identifiers without logging the shared secret', () => {
  assert.match(appsScript, /Member metadata registration needs retry:/);
  assert.match(appsScript, /JSON\.stringify\(\{ memberId: memberId, memberNumber: memberNumber, status: metadataResult\.status \|\| 0 \}\)/);
  const retryLog = appsScript.slice(appsScript.indexOf('Member metadata registration needs retry:'), appsScript.indexOf('Member metadata registration needs retry:') + 240);
  assert.doesNotMatch(retryLog, /secret/i);
  assert.match(appsScript, /if \(isNewRow && email\) sendSignupConfirmation_\(record\)/);
});

test('sequential lock releases for two new members issue HL-26-008 then HL-26-009 with no duplicate', () => {
  const issued = ['HL-26-001', 'HL-26-007'];
  const next = () => `HL-26-${String(Math.max(...issued.map(value => Number(value.slice(-3)))) + 1).padStart(3, '0')}`;
  const first = next(); issued.push(first);
  const second = next(); issued.push(second);
  assert.deepEqual([first, second], ['HL-26-008', 'HL-26-009']);
  assert.equal(new Set(issued).size, issued.length);
});

test('existing seven IDs retain their issued numbers', () => {
  const existing = Array.from({ length: 7 }, (_, index) => `HL-26-${String(index + 1).padStart(3, '0')}`);
  const store = new Map(existing.map((memberNumber, index) => [`member-${index + 1}`, { memberNumber }]));
  const retry = register(store, 'member-4', 'HL-26-999', '2026-08-11T02:45:59.000Z');
  assert.equal(retry.memberNumber, 'HL-26-004');
  assert.equal(store.size, 7);
});
