/** Harmony Link 봉사·도움 요청 스프레드시트 누적 자동화 */
const INTAKE = {
  sheetName: '봉사·도움 접수',
  propertySpreadsheetId: 'INTAKE_SPREADSHEET_ID'
};

function doPost(e) {
  const values = e && e.parameter ? e.parameter : {};
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty(INTAKE.propertySpreadsheetId);

    if (!spreadsheetId) {
      throw new Error('INTAKE_SPREADSHEET_ID가 설정되지 않았습니다.');
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(INTAKE.sheetName) ||
      spreadsheet.insertSheet(INTAKE.sheetName);
    const headers = [
      '접수번호', '접수시각', '문의유형', '이름',
      '연락처', '이메일', '문의내용', '접수경로'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    const intakeId = Utilities.getUuid();
    const submittedAt = values['접수 시각'] || new Date().toISOString();

    sheet.appendRow([
      intakeId,
      submittedAt,
      values['문의 유형'] || '',
      values['이름'] || '',
      values['연락처'] || '',
      values.email || '',
      values['문의 내용'] || '',
      values['접수 경로'] || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, intakeId }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
