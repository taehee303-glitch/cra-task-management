# CRA Workflow OS — Product Requirements Document (PRD)

**Version:** v2.0 MVP (living document)  
**Product:** CRA Workflow OS (evolved from CRA Task Manager)  
**Last updated:** 2026-07-13  
**Status:** MVP v1 complete (build 31)

---

## 1. Product Vision

### Mission

CRA가 업무를 놓치지 않고, 반복 업무를 Workflow로 축적하여 시간을 절약하며 개인적으로 성장하는 업무 운영 시스템을 제공한다.

이 제품은 단순한 Todo 앱이 아니라, **"CRA의 업무 경험이 자산이 되는 Workflow OS"**를 목표로 한다.

**Tagline (후보)**

- Track your tasks. Build your workflow.
- Your workflow grows with your experience.
- Never miss a task. Build your own CRA workflow.

---

## 2. Core Value

### 기존 도구의 분산

| Excel Tracker | OneNote | Outlook Calendar | Teams | Sticky Note |
|---------------|---------|------------------|-------|-------------|

→ 여러 도구에 흩어진 업무 정보를 **하나의 워크스페이스**에서 관리한다.

### CRA Workflow OS

| Task | Workflow | Checklist | Dependency | Routine |
|------|----------|-----------|------------|---------|

→ 업무 누락을 최소화하고, 반복 패턴을 축적한다.

---

## 3. Target User

| Segment | Description |
|---------|-------------|
| **Primary** | Clinical Research Associate (CRA) |
| **Future** | Senior CRA, Lead CRA, CRA Manager |

---

## 4. Product Principles

1. **Task First** — 모든 기능은 Task에서 시작한다. Workflow는 Task를 보조하는 레이어다.
2. **No Task Left Behind** — 모든 화면은 "놓친 업무가 없는가?"를 전제로 설계한다.
3. **Learning by Doing** — Workflow는 처음부터 완성되지 않는다. 사용자가 업무를 수행하며 축적한다.
4. **Personal Experience** — AI가 아닌, 사용자의 실제 업무 경험을 기반으로 Workflow가 성장한다.
5. **Information Hierarchy** — Workspace → Study → Task → Workflow → Checklist → Dependency → Routine
6. **Optional Workflow** — Task 생성/완료는 Workflow 없이도 항상 동작해야 한다.

---

## 5. Information Hierarchy

```
Workspace
 └── Study
      └── Task
           └── Workflow (선택)
           └── Checklist
           └── Dependency (향후)
           └── Routine (향후)
```

---

## 6. MVP Features

### 6.1 Dashboard

| Section | Description |
|---------|-------------|
| Due Today | 오늘 마감 Task |
| Overdue | 지연 Task |
| Due This Week | 이번 주 마감 Task |
| Routine | 반복 업무 예정 (향후) |
| Recently Completed | 최근 완료 Task |

> 모바일: Dashboard view 대신 **Today** 화면이 Dashboard 역할을 수행한다.

### 6.2 Study

- Study 기본 정보, Site/System 연결
- **Workflow Library** — Study별 Workflow 조회·적용·메타 확인
- Routine 연결 (향후)
- Legacy Task Rule (기존 MV/SIV/COV 규칙, 점진 이전)

### 6.3 Task

**필수 필드:** Task Name, Study, Due Date, Priority, Status

**선택 연결:** Workflow, Routine (향후)

**유지:** memo, checklist, history, Inbox, Calendar sync

### 6.4 Workflow

Workflow는 **Task 생성 시 선택적으로 적용**하는 기능이다. Task 생성 UX 자체는 변경하지 않는다.

**예시 Flow:**

```
Monitoring Visit
    ↓
Visit Report (+5일)
    ↓
Follow-up Letter (+7일)
    ↓
TMF Upload (+3일)
```

**MVP UX (구현 완료 / 진행 중)**

| UX | Trigger | Action |
|----|---------|--------|
| Workflow Suggestion | Task 생성 시 이름 매칭 | Preview 확인 → 적용 / 이번만 생성 |
| Workflow Learning | Task 완료 후 후속 Task 추가 | Preview → 업데이트 / 저장 + Scope (**Sprint 2 ✅**) |
| Scope 선택 | Workflow 저장 시 | Study / Workspace / Global(향후) |
| Workflow Library | Study Master | 카드 Preview + 메타 (Task 수, 적용 횟수, 최근 사용) |

**Workflow 저장 범위**

| Scope | 저장 위치 | MVP |
|-------|----------|-----|
| Study | `study.workflows[]` | ✅ |
| Workspace | `cra-workspace-workflows` | ✅ |
| Global | 읽기 전용 preset catalog | 읽기 + Study 복사만 |

### 6.5 Checklist

- Task별 checklist (구현됨)
- Workflow step별 checklist preset (향후)

### 6.6 Dependency

- Task 간 선후 관계 (향후 MVP 이후)
- MVP: Workflow steps 순서로 암시적 표현

### 6.7 Routine

- Study → **Routine** 탭 CRUD (**Sprint 2 ✅**)
- Training 프리셋 + 자유 생성
- anchor (D-14/D-7/D-3/Due), weekly, monthly
- 앱 부팅 시 Task materialize

---

## 7. Workflow Scope (개념)

| Level | Description |
|-------|-------------|
| Global | 기본 템플릿 (SIV, MV, COV 등) |
| Workspace | 개인 반복 패턴 |
| Study | 특정 Study 전용 Workflow |

---

## 8. Workflow Learning (개념)

```
Task 완료
  → 후속 Task 추가
  → "Workflow에 저장할까요?"
      → 기존 Workflow 업데이트
      → 새 Workflow로 저장 (Scope 선택)
```

**MVP에서 제외:** Version History UI, 복잡한 Engine 분리

---

## 9. Workflow Library (Study)

Study별 Workflow 목록에서 확인 가능한 정보:

| Meta | Field |
|------|-------|
| 생성되는 Task 수 | `stepCount` |
| 적용 횟수 | `usageCount` |
| 최근 사용일 | `lastUsedAt` |
| Flow Preview | `steps[]` 시각화 |

---

## 10. Data Model — WorkflowRecord

향후 확장을 위해 MVP DB 구조에 포함. UI에서 모든 필드를 노출하지 않을 수 있다.

```typescript
WorkflowRecord {
  id: string
  name: string
  scope: "study" | "workspace" | "global"
  studyId?: string
  steps: WorkflowStep[]

  // 확장 필드 (향후 검색·필터·자동화용)
  category: "Visit" | "Training" | "IRB" | "Admin" | "General"
  tags: string[]
  trigger: "TASK_CREATED" | "TASK_COMPLETED" | "STUDY_CREATED" | "ROUTINE"
  stepCount: number          // root + steps 캐시

  // Library 메타
  usageCount: number
  lastUsedAt: string | null
  source: "manual" | "learned" | "template" | "legacy-taskRules"
  createdAt: string
  updatedAt?: string
}

WorkflowStep {
  id: string
  taskName: string
  dueOffset: number
  dueUnit: "calendar" | "business"
  priority?: string
  defaultStatus?: string
}
```

**Storage**

| Key | Location |
|-----|----------|
| `studies[].workflows[]` | Firestore `studies` doc (embedded) |
| `cra-workspace-workflows` | localStorage + Firestore `workspaceWorkflows` |
| Global presets | `WORKFLOW_VISIT_RULES` 상수 (읽기 전용) |

**Task optional fields (향후 확장)**

- `workflowId`, `routineId`

---

## 11. Default Templates (Global Preset)

| Template | Category |
|----------|----------|
| SIV | Visit |
| Monitoring Visit (MV) | Visit |
| Close-out Visit (COV) | Visit |
| PSV | Visit |
| IRB Submission | IRB |
| Training | Training |
| Expense | Admin |
| Timesheet | Admin |

---

## 12. Design Philosophy

정보를 "찾으러 가는" 앱이 아니라, 정보가 "따라오는" 앱.

Reference 자료는 필요할 때 열람하고, **Task 중심으로 Workflow가 밖에서 지원**한다.

---

## 13. Success Metrics (MVP)

- [ ] 한 Study에서 Workflow를 한 번 이상 적용
- [ ] Excel Tracker 대비 업무 누락 감소 (정성 평가)
- [ ] 반복 업무 자동/반자동 생성
- [ ] Workflow가 사용 경험에 따라 축적됨

---

## 14. Explicitly Out of Scope (MVP)

다음 기능은 **삭제하지 않고 유지**하되, Workflow OS MVP 확장 범위에서는 우선순위를 낮춘다.

| Feature | Status |
|---------|--------|
| Google Calendar Sync | 유지 (기존) |
| Outlook Calendar Sync | Future |
| AI Workflow Suggestion | Future |
| AI Document Summary | Future |
| File Upload / PDF / OCR | Future |
| Team Sharing | Future |
| Mobile Push Notification | Future |
| Analytics Dashboard | Future |
| Workflow Version History UI | Future |
| Explicit Dependency DAG | Future |

---

## 15. Technical Constraints (Refactoring Principles)

1. 기존 UI와 로그인 기능 유지
2. 기존 Task 기능 삭제 금지
3. 기존 DB 최대 활용 (`tasks`, `studies`, `sites`, `systems`)
4. 새 기능은 기존 구조 위에 추가
5. 기존 화면이 깨지지 않도록 점진적 변경
6. MVP: UX 우선, Engine 분리는 안정화 이후

---

## 16. Related Documents

- [ROADMAP.md](./ROADMAP.md) — Sprint / Phase 계획
- [BACKLOG.md](./BACKLOG.md) — 우선순위별 기능 후보
- [MVP_V1_TEST_CHECKLIST.md](./MVP_V1_TEST_CHECKLIST.md) — MVP v1 테스트 및 알려진 이슈
- [CHANGELOG.md](./CHANGELOG.md) — 버전별 변경 이력
