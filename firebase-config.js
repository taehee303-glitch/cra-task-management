/**
 * Firebase 설정
 *
 * 1. https://console.firebase.google.com/ → 프로젝트 생성
 * 2. Authentication → Sign-in method → Google 사용 설정
 * 3. Firestore Database → 데이터베이스 만들기 (테스트/프로덕션 모드)
 * 4. 프로젝트 설정 → 일반 → 웹 앱 추가 → firebaseConfig 복사
 * 5. Authentication → Settings → Authorized domains 에 추가:
 *    - localhost
 *    - taehee303-glitch.github.io
 * 6. Firestore → Rules 에 firestore.rules 내용 배포
 * 7. Authentication → Sign-in method → Google → Web SDK configuration → Web client ID
 *    → 아래 googleWebClientId 에 입력 (모바일 로그인 필수)
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCIW2Ux_g3WMoG0oA2iW7zf2jzXPbZDFwA",
  authDomain: "cra-task-management.firebaseapp.com",
  projectId: "cra-task-management",
  storageBucket: "cra-task-management.firebasestorage.app",
  messagingSenderId: "1022286935221",
  appId: "1:1022286935221:web:28083c98ac7f0075e87afc",
  googleWebClientId: "1022286935221-u2jvohi82bb26rctv0hgi4o19hg7cnbi.apps.googleusercontent.com",
  /** true: 앱 시작 시 로그인 필수, Firestore가 SSOT */
  requireCloudAuth: true,
};
