# CRA Workflow OS — CHANGELOG

버전별 변경 이력입니다. 형식은 [Keep a Changelog](https://keepachangelog.com/)를 참고합니다.

**Versioning**

- `APP_VERSION` — 제품 메이저 버전 (현재 `1.1.0`)
- `APP_BUILD` / `CACHE_VERSION` — 배포 빌드 및 PWA 캐시 버전

**Post v1.1 RC:** 버그는 Bug Fix로, 기능 개선은 [BACKLOG.md](./BACKLOG.md)에 기록.

---

## [Unreleased]

_(none)_

---

## [1.1.0] — build 53 — 2026-07-13 — Dashboard compact row + inline expand

### Changed

- **Dashboard 카드** — Task · Study/Site · Due · Status · 완료를 **가로 한 줄**로 표시 (행 높이 축소)
- **더 보기** — My Tasks 이동 대신 Dashboard 섹션 내에서 접힌 Task **바로 펼치기/접기**

---

## [1.1.0] — build 52 — 2026-07-13 — Dashboard Execute on cards only

### Changed

- **Dashboard 카드** — Status 변경 · 완료 버튼 복원 (카드 오른쪽에서 업무 실행)
- **Workflow Detail** — Workflow 확인 전용 (진행률 · 현재 위치 · 이전/다음 · Timeline), Status UI 제거
- 역할 분리: Dashboard = Execute · Workflow Detail = 확인 · My Tasks = Manage

---

## [1.1.0] — build 51 — 2026-07-13 — Dashboard Execute + Workflow Master

### Added

- **Master Data → Workflow** — Global Templates · Workspace · Study Workflows 통합 관리
- **GlobalWorkflowStore** — Global Template 생성·수정·삭제 (Study Library와 동일 Editor)
- **Dashboard Workflow Detail Execute** — Status 변경 · 완료 처리 (Due/Priority 등은 My Tasks 전용)

### Changed

- **Study Workflow Library** — 적용·Study 복사만 (편집/삭제는 Workflow Master로 이동)
- **Workflow Step 자동 정렬** — Due Offset 기준 (pre: 큰 offset 먼저 → root → post: 작은 offset 순)
- 저장·Timeline·Library·Dashboard·Task Detail 전 화면 동일 순서 적용
- Dashboard Workflow Detail — Workflow 확인 + Status/Complete 실행, "My Tasks에서 수정" 유지

---

## [1.1.0] — build 49 — 2026-07-13 — Dashboard Read / My Tasks Manage

### Added

- **Dashboard Workflow Detail (읽기 전용)** — Task 클릭 시 Edit 대신 Workflow Context 패널
  - 현재 Task 정보 · Workflow Timeline · 진행률 · 다음 업무 · **My Tasks에서 수정** 버튼
- Timeline pending Step에 due offset 표시 (예: `○ Expense Claim (+2일)`)

### Changed

- **Dashboard = Read** — Status/완료 버튼 제거, 카드 클릭 → Workflow Detail
- **My Tasks = Manage** — 모든 수정 기능 유지 (Status, Due, Priority, Study, 삭제)
- Timeline Step 클릭: Dashboard에서는 동일 패널 내 Step 전환, My Tasks에서는 Edit 이동

---

## [1.1.0] — build 48 — 2026-07-13 — Workflow Timeline UX Sprint

### Added

- **Task Detail Workflow Timeline** — WorkflowRecord 기반 ✓ / ● / ○ 진행 표시, Task 클릭으로 Detail 이동
- **Workflow Library 통합 Editor** — 전체 Flow 순서 변경, 중간 삽입, 삭제, 이름·offset 편집

### Changed

- Dashboard Workflow Chip — Task chain 전체에서 `workflowId` 해석, Library와 동일 WorkflowRecord 이름 표시
- Dashboard Compact UI — Status Chip 축소, 완료 버튼 아이콘화, 카드 높이 추가 감소
- Dashboard 모든 섹션 — 최대 3건 미리보기 (오늘 마감 포함)
- Learning Modal vs Library — 빠른 등록 / 정식 편집 역할 구분 명확화

---

## [1.1.0] — build 47 — 2026-07-13 — Dashboard WorkflowRecord sync

### Fixed

- Dashboard Task Card Workflow 표시가 Legacy `Workflow 2/2`로 남던 문제 — `workflowId` 기반 **WorkflowRecord** 조회로 통일 (Workflow Library와 동일 소스)
- Root Task까지 parent chain을 따라 `workflowId` 해석
- Workflow 이름 수정 시 Dashboard에 즉시 반영 (`renderAll` after save)

### Changed

- Workflow Chip 형식: `🟣 CTMS Update Follow-up (2/2)` — `workflowName` + `currentStep/totalSteps`
- Workflow 적용 시 기존 follow-up Task에도 `workflowId` backfill

---

## [1.1.0] — build 46 — 2026-07-13 — Dashboard Control Center UX

### Changed

- **Dashboard 요약화** — 섹션 내부 스크롤(Double Scroll) 제거
- **이번 주 준비 · 다음 주 · 최근 완료 · 지연** — 최대 3건 미리보기 + `+ N개 더 보기` → My Tasks 해당 필터
- **오늘 마감** — 최대 5건 미리보기 + 더 보기 (실행 구역)
- **Compact Task Card** — 패딩·액션 축소로 한 화면 정보 밀도 개선
- **Workflow 표시** — `Workflow 1/6` 대신 WorkflowRecord 이름 + `(현재/전체)` (예: `🟣 CTMS Update Follow-up (2/2)`)

---

## [1.1.0] — build 45 — 2026-07-13 — Time-based Dashboard

### Added

- **다음 주 예정** 섹션 — Visit · Training · IRB · Query 등 다음 주 Due Task + Workflow Context Chip
- KPI Quick Filter **다음 주** (D-1 필터 대체)

### Changed

- **Time-based Dashboard** 순서: Progress → 오늘 → 이번 주 준비 → 다음 주 → 최근 완료 → 지연
- D-1 별도 섹션 제거 → **이번 주 준비**에 통합 (내일~주말)
- **색상 계층**: 오늘(보라 강조) · 이번 주(주황) · 다음 주(파랑) · 완료(초록) · 지연(빨강)
- Section 리스트 max-height 축소로 한 화면 가시성 개선

---

## [1.1.0] — build 44 — 2026-07-13 — Dashboard readability pass

### Changed

- **Task 카드 스캔 패턴** — Task 이름 우선(좌) · Due 칩(우) · Study/Site 보조 정보 분리
- Priority는 Critical만 표시해 시각적 노이즈 감소
- Section별 헤더 색상 악센트(이번 주/오늘/D-1/지연)로 구역 구분 강화
- Status·Context Chip·KPI 숫자 가독성 개선 (font-weight, contrast, tabular nums)

---

## [1.1.0] — build 43 — 2026-07-13 — Dashboard density polish

### Changed

- **Section 부가 설명 제거** — 각 카드 하단 subtitle(「오늘·D-1 제외」 등) 삭제
- **Today's Progress 컴팩트화** — 패딩·폰트 축소, 메타 한 줄(4/5 완료 · 남은 1건), CTA 제거
- Dashboard 헤더 tagline 제거, 카드 헤더·빈 상태·통계 영역 여백 추가 축소

---

## [1.1.0] — build 42 — 2026-07-13 — Dashboard Daily Control Center UX

### Changed

- **Dashboard 철학** — Workflow/Routine 별도 Section 없음, Task 하단 Context Chip(🟣 Workflow 2/4 · 🔁 Routine)만 표시
- **카드 순서** — Today's Progress → 이번 주 마감 → 오늘 마감 → D-1 → 최근 완료 → 지연 → 통계
- **KPI Quick Filter** — 전체 → 이번 주 → 오늘 → D-1 → 지연 → 완료 (6개)
- **Compact Empty Card** — 업무 없을 때 한 줄 높이로 축소, 카드 간 여백 축소
- **지연 업무** — 빈 상태·하단 배치로 React보다 Prevent(예방) 우선 UX
- Dashboard tagline: CRA Daily Control Center

---

## [1.1.0] — build 41 — 2026-07-13 — Follow-up Add Task modal fix

### Fixed

- **Follow-up → Add Task Modal** — `els.task` / `els.dueDate` 참조 누락으로 `openAddTaskModal`이 예외 발생하며 Modal이 열리지 않던 문제 수정
- Add Task form 필드 접근에 null-safe 처리 추가

---

## [1.1.0] — build 40 — 2026-07-13 — Workflow Library editor + follow-up fix

### Added

- **Workflow Detail 편집** — Study/Workspace Workflow Library에서 「편집」으로 기준 Task 중심 **이전·이후 단계** 추가/삭제
- Workflow 데이터 모델에 `preSteps`, `rootTaskName` 필드 추가 (Library 수동 편집용)

### Fixed

- **Follow-up → Add Task** — 「예」 클릭 시 후속 Task Modal이 즉시 열리도록 타이밍·z-index·Status Portal 간섭 보완
- Follow-up Modal 내부 클릭이 overlay로 전파되어 닫히는 문제 방지

### Changed

- Workflow Learning(업무 중)은 **Post-task만** 유지 — Library에서만 Pre-task 편집
- Workflow Flow 미리보기에 이전 단계(preSteps) 표시

---

## [1.1.0] — build 39 — 2026-07-13 — Dashboard QA fixes

### Fixed

- **Dashboard Status Dropdown** — Portal(fixed) 방식으로 변경, 스크롤 영역에 잘리지 않음
- **Follow-up → Add Task → Learning** — 「예」 클릭 시 새 업무 Modal 즉시 오픈, parentTaskId·workflowId 연결
- Follow-up Task 저장 후 Workflow Learning Modal 정상 연결

### Changed

- Follow-up Prompt 문구: 「이 업무 이후 이어지는 다음 업무가 있나요?」
- 후속 Task 추가 Modal에 Workflow 이름·Step 정보 표시

---

## [1.1.0] — build 38 — 2026-07-13 — Dashboard execution UI polish

### Changed

- **Dashboard 레이아웃** — Today's Progress → 오늘 마감(실행 존) → 이번 주 → D-1 → 지연 → 최근 완료
- **Task 카드 디자인** — Due 칩 · Priority · › 상세 affordance · 녹색 완료 버튼
- **오늘 마감 섹션** — 실행 가이드 헤더, 더 넓은 목록 영역
- **Today's Progress Hero** — 진행 상태별 색상(진행 중/완료/없음), CTA 추가
- Mobile — Status·완료 버튼 가로 배치, 터치 영역 확대

---

## [1.1.0] — build 37 — 2026-07-13 — Dashboard task execution

### Changed

- **Dashboard Task 카드** — 클릭 시 Task Detail 패널 오픈 (PC: split / Mobile: fullscreen)
- Dashboard 카드에서 Status 드롭다운·완료(✓) 버튼으로 즉시 상태 변경
- Completed 변경 시 Follow-up Prompt → Learning Modal 흐름 유지
- 저장·상태 변경 후 Dashboard(Today's Progress 포함) 즉시 갱신

---

## [1.1.0] — build 36 — 2026-07-13 — Prevention-first Dashboard & Today's Progress

### Changed

- **Today's Progress Hero** — Dashboard 최상단, 오늘 Due Task 기준 완료율
  - `완료 / 오늘 예정`, 남은 업무 건수, 진행 바
  - 클릭 시 Today 필터가 적용된 Task 목록으로 이동
- **Dashboard 카드 우선순위** — 업무 누락 방지 중심
  1. Today's Progress
  2. 이번 주 마감
  3. 오늘 마감 · D-1
  4. 지연 업무 (하단)
  5. 최근 완료
- **전체 완료율** — Dashboard 하단 통계 영역으로 이동
- 이번 주 마감: 오늘·D-1 제외, 2일 이후~주말까지 미리 준비할 업무

---

## [1.1.0] — build 35 — 2026-07-13 — Task-centric Dashboard & My Tasks

### Changed

- **Dashboard / My Tasks / Mobile Home:** Workflow·Routine을 별도 섹션이 아닌 Task 속성(보조 Context)으로 표시
  - Workflow: `🟣 {이름} (현재/전체)` — 단일 단계는 진행률 생략
  - Routine: `🔁 {Routine 이름}` badge
- Dashboard Active Workflow hero, Routine preview, My Tasks Workflow strip 제거
- Mobile Home의 진행 중 Workflow / 예정 Routine 섹션 제거
- Dashboard tagline: 오늘 해야 할 Task 중심

---

## [1.1.0] — build 34 — 2026-07-13 — Task-first UX

### Changed

- **기본 Landing:** Dashboard (PC·Mobile Home)
- **FAB:** 클릭 시 바로 새 업무 생성 (MV/SIV/COV 메뉴 제거)
- **Task 완료 후:** 「추가로 진행할 업무가 있나요?」→ 후속 Task → Learning Modal
- Suggestion Modal: 「Workflow 적용」/「이번만 Task」
- Learning Modal: 「이 Workflow를 저장하거나 업데이트하시겠습니까?」
- Mobile bottom nav: Home(Dashboard) · Tasks · Inbox · Calendar · Reference
- Sidebar: Dashboard 최상단

---

## [1.1.0] — MVP v1.1 Release Candidate — build 33 — 2026-07-13

Sprint 3 UX Polish + Dashboard Active Workflow hero 첫 화면 배치. **새 DB/Workflow 구조 변경 없음.**

### Sprint 3 UX Polish (build 32 → 33)

- **Dashboard Active Workflow hero** — header 바로 아래, 스크롤 없이 첫 화면 노출
- Dashboard — 이번 주 마감 / 최근 완료 / Routine preview
- My Tasks Workflow strip, Mobile Workflow/Routine 섹션
- Task context chips, Task Detail preview/Steps, Library/Routine 이동
- Task 생성 Modal Workflow live hint
- Branding: Workflow OS tagline, FAB Workflow 라벨
- Workflow Library usage/lastUsed 정렬

### Release

- `APP_VERSION` → **1.1.0**
- `APP_BUILD` / `CACHE_VERSION` → **33**
- QA: [MVP_V1_1_RC_QA.md](./MVP_V1_1_RC_QA.md)

---

## [1.0.0] — build 32 — 2026-07-13 — Sprint 3 (pre-RC, internal)

### Added

- **Dashboard Workflow 섹션** — 진행 중 Workflow, 이번 주 마감, 최근 완료, Routine preview
- **My Tasks Workflow strip** — PC 홈에서 진행 중 Workflow 요약
- **Mobile Today** — 진행 중 Workflow / 예정 Routine 섹션
- **Task context chips** — Workflow · Routine · step progress · Follow-up (카드/리스트/Dashboard)
- **Task Detail** — Workflow Flow preview, Workflow Steps 목록, Library/Routine 이동 버튼
- **Task 생성 Modal** — Workflow 매칭 live hint

### Changed

- Sidebar tagline **Workflow OS**, Dashboard tagline **Track tasks. Build workflows.**
- FAB MV/SIV/COV → **MV/SIV/COV Workflow** 라벨
- Workflow Library 카드 정렬 — 적용 횟수 · 최근 사용일 우선
- Study 목록 WF/RT 카운트 강조
- `APP_BUILD` / `CACHE_VERSION` → **32**

### Notes

- DB 스키마 및 WorkflowRecord 구조 변경 없음 (UI/UX only)

---

## [1.0.0] — MVP v1 — build 31 — 2026-07-13 — Sprint 2

### Added

- **Workflow Learning Modal** — 완료 후 후속 Task → Workflow 저장 제안
- **Workflow Scope UX** — Study / Workspace 저장 (`saveWorkflowWithScope`)
- **Routine CRUD** — Study → Routine 탭, modal, Training/Query/TMF 프리셋
- `RoutineRecord` + `study.routines[]` embedded storage
- `runRoutineScheduler()` — 부팅 시 Routine Task materialize
- Task Detail **연결** 섹션 — Workflow / Routine 읽기 전용 표시
- [MVP_V1_TEST_CHECKLIST.md](./MVP_V1_TEST_CHECKLIST.md)

### Changed

- Task `routineId` optional field
- Study list meta: WF / RT counts

---

## [1.0.0] — build 30 — 2026-07-13 — Sprint 1

### Added

- `WorkflowRecord` 데이터 모델 및 확장 필드 (`category`, `tags`, `trigger`, `stepCount`)
- Study `workflows[]` embedded storage + Workspace sync (`workspaceWorkflows`)
- `renderWorkflowFlowPreview()` / `renderWorkflowMetaRow()` — Flow Preview + 메타 UI
- Study Master → **Workflow Library** 탭 (섹션: Study / Legacy / Workspace / Global)
- **Workflow Suggestion Modal** — Task 생성 시 Preview·메타 확인 후 적용 / 이번만 생성
- Legacy `study.taskRules` → Library adapter
- Global preset (MV/SIV/COV) Library 노출 및 Study 복사

### Changed

- Task 생성: 매칭 Workflow 있으면 Suggestion Modal (선택 적용)
- Study list meta: Workflow 수 표시

### Not in Sprint 1 (deferred)

- Workflow Learning Modal → Sprint 2

---

## [1.0.0] — build 29 — 2026-07-13 (superseded)

### Added (partial, pre–Sprint 1 scope trim)

- Workflow Learning Modal prototype (build 29, **removed in build 30**)

---

## [1.0.0] — build 28 — 2026-06

### Fixed

- GitHub Pages 배포 복구, legacy FitSpace service worker 캐시 정리 (build 28)

---

## [1.0.0] — build 27 — 2026-06

### Changed

- Reference 화면 중복 Google Calendar 버튼 제거 (Settings에서만 관리)

---

## [1.0.0] — build 26 — 2026-06

### Fixed

- 앱 bootstrap 하ardening (Calendar/Reminder init try/catch, stale cache 안내)

---

## [1.0.0] — build 25 — 2026-06

### Fixed

- Task detail PC grid split layout
- Task detail 모바일 true fullscreen

---

## [1.0.0] — build 24 — 2026-06

### Added

- Task detail split panel (PC) / fullscreen (mobile)
- Task fields: `memo`, `checklist`, `history`
- `#taskDetailPanel` (center modal 제거)

### Removed

- `#editModal` center dialog

---

## [1.0.0] — build 23 — 2026-06

### Changed

- Settings: iOS/Todoist-style menu → detail screens
- Settings: fullscreen (mobile) / centered modal (desktop)
- Settings screens: Calendar, Notification, Appearance, Data, About

---

## [1.0.0] — pre-build 23 — 2026-06

### Added

- Mobile Daily Workspace UX (Today, filter chips, feed)
- PC Management workspace / Mobile Daily mode split
- Task quick filters, card/list toggle
- Reference view (mobile): Study/Site/System hub
- Firebase Auth + Firestore sync (tasks, studies, sites, systems)
- Google Calendar OAuth sync (Settings)
- Desktop reminder notifications
- Study Task Rules (MV/SIV/COV per-study override)
- PWA manifest + service worker offline shell

### Infrastructure

- GitHub Pages auto-deploy (`.github/workflows/deploy-pages.yml`)
- Flat vanilla JS SPA: `index.html`, `app.js`, `styles.css`

---

## Document History

| Date | Change |
|------|--------|
| 2026-07-13 | Initial docs: PRD, ROADMAP, BACKLOG, CHANGELOG |

---

## Related Documents

- [PRD.md](./PRD.md)
- [ROADMAP.md](./ROADMAP.md)
- [BACKLOG.md](./BACKLOG.md)
