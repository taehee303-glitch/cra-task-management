# Sprint 3 — UX Polish

**Version:** 1.1.0 (build 33)  
**Date:** 2026-07-13  
**Principle:** 새 기능 추가 없이, MVP v1 Workflow/Routine 기능을 **더 잘 보이게** 만든다.

---

## Problem

Sprint 1–2에서 Workflow Library, Suggestion, Learning, Routine CRUD 등 기능은 구현되었으나:

- 메인 화면(My Tasks, Dashboard)은 Task Manager와 동일하게 보임
- Workflow는 Study Master 깊숙한 탭에만 존재
- MV/SIV/COV 자동화는 Legacy 엔진 그대로 → 체감 변화 없음
- Task 카드에 Workflow/Routine 연결 정보 미표시

---

## Sprint 3 Goals

| Goal | Approach |
|------|----------|
| Workflow 중심 앱 인식 | Branding, Dashboard, strip, chips |
| 기존 기능 발견성 | Task Detail preview, Library 이동, live hint |
| Routine 가시성 | Dashboard/Mobile preview |
| 구조 안정성 | **DB / WorkflowRecord 변경 없음** |

---

## Scope (Implemented)

### P0 — Workflow visibility

1. **Task context chips** — Workflow name, Routine, `N/M steps`, Follow-up
2. **Dashboard — 진행 중 Workflow (hero, header 바로 아래)** — root Task + next step, **스크롤 없이 첫 화면 노출**
3. **My Tasks strip** — PC 홈 상단 Workflow 요약
4. **Mobile Today** — 동일 Workflow 섹션

### P1 — Dashboard completeness (PRD §6.1)

5. **Due This Week** list (오늘 제외)
6. **Recently Completed** list
7. **Routine preview** — enabled Routine 다음 due + materialized 상태

### P2 — Task Detail & Create UX

8. **Task Detail** — compact Flow preview, Workflow Steps, Library/Routine navigation
9. **Add Task Modal** — 입력 중 Workflow 매칭 hint

### P3 — Polish

10. Sidebar **Workflow OS** tagline
11. Dashboard **Track tasks. Build workflows.**
12. FAB **MV/SIV/COV Workflow** labels
13. Workflow Library sort by usage / lastUsed

---

## Out of Scope

- Quick Add → Workflow Suggestion
- Workflow category/tags filter UI
- Global scope save
- Engine module split
- New data fields

---

## Manual QA Checklist

- [ ] Dashboard: **진행 중 Workflow**가 header 바로 아래 첫 화면(스크롤 전)에 보임
- [ ] Dashboard: 진행 중 Workflow 카드 클릭 → Task Detail
- [ ] Dashboard: 이번 주 마감 / 최근 완료 / Routine preview 표시
- [ ] My Tasks: Workflow strip (후속 Task 있는 root Task 있을 때)
- [ ] Task 카드: Workflow chip / step progress 표시
- [ ] Task Detail: Flow preview + Steps + Library 열기
- [ ] 새 업무 Modal: `Monitoring Visit` 입력 → hint 표시 → 저장 → Suggestion Modal
- [ ] Mobile Today: Workflow / Routine 섹션
- [ ] Settings About: build **32**

---

## Related

- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [MVP_V1_TEST_CHECKLIST.md](./MVP_V1_TEST_CHECKLIST.md)
