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
 */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
