# CRA Workflow OS — CHANGELOG

버전별 변경 이력입니다. 형식은 [Keep a Changelog](https://keepachangelog.com/)를 참고합니다.

**Versioning**

- `APP_VERSION` — 제품 메이저 버전 (현재 `1.0.0`)
- `APP_BUILD` / `CACHE_VERSION` — 배포 빌드 및 PWA 캐시 버전

---

## [Unreleased]

_(none — MVP v1 complete)_

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
