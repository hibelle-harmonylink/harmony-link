const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const bridge = read('automation/digital-class-application-forward.gs');

// Extracts one top-level function's full source (closing brace alone at
// column 0 -- the codebase's consistent top-level function convention) so it
// can be real-executed in an isolated vm context instead of only pattern
// matched.
function extractFunction(name) {
  const match = bridge.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `could not extract ${name} from digital-class-application-forward.gs`);
  return match[0];
}

// Builds a real, isolated execution context for the Form-submit handler and
// its alignment helper, with forwardDigitalClassApplicationToRoster_ replaced
// by a counting (optionally throwing) spy -- the roster-sync side of this
// handler is already covered by tests/digital-class-application-sync.test.js,
// so this harness focuses only on the new alignment behavior and on proving
// the two concerns are independent of each other.
function submitHarness({ rosterSyncThrows = false, alignmentThrows = false } = {}) {
  const calls = { align: 0, rosterSync: 0, consoleError: 0 };
  const errors = [];
  const context = {
    calls, errors,
    console: { error: (...args) => { calls.consoleError++; errors.push(args.join(' ')); }, warn: () => {} },
  };
  vm.createContext(context);
  vm.runInContext([
    extractFunction('forwardDigitalClassApplication'),
    alignmentThrows
      ? `function alignDigitalClassResponseRowLeft_(event) { calls.align++; throw new Error('simulated alignment failure'); }`
      : extractFunction('alignDigitalClassResponseRowLeft_'),
    rosterSyncThrows
      ? `function forwardDigitalClassApplicationToRoster_(namedValues) { calls.rosterSync++; throw new Error('simulated roster sync failure'); }`
      : `function forwardDigitalClassApplicationToRoster_(namedValues) { calls.rosterSync++; }`,
  ].join('\n;\n'), context);
  return { forwardDigitalClassApplication: context.forwardDigitalClassApplication, calls, errors };
}

// A minimal mock Range/Sheet pair matching the real onFormSubmit event shape
// (event.range.getSheet(), event.range.getRow()) with no hardcoded sheet
// name/ID and no hardcoded row number -- both come from the mock event, the
// same way the real Apps Script event supplies them.
function mockFormSubmitEvent({ row, lastColumn, namedValues }) {
  const alignmentCalls = [];
  const sheet = {
    getLastColumn: () => lastColumn,
    getRange: (r, c, numRows, numCols) => ({
      setHorizontalAlignment: alignment => { alignmentCalls.push({ row: r, col: c, numRows, numCols, alignment }); },
    }),
  };
  const range = { getSheet: () => sheet, getRow: () => row };
  return { event: { namedValues, range }, alignmentCalls };
}

test('REAL EXECUTION: a new Form submission left-aligns exactly its own row across the sheet\'s full used column range', () => {
  const { event, alignmentCalls } = mockFormSubmitEvent({ row: 42, lastColumn: 17, namedValues: { '9.구글이메일': ['x@example.com'] } });
  const h = submitHarness();
  h.forwardDigitalClassApplication(event);
  assert.equal(alignmentCalls.length, 1);
  assert.deepEqual(alignmentCalls[0], { row: 42, col: 1, numRows: 1, numCols: 17, alignment: 'left' });
  assert.equal(h.calls.rosterSync, 1, 'roster sync must still run alongside alignment');
});

test('REAL EXECUTION: alignment still runs when it is given no range (defensive no-op, never throws)', () => {
  const h = submitHarness();
  assert.doesNotThrow(() => h.forwardDigitalClassApplication({ namedValues: { '9.구글이메일': ['x@example.com'] } }));
  assert.equal(h.calls.rosterSync, 1);
});

test('REAL EXECUTION: a roster-sync failure never prevents alignment from running (independence)', () => {
  const { event, alignmentCalls } = mockFormSubmitEvent({ row: 5, lastColumn: 10, namedValues: {} });
  const h = submitHarness({ rosterSyncThrows: true });
  assert.doesNotThrow(() => h.forwardDigitalClassApplication(event));
  assert.equal(alignmentCalls.length, 1, 'alignment must still have been applied');
  assert.equal(h.calls.rosterSync, 1, 'roster sync was still attempted');
  assert.ok(h.calls.consoleError >= 1, 'the roster-sync failure must be logged, not silently dropped');
});

test('REAL EXECUTION: an alignment failure never prevents roster sync from running (independence)', () => {
  const event = { namedValues: { '9.구글이메일': ['x@example.com'] }, range: {} };
  const h = submitHarness({ alignmentThrows: true });
  assert.doesNotThrow(() => h.forwardDigitalClassApplication(event));
  assert.equal(h.calls.align, 1, 'alignment was attempted');
  assert.equal(h.calls.rosterSync, 1, 'roster sync must still have run');
  assert.ok(h.calls.consoleError >= 1, 'the alignment failure must be logged, not silently dropped');
});

// REAL EXECUTION of the menu-triggered bulk alignment pass, against a mock
// active sheet/data-range -- never a hardcoded sheet name/ID, never a
// hardcoded row/column count, and no value-reading or value-writing call
// anywhere in the path.
function bulkAlignHarness({ numRows, numCols }) {
  const calls = { setHorizontalAlignment: 0, alert: 0 };
  const alignmentCalls = [];
  const range = {
    getNumRows: () => numRows,
    getNumColumns: () => numCols,
    setHorizontalAlignment: alignment => { calls.setHorizontalAlignment++; alignmentCalls.push(alignment); },
  };
  const sheet = { getDataRange: () => range };
  const context = {
    calls, alignmentCalls,
    SpreadsheetApp: {
      getUi: () => ({ alert: () => { calls.alert++; } }),
      getActiveSheet: () => sheet,
    },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction('alignAllDigitalClassResponsesLeft'), context);
  return { alignAllDigitalClassResponsesLeft: context.alignAllDigitalClassResponsesLeft, calls, alignmentCalls };
}

test('REAL EXECUTION: the bulk-align menu action left-aligns the real data range once, without reading or writing values', () => {
  const h = bulkAlignHarness({ numRows: 76, numCols: 13 });
  h.alignAllDigitalClassResponsesLeft();
  assert.equal(h.calls.setHorizontalAlignment, 1);
  assert.deepEqual(h.alignmentCalls, ['left']);
  assert.equal(h.calls.alert, 1);
});

test('REAL EXECUTION: the bulk-align menu action is a no-op when the sheet has no data, and never throws', () => {
  const h = bulkAlignHarness({ numRows: 0, numCols: 0 });
  assert.doesNotThrow(() => h.alignAllDigitalClassResponsesLeft());
  assert.equal(h.calls.setHorizontalAlignment, 0, 'nothing should be aligned when there is no data');
  assert.equal(h.calls.alert, 1);
});

// Static checks -- the contract this feature must hold in the source itself.

test('the admin menu exposes the new bulk-align item wired to the real function name', () => {
  assert.match(bridge, /\.addItem\('응답 전체 왼쪽 정렬', 'alignAllDigitalClassResponsesLeft'\)/);
});

test('alignment code never reads or writes a cell value -- only horizontal alignment formatting', () => {
  const alignmentSection = bridge.slice(
    bridge.indexOf('function alignAllDigitalClassResponsesLeft'),
    bridge.indexOf('function digitalClassAnswer_')
  );
  assert.doesNotMatch(alignmentSection, /setValue|setValues|appendRow|deleteRow|clearContent|insertRow|getValue\(|getValues\(/);
  assert.match(alignmentSection, /setHorizontalAlignment\('left'\)/);
});

test('row-level alignment never hardcodes a sheet name/ID or a row number', () => {
  const rowAlignFn = bridge.slice(
    bridge.indexOf('function alignDigitalClassResponseRowLeft_'),
    bridge.indexOf('function forwardDigitalClassApplicationToRoster_')
  );
  assert.doesNotMatch(rowAlignFn, /getSheetByName\(|openById\(/);
  assert.match(rowAlignFn, /event\.range\.getSheet\(\)/);
  assert.match(rowAlignFn, /event\.range\.getRow\(\)/);
  // The range used for alignment is built from the dynamic `row` variable
  // and the sheet's own getLastColumn(), never a literal row/column number.
  assert.match(rowAlignFn, /getRange\(row, 1, 1, lastColumn\)/);
  assert.doesNotMatch(rowAlignFn, /getRange\(\d/);
});

test('bulk alignment never hardcodes a sheet name/ID or a fixed range string', () => {
  const bulkAlignFn = bridge.slice(
    bridge.indexOf('function alignAllDigitalClassResponsesLeft'),
    bridge.indexOf('function forwardDigitalClassApplication(')
  );
  assert.doesNotMatch(bulkAlignFn, /getSheetByName\(|openById\(/);
  assert.doesNotMatch(bulkAlignFn, /getRange\(['"]/); // no "A1:Z99"-style literal range
  assert.match(bulkAlignFn, /getActiveSheet\(\)/);
  assert.match(bulkAlignFn, /getDataRange\(\)/);
});

test('this feature adds no new onFormSubmit trigger -- exactly one ScriptApp.newTrigger call in the whole file', () => {
  const newTriggerMatches = bridge.match(/ScriptApp\.newTrigger\(/g) || [];
  assert.equal(newTriggerMatches.length, 1);
  assert.match(bridge, /ScriptApp\.newTrigger\('forwardDigitalClassApplication'\)/);
});

test('alignment and roster sync are independently wrapped so neither can block the other', () => {
  const handler = bridge.slice(bridge.indexOf('function forwardDigitalClassApplication('), bridge.indexOf('function alignDigitalClassResponseRowLeft_'));
  const tryBlocks = handler.match(/try \{/g) || [];
  assert.equal(tryBlocks.length, 2, 'alignment and roster sync must each have their own try/catch');
});

test('no specific member (by name, email, or member number) is hardcoded anywhere in this file', () => {
  assert.doesNotMatch(bridge, /염나영|신영숙/);
  assert.doesNotMatch(bridge, /meilly@naver\.com|040nsd@gmail\.com|agnesshin70@gmail\.com/);
  assert.doesNotMatch(bridge, /HL-26-013|HL-26-005/);
});

test('the existing roster sync function and config are unchanged by this feature', () => {
  assert.match(bridge, /function forwardDigitalClassApplicationToRoster_\(namedValues\) \{/);
  assert.match(bridge, /rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL'/);
  assert.match(bridge, /name: '4\.이름'/);
  assert.match(bridge, /email: '9\.구글이메일'/);
});
