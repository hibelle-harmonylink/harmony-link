# 회원가입 명단 자동 기록 연결

1. 새 Google 스프레드시트를 만들고 파일 이름을 `회원가입 명단`으로 지정합니다.
2. 별도의 Apps Script 프로젝트를 만들고 `member-signup.gs` 전체 코드를 붙여넣습니다.
3. 프로젝트 설정의 스크립트 속성에 `MEMBER_SPREADSHEET_ID`를 추가하고 새 스프레드시트 ID를 값으로 입력합니다.
4. 웹 앱으로 새 배포한 뒤 생성된 `/exec` URL을 복사합니다.
5. `auth.js`의 `signupAutomationUrl` 빈 문자열에 해당 URL을 입력합니다.

## 등급 변경 안내메일 업데이트

1. 기존 회원가입 명단 Apps Script 프로젝트에서 `member-signup.gs` 전체를 최신 코드로 교체합니다.
2. 프로젝트 설정의 **스크립트 속성**에 `ROLE_EMAIL_WEBHOOK_SECRET`을 추가하고 임의의 긴 비밀값을 저장합니다.
3. **배포 → 배포 관리 → 수정**을 누릅니다.
4. 버전을 **새 버전**으로 선택하고 배포합니다. 기존 `/exec` 주소는 그대로 유지합니다.
5. Supabase Edge Function `notify-role-change`를 배포합니다.
6. Supabase Secrets에 `ROLE_EMAIL_WEBHOOK_URL`(기존 `/exec` 주소)과 `ROLE_EMAIL_WEBHOOK_SECRET`(2번과 동일한 값)을 저장합니다.
7. 홈페이지 회원관리에서 등급을 변경하면 서버가 관리자 권한을 다시 확인한 뒤 해당 회원에게 등급·혜택·다시 로그인하는 방법을 자동메일로 보냅니다.

이 설정은 기존 봉사·도움 접수 Apps Script와 웹 앱 URL을 사용하거나 변경하지 않습니다.
