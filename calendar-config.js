/**
 * Google Calendar OAuth2 설정
 *
 * 1. Google Cloud Console에서 프로젝트 생성
 * 2. Google Calendar API 활성화
 * 3. OAuth 2.0 클라이언트 ID (웹 애플리케이션) 생성
 * 4. 승인된 JavaScript 원본에 아래 URL 모두 추가:
 *    - 로컬: http://localhost:5500 , http://127.0.0.1:5500
 *    - 배포: https://<GitHub아이디>.github.io (또는 실제 배포 URL)
 * 5. clientId에 발급받은 Client ID 입력
 */
window.CALENDAR_CONFIG = {
  defaultProvider: "google",
  google: {
    clientId: "168635744370-3nkoq2eos8aq8lkvq7nfkrlbgja1b0k4.apps.googleusercontent.com",
    scope: "https://www.googleapis.com/auth/calendar.events",
    apiBase: "https://www.googleapis.com/calendar/v3",
    defaultCalendarId: "primary",
  },
  // 향후 Outlook Calendar 연동용 (Microsoft Graph API)
  outlook: {
    clientId: "",
    scope: "Calendars.ReadWrite offline_access",
    authority: "https://login.microsoftonline.com/common",
  },
};
