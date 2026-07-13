# CRA Workflow OS — MVP v1 테스트 체크리스트

**Version:** 1.0.0 (build 31)  
**Last updated:** 2026-07-13  
**Scope:** Sprint 1 + Sprint 2 완료 기준

---

## 1. 기존 기능 회귀 (Critical)

### Login & Sync
- [ ] Google 로그인 / 로그아웃
- [ ] Firestore 동기화 (tasks, studies, sites, systems, workspaceWorkflows)
- [ ] PC ↔ 모바일 데이터 일치

### Task
- [ ] Quick Add / FAB / Modal로 Task 생성
- [ ] Workflow **없이** 단일 Task 생성 가능
- [ ] Task Detail 열기·수정·저장 (PC split / mobile fullscreen)
- [ ] Task 삭제, Inbox Task
- [ ] memo, checklist, history

### MV/SIV/COV Legacy
- [ ] Monitoring Visit / SIV / COV Task 완료 시 후속 Task 자동 생성
- [ ] Study Task Rules 탭 CRUD
- [ ] Study Task Rules 있을 때 기본 Rule override

### Dashboard & Navigation
- [ ] PC Dashboard (Today / Overdue / D-1 / stats)
- [ ] Mobile Today / Inbox / Calendar / Reference
- [ ] Settings, Study/Site/System Master

---

## 2. Sprint 1 — Workflow

### Workflow Library
- [ ] Study → Workflow Library 탭
- [ ] Global Template Preview (MV/SIV/COV)
- [ ] Legacy Task Rules 섹션 표시
- [ ] 카드 메타: Task 수 · 적용 횟수 · 최근 사용일
- [ ] Global → Study 복사

### Workflow Suggestion
- [ ] `Monitoring Visit` 등 입력 시 Suggestion Modal
- [ ] Flow Preview + 메타 표시
- [ ] **이 Workflow 적용** → root + 후속 Task 생성
- [ ] **이번만 Task 생성** → 단일 Task만 생성
- [ ] 적용 시 usageCount / lastUsedAt 갱신

---

## 3. Sprint 2 — Workflow Learning & Scope

### Learning Modal
- [ ] Task A 완료 → 7일 이내 같은 Study에 Task B 생성
- [ ] Learning Modal: Flow Preview 표시
- [ ] **기존 Workflow 업데이트** (Study scope)
- [ ] **새 Workflow로 저장** + Scope 선택
- [ ] **Study에만** 저장 → `study.workflows[]`
- [ ] **내 Workspace** 저장 → `cra-workspace-workflows`
- [ ] **나중에** → Workflow 변경 없음

### Scope
- [ ] Study 미지정 Task → Study scope 비활성, Workspace 기본
- [ ] Global scope 저장 불가 (안내 문구)

---

## 4. Sprint 2 — Routine CRUD

### Routine 탭
- [ ] Study → Routine 탭
- [ ] + Routine 수동 생성
- [ ] 프리셋: Training / Query Check / TMF Check
- [ ] anchor (D-14/D-7/D-3/Due), weekly, monthly 스케줄
- [ ] Routine 수정 / 삭제 / ON·OFF

### Routine Task 생성
- [ ] 앱 로드 시 enabled Routine → Task 자동 생성
- [ ] 동일 routineId + dueDate + taskName 중복 생성 없음
- [ ] 생성 Task에 `routineId` 저장

---

## 5. Sprint 2 — Task Detail 연결 표시

- [ ] Workflow 적용 Task → Workflow 이름 + Scope 표시
- [ ] Workflow 후속 Task (parent) → Workflow + "(parent Task)" 표시
- [ ] Routine 생성 Task → Routine 이름 표시
- [ ] 연결 없는 Task → 연결 섹션 숨김

---

## 6. 모바일 / PWA

- [ ] Workflow / Learning Modal 스크롤·터치
- [ ] Routine Modal 입력
- [ ] Task Detail fullscreen + Back
- [ ] build 31 캐시 반영 (강력 새로고침)

---

## 알려진 이슈 (MVP v1)

| # | 이슈 | 심각도 | 비고 |
|---|------|--------|------|
| KI-01 | Global Workflow 저장 불가 | Low | 의도된 MVP 제한. Study/Workspace만 저장 |
| KI-02 | Workflow Learning은 완료 후 7일·동일 Study 조건 | Low | UX 단순화 |
| KI-03 | Routine scheduler는 앱 부팅 시 1회 실행 | Medium | Dashboard Routine preview 없음 (Backlog) |
| KI-04 | anchor Routine: anchorDate 미입력 시 오늘 기준 | Low | UI에서 기준일 입력 권장 |
| KI-05 | Legacy MV/SIV/COV 자동화와 Workflow 적용 중복 가능 | Medium | `hasExistingFollowUp`으로 완화, 완료 시 auto-gen과 혼용 주의 |
| KI-06 | Workspace Workflow는 Library에 표시되나 전용 관리 화면 없음 | Low | Study Library에서 삭제 가능 |
| KI-07 | Task Detail Workflow 링크는 읽기 전용 (편집/이동 없음) | Low | Sprint 3+ |
| KI-08 | `category` / `tags` / `trigger` DB 필드 UI 미노출 | Low | 향후 필터용 |
| KI-09 | Suggestion Modal X 닫기 시 draft 소실 | Low | 재제출 필요 |
| KI-10 | Firestore rules에 workspaceWorkflows 명시 미비 | Medium | 동작은 하며 rules 문서화 Backlog |

---

## 테스트 환경

| 환경 | URL / 방법 |
|------|------------|
| Local | `http://127.0.0.1:5500/` |
| Production | `https://taehee303-glitch.github.io/cra-task-management/` |

**권장:** 테스트 전 Ctrl+Shift+R (캐시 v31 확인: Settings → About → Build 31)

---

## Related Documents

- [PRD.md](./PRD.md)
- [ROADMAP.md](./ROADMAP.md)
- [BACKLOG.md](./BACKLOG.md)
- [CHANGELOG.md](./CHANGELOG.md)
