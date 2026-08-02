/** Harmony Link 회원가입 명단 스프레드시트 누적 자동화 */
const MEMBER_SIGNUP = {
  sheetName: '회원가입 명단',
  propertySpreadsheetId: 'MEMBER_SPREADSHEET_ID'
};

function doPost(e) {
  const values = e && e.parameter ? e.parameter : {};
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty(MEMBER_SIGNUP.propertySpreadsheetId);

    if (!spreadsheetId) {
      throw new Error('MEMBER_SPREADSHEET_ID가 설정되지 않았습니다.');
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(MEMBER_SIGNUP.sheetName) ||
      spreadsheet.insertSheet(MEMBER_SIGNUP.sheetName);
    const headers = [
      '회원 ID', '가입시각', '이름', '이메일',
      '가입방식', '회원구분', '가입경로'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#0d51aa')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }

    const memberId = values['회원 ID'] || '';
    if (memberId && sheet.getLastRow() > 1) {
      const existing = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(memberId)
        .matchEntireCell(true)
        .findNext();
      if (existing) {
        return ContentService
          .createTextOutput(JSON.stringify({
            ok: true,
            memberId,
            duplicate: true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    sheet.appendRow([
      memberId,
      values['가입 시각'] || new Date().toISOString(),
      values['이름'] || '',
      values['이메일'] || values.email || '',
      values['가입 방식'] || '',
      values['회원 구분'] || '일반회원',
      values['가입 경로'] || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        memberId,
        duplicate: false
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
