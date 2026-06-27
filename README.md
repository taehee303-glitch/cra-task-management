# CRA 업무 관리 웹앱

Clinical Research Associate(CRA)를 위한 업무 관리 도구입니다.  
브라우저 LocalStorage에 데이터가 저장되며, **Firebase 로그인 시 PC·휴대폰 간 클라우드 동기화**를 지원합니다. **PWA(홈 화면 추가)** 를 지원합니다.

## 기능

- 업무 등록 / 대시보드 / Study·Site·System Master
- Study별 Task Rule, MV/SIV/COV 자동 업무 생성
- **Google 로그인 + Firebase Firestore 클라우드 동기화** (선택)
- Google Calendar 연동 (선택)
- 모바일 반응형 + PWA
---

## 로컬 실행 (개발)

```powershell
cd C:\Users\taehe\cra-task-manager
.\start-server.ps1
```

PC 브라우저: `http://127.0.0.1:5500/`  
로컬 LAN 테스트(개발용): `http://127.0.0.1:5500/?devMobile=1` → 휴대폰 접속 링크 표시

---

## 웹 배포 (GitHub Pages) — 어디서든 접속

배포하면 `https://<GitHub아이디>.github.io/<저장소이름>/` 주소로 **Wi-Fi 없이** PC·휴대폰에서 접속할 수 있습니다.

### 1. GitHub 저장소 만들기

1. [GitHub](https://github.com/new)에서 새 저장소 생성 (예: `cra-task-manager`)
2. PC에서 프로젝트 폴더를 GitHub에 업로드:

```powershell
cd C:\Users\taehe\cra-task-manager
git init
git add .
git commit -m "Initial commit: CRA task manager"
git branch -M main
git remote add origin https://github.com/<GitHub아이디>/cra-task-manager.git
git push -u origin main
```

### 2. GitHub Pages 켜기

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. `main` 브랜치에 push하면 `.github/workflows/deploy-pages.yml` 이 자동 배포
4. **Actions** 탭에서 워크플로가 완료되면 URL 확인  
   예: `https://taehe.github.io/cra-task-manager/`

### 3. Google Calendar (배포 후 사용 시)

[Google Cloud Console](https://console.cloud.google.com/) → OAuth 클라이언트 → **승인된 JavaScript 원본**에 배포 URL 추가:

```
https://<GitHub아이디>.github.io
```

(저장소 이름이 URL 경로에 포함되면 해당 전체 URL도 추가)

---

## Firebase 클라우드 동기화 (PC ↔ 휴대폰)

Google 로그인 후 Firestore에 데이터를 저장해 **PC와 휴대폰에서 같은 업무 데이터**를 사용할 수 있습니다.

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/) → **프로젝트 추가**
2. **Authentication** → Sign-in method → **Google** 사용 설정
3. **Firestore Database** → 데이터베이스 만들기
4. **프로젝트 설정** → 일반 → **웹 앱 추가** → `firebaseConfig` 값 복사
5. `firebase-config.js`에 붙여넣기
6. **Authentication** → Settings → **Authorized domains** 에 `localhost`, GitHub Pages 도메인 추가

### 2. Firestore 보안 규칙

Firebase Console → Firestore → **Rules** 탭에 `firestore.rules` 파일 내용을 붙여넣고 게시합니다.

### 3. 사용 방법

1. 배포 URL 또는 localhost에서 앱 열기
2. 헤더 **Google 로그인** 클릭
3. 최초 로그인 시 로컬 데이터 업로드 여부 선택
4. 다른 기기에서 **같은 Google 계정**으로 로그인 → 데이터 자동 동기화

### 4. 이후 업데이트

코드 수정 후:

```powershell
git add .
git commit -m "Update"
git push
```

push하면 자동으로 웹에 반영됩니다. (PWA는 Network First라 최신 버전을 받습니다.)

---

## 데이터 안내

- **로그인 전**: 데이터는 브라우저 **LocalStorage**에만 저장됩니다.
- **로그인 후**: 업무·Master·설정이 **Firebase Firestore**에 저장되며 PC·휴대폰 간 실시간 동기화됩니다.
- `localhost`와 `github.io`는 로그인 전에는 서로 다른 LocalStorage입니다.
- Google Calendar 토큰은 기기별 LocalStorage에 남을 수 있습니다. (캘린더 연동은 기기마다 다시 연결 필요)
- 배포 URL을 휴대폰 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.

---

## 파일 구조

| 파일 | 설명 |
|------|------|
| `index.html` | 메인 UI |
| `app.js` | 앱 로직 |
| `styles.css` | 스타일 |
| `manifest.webmanifest` | PWA 매니페스트 |
| `service-worker.js` | 오프라인/PWA 캐시 |
| `firebase-config.js` | Firebase 프로젝트 설정 |
| `firebase-sync.js` | Firebase Auth + Firestore 동기화 |
| `firestore.rules` | Firestore 보안 규칙 (Console에 배포) |
| `calendar-config.js` | Google Calendar OAuth 설정 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 자동 배포 |
