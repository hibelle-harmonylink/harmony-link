const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const updateMember = source.slice(source.indexOf('const updateMember = async'), source.indexOf("filters.addEventListener('submit'"));

test('treats verified database persistence as the save-complete boundary', () => {
  const verification = updateMember.indexOf('await loadMembers();');
  const success = updateMember.indexOf("setMessage('변경사항이 저장되었습니다.')");
  const close = updateMember.indexOf('if (dialog.open) dialog.close();');
  assert.ok(verification >= 0 && success > verification);
  assert.ok(close > success);
  assert.match(updateMember, /window\.setTimeout\(\(\) => \{\s*if \(dialog\.open\) dialog\.close\(\);\s*\}, 1000\)/);
  assert.doesNotMatch(updateMember, /await Promise\.all\(\[emailTask, sheetTask\]\)/);
});

test('runs roster sync asynchronously without turning a timeout into a save failure', () => {
  assert.match(updateMember, /if \(anyFieldSaved\) void \(async \(\) =>/);
  assert.match(updateMember, /client\.functions\.invoke\('notify-role-change', \{ body: \{ action: 'profile_sync', memberId: member\.id \} \}\)/);
  assert.match(updateMember, /15000,\s*'회원 명단 시트 업데이트 요청이 시간 초과되었습니다.'/);
  assert.match(updateMember, /변경사항은 저장되었습니다\. 명단 시트 동기화는 계속 진행 중입니다\./);
  assert.doesNotMatch(updateMember, /회원 정보는 저장되었지만 회원 명단 시트 업데이트에 실패했습니다/);
});

test('keeps metadata changes outside the role-email trigger', () => {
  assert.match(updateMember, /if \(roleChanged && accessSaved\) void \(async \(\) =>/);
  const roleTrigger = updateMember.indexOf('if (roleChanged && accessSaved)');
  const directNotification = updateMember.indexOf('sendDirectRoleNotification', roleTrigger);
  assert.ok(roleTrigger >= 0 && directNotification > roleTrigger);
});
