# CRA Workflow OS — BACKLOG

**Last updated:** 2026-07-13

**v1.1 RC 이후:** Bug Fix만 즉시 처리. 기능 개선·신규 Sprint는 Backlog.

우선순위별 기능 후보 목록입니다. **구현 대상이 아닌 제품 관리 문서**이며, Sprint 계획 시 참고합니다.

상태 표기: `💡 idea` · `📋 planned` · `🚧 in progress` · `✅ done` · `❌ dropped`

---

## Next Sprint

> **Sprint 4+** — BACKLOG 우선순위 협의 후 착수.

| ID | Item | Notes |
|----|------|-------|
| NS-01 | ~~Dashboard: Due This Week 리스트~~ | ✅ Sprint 3 |
| NS-02 | ~~Dashboard: Recently Completed~~ | ✅ Sprint 3 |
| NS-03 | ~~Dashboard: Routine preview 섹션~~ | ✅ Sprint 3 |
| NS-04 | Workflow Library category/tags 필터 | High Priority |
| NS-05 | Study 완료 → Template 저장 제안 | High Priority |
| NS-06 | Quick Add Workflow hint / full modal 연동 | Medium |

---

## Sprint 3 Complete (reference)

| ID | Item | Status |
|----|------|--------|
| S3-01 | Dashboard Workflow/Routine sections | ✅ build 32 |
| S3-02 | Task context chips + strip | ✅ |
| S3-03 | Task Detail preview + navigation | ✅ |
| S3-04 | Add Task live Workflow hint | ✅ |
| S3-05 | Branding + Library sort | ✅ |

---

## Sprint 2 Complete (reference)

| ID | Item | Status |
|----|------|--------|
| S2-01 | Workflow Learning Modal | ✅ build 31 |
| S2-02 | Workflow Scope (Study/Workspace) | ✅ |
| S2-03 | Routine CRUD | ✅ |
| S2-04 | Task Detail Workflow/Routine link | ✅ |
| S2-05 | MVP v1 test checklist | ✅ |

---

## High Priority

| ID | Item | Notes |
|----|------|-------|
| HP-01 | Workflow Library `category` / `tags` 필터 UI | DB 필드 이미 존재, UI만 추가 |
| HP-02 | Workflow `trigger` 필드 UI 노출 (생성/편집) | TASK_CREATED vs TASK_COMPLETED 구분 |
| HP-03 | Study 완료 → Template 저장 제안 | PRD §13 |
| HP-04 | Global preset → Study 일괄 복사 | Library "Study에 복사" UX 개선 |
| HP-05 | Workflow 적용 시 Inbox Task 처리 규칙 | Study 미지정 Task edge case |
| HP-06 | Firestore rules: `workspaceWorkflows` | 보안 규칙 명시 |
| HP-07 | ~~Learning Modal~~ | ✅ Sprint 2 완료 |
| HP-08 | Workflow step checklist preset | Checklist 템플릿 연동 |
| HP-09 | 모바일 Workflow Library 카드 UX polish | compact preview, 터치 영역 |
| HP-10 | `study.taskRules` → `workflows[]` 점진 마이그레이션 | dual-write 후 single-write |

---

## Medium Priority

| ID | Item | Notes |
|----|------|-------|
| MP-01 | Explicit Dependency (`dependsOn[]`) | Workflow steps와 분리 |
| MP-02 | Dependency: Complete 차단 + tooltip | 선행 Task 미완료 시 |
| MP-03 | Dependency 학습 UX | Learning Modal 확장 |
| MP-04 | Workflow 이름 유사도 매칭 개선 | fuzzy match, Study 우선 |
| MP-05 | Task Detail 섹션 PRD 순서 정렬 | Workflow → Checklist → Dependency → Routine |
| MP-06 | CSV export: `workflowId`, `routineId` | optional 컬럼 |
| MP-07 | Dashboard: blocked Task 표시 | Dependency 도입 후 |
| MP-08 | Workflow Library 정렬 (최근 사용, 적용 횟수) | 메타 기반 sort |
| MP-09 | Workspace Workflow 관리 전용 화면 | Settings 또는 별도 view |
| MP-10 | Study list meta: Workflow/Routine 수 | 현재 WF 수 표시됨, Routine 추가 |
| MP-11 | Notification: Routine due reminder | Desktop reminder 확장 |
| MP-12 | Quick Add에서 Workflow skip 기억 | "이 Task는 다시 묻지 않기" (local) |

---

## Future

> PRD §14 — MVP 이후, 아키텍처 안정화와 함께 검토.

| ID | Item | Notes |
|----|------|-------|
| FU-01 | Workflow Version History UI | `workflows[].history[]` |
| FU-02 | `workflow-engine.js` 모듈 분리 | app.js 비대화 해소 |
| FU-03 | `routine-engine.js` 모듈 분리 | |
| FU-04 | `dashboard-service.js` 모듈 분리 | |
| FU-05 | `dependency-service.js` 모듈 분리 | |
| FU-06 | Global Template 서버 공유 | 팀/조직 단위 |
| FU-07 | Sponsor Template (`ruleTemplateId`) | `TaskRuleResolver` 확장 |
| FU-08 | AI Workflow Suggestion | Task 이름 + Study 컨텍스트 |
| FU-09 | AI Document Summary | |
| FU-10 | Team Sharing / Multi-user Study | Firestore 스키마 확장 |
| FU-11 | Analytics Dashboard | 완료율, Workflow 사용 통계 |
| FU-12 | Outlook Calendar Sync | `OutlookCalendarProvider` stub 활용 |
| FU-13 | Google Calendar 양방향 sync | `pullChangesSince` 구현 |
| FU-14 | Mobile Push Notification | PWA push |
| FU-15 | File Upload / PDF / OCR | TMF 보조 |

---

## Someday

> 가치는 있으나 시기·범위 미정. 아이디어 보관함.

| ID | Item | Notes |
|----|------|-------|
| SD-01 | CRA Manager 뷰 (팀 Task oversight) | Role-based access |
| SD-02 | Sponsor별 Workflow Marketplace | Global template 생태계 |
| SD-03 | Visit Report AI 초안 | 문서 연동 |
| SD-04 | eTMF 폴더 구조 자동 분류 | File Upload 선행 |
| SD-05 | 오프라인-first CRDT sync | Firebase 외 선택지 |
| SD-06 | 다국어 UI (EN/KO toggle) | |
| SD-07 | 키보드 단축키 (PC power user) | |
| SD-08 | Task batch edit | |
| SD-09 | Study lifecycle (시작/종료/보관) | Archive + Template |
| SD-10 | Integration: CTMS webhook | 외부 시스템 |
| SD-11 | Wearable / widget (Today glance) | |
| SD-12 | Audit log (GxP compliance) | Enterprise |

---

## Backlog Hygiene

- Sprint 종료 시: 완료 항목 → CHANGELOG, 미완료 → Next Sprint 재검토
- 분기 1회: Someday 항목 정리 (유지 / Future 승격 / dropped)
- 새 아이디어: Someday에 추가 후 우선순위 논의

---

## Related Documents

- [PRD.md](./PRD.md)
- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
