# MVP v1.1 Release Candidate — QA Checklist

**Version:** 1.1.0 (build 33)  
**Deployed:** 2026-07-13  
**URL:** https://taehee303-glitch.github.io/cra-task-management/

배포 후 **사용자 직접 QA** 항목입니다.  
발견 이슈는 **Bug Fix**로, 기능 개선 아이디어는 **BACKLOG**에 기록합니다.

---

## Pre-flight

- [ ] `Ctrl+Shift+R` 강력 새로고침
- [ ] Settings → About: Version **1.1.0**, Build **33**

---

## Sprint 3 / Workflow UX

- [ ] **Dashboard 첫 화면** — 스크롤 없이 **진행 중인 Workflow** hero (보라색) 노출
- [ ] Dashboard — 이번 주 마감 / 최근 완료 / Routine preview
- [ ] My Tasks — Workflow strip (진행 중 Flow 있을 때)
- [ ] Task 카드 — Workflow/Routine chip, step progress
- [ ] Task Detail — Flow preview, Workflow Steps, Library/Routine 이동
- [ ] **Workflow Suggestion** — `Monitoring Visit` 등 → Modal → 적용/이번만
- [ ] **Workflow Learning** — 완료 → 후속 Task → 저장 Modal
- [ ] **Workflow Library** — Study → 탭, Legacy/Global/Study 섹션
- [ ] **Routine** — 등록 후 새로고침 → Task 자동 생성
- [ ] **Mobile** — Today Workflow/Routine 섹션, Task Detail, Reference

---

## Legacy & Core

- [ ] **MV/SIV/COV** — FAB 또는 Task 완료 시 후속 Task 자동 생성
- [ ] Study **Workflow Rule** 탭 CRUD
- [ ] Task CRUD, Inbox, Calendar, Dashboard stats
- [ ] Google 로그인 / 로그아웃
- [ ] **Firestore Sync** — PC ↔ 모바일 데이터 일치 (`workspaceWorkflows` 포함)
- [ ] 콘솔 에러 없음

---

## Issue triage

| Type | Where to track |
|------|----------------|
| Bug (동작 오류, 회귀) | Bug Fix (즉시 수정 대상) |
| UX/기능 개선 | [BACKLOG.md](./BACKLOG.md) |
| Sprint / 새 기능 | **v1.1 RC 이후 중단** |

---

## Related

- [CHANGELOG.md](./CHANGELOG.md)
- [MVP_V1_TEST_CHECKLIST.md](./MVP_V1_TEST_CHECKLIST.md)
- [SPRINT3_UX_POLISH.md](./SPRINT3_UX_POLISH.md)
