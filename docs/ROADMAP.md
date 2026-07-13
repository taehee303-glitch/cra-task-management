# CRA Workflow OS — ROADMAP

**Last updated:** 2026-07-13  
**Current build:** v1.0.0 (build 31) — **MVP v1**

이 문서는 구현 일정이 아닌 **제품 개발 방향**을 Sprint / Phase 단위로 정리한 로드맵입니다.

---

## Overview

```
CRA Task Manager MVP  →  CRA Workflow OS MVP  →  Workflow OS v1.x
     (완료)                  (진행 중)              (계획)
```

**핵심 전략:** 전면 재작성 없이, 기존 SPA(localStorage + Firestore) 위에 Workflow/Routine 레이어를 점진 추가.

---

## Completed (Pre–Workflow OS)

| Milestone | Summary |
|-----------|---------|
| PC / Mobile dual mode | Management workspace + Daily PWA |
| Firebase Auth + Firestore sync | tasks, studies, sites, systems |
| Study / Site / System Master | CRUD + 연결 |
| MV/SIV/COV auto-generation | `study.taskRules` + `WORKFLOW_VISIT_RULES` |
| Settings iOS-style | Menu → detail screens |
| Task Detail refactor | PC split panel, mobile fullscreen |
| Google Calendar sync | Settings에서만 관리 |
| Reference view | Study/Site/System hub (mobile) |

---

## Sprint 1 — Workflow Foundation & UX ✅ Complete (build 30)

**Goal:** Workflow를 "선택적 Task 보조 레이어"로 도입. UX 우선, Engine 분리 없음.

| # | Item | Status |
|---|------|--------|
| 1.1 | `WorkflowRecord` 데이터 모델 + 확장 필드 (`category`, `tags`, `trigger`, `stepCount`) | ✅ Done |
| 1.2 | `renderWorkflowFlowPreview()` 공통 컴포넌트 | ✅ Done |
| 1.3 | Study → **Workflow Library** 탭 (카드 + Preview + 메타) | ✅ Done |
| 1.4 | **Workflow Suggestion Modal** (Task 생성 시) | ✅ Done |
| 1.5 | Legacy `taskRules` → Library adapter 표시 | ✅ Done |
| 1.6 | Workspace Workflow sync (`workspaceWorkflows`) — Library 표시용 | ✅ Done |
| 1.7 | Sprint 1 QA + 배포 (build 30) | 🔲 Pending deploy |

**Sprint 1 범위에서 제외 (→ Sprint 2)**

- Workflow Learning Modal (완료 후 후속 Task 저장 + Scope UX)

**Sprint 1 완료 기준**

- [x] Task를 Workflow 없이 생성·완료 가능
- [x] Suggestion Modal에서 Flow Preview + 메타 확인 후 적용/건너뛰기
- [x] Library에서 Task 수 · 적용 횟수 · 최근 사용일 + Flow Preview 확인
- [ ] Learning Modal (Sprint 2)

---

## Sprint 2 — MVP v1 Complete ✅ (build 31)

**Goal:** Workflow Learning + Scope, Routine CRUD, Task Detail 연결 표시.

| # | Item | Status |
|---|------|--------|
| 2.0 | Workflow Learning Modal | ✅ Done |
| 2.1 | Workflow Scope 저장 (Study / Workspace) | ✅ Done |
| 2.2 | `RoutineRecord` + Study Routine 탭 CRUD | ✅ Done |
| 2.3 | Routine scheduler (부팅 시 materialize) | ✅ Done |
| 2.4 | Task Detail Workflow/Routine 연결 표시 | ✅ Done |
| 2.5 | MVP v1 테스트 체크리스트 | ✅ Done |

**Sprint 2에서 제외 (Backlog)**

- Dashboard Due This Week / Recently Completed / Routine preview
- Workflow category/tags 필터 UI
- Version History, Analytics, AI, Calendar 확장

---

## Sprint 3+ — Post MVP v1

_상세 항목은 [BACKLOG.md](./BACKLOG.md) 참고._

## Phase 4 — Dependency (Post-MVP)

| # | Item |
|---|------|
| 4.1 | `dependsOn[]` Task 필드 |
| 4.2 | 선행 Task 미완료 시 Complete 차단 |
| 4.3 | Task Detail: 선행/후속 Task 섹션 |
| 4.4 | Dependency 학습 UX (Learning Modal 확장) |

---

## Phase 5 — Code Structure (Post-MVP, 안정화 후)

Engine 분리는 **기능 안정화 이후** 진행.

| Module | Responsibility |
|--------|----------------|
| `workflow-engine.js` | 규칙 해석, 자동 Task 생성 |
| `routine-engine.js` | 반복 스케줄 계산 |
| `dashboard-service.js` | Dashboard 집계 |
| `dependency-service.js` | 선행 관계 검증 |

---

## Phase 6 — Future (PRD §14)

- Workflow Version History UI
- Global Template 공유 (서버)
- AI Workflow Suggestion
- Team Sharing
- Analytics Dashboard
- Outlook Calendar Sync

---

## Release Cadence (권장)

| Type | Trigger |
|------|---------|
| **Build bump** | 기능 배포 시 `APP_BUILD` + `CACHE_VERSION` 증가 |
| **Sprint release** | Sprint 완료 + QA 후 GitHub Pages deploy |
| **Doc update** | Sprint 시작/종료 시 PRD·ROADMAP·BACKLOG·CHANGELOG 갱신 |

---

## Related Documents

- [PRD.md](./PRD.md)
- [BACKLOG.md](./BACKLOG.md)
- [CHANGELOG.md](./CHANGELOG.md)
