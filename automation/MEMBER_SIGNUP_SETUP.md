# 회원가입 명단 자동 기록 연결

1. 새 Google 스프레드시트를 만들고 파일 이름을 `회원가입 명단`으로 지정합니다.
2. 별도의 Apps Script 프로젝트를 만들고 `member-signup.gs` 전체 코드를 붙여넣습니다.
3. 프로젝트 설정의 스크립트 속성에 `MEMBER_SPREADSHEET_ID`를 추가하고 새 스프레드시트 ID를 값으로 입력합니다.
4. 웹 앱으로 새 배포한 뒤 생성된 `/exec` URL을 복사합니다.
5. `auth.js`의 `signupAutomationUrl` 빈 문자열에 해당 URL을 입력합니다.

이 설정은 기존 봉사·도움 접수 Apps Script와 웹 앱 URL을 사용하거나 변경하지 않습니다.
