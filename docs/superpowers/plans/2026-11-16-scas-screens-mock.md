# 지금 기능 11개 화면 r3 시안(가짜 데이터) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지금 앱 기능을 r3 시안 모양의 화면 11개(S00~S07 · S10 · S13 · S14)로, 서버 없이 가짜 데이터로 `/dev/sNN`에 띄운다.

**Architecture:** 남은 공용 부품을 `@/shared/ui/{kit,viewer,ai,panel}`에 정본 절차로 채운 뒤, 화면마다 값만 받아 그리는 표시 컴포넌트를 `src/widgets/<화면>/`에 만들고, 개발 전용 진열 페이지 `src/pages/dev/screens/sNN/`가 가짜 값을 넘긴다. 지금 페이지 · API · 사이드바는 바꾸지 않는다. 부품(3갈래) → 잠금 → 화면(5갈래) 병렬 트랙.

**Tech Stack:** React 19 · TypeScript · Vite · Tailwind 4 · shadcn · React Router v7 · Vitest · Playwright(UI 대조)

**Spec:** `docs/superpowers/specs/2026-11-16-scas-screens-mock-design.md` (반드시 함께 읽는다). 디자인 정본: `.claude/skills/police-ui-design/SKILL.md` + `references/*`.

## Global Constraints

- 작업 위치: 워크트리 `../police-new-scas-mock`, 브랜치 `feat/scas-screens-mock`(기준 `feat/pilot-db-a`의 이 계획 커밋).
- 개발 서버 포트: **5210 고정**(`npm run dev -- --port 5210 --strictPort`). 5173 · 5185~5197은 다른 작업이 사용 중이니 띄우거나 끄지 않는다. UI 검사(`check:ui:visual`)는 기존대로 5180.
- 지금 페이지 · 기능 · 위젯 · 엔티티 파일 무변경. 바뀌어도 되는 경로: `src/widgets/<새 화면 폴더>/**`, `src/pages/dev/**`, `src/shared/ui/{kit,viewer,ai,panel}/**`, `src/shared/lib/screen-status.ts`(새 파일), `src/App.jsx`(진열 라우트 추가만), `src/index.css`(토큰 추가만), `.claude/skills/police-ui-design/**`, `docs/**`, `scripts/ui/**`, `tests/ui/**`, `src/assets/**`(추가만).
- 색은 토큰만. 새 코드 hex 0 · 인라인 색 0 · 컴포넌트 옆 `.css` 0. 인라인 `style`은 좌표 파생 위치값만.
- 위젯 · 진열 페이지에서 `backendFetch` · `@/services/*` · `@/entities/*/api` 가져오기 0. 엔티티 **타입**(`@/entities/<x>` 배럴의 type)은 가져와도 된다.
- 가짜 데이터: 이름은 가림(`박○○`), 실제 사건 사진 금지, 숫자는 시안 예시값과 맞춤(감정번호 00001-25-0646 등).
- UI 문자열 · 주석 · 커밋 메시지는 한국어. 커밋 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 생김새를 바꾼 작업은 `police-ui-design` 스킬을 먼저 읽는다. `src/pages/dev/**`를 쓰기 전에 `src/pages/dev/parts/parts-plan.md`에 행이 있어야 한다(훅이 막음).
- 공유 파일(spec §9-2)은 오케스트레이터 작업(Task 1 · 5 · 11)만 고친다. 갈래 작업은 노트 `docs/superpowers/sprint/2026-11-16-scas-screens-mock/<갈래>.md`에 요청을 적는다.
- 작업 완료 = `npx tsc --noEmit` · 해당 테스트 `npx vitest run <경로>` · 변경 파일 `npx eslint` 통과 + 커밋. 전체 `npm run build` · `npm run check:ui`는 Task 5 · 11에서.

## Review Focus

1. **조회 실패를 빈 결과로 보여 줌** — `status="error"`인데 「결과 없음」이 보이면 안 된다. 화면 테스트마다 error 케이스에 「다시」 버튼이 있고 「결과 없음」 문구가 없음을 확인(Task 6~10 각 테스트에 포함).
2. **보기 전용 권한에서 쓰기 버튼이 눌림** — `readonly`에서 등록 · 저장 · 수정 버튼이 없거나 `disabled`. 화면 테스트마다 확인.
3. **긴 값 · 많은 행에서 가로 넘침** — 사건명 40자, 목록 50행. 진열 페이지 `?case=ready` 가짜 데이터에 긴 값 1건 이상 포함하고, Task 11 반응형 확인(`tests/ui/responsive.spec.ts`에 `/dev/s01` · `/dev/s05` 폭 1280 · 1600 추가).
4. **신발 ID 앞자리 0 손실** — 가짜 데이터 `ftwrId: "00758"`이 화면에 `00758`로 보인다(S05 · S10 테스트).
5. **움직임 줄이기 설정** — AiProgress · ScanOverlay · LiveDot은 `prefers-reduced-motion`에서 멈춘 최종 모양(Task 4 부품 테스트).

---

## 파일 구조 (만드는 것)

```text
src/shared/lib/screen-status.ts                 # ScreenStatus 타입(Task 1)
src/shared/ui/panel/{ScasShell,SearchForm,Crumb,PageHead}.tsx (+ .test.tsx)   # Task 1
src/shared/ui/kit/{Segmented,RadioRow,Combobox,StatusDot,Avatar,DataGrid,Pagination,DialogShell,InlineError}.tsx (+ test)  # Task 2
src/shared/ui/viewer/{EvidenceImage,SoleThumb,PatternIcon,ZoneBands,CompareView,PointPairs}.tsx (+ test)  # Task 3
src/shared/ui/ai/{AiProgress,ConfidenceBar,ScanOverlay,LiveDot}.tsx (+ test)  # Task 4
src/pages/dev/parts/fixtures-<출입구>.tsx         # 갈래별 진열 예시(Task 2~4), Task 5에서 연결
src/pages/dev/screens/
  index.ts · DevScreensIndexPage.tsx             # /dev 목차(Task 1)
  frame/DevScreenFrame.tsx · dev-viewers.ts · use-dev-case.ts   # 케이스 · 권한 전환(Task 1)
  mock-assets/FakePhoto.tsx · FakeSole.tsx       # 시안 M.photo · M.sole 이식(Task 3)
  s00/ … s14/  (S00 · S01 · S02 · S03 · S04 · S05 · S06 · S07 · S10 · S13 · S14)
    SNNDevPage.tsx · mock-cases.ts · SNNDevPage.test.tsx      # Task 6~10
src/widgets/{login-screen,case-list,case-detail,image-edit,pattern-code,search-result,match-compare,result-confirm,shoe-db,admin-users-screen,admin-logs-screen}/
  index.ts · model/types.ts · ui/<Name>Screen.tsx (+ ui 하위 조각)   # Task 6~10
docs/superpowers/sprint/2026-11-16-scas-screens-mock/*.md     # 갈래 노트
```

---

### Task 1: 토대 — 워크트리 · 진열 틀 · 공통 껍데기 부품 (오케스트레이터)

**Files:**
- Create: `src/shared/lib/screen-status.ts`, `src/pages/dev/screens/**`(index · frame · s00~s14 빈 페이지), `src/shared/ui/panel/{ScasShell,SearchForm,Crumb,PageHead}.tsx` + 각 `.test.tsx`, `docs/superpowers/sprint/2026-11-16-scas-screens-mock/README.md`
- Modify: `src/App.jsx`(dev 라우트), `src/shared/ui/panel/index.ts`, `src/pages/dev/parts/parts-plan.md`, `.claude/skills/police-ui-design/references/components.md`(4개 상태 → 구현됨)

**Interfaces:**
- Produces:
  - `export type ScreenStatus = "loading" | "error" | "empty" | "ready"` (`@/shared/lib/screen-status`)
  - `export type DevViewer = "admin" | "investigator" | "readonly"`, `export const DEV_VIEWERS: Record<DevViewer, { label: string; isAdmin: boolean; features: readonly FeatureCode[] }>` — admin = 관리자 · 전부, investigator = `CRIME_REGISTER` · `CRIME_SEARCH` · `SHOE_VIEW`, readonly = `SHOE_VIEW` (`src/pages/dev/screens/frame/dev-viewers.ts`)
  - `export function useDevCase<C extends string>(cases: readonly C[], fallback: C): C` — `?case=` 읽기 (`frame/use-dev-case.ts`)
  - `export function useDevViewer(): (typeof DEV_VIEWERS)[DevViewer]` — `?as=` 읽기, 기본 investigator
  - `export function DevScreenFrame(props: { screen: string; title: string; cases: readonly string[]; bare?: boolean; children: React.ReactNode }): JSX.Element` — 위 얇은 전환 막대(케이스 · 보는 사람, 진열용이라 대조 대상 아님) + `ScasShell`로 children 감쌈. `bare`면 ScasShell 없이(S00 로그인용)
  - `ScasShell` props: `{ active: string; title?: string; tabs?: string[]; tabOn?: string; menu: ScasMenuGroup[]; user: { name: string; org: string; roleLabel: string }; children: React.ReactNode; partId?: string }`, `export interface ScasMenuGroup { group: string; items: { label: string; href?: string; count?: number; disabled?: boolean }[] }` — 시안 `M.shell`(core.js 187~217줄)과 `.app/.topnav/.mdi/.side/.content` 스타일. 메뉴는 받아서 그리기만(권한 판단 없음).
  - `SearchForm` props: `{ columns: 2 | 3; rows: { label: string; required?: boolean; span?: 1 | 3; field: React.ReactNode }[]; onSearch?: () => void; onReset?: () => void }` — 시안 `.form`
  - `Crumb` props: `{ items: string[] }` — `.crumb`; `PageHead` props: `{ title: string; description?: string; actions?: React.ReactNode }` — `.page-head`
  - 진열 라우트: `/dev` → 목차, `/dev/s00` … `/dev/s14`(11개) → `S{NN}DevPage`. 모두 `import.meta.env.DEV`일 때만, `/dev/parts`와 같은 방식(lazy + 가드 밖).

- [ ] **Step 1: 워크트리 만들기** — `superpowers:using-git-worktrees`로 `../police-new-scas-mock`(브랜치 `feat/scas-screens-mock`) 생성, `npm ci`, `npx vitest run` 기준선 통과 확인.
- [ ] **Step 2: 부품표 승인 줄** — `src/pages/dev/parts/parts-plan.md`에 spec §8 「만들 부품」 23개 각 행(판정 `새로`) + `승인: 11/16 소유자 — <부품>` 줄, 그리고 화면 진열 페이지 자리 행(S00~S14, 쓰는 부품 「그대로」)을 적는다. `python3 .claude/hooks/parts_gate.py --check-all` 통과.
- [ ] **Step 3: 부품 테스트 먼저** — `ScasShell.test.tsx`: `메뉴 그룹과 항목을 그린다`(label 보임, `active` 항목에 `aria-current="page"`), `탭 줄에 현재 탭을 표시한다`; `SearchForm.test.tsx`: `3열 폼에 라벨 · 필수 표시를 그린다`(필수 라벨에 `data-required`), `조회 · 초기화 콜백을 부른다`; `Crumb` · `PageHead`: 텍스트 · 루트 `data-part` 값. 실행해 실패 확인.
- [ ] **Step 4: 부품 구현** — 정본 작업 순서(시안 계산값 → 토큰 → `partAttrs`)대로. 시안에 hex만 있는 색은 `src/index.css`에 토큰 추가 + `references/tokens.md` 한 줄. 테스트 통과.
- [ ] **Step 5: 진열 틀 테스트 먼저** — `frame/DevScreenFrame.test.tsx`: `?case=error면 useDevCase가 error를 준다`, `없는 case 값이면 fallback`, `?as=readonly면 features가 SHOE_VIEW만`. 실패 확인 → 구현 → 통과.
- [ ] **Step 6: 라우트 · 빈 페이지 11개 · 목차** — 각 `sNN/SNNDevPage.tsx`는 `DevScreenFrame` 안에 「준비 중」 한 줄. 목차는 11개 링크. `src/App.jsx`에 라우트 추가(기존 줄 무변경).
- [ ] **Step 7: 확인** — `npm run dev -- --port 5210 --strictPort`(5173 등 51xx는 다른 작업이 사용 중 — 이 워크트리는 **5210 고정**, `vite.config.js`는 바꾸지 않음) 후 `http://localhost:5210/dev`, `/dev/s01?case=loading&as=readonly`가 로그인 없이 열림. `npx tsc --noEmit` · `npx vitest run` · `npm run build` · `npm run check:ui:static` 통과.
- [ ] **Step 8: 커밋** — `feat(dev): 시안 진열 틀 · ScasShell · SearchForm · Crumb · PageHead`

---

### Task 2~4 공통 (부품 갈래 — 병렬)

각 부품마다 아래 사이클. 부품 하나 = 한 커밋.
1. `references/components.md`에서 그 행의 「원본(data-part)」 · 「쓰는 화면」을 보고, 시안 `docs/mockups/scas-redesign/assets/mockup.css` · `screens/sNN-*.js`에서 상태별 계산값을 읽는다(`tests/ui/style-read.ts` 도우미 사용 가능).
2. 테스트 먼저(`<Part>.test.tsx`): 루트 `data-part="<Part>"`, 변형마다 `data-part-variant`, 아래 표의 동작 assertion. 실패 확인.
3. 구현(`partAttrs` 사용, Chip.tsx 패턴), 출입구 배럴에 export, 테스트 통과.
4. 진열: 시안의 그 자리에 `data-part` · `data-part-variant` · `data-part-id`(형식 `S05-31`처럼 그 화면 번호 + 기존과 안 겹치는 번호) 표식을 단다(시안 파일을 고치기 전 `docs/mockups/scas-redesign/parts-plan.md`에 행 — 공유 파일이므로 **노트에 요청**하고, 오케스트레이터가 Task 5에서 일괄 반영해도 된다). 갈래 진열 파일 `src/pages/dev/parts/fixtures-<출입구>.tsx`에 예시 + 같은 이름 `-meta.ts`에 `PartFixture` 데이터.
5. 대조(`npx playwright test -c playwright.ui.config.ts tests/ui/parts-compare.spec.ts -g <id>`)는 Task 5에서 연결 후 돌린다. 갈래에서는 계산값 표를 `references/visual-spec.md`에 넣을 내용으로 노트에 적는다.
6. 갈래 끝: 노트에 「부품 · 변형 · 대조 id · 남은 차이」 목록.

### Task 2: kit 부품 9개

**Files:** Create `src/shared/ui/kit/{Segmented,RadioRow,Combobox,StatusDot,Avatar,DataGrid,Pagination,DialogShell,InlineError}.tsx` + `.test.tsx`, `src/pages/dev/parts/fixtures-kit.tsx` · `fixtures-kit-meta.ts`. Modify `src/shared/ui/kit/index.ts`.

**Interfaces — Produces:**

| 부품 | props(핵심) | 테스트 assertion |
|---|---|---|
| `Segmented` | `{ items: { value: string; label: React.ReactNode }[]; value: string; onValueChange: (v: string) => void; scas?: boolean }` — `.seg`, 눌린 칸 `aria-pressed="true"` | 클릭 시 `onValueChange("이진화")`, 현재 칸만 pressed |
| `RadioRow` | `{ name: string; options: { value: string; label: string }[]; value: string \| null; onValueChange; disabled?: boolean }` — `.radio` ◉○ | `role="radiogroup"`, 선택값에 `aria-checked="true"`, disabled면 콜백 안 부름 |
| `Combobox` | `{ items: { value: string; label: string; path?: string }[]; value: string \| null; onValueChange; placeholder?: string; emptyText?: string }` — 검색형 한 칸, 결과에 경로(「대구청 › 동부서」) | 입력 「동부」 → 일치 항목만, Enter로 선택 시 콜백 |
| `StatusDot` | `{ tone: "ok" \| "warn" \| "danger" \| "off"; label: string }` — `.dot` + 글자(색만으로 구분 금지) | label 글자가 보임, `data-part-variant=tone` |
| `Avatar` | `{ name: string; tone?: "blue" \| "teal" \| "violet" \| "amber" }` — `.avatar` 이니셜 | `박○○` → 「박」 |
| `DataGrid` | `<Row>` 제네릭: `{ columns: { key: string; header: string; align?: "left" \| "right"; wrap?: boolean; render: (row: Row) => React.ReactNode }[]; rows: Row[]; rowKey: (row: Row) => string; selectedKey?: string; onRowClick?: (row: Row) => void; emptyText?: string }` — `.grid`, 선택 행 `tr.sel` = `aria-selected` | 열 머리 순서 그대로, 행 클릭 콜백, 선택 행 `aria-selected="true"`, rows 0이면 emptyText |
| `Pagination` | `{ total?: number; page: number; pageSize: number; hasNext: boolean; onPageChange: (p: number) => void }` — SCAS 「전체 n 중 a-b」, total 없으면 「a-b」만 | 「전체 116 중 1-20」, 첫 쪽 이전 disabled, `hasNext=false`면 다음 disabled |
| `DialogShell` | `{ open: boolean; onOpenChange; title: string; size?: "default" \| "large"; actions?: React.ReactNode; children }` — shadcn Dialog 감싸기, 머리 · 몸 · 발, large = 90% | open일 때 title 보임, 닫기 버튼 콜백 |
| `InlineError` | `{ message: string; at?: string; onRetry?: () => void }` — 회색 「확인 못 함 · 시:분 · 다시」(SKILL 「상태 표시」) | message · at 보임, onRetry 있으면 「다시」 버튼 클릭 시 호출 |

- [ ] Step 1~6: 위 공통 사이클을 부품 9개에 반복(부품당 커밋 `feat(kit): <부품>`).

### Task 3: viewer 부품 6개 + 가짜 그림

**Files:** Create `src/shared/ui/viewer/{EvidenceImage,SoleThumb,PatternIcon,ZoneBands,CompareView,PointPairs}.tsx` + test, `src/pages/dev/screens/mock-assets/{FakePhoto,FakeSole}.tsx` + test, `src/pages/dev/parts/fixtures-viewer.tsx` · `-meta.ts`. Modify `src/shared/ui/viewer/index.ts`.

**Interfaces — Produces:**

| 부품 | props(핵심) | 테스트 assertion |
|---|---|---|
| `EvidenceImage` | `{ src: string; alt: string; look?: "raw" \| "binary" \| "invert" \| "contrast"; caption?: string; tag?: string; ruler?: boolean; children?: React.ReactNode /* 위에 얹는 장식 */ }` — `.imgbox` 2:3 틀 · 증거 꼬리표 · cm 자. **캔버스 화면에는 쓰지 않는다** | look별 `data-part-variant`, caption · tag 글자 |
| `SoleThumb` | `{ src: string; alt: string; size?: "sm" \| "md" \| "lg"; selected?: boolean; onClick? }` | selected면 `aria-pressed="true"` |
| `PatternIcon` | `{ name: string; src: string; size?: "sm" \| "md" \| "lg"; essential?: boolean; count?: number; selected?: boolean; ai?: boolean }` — `.picon`. 경로를 다시 바꾸지 않는다(`docs/pattern-data-model.md` §3 — 받은 `src` 그대로) | essential이면 「필수」 글자, count 표시 |
| `ZoneBands` | `{ zones: { key: "top" \| "mid" \| "bottom"; label: string; from: number; to: number }[] }` 비율 0~1, `pointer-events-none` 띠만(확신도 없음) | 띠 3개 · 라벨, 루트 `pointer-events-none` 클래스 |
| `CompareView` | `{ left: React.ReactNode; right: React.ReactNode; mode: "side" \| "overlay" \| "slide"; onModeChange?; leftLabel: string; rightLabel: string }` | mode별 variant, 라벨 둘 |
| `PointPairs` | `{ boxes: MatchBox[] /* @/entities/match 타입 */; side: "crime" \| "shoe"; activeIndex: number \| null; onHover?: (i: number \| null) => void; onSelect?: (i: number) => void; width: number; height: number }` — 번호 박스 그림만 | 박스 수만큼 번호, activeIndex 박스 `data-active`, 클릭 시 onSelect(i) |

- `FakePhoto({ look, rotate, flip, zones })` · `FakeSole({ zones, ruler, flip })`: 시안 `core.js` `M.photo`(115줄) · `M.sole`(72줄)을 SVG 컴포넌트로 옮긴다. 색은 `currentColor` · 토큰 클래스(hex 금지 — `count-hex`가 `src/` 전체를 본다). 데이터 URL이 필요하면 `export function fakePhotoUrl(opts): string`도 같은 파일에.
- [ ] Step 1~6: 공통 사이클(부품당 커밋 `feat(viewer): <부품>`), 가짜 그림은 `feat(dev): 가짜 사진 · 밑창 그림`.

### Task 4: ai 부품 4개

**Files:** Create `src/shared/ui/ai/{AiProgress,ConfidenceBar,ScanOverlay,LiveDot}.tsx` + test, `src/pages/dev/parts/fixtures-ai.tsx` · `-meta.ts`. Modify `src/shared/ui/ai/index.ts`, (움직임 키프레임이 없으면) `src/index.css` 추가 — **공유 파일이므로 노트에 요청, Task 5에서 반영**. 갈래 안에서는 `references/motion.md`에 이미 있는 키프레임 이름만 쓴다.

| 부품 | props(핵심) | 테스트 assertion |
|---|---|---|
| `AiProgress` | `{ state: "running" \| "done" \| "failed"; value?: number /* 0~1 */; label?: string }` — `.fx-bar > i`, running = `.run` 반짝임 | state별 variant, `role="progressbar"` + `aria-valuenow`, failed면 글자 「실패」 |
| `ConfidenceBar` | `{ value: number; scale: "unit" \| "percent"; threshold?: number; label?: string }` — percent는 0~100, unit은 0~1. 임계 미만 주황 | 69.99(percent) → 「70%」, threshold 미만이면 `data-part-state="low"` |
| `ScanOverlay` | `{ active: boolean }` — `.fx-scan`, `pointer-events-none` | active=false면 렌더 안 함 |
| `LiveDot` | `{ state: "busy" \| "idle"; label: string }` — `.fx-live` | label 보임 |

- 움직임: `motion-reduce:` 변형으로 멈춘 최종 모양. 테스트는 클래스에 `motion-reduce:animate-none`(또는 motion.md가 정한 방식) 포함 확인.
- [ ] Step 1~6: 공통 사이클(부품당 커밋 `feat(ai): <부품>`).

---

### Task 5: 부품 잠금 (오케스트레이터)

**Files:** Modify `src/pages/dev/parts/fixtures.tsx` · `fixtures-meta.ts`(갈래 진열 파일 연결), `docs/mockups/scas-redesign/parts-plan.md` · 시안 표식(노트 요청분), `src/index.css`(노트 요청 토큰 · 키프레임), `.claude/skills/police-ui-design/references/{components,visual-spec,tokens,motion}.md`, `scripts/ui/ui-converted.txt`(해당 없음이면 무변경).

- [ ] **Step 1:** 세 갈래 브랜치/커밋을 워크트리 브랜치에 합치고 충돌 정리(갈래는 같은 워크트리의 다른 파일만 썼으므로 충돌은 공유 파일 요청뿐).
- [ ] **Step 2:** 노트의 공유 파일 요청 반영.
- [ ] **Step 3:** `npm run check:ui` 실행. 대조 실패 부품은 한 번 고쳐 보고, 그래도 남으면 상태 「구현됨」으로 두고 `components.md` 「같은 부품인데 값이 다른 자리」 또는 노트에 남은 차이 기록(화면 작업을 막지 않음). 통과 부품은 「검증됨」.
- [ ] **Step 4:** `node scripts/ui/count-part-usage.mjs` → `components.md` 「쓰는 화면」 갱신.
- [ ] **Step 5:** `npx tsc --noEmit` · `npx vitest run` · `npm run build` · 변경 파일 eslint 통과.
- [ ] **Step 6:** 커밋 `feat(ui): 부품 23개 잠금 — 진열 · 대조 · 목록 갱신`. **이후 공용 부품 추가 금지**(필요하면 멈추고 사용자에게).

---

### Task 6~10 공통 (화면 갈래 — 병렬)

화면 하나마다:
1. 시안 `docs/mockups/scas-redesign/screens/sNN-*.js`의 `ours()` 마크업과 `gap-table.md`의 그 화면 핀을 읽고, spec §5-2 규칙으로 요소마다 담음/뺌을 정한다. 뺀 요소 중 애매한 것은 노트 한 줄.
2. spec §5-1의 그 화면 F 줄이 어느 자리에 들어가는지 정한다(노트에 「F번호 → 자리」).
3. `src/widgets/<이름>/model/types.ts`에 `<Name>ScreenProps` 정의. 공통 필드: `status: ScreenStatus`(필요한 값만), `errorAt?: string`, `onRetry: () => void`, `isAdmin: boolean`, `features: readonly FeatureCode[]`. 저장되는 값은 모두 제어형(spec §6-1 「상태는 어디에」). 엔티티 타입이 있으면 그대로, 레거시 API 응답은 지금 모양 그대로 최소 타입 + 출처 주석(`// 출처: services/api.js imageSearch 응답`).
4. 테스트 먼저 `src/pages/dev/screens/sNN/SNNDevPage.test.tsx`(진열 페이지를 `MemoryRouter`로 `?case=…&as=…` 렌더):
   - `ready 케이스에 <핵심 항목>을 그린다`
   - `loading 케이스는 aria-busy="true"`
   - `error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다`
   - (목록 · 결과 화면) `empty 케이스는 「결과 없음」을 보인다`
   - `readonly 보기에서 <쓰기 버튼>이 없거나 disabled`
   - 화면별 추가 assertion은 아래 각 Task 표
5. 위젯 `ui/<Name>Screen.tsx` 구현(부품은 출입구 4개에서만, 화면 전용 조각은 같은 `ui/` 안). `index.ts` 배럴.
6. 진열 페이지: `DevScreenFrame` + `useDevCase` + `useDevViewer` + `mock-cases.ts`의 값 + `useState`로 제어형 값 보관 + 콜백(다음 화면 `navigate("/dev/sNN?…")` 또는 `toast`). 빈 콜백 금지.
7. 테스트 통과, `npx tsc --noEmit`, 변경 파일 eslint. 커밋 `feat(screens): SNN <화면 이름> 시안`.
8. 좌표 캔버스 자리는 슬롯(`canvasSlot: React.ReactNode`)으로 받고, 진열 페이지는 `FakePhoto` + 고정 장식(`pointer-events-none`)을 넣는다(spec §6-1).
9. `src/App.jsx` · 배럴(`shared/ui/*/index.ts`) · 다른 갈래 폴더는 고치지 않는다.

### Task 6: 갈래 ① 사건 — S01 · S02

**Files:** `src/widgets/case-list/**`, `src/widgets/case-detail/**`, `src/pages/dev/screens/s01/**`, `s02/**`.

| 화면 | 담는 F | 추가 assertion |
|---|---|---|
| S01 `CaseListScreen` | F3 · F4 · F33 | SCAS 검색 폼 라벨 순서가 시안과 같다(첫 3개 「감정번호」 · 「등록일자」 · 「사건장소」), 툴바 순서 「목록보기/문양보기 · 초기화 · 엑셀 · 조회 · 등록」, 행 클릭 시 `onOpenCase(aprthngNo)`, readonly면 「등록」 없음 |
| S02 `CaseDetailScreen` | F5 · F6 | 사건정보 7칸(사건등록번호 필수 표시 포함), 「저장」 클릭 시 `onSave`, 사건번호 비면 「이미지와 사건 번호는 필수 입력 사항입니다.」, 관서는 `Combobox`, 이미지 목록 숫자 순서 |

### Task 7: 갈래 ② 편집 · 문양 — S03 · S04

**Files:** `src/widgets/image-edit/**`, `src/widgets/pattern-code/**`, `src/pages/dev/screens/s03/**`, `s04/**`.

| 화면 | 담는 F | 추가 assertion |
|---|---|---|
| S03 `ImageEditScreen` (A 이미지 커팅 + B 보기용 뷰어, `Segmented`로 전환) | F7~F16 | A 버튼 줄에 「크롭」 · 「각도보정」 · 「길이측정」 · 「배경제거」 · 「접합장애물제거」 · 「이진화」 · 「노이즈제거」 (SCAS 버튼 뒤에 덧붙임), 이진화 모드 5개 「이진(표준)」 · 「이진(반전)」 · 「절단」 · 「제로화」 · 「제로화(반전)」, B 보기 방식 밝기 · 대비 · 감마 · 임계값 · 반전 · 흑백, 노이즈제거 running 케이스에 `AiProgress` |
| S04 `PatternCodeScreen` | F17~F22 | 상/중/하/윤곽 4부위, 팔레트 종류 8개 「무늬」 · 「선」 · 「윤곽」 · 「다각」 · 「삼각」 · 「사각」 · 「원」 · 「항목」, 필수 문양에 「필수」, 우클릭(`contextmenu`) 시 `onToggleEssential`, 추출 결과에 `ConfidenceBar`, 검색 이력 표 열 「ID」 · 「등록일시」 · 「순위」 · 「매칭된 신발 정보」 |

- S04 팔레트 종류 버튼은 **글자만**(아이콘 · 자식 요소 금지 — `docs/pattern-data-model.md` §4). 문양 그림 경로는 `insertPatternPath`가 만든 모양(`/src/assets/Patterns/전체/<이름>.png`)을 가짜 데이터에 그대로 넣는다.

### Task 8: 갈래 ③ 결과 · 대조 · 확인 — S05 · S06 · S07

**Files:** `src/widgets/search-result/**`, `src/widgets/match-compare/**`, `src/widgets/result-confirm/**`, `src/pages/dev/screens/s05/**`, `s06/**`, `s07/**`.

| 화면 | 담는 F | 추가 assertion |
|---|---|---|
| S05 `SearchResultScreen` | F23 · F24 | 카드에 「No. 00758」 · 유사도 %(69.99 → 「70%」) · 「#1」 · 상위 3위 「TOP 1」, 색 등급 80↑ ok · 60↑ warn · 그 아래 danger(`data-grade`), 결과형태 1–4열 `Segmented`, 「이진화보기」/「원본보기」 문자열 리터럴 그대로, `Pagination` |
| S06 `MatchCompareScreen` | F25~F27 | 정렬 미설정 케이스(`?case=no-alignment`)에 「정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요.」 + 「정렬 설정하러 가기」, 정렬 설정 `DialogShell`, Top-10 `PointPairs` 양쪽, 목록 행 호버 시 양쪽 같은 index active, 「RGB」 ↔ 「스케치·이진」 |
| S07 `ResultConfirmScreen` | F28 | 이미지 블록마다 `RadioRow` 「발견」 · 「불발견」, 저장 시 `onSaveJudgement({ ftwrId, result })`, readonly면 라디오 disabled |

- S06 `?case=`는 `ready | loading | error | no-alignment`.

### Task 9: 갈래 ④ 신발 — S10

**Files:** `src/widgets/shoe-db/**`, `src/pages/dev/screens/s10/**`.

| 화면 | 담는 F | 추가 assertion |
|---|---|---|
| S10 `ShoeDbScreen` | F29 · F30 | 검색 폼 3열×4행, 툴바 원문 순서, 목록 `DataGrid`에 `00758` 그대로, 등록/수정 레이어 창 1겹(`DialogShell`) 필드 「모델명」 · 「상표코드」 · 「제조사코드」 · 「수집처」 · 「수집연도」, 중복 번호 케이스(`?case=duplicate`)에 「이미 등록된 번호입니다」, `readonly`(SHOE_VIEW만)면 등록 · 저장 없음 |

### Task 10: 갈래 ⑤ 계정 · 관리 — S00 · S13 · S14

**Files:** `src/widgets/login-screen/**`, `src/widgets/admin-users-screen/**`, `src/widgets/admin-logs-screen/**`, `src/pages/dev/screens/s00/**`, `s13/**`, `s14/**`.

| 화면 | 담는 F | 추가 assertion |
|---|---|---|
| S00 `LoginScreen` (`mode: "login" \| "password-change"`) | F1 · F2 | 아이디 · 비밀번호 칸, 실패 케이스(`?case=failed`)에 서버 문구 그대로 `InlineError`, 잠금 케이스(`?case=locked`) 문구, password-change 모드에 현재 · 새 · 확인 3칸, 시안 AI 시연 · 지난 로그인 없음. **S00은 ScasShell 밖** — `DevScreenFrame bare` |
| S13 `AdminUsersScreen` | F31 | 사용자 표 + 오른쪽 상세, 상태 칩 「사용」 · 「잠금」 · 「중지」, 권한 스위치 12종(가짜 데이터 = 서버 기능 목록 모양 `FeatureInfo[]`), 잠긴 사용자만 「잠금 해제」, 관리자 계정은 스위치 대신 안내 |
| S14 `AdminLogsScreen` | F32 | 필터 막대(사용자 · 결과 · 기능 · 기간), 세션 행 펼침 → 기능 타임라인, 결과 칩 성공/실패, 50개 미만이면 다음 쪽 disabled |

- 비관리자(`investigator`)로 S13 · S14를 열면 「관리자만 볼 수 있습니다」 안내(진열에서만 — 실제 가드는 운영 연결 때).

---

### Task 11: 마감 (오케스트레이터)

**Files:** `src/pages/dev/screens/**`(화면 간 이동 연결만), `tests/ui/responsive.spec.ts`, spec §5-1 표(「옮길 화면」 칸 → 실제 자리로 갱신), 노트 정리.

- [ ] **Step 1:** 화면 간 이동 연결 — S01 행 → S02, S02 「이미지 편집」 → S03, S03 → S04, S04 「신발 검색」 → S05, S05 카드 → S06, S06 「확인」 → S07, S01 메뉴 「신발」 → S10, 관리 메뉴 → S13 · S14. `ScasShell` 메뉴 `href`를 `/dev/sNN`으로.
- [ ] **Step 2:** `tests/ui/responsive.spec.ts`에 `/dev/s01` · `/dev/s05`를 폭 1280 · 1600에서 가로 넘침 0 확인 추가(Review Focus 3). 실패 확인 → 고침 → 통과.
- [ ] **Step 3:** spec §5-1 33줄 「옮길 화면」을 실제 자리(화면 · 영역 이름)로 채움. 빈 줄 0.
- [ ] **Step 4:** 무변경 확인 — `git diff feat/pilot-db-a --stat`이 Global Constraints의 허용 경로 안. hex · 서버 호출 검사: `npm run check:ui:static`, `grep -rnE "backendFetch|@/services/|entities/[a-z-]+/api" src/widgets/{login-screen,case-list,case-detail,image-edit,pattern-code,search-result,match-compare,result-confirm,shoe-db,admin-users-screen,admin-logs-screen} src/pages/dev/screens` 결과 0.
- [ ] **Step 5:** 일괄 교차 검수 1회 — 새 검토 에이전트(가장 강한 모델)에게 spec · 이 계획 · 브랜치 diff를 주고 spec §10 · Review Focus 기준 검수. 지적마다 실제 코드와 대조해 오탐 제거 → 진짜 결함은 재현 테스트 먼저 실패 확인 → 한 번에 수정.
- [ ] **Step 6:** 전체 검증 1회 — `npm run check:ui` · `npx tsc --noEmit` · `npx vitest run` · `npm run build` · 변경 파일 eslint.
- [ ] **Step 7:** 노트를 모아 사용자 보고(뺀 요소 목록 · 대조 남은 차이 · F 자리표). 커밋 `feat(screens): 11개 화면 시안 연결 · 마감 검수`.
- [ ] **Step 8:** 워크트리에서 `npm run dev -- --port 5210 --strictPort`를 백그라운드로 띄우고 사용자에게 `http://localhost:5210/dev` 안내(다른 작업의 5173은 건드리지 않음).
