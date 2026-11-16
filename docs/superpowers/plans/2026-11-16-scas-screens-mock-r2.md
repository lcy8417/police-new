# 11개 화면 시안 r2 — 「전부 시안 그대로」 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 1차로 만든 11개 화면(지금 기능만)에 r3 시안의 +α · 실증 업무 · 애니메이션을 전부 더해, 진열 화면이 시안과 같아 보이게 한다.

**Architecture:** 1차 구조(위젯 = 값만 받는 표시 컴포넌트, `/dev/sNN` 진열 페이지가 가짜 데이터)를 그대로 쓴다. +α 요소는 위젯 안에서 `showPlus` 하나로 숨길 수 있게 감싸고 `data-plus`를 단다. 보는 사람은 시안 역할(수사관 · 감정관 · 기술책임자 · 관리자 + 보기 전용)로 바꾼다.

**Tech Stack:** 1차와 같음.

**Spec:** `docs/superpowers/specs/2026-11-16-scas-screens-mock-design.md` — **§13(r2)이 우선**, 나머지는 1차 그대로. 1차 계획 `docs/superpowers/plans/2026-11-16-scas-screens-mock.md`의 Global Constraints는 아래 차이를 빼고 그대로 적용.

## Global Constraints (1차와의 차이만)

- 담는 범위: 시안 `ours()` 전부(spec §13-1). 1차의 「뺀 것」 목록(노트 `docs/superpowers/sprint/2026-11-16-scas-screens-mock/screens-*.md`)이 이번에 넣을 목록의 출발점.
- 지금 기능과 그 테스트는 지우지 않는다(§13-2). 화면 동작이 바뀌면 그 테스트를 고친다.
- +α · 실증 요소: 위젯 prop `showPlus?: boolean`(기본 true) 한 개로 숨김, 감싼 요소에 `data-plus`(§13-3). 동작 없는 신규 버튼은 활성 모양 + 진열 페이지 콜백이 `toast("시안 — 기능 준비 중")`(§13-4).
- 역할별 보임: 시안 `data-role`을 권한 코드로 옮긴다 — 위젯은 지금처럼 `isAdmin` + `features`만 받는다(역할 이름을 위젯에 넣지 않음). 실증 권한 코드(`EXAM_DECIDE` · `CROSS_REVIEW` · `REPORT_WRITE` · `REPORT_APPROVE` · `REPORT_SEND` · `CASE_STATUS_VIEW` · `REPORT_VIEW` · `SHOE_COLLECT_REVIEW`)를 그대로 쓴다.
- 애니메이션: 시안이 움직이는 자리에만, 움직임 줄이기면 끝난 모양(§13-6).
- 시안에 없는 모양은 지어내지 않는다.
- 개발 서버: 사용자가 보는 5210은 끄지 않는다. 갈래는 5220~5226 중 지정 포트만 `--strictPort`로.

## Review Focus

1. `?plus=0`이면 +α가 하나도 안 보이고 지금 기능은 1차와 같다 — 화면마다 테스트.
2. 역할을 바꾸면 시안 `data-role`대로 버튼 · 칸이 보이고 숨는다(대표 2개 이상) — 화면마다 테스트.
3. 움직임 줄이기에서 애니메이션이 끝난 모양으로 멈춘다 — S00 시연 포함.
4. 1차 지금 기능 테스트가 그대로 통과(필요한 수정은 역할 키 변경 정도).
5. 화면 폭 1280에서 가로 넘침 0(S00 · S01 · S05 · S06).

---

### Task R1: 진열 틀 r2 — 시안 역할 · 신규 켜기/끄기

**Files:** `src/pages/dev/screens/frame/**`, `src/pages/dev/screens/index/**`, 1차 화면 진열 페이지 · 테스트의 `?as=` 값 교체만(`src/pages/dev/screens/sNN/**`).

**Produces:**
- `export type DevViewer = "investigator" | "analyst" | "verifier" | "admin" | "readonly"`; `DEV_VIEWERS[k] = { label, who, org, isAdmin, features }` — label · who · org는 시안 `M.ROLES`(core.js 23~27줄) 그대로(관리자 · 보기 전용은 시안 표기 따름/진열용). features: 실증 설계서 165~172줄 역할 배정 + 1차 지금 기능 코드 — investigator = `CRIME_REGISTER, CASE_STATUS_VIEW, REPORT_VIEW`; analyst = `CRIME_REGISTER, CRIME_SEARCH, SHOE_VIEW, SHOE_EDIT, CASE_STATUS_VIEW, REPORT_VIEW, EXAM_DECIDE, CROSS_REVIEW, REPORT_WRITE, SHOE_COLLECT_REVIEW`; verifier = `CRIME_SEARCH, SHOE_VIEW, CASE_STATUS_VIEW, REPORT_VIEW, REPORT_APPROVE, REPORT_SEND`; admin = 전부 + isAdmin; readonly = `SHOE_VIEW`.
- `DEV_SCREENS[i].defaultViewer: DevViewer` — 시안 각 화면의 기본 역할(대부분 analyst, S00은 해당 없음, S13 · S14는 admin). `useDevViewer()`는 `?as=` 없으면 그 화면 기본값.
- `export function useDevPlus(): boolean` — `?plus=0`이면 false, 그 외 true. 진열 막대에 「신규 기능 보기」 켜기/끄기(as · case 유지).
- 진열 막대의 보는 사람 표시는 시안 상단 「보는 사람」 모양을 따른다(진열용, 대조 대상 아님).

- [ ] 테스트 먼저(frame): 역할 5종 features, 화면 기본 역할, `?plus=0` → false, 막대 링크가 as · case · plus 유지. → 구현 → 통과.
- [ ] 1차 화면 테스트 중 `as=investigator`가 「조회 · 검색 가능」을 뜻하던 곳은 `as=analyst`로 바꾼다(기대값 그대로). 메뉴 거름(feature)은 새 역할로 다시 확인.
- [ ] `npx tsc --noEmit` · `npx vitest run` · 변경 파일 eslint → 커밋 `feat(dev): 진열 보는 사람을 시안 역할로 · 신규 기능 켜기/끄기`.

### Task R2: 공용 부품 5개 — StatTile · CheckList · AiSuggestion · HeatOverlay · Stepper (R1과 병렬)

**Files:** `src/shared/ui/{ai,viewer,panel}/**`, `src/pages/dev/parts/**`, `.claude/skills/police-ui-design/references/**`, `docs/mockups/scas-redesign/**`(표식만), `src/index.css`(토큰 · 키프레임 추가만). 이 갈래가 부품 공유 파일을 단독 소유.

**Produces(props 핵심):** 시안 클래스 기준 — `StatTile`(`.stat`: `{ label; value; unit?; tone?; glow?; children? }`), `CheckList`(`.check`: `{ items: { tone: "ok"|"warn"|"bad"; text; action?: ReactNode }[] }`), `AiSuggestion`(`{ title; reason?; confidence?; actionLabel?; onApply? }`), `HeatOverlay`(`{ opacity?; children? }` 그림만, `pointer-events-none`), `Stepper`(`.stepper`: `{ steps: string[]; current: number }`). 시안 실제 마크업을 읽고 필요한 변형을 더한다.

- [ ] 부품마다 1차 공통 사이클(시안 계산값 → 토큰 → 테스트 먼저 → 구현 → 진열 → 대조 → components.md 상태). 대조 실패는 한 번 고치고 남으면 「구현됨」 + 차이 기록.
- [ ] `npm run check:ui` · `npx tsc --noEmit` · `npx vitest run` · eslint → 부품당 커밋.

### Task R3~R7: 화면 갈래 r2 (R1 · R2 병합 뒤 병렬)

갈래 묶음은 1차와 같다: R3 ① S01 · S02 · R4 ② S03 · S04 · R5 ③ S05 · S06 · S07 · R6 ④ S10 · R7 ⑤ S00 · S13 · S14.

화면 하나마다:
1. 시안 `ours()`와 1차 노트의 「뺀 것」을 대조해 넣을 목록을 만든다(노트에 r2 절).
2. 테스트 먼저(진열 페이지): Review Focus 1 · 2 · 3 + 화면 대표 +α 요소 2~3개가 보이는지(시안 문구 그대로).
3. 위젯에 +α 추가 — `showPlus`로 감싸고 `data-plus`. 지금 기능 영역은 건드리지 않되, 시안이 같은 자리를 다르게 그리면 시안을 따른다(S04 검색 이력 열 등 — 테스트도 바꿈).
4. 진열 페이지: 가짜 값(시안 예시값 그대로), `useDevPlus()` → `showPlus`, 신규 버튼 콜백 = 「시안 — 기능 준비 중」 알림.
5. 화면 전용 조각은 위젯 `ui/` 안. 공용 부품이 모자라면 노트에 적고 보고(R2 부품 외 추가 금지 — 화면 안 조각으로 처리 가능하면 그렇게).
6. 검증: 해당 폴더 vitest · `npx tsc --noEmit` · eslint · `npm run check:ui:static`. 커밋 `feat(screens): SNN 시안 r2 — 신규 기능 · 연출`.

화면별 대표 확인(시안 문구 그대로):
- S00: 시연 5단계(스캔 → 문양 제안 → 리랭킹 1위 → 정밀 대조 87% → 감정서 초안 도장), 지난 로그인 · 실패 횟수, 내부망 · 기록 안내, 역할별 첫 화면 줄.
- S01: AI 사전 처리 타일 · 역할별 할 일 타일 · 「● 실시간」 · 사건 진행 열 · 행 펼침 3단 썸네일.
- S02: 단계 띠 · AI 1차 작업 점검 카드 · 채취 방법 AI 제안 · 필수 칸 원형 진행 · 업로드 직후 점검.
- S03: AI 제안 칸 · 원본→편집본 · 편집 이력 + 해시 · B 뷰어 십자선 · 돋보기 · 나란히/겹쳐/밀어.
- S04: 영역별 확신도 띠 · AI 확신도 막대 · 검색 전 미리보기 깔때기 · 시안 SCAS 검색이력 열.
- S05: AI가 먼저 보라는 10건 · 유사도 분포 · 빠른 비교 창 · 보기 거르기 · 확인대상 ★.
- S06: 대응점 39개(일치/불일치) · 부위별 근거 · 「AI가 미리 대조해 둠」 · AI 의견 문구.
- S07: AI 추천 표시 · 이미지별 근거 · 결과확인완료 n/m · 교차 검증 요청.
- S10: 단계별 AI 사전 작업 · 미승인 막대 · 오늘 승인 · 중복 의심 · 같은 문양 한 번에.
- S13: 역할 분포 · 잠긴 계정 · 만료 · 미접속 타일 · 담당 부족 경고 · 사용자별 실제 권한 표.
- S14: 시간대별 사용량 · 이상 징후 7일 · 기록 무결성(해시 사슬).

### Task R8: 마감 (갈래 병합 뒤)

- [ ] 갈래 병합, 화면 간 이동 · 역할 · plus 유지 확인(navigation 테스트에 plus 유지 1건 추가).
- [ ] `tests/ui/responsive.spec.ts`에 S00 · S06 1280 추가.
- [ ] 전체 검증 1회(`npm run check:ui` · tsc · vitest · build · eslint), README 「r2 마감 보고」(시안과 남은 차이 · 부품 대조 결과 · 지금 기능 영향 없음 확인).
- [ ] 브랜치 전체 최종 검수 1회(가장 강한 모델) → 수정 1회 → 재검토.
