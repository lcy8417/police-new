# 공용 UI 부품 정본(police-ui-design) 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부품 정본 체계(스킬 · 토큰 · 출입구 4개 · 시안 표식 · 진열 화면 · 자동 대조 · 검사 · 관문)를 세우고, 대표 부품 6개(Button · Chip · Field · Panel · ButtonBar · AiTag)를 시안 S01 · S02와 대조 통과시켜 체계가 끝까지 돈다는 것을 증명한다.

**Architecture:** 생김새 원본은 r3 HTML 시안이다. 시안 요소에 `data-part*` 표식을 붙이고, 개발용 진열 화면 `/dev/parts`에 같은 표식의 React 부품을 같은 조건으로 그린 뒤, Playwright가 두 쪽의 computed style과 요소 스크린샷을 비교한다. 색은 `src/index.css`의 값 토큰 `--t-*`에서만 오고, 부품은 `@/shared/ui/{kit,viewer,ai,panel}` 출입구로만 꺼낸다.

**Tech Stack:** React 19 · TypeScript · Vite 6 · Tailwind 4(`@theme inline`) · shadcn new-york(radix-ui) · class-variance-authority · Vitest · @playwright/test · ESLint 9 flat config · Python 3(훅)

**Spec:** `docs/superpowers/specs/2026-11-13-ui-parts-sot-design.md` (r2 확정) — 실행자는 계획과 설계서를 함께 읽는다.

## Global Constraints

- 생김새 원본 = r3 시안 `docs/mockups/scas-redesign/`. 값은 눈대중이 아니라 computed style로 읽는다(설계서 §8-2-3).
- **이 단계에서 기존 앱 화면의 색 · 모양 변화 0**(설계서 §12-2). 기존 shadcn 변수 이름(`--background` `--card` `--accent` …)의 뜻을 바꾸지 않는다. `--accent`는 `#16233b`(어두운 선택 배경) 그대로.
- `<html class="dark">`와 `.dark` 블록 유지. `--destructive`(oklch)와 `--chart-*`는 이번에 건드리지 않는다.
- 새 코드에 hex · 인라인 색 · 컴포넌트 옆 `.css` 금지. 인라인 `style`은 계산되는 위치값(`left/top/width/height/transform`)만. 조건부 클래스는 `cn()`(`@/shared/lib/utils`).
- 좌표 민감 영역(`features/patterns-extract/ui/PatternCanvas`, `hooks/useCalibration.js`, `components/Canvas.jsx`)은 **수정 금지**(`docs/api-communication.md` §4).
- 시안 표식은 `data-part` · `data-part-variant` · `data-part-state` · `data-part-id`(형식 `S01-03`). **`data-state`는 쓰지 않는다**(shadcn 예약).
- 부품 이름 = PascalCase, 컴포넌트 파일 `PascalCase.tsx`, 훅 · 유틸 `kebab-case.ts`, 폴더 `kebab-case`(`CLAUDE.md`). 주석 · UI 문자열 · 커밋 메시지는 한국어.
- 모든 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. push 하지 않는다. 이 저장소는 「작업 즉시 커밋」 규약.
- 소스 파일 생성 · 수정은 Write/Edit 도구로만(Bash 리다이렉트 금지 — 사용자 전역 규칙).
- 완료 검증 = `npx tsc --noEmit` + `npx vitest run` + `npm run build` + 변경 파일 `npx eslint` + (Task 8 이후) `npm run check:ui`.
- 반응형: 부품은 유동형(`min-w-0`), 폭 기준은 `lg`(1024) · `xl`(1280)만, 1024 미만 범위 밖(설계서 §5-3-1).

## Review Focus

1. **글꼴을 못 받은 환경(오프라인)** — 대조가 엉뚱한 차이 수십 개를 내는 대신 「글꼴 미로딩: IBM Plex Sans KR」 한 줄로 실패해야 한다 → Task 4 Step 2 테스트.
2. **기존 파일에 경고 폭탄** — 출입구 가져오기 검사가 기존 56개 파일(루트 16 + 안쪽 40)을 오류로 만들면 `npm run lint`가 깨진다. 기존 파일은 경고(1), 진열 화면 · 전환 완료 파일만 오류(2) → Task 2 Step 1 테스트.
3. **`/login` 밖 화면의 색 흔들림** — 변수 연결을 바꾼 뒤 로그인 화면 스크린샷만 같아도 다른 화면 색이 바뀔 수 있다. shadcn 변수 전부의 계산값을 전후 비교 → Task 1 Step 1 테스트.
4. **한글 · 공백이 든 경로** — 저장소 경로에 `족적데이터_1802`가 있다. 훅이 경로를 못 읽어 정상 편집을 막거나 통과시키면 안 된다 → Task 9 Step 1 테스트(한글 절대경로 케이스).
5. **hex 모양 글자의 오탐** — `"#face"` 같은 앵커가 새 파일에서 색으로 세어지면 안 된다. 줄 끝 `// hex-ok` 표시는 세지 않는다 → Task 8 Step 1 테스트.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/index.css` (수정) | 값 토큰 `--t-*`, `.dark` 변수 → `var(--t-*)`, 새 역할 `@theme inline`, 글꼴 토큰 |
| `index.html` (수정) | 시안과 같은 Google Fonts 링크(IBM Plex Sans KR · JetBrains Mono) |
| `src/shared/ui/{kit,viewer,ai,panel}/index.ts` | 출입구 4개 |
| `src/shared/ui/kit/Button.tsx` · `Chip.tsx` · `Field.tsx` | kit 대표 부품 |
| `src/shared/ui/panel/Panel.tsx` · `ButtonBar.tsx` | panel 대표 부품 |
| `src/shared/ui/ai/AiTag.tsx` | ai 대표 부품 |
| `src/shared/ui/part-attrs.ts` | `data-part*` 속성 만드는 공용 함수 |
| `src/pages/dev/parts/` | 진열 화면(`PartsGalleryPage.tsx`, `fixtures.ts`, `parts-plan.md`) |
| `docs/mockups/scas-redesign/assets/core.js` · `screens/s01-case-list.js` · `screens/s02-case-detail.js` (수정) | 표식 · `M.photo` `seed` 인자 |
| `docs/mockups/scas-redesign/parts-plan.md` | 시안 부품표 |
| `playwright.ui.config.ts`, `tests/ui/*.spec.ts` | 시안 스냅샷 · 대조 · 반응형 · 토큰 회귀 |
| `scripts/ui/count-hex.mjs` · `hex-baseline.json` · `check-parts-catalog.mjs` · `ui-converted.txt` | 검사 |
| `.claude/hooks/parts_gate.py`, `tests/hooks/test_parts_gate.py`, `.claude/settings.json` (수정) | 관문 |
| `.claude/skills/police-ui-design/**`, `.claude/rules/ui-design.md`, `AGENTS.md` | 정본 · 방아쇠 |
| `CLAUDE.md` · `docs/architecture.md` (수정) | 스킬 가리키기 |
| `eslint.config.js` (수정) | 출입구 · 날것 컨트롤 검사 |
| `src/App.jsx` (수정) | 개발 실행에서만 `/dev/parts` |

---

### Task 1: 토큰 2층 — 값은 그대로

**Files:**
- Modify: `src/index.css`, `index.html`
- Create: `tests/ui/token-regression.spec.ts`, `tests/ui/__baseline__/dark-vars.json`, `playwright.ui.config.ts`, `src/shared/ui/token-map.test.ts`

**Interfaces:**
- Produces: 값 토큰 `--t-bg --t-bg-2 --t-panel --t-panel-2 --t-panel-3 --t-strip --t-select --t-line --t-line-2 --t-line-3 --t-fg --t-fg-2 --t-mute --t-dim --t-faint --t-brand --t-brand-2 --t-brand-3 --t-ai --t-ai-bg --t-danger --t-danger-bg --t-ok --t-ok-bg --t-warn --t-warn-bg --t-violet --t-violet-bg`(값 = 설계서 §5-2 표 · 시안 `mockup.css :root`; `--t-select`=`#16233b`, `--t-faint`=`#4a5568`). Tailwind 새 역할: `canvas panel panel-3 strip line-2 line-3 fg-2 dim faint brand brand-2 brand-3 ai ai-bg danger danger-bg ok ok-bg warn warn-bg violet violet-bg`(`--color-<이름>: var(--t-…)`), 글꼴 `--font-ui` · `--font-mono`(값 = 시안 `--font-ui` · `--font-mono` 문자열 그대로).
- `playwright.ui.config.ts`: `testDir: "./tests/ui"`, 프로젝트 chromium, `use.reducedMotion: "reduce"`, `webServer`(`npm run dev`, `http://localhost:5173`, `reuseExistingServer: false`), `expect.toHaveScreenshot.maxDiffPixels: 0`.

- [ ] **Step 1: 회귀 기준을 먼저 뜬다(변경 전)**

`tests/ui/token-regression.spec.ts`의 `test("shadcn 변수 계산값 불변")`: `/login`을 열고 `.dark`에 정의된 모든 변수(`--background` … `--sidebar-ring`, `src/index.css`에서 정규식으로 이름 수집)의 `getComputedStyle(document.documentElement).getPropertyValue()`를 모아 `tests/ui/__baseline__/dark-vars.json`과 `toEqual`. 기준 파일이 없으면 만들고 통과(`UPDATE_BASELINE=1`일 때만 덮어씀). 같은 파일의 `test("로그인 화면 스크린샷 불변")`: 1440×900에서 `expect(page).toHaveScreenshot("login-1440.png")`.

Run: `UPDATE_BASELINE=1 npx playwright test -c playwright.ui.config.ts token-regression --update-snapshots`
Expected: 2 passed, 기준 파일 2개 생성

- [ ] **Step 2: 대응 표 단위 테스트 작성(실패)**

`src/shared/ui/token-map.test.ts`: `fs`로 `docs/mockups/scas-redesign/assets/mockup.css`와 `src/index.css`를 읽어 — `it("시안 앱용 값은 모두 --t-*로 1:1")`: 시안 `:root`의 `--bg --bg2 --panel --panel2 --panel3 --strip --line --line2 --line3 --fg --fg2 --mute --dim --faint --blue --blue2 --blue3 --blue-bg 제외 --teal --teal-bg --red --red-bg --green --green-bg --amber --amber-bg --violet --violet-bg` 각 값이 설계서 §5-2 이름의 `--t-*` 값과 같다(대응 객체를 테스트 안에 상수로). `it("시안 전용 토큰은 앱에 없다")`: `src/index.css`에 `--k-`·`--s-` 없음. `it("기존 이름 뜻 유지")`: `.dark`에서 `--accent`가 `var(--t-select)`.

Run: `npx vitest run src/shared/ui/token-map.test.ts`
Expected: FAIL(`--t-*` 없음)

- [ ] **Step 3: `src/index.css` 수정**

`:root` 맨 위에 값 토큰 추가 → `.dark`의 shadcn 변수 중 값이 같은 것을 `var(--t-*)`로 바꿈(`--background: var(--t-bg-2)`, `--card`·`--popover: var(--t-panel-2)`, `--primary`·`--ring`·`--sidebar-primary`: `var(--t-brand-3)`, `--secondary`·`--muted`·`--accent`·`--sidebar-accent: var(--t-select)`, `--accent-foreground`·`--sidebar-accent-foreground: var(--t-brand-2)`, `--border: var(--t-line)`, `--input`·`--sidebar: var(--t-strip)`, `--foreground`·`--card-foreground`·`--popover-foreground`·`--secondary-foreground: var(--t-fg)`, `--muted-foreground`·`--sidebar-foreground: var(--t-mute)`). 값이 다른 것(`--sidebar-border #1c2636`, `--primary-foreground #ffffff`, oklch 값)은 그대로. `@theme inline`에 새 역할과 글꼴 토큰 추가. 스크롤바의 `#1e2a3c`·`#2b3a52`는 `var(--t-line)`·그대로(값 다름) — `#2b3a52`는 이 단계에서 유지.
`index.html` `<head>`에 시안 `index.html` 4~6행과 같은 `preconnect` 2개 + 글꼴 `stylesheet` 링크(body 글꼴은 바꾸지 않음).

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/shared/ui/token-map.test.ts && npx playwright test -c playwright.ui.config.ts token-regression`
Expected: 전부 PASS(계산값 · 스크린샷 차이 0)

- [ ] **Step 5: 커밋**

```bash
git add src/index.css index.html playwright.ui.config.ts tests/ui src/shared/ui/token-map.test.ts
git commit -m "feat(ui): 값 토큰 --t-* 와 족적 역할 토큰 — 기존 화면 색 변화 0"
```

---

### Task 2: 출입구 4개 + 가져오기 · 날것 컨트롤 검사

**Files:**
- Create: `src/shared/ui/kit/index.ts`, `src/shared/ui/viewer/index.ts`, `src/shared/ui/ai/index.ts`, `src/shared/ui/panel/index.ts`, `src/shared/ui/part-attrs.ts`, `src/shared/ui/part-attrs.test.ts`, `src/shared/ui/entrances.test.ts`, `scripts/ui/ui-converted.txt`
- Modify: `eslint.config.js`

**Interfaces:**
- Produces: `partAttrs(part: string, opts?: { variant?: string; state?: string; id?: string }): Record<"data-part" | "data-part-variant" | "data-part-state" | "data-part-id", string>` — 값이 없는 키는 결과에서 뺀다.
- `kit/index.ts`(이 단계): 기존 `StatusChip`, `TechCorners`, `DotGrid`, `GlowOrb`, `EdgeGlow`, `LoadingImage`, `ImageLoadingOverlay`, `Tooltip*`, `Dialog*`, `Tabs*`, `Checkbox`, `Label`, `Switch`, `ToggleGroup*`을 다시 내보냄. 루트 `@/shared/ui/index.ts`는 건드리지 않음(기존 사용처 유지, `RetrievalResultsGrid`는 kit에 넣지 않음 — 설계서 §6-2).
- `viewer` · `ai` · `panel` `index.ts`는 빈 출입구(`export {}` + 한 줄 주석: 무엇을 담는지 설계서 §6 기준 문장).
- `scripts/ui/ui-converted.txt`: 전환 완료 파일 목록(한 줄에 경로 하나, `#` 주석). 처음 내용: `src/pages/dev/**`.

- [ ] **Step 1: 테스트 작성(실패)**

`src/shared/ui/part-attrs.test.ts`: `partAttrs("Button", { variant: "pri", id: "S01-03" })` → `{ "data-part": "Button", "data-part-variant": "pri", "data-part-id": "S01-03" }`(state 키 없음).
`src/shared/ui/entrances.test.ts`(ESLint Node API, `new ESLint({ cwd })` + `lintText(code, { filePath })`):
- `it("기존 화면의 루트 출입구 가져오기는 경고")`: `filePath: "src/features/x/ui/A.tsx"`, 코드 `import { Button } from "@/shared/ui"` → 규칙 `no-restricted-imports` severity 1.
- `it("진열 화면은 오류")`: 같은 코드, `filePath: "src/pages/dev/parts/A.tsx"` → severity 2.
- `it("출입구 안쪽 파일 가져오기 금지")`: `import { Button } from "@/shared/ui/kit/Button"`, 진열 화면 경로 → severity 2.
- `it("출입구 가져오기는 통과")`: `import { Button } from "@/shared/ui/kit"` → 해당 규칙 메시지 0.
- `it("전환 완료 파일의 날것 button 금지")`: 진열 화면 경로에 `<button>x</button>` → `no-restricted-syntax` severity 2, 메시지에 `@/shared/ui/kit` 포함.

Run: `npx vitest run src/shared/ui/part-attrs.test.ts src/shared/ui/entrances.test.ts`
Expected: FAIL

- [ ] **Step 2: 구현**

`part-attrs.ts` 작성. `eslint.config.js`에 블록 2개 추가: (a) `files: ['src/{pages,widgets,features,entities}/**/*.{ts,tsx,js,jsx}']` — `no-restricted-imports: ['warn', { patterns: [{ group: ['@/shared/ui', '@/shared/ui/*', '!@/shared/ui/kit', '!@/shared/ui/viewer', '!@/shared/ui/ai', '!@/shared/ui/panel', '@/shared/ui/*/*'], message: '공용 부품은 @/shared/ui/{kit,viewer,ai,panel} 출입구로만 가져옵니다(police-ui-design 스킬)' }] }]`. (b) `files:` = `ui-converted.txt`를 설정 파일 안에서 `fs.readFileSync`로 읽어 만든 glob 배열 — 같은 `no-restricted-imports`를 `'error'`로 + `no-restricted-syntax: ['error', { selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]", message: '날것 컨트롤 대신 @/shared/ui/kit 부품을 씁니다' }]`.

- [ ] **Step 3: 통과 확인 + 기존 린트 유지**

Run: `npx vitest run src/shared/ui/part-attrs.test.ts src/shared/ui/entrances.test.ts && npm run lint`
Expected: 테스트 PASS, `npm run lint` 오류 0(경고는 늘 수 있음)

- [ ] **Step 4: 커밋** — `feat(ui): 부품 출입구 4개와 가져오기·날것 컨트롤 검사`

---

### Task 3: 시안 S01 · S02 부품 표식 — 생김새 변화 0

**Files:**
- Modify: `docs/mockups/scas-redesign/assets/core.js`, `docs/mockups/scas-redesign/screens/s01-case-list.js`, `docs/mockups/scas-redesign/screens/s02-case-detail.js`
- Create: `tests/ui/mockup-snap.spec.ts`, `tests/ui/mockup-open.ts`

**Interfaces:**
- Produces: `openMockup(page: Page, screen: "S00" | … | "S15"): Promise<Locator>` in `tests/ui/mockup-open.ts` — `localStorage["scas-mockup-viewer"]="analyst"`를 먼저 심고 `file://<절대경로>/docs/mockups/scas-redesign/index.html`을 연 뒤 `document.fonts.ready`를 기다리고, 그 화면 절의 `.frame[data-frame="ours"]` Locator를 돌려준다(화면 절 찾는 법은 `core.js`의 `M.render`가 만드는 절 id를 읽어 정함).
- 시안 표식 규칙: 대표 부품 6개(`.btn` → `Button`, `.chip`/`.chip-ref` → `Chip`, `.inp` → `Field`, `.panel` → `Panel`, 패널 머리 오른쪽 버튼 묶음 `.panel-h .r` → `ButtonBar`, `.ai-tag`/`.ai-mark` → `AiTag`)의 **S01 · S02 안 모든 자리**에 `data-part` · `data-part-variant`(시안 클래스 조합 이름, 예 `pri` · `sm-ghost`) 를 붙이고, 변형마다 대표 1곳에 `data-part-id`(`S01-01`부터). 상태가 있는 것(`.locked`·`[disabled]` 등)은 `data-part-state`.
- `M.photo({ …, seed })`: `seed`가 숫자면 잡음 `seed` 속성에 그 값을 쓰고, 없으면 지금처럼 `uid`.

- [ ] **Step 1: 기준 스냅샷(변경 전)**

`tests/ui/mockup-snap.spec.ts`: 16개 화면마다 `test("S01 생김새 불변")` … — `openMockup` 후 `expect(frame).toHaveScreenshot("S01.png")`. 뷰포트 1600×1000.

Run: `npx playwright test -c playwright.ui.config.ts mockup-snap --update-snapshots`
Expected: 16 passed, 스냅샷 16개

- [ ] **Step 2: 표식 붙이기 + `seed` 인자**

`core.js`의 공용 틀 · 그림 함수 중 위 6개 부품을 만드는 자리와 S01 · S02 화면 파일에 속성만 추가한다(클래스 · 인라인 스타일 · 글자는 손대지 않음). 변형 목록과 「같은 부품인데 값이 조금 다른 자리」는 Task 4 추출 결과로 `components.md`에 기록(Task 10).

- [ ] **Step 3: 불변 확인**

Run: `npx playwright test -c playwright.ui.config.ts mockup-snap`
Expected: 16 passed(차이 0 — `core.js`가 모든 화면에 영향을 주므로 16개 전부)

- [ ] **Step 4: 커밋** — `docs(mockup): S01·S02 부품 표식(data-part*)과 M.photo seed 인자 — 생김새 변화 0`

---

### Task 4: 진열 화면 틀 + 스타일 추출 · 자동 대조 도구

**Files:**
- Create: `src/pages/dev/parts/PartsGalleryPage.tsx`, `src/pages/dev/parts/fixtures.ts`, `src/pages/dev/parts/index.ts`, `tests/ui/style-read.ts`, `tests/ui/parts-compare.spec.ts`, `tests/ui/style-read.test-helper.spec.ts`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `openMockup`(Task 3), `partAttrs`(Task 2)
- Produces:
  - `interface PartFixture { id: string; part: string; variant?: string; state?: string; parentWidth: number; render: () => React.ReactNode }` · `export const PART_FIXTURES: PartFixture[]` in `fixtures.ts`. `id`는 시안 `data-part-id`와 같다. 진열 화면은 각 픽스처를 폭 `parentWidth`px 상자 안에 그리고, 부품 루트에 같은 `data-part-id`가 붙는다.
  - `readStyle(locator: Locator): Promise<StyleSnapshot>` in `tests/ui/style-read.ts` — 요소와 **자식 요소 전부(문서 순서)**, `::before` · `::after`의 아래 속성 계산값: `color background-color background-image border-{top,right,bottom,left}-{color,width,style} border-{top-left,top-right,bottom-right,bottom-left}-radius font-family font-size font-weight line-height letter-spacing padding-{top,right,bottom,left} width height box-shadow opacity gap text-transform content`. 숫자 px는 소수 2자리 반올림. `type StyleSnapshot = { tag: string; props: Record<string,string>; pseudo: { before: Record<string,string>; after: Record<string,string> }; children: StyleSnapshot[] }`.
  - `diffStyle(a: StyleSnapshot, b: StyleSnapshot, path?: string): string[]` — 다른 곳마다 `"<경로> <속성>: 시안=<값> 구현=<값>"`. px 차이 0.01 이하는 같음.
  - `/dev/parts` 경로: `import.meta.env.DEV`일 때만 `React.lazy`로 등록, `RequireAuth` 밖(백엔드 불필요). 쿼리 `?id=S01-03`이면 그 픽스처 하나만.

- [ ] **Step 1: 도구 테스트 작성(실패)**

`tests/ui/style-read.test-helper.spec.ts`: `page.setContent()`로 같은 버튼 두 개(하나만 `padding-left` 4.004px 차이 · 하나는 `color` 다름)를 그려 — `diffStyle` 결과가 각각 `[]`, `["… color: 시안=rgb(…) 구현=rgb(…)"]` 1줄.

- [ ] **Step 2: 글꼴 미로딩 실패 테스트(Review Focus 1)**

같은 파일 `test("글꼴이 없으면 한 줄로 실패")`: 글꼴 요청을 `page.route("**/fonts.g*/**", r => r.abort())`로 막고 `openMockup` → `Error("글꼴 미로딩: IBM Plex Sans KR")`를 던진다(`openMockup` 안에서 `document.fonts.check('12px "IBM Plex Sans KR"')`가 거짓이면). `/dev/parts` 쪽도 같은 검사 함수 `assertFonts(page)`를 쓴다.

Run: `npx playwright test -c playwright.ui.config.ts style-read`
Expected: FAIL(함수 없음)

- [ ] **Step 3: 구현**

`style-read.ts`, `assertFonts`(`mockup-open.ts`에 추가), 진열 화면 틀(픽스처 0개여도 열림 — 「진열할 부품 없음」 문구), `App.jsx` 경로.
`tests/ui/parts-compare.spec.ts`: `PART_FIXTURES`의 `id`마다 `test(id)` — 시안 `[data-part-id=id]`와 `/dev/parts?id=id`의 `[data-part-id=id]`를 각각 `readStyle` → `diffStyle` 결과가 `[]`이고, 요소 스크린샷이 같다(시안 요소를 `toHaveScreenshot(\`${id}.png\`)` 기준으로 먼저 뜨고 구현 요소로 비교 — 두 단계는 같은 테스트 안에서 `testInfo.snapshotPath`로 처리). 시안 요소가 0개이거나 2개 이상이면 실패 메시지 `"시안에 data-part-id=<id> 가 1개가 아님"`.

- [ ] **Step 4: 통과 확인**

Run: `npx playwright test -c playwright.ui.config.ts style-read parts-compare && npx tsc --noEmit`
Expected: PASS(대조 테스트는 픽스처가 없어 0개 실행), 타입 오류 0

- [ ] **Step 5: 커밋** — `feat(ui): 부품 진열 화면(/dev/parts, 개발 실행 전용)과 시안 대조 도구`

---

### Task 5: kit — Button · Chip

**Files:**
- Create: `src/shared/ui/kit/Button.tsx`, `src/shared/ui/kit/Button.test.tsx`, `src/shared/ui/kit/Chip.tsx`, `src/shared/ui/kit/Chip.test.tsx`
- Modify: `src/shared/ui/kit/index.ts`, `src/pages/dev/parts/fixtures.ts`

**Interfaces:**
- Consumes: `partAttrs`, `PART_FIXTURES`, 대조 도구(Task 4), 토큰(Task 1)
- Produces:
  - `Button(props: React.ComponentProps<"button"> & { variant?: ButtonVariant; size?: "md" | "sm"; locked?: boolean; asChild?: boolean; partId?: string })` · `type ButtonVariant = "default" | "pri" | "ai" | "ok" | "warn" | "danger" | "ghost"`(시안 `.btn` 클래스 `pri · ai · ok · warn · danger · ghost` · `.sm` · `.locked`에서). `locked`면 `disabled` + `data-part-state="locked"`. 기존 shadcn `button.tsx`와 별개 파일(이름만 같음 — 기존 사용처 무변경).
  - `Chip(props: React.ComponentProps<"span"> & { variant?: string; on?: boolean; partId?: string })` — 변형 이름은 Task 3이 S01 · S02에서 붙인 `data-part-variant` 값 집합 그대로(`Chip.tsx`의 `ChipVariant` 유니온).
  - 두 부품 모두 루트에 `partAttrs(...)`, 값은 Task 4 추출 결과를 Tailwind 역할 토큰 클래스로(hex 금지).

- [ ] **Step 1: 테스트 작성(실패)** — `Button.test.tsx`: `render(<Button variant="pri">조회</Button>)` → `getByRole("button")`의 `data-part="Button"` · `data-part-variant="pri"`; `locked` → `toBeDisabled()` · `data-part-state="locked"`; `asChild`로 `<a href="/x">`를 감싸면 `a`에 `data-part="Button"`. `Chip.test.tsx`: `on` → `data-part-state="on"`, 기본 → 상태 속성 없음.

Run: `npx vitest run src/shared/ui/kit` → Expected: FAIL

- [ ] **Step 2: 값 읽기** — S01 · S02의 `Button` · `Chip` 변형별 대표 `data-part-id`를 `readStyle`로 읽어 출력(일회성 `npx playwright test … --grep read` 또는 `node` 스크립트; 결과는 Task 10 `visual-spec.md` 표로 옮김).

- [ ] **Step 3: 구현** — 위 시그니처대로, `kit/index.ts`에 `Button` · `Chip` · 타입 내보내기. 픽스처: 변형마다 1개(`id` = 시안 대표 `data-part-id`, 글자 · `parentWidth` = 시안과 같게).

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/shared/ui/kit && npx playwright test -c playwright.ui.config.ts parts-compare` → Expected: 전부 PASS(Button · Chip 픽스처 대조 차이 0)

- [ ] **Step 5: 커밋** — `feat(ui/kit): Button·Chip — r3 시안 S01·S02 대조 통과`

---

### Task 6: kit — Field

**Files:**
- Create: `src/shared/ui/kit/Field.tsx`, `src/shared/ui/kit/Field.test.tsx`
- Modify: `src/shared/ui/kit/index.ts`, `src/pages/dev/parts/fixtures.ts`

**Interfaces:**
- Produces: `Field(props: Omit<React.ComponentProps<"input">, "size"> & { variant?: FieldVariant; required?: boolean; readOnly?: boolean; invalid?: boolean; icon?: "search"; partId?: string })` — `FieldVariant`는 S01 · S02의 `.inp` 변형 값 집합. 상태: `readOnly` → `data-part-state="readonly"`, `invalid` → `"invalid"` + `aria-invalid="true"`, `required` → `aria-required="true"`(빨간 `*`는 라벨 쪽 일이라 Field는 그리지 않음).

- [ ] **Step 1: 테스트(실패)** — `render(<Field invalid aria-label="감정번호" />)` → `getByLabelText("감정번호")`의 `aria-invalid="true"` · `data-part-state="invalid"`; `readOnly` → `toHaveAttribute("readonly")`; `icon="search"` → 돋보기 아이콘(`lucide` `Search`, `aria-hidden`)이 있고 입력의 접근성 이름은 그대로.
- [ ] **Step 2: 값 읽기 · 구현 · 픽스처**(Task 5 Step 2~3과 같은 방식)
- [ ] **Step 3: 통과 확인** — `npx vitest run src/shared/ui/kit/Field.test.tsx && npx playwright test -c playwright.ui.config.ts parts-compare` → PASS
- [ ] **Step 4: 커밋** — `feat(ui/kit): Field — 시안 대조 통과`

---

### Task 7: panel — Panel · ButtonBar, ai — AiTag, S01 조립 예시

**Files:**
- Create: `src/shared/ui/panel/Panel.tsx`, `Panel.test.tsx`, `src/shared/ui/panel/ButtonBar.tsx`, `ButtonBar.test.tsx`, `src/shared/ui/ai/AiTag.tsx`, `AiTag.test.tsx`
- Modify: `src/shared/ui/panel/index.ts`, `src/shared/ui/ai/index.ts`, `src/pages/dev/parts/fixtures.ts`, `src/pages/dev/parts/PartsGalleryPage.tsx`

**Interfaces:**
- Produces:
  - `Panel(props: { title: React.ReactNode; label?: string; actions?: React.ReactNode; corners?: boolean; children: React.ReactNode; partId?: string; className?: string })` — 시안 `.panel`(`.tc` = `corners`) · `.panel-h`(`.t` 제목 · `.lbl` 작은 영문 라벨 · `.r` 오른쪽) · `.panel-b`. `actions`는 머리 오른쪽에 놓인다.
  - `ButtonBar(props: { children: React.ReactNode; partId?: string })` — 시안 `.panel-h .r`(`gap` · 정렬). 순서는 받은 그대로(SCAS 순서 고정은 쓰는 쪽 책임 — 주석).
  - `AiTag(props: { variant?: AiTagVariant; children?: React.ReactNode; partId?: string })` — `AiTagVariant`는 S01 · S02의 `.ai-tag` · `.ai-mark` 변형 값 집합. `panel`은 `kit`만, `ai`는 `kit`만 가져온다(설계서 §6 방향).
  - 진열 화면에 「S01 조립 예시」 절: 시안 S01의 검색 조건 패널 한 개를 Panel + ButtonBar + Button + Field + Chip으로 다시 그린 것(`data-part-id` 없음 — 대조 대상 아님, Task 11 반응형 확인용).

- [ ] **Step 1: 테스트(실패)** — `Panel`: `actions={<ButtonBar><Button>조회</Button></ButtonBar>}` → 머리(`[data-part="Panel"] header`) 안에 버튼; 제목이 `heading` 역할(`h2`). `ButtonBar`: 자식 순서 유지(`getAllByRole("button")` 이름 순서 `["이전","다음","닫기"]`). `AiTag`: 기본 글자 「AI」, `data-part="AiTag"`.
- [ ] **Step 2: 값 읽기 · 구현 · 픽스처**(Task 5 방식)
- [ ] **Step 3: 통과 확인** — `npx vitest run src/shared/ui && npx playwright test -c playwright.ui.config.ts parts-compare` → PASS(6개 부품 픽스처 전부 차이 0)
- [ ] **Step 4: 커밋** — `feat(ui): Panel·ButtonBar·AiTag와 S01 조립 예시 — 시안 대조 통과`

---

### Task 8: hex 검사 · 목록 검사 · `check:ui`

**Files:**
- Create: `scripts/ui/count-hex.mjs`, `src/shared/lib/hex-count.ts` + `src/shared/lib/hex-count.test.ts`(vitest가 `src/**`만 읽으므로 순수 함수를 여기 둔다), `scripts/ui/hex-baseline.json`, `scripts/ui/check-parts-catalog.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `countHex(source: string): number` in `src/shared/lib/hex-count.ts` — 정규식 `/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g`, `// hex-ok`로 끝나는 줄은 세지 않음.
  - `count-hex.mjs`: `src/**/*.{ts,tsx,js,jsx,css}`(`src/index.css` 제외)를 세어 — `--write`면 `hex-baseline.json`(`{ "<경로>": 수 }`)을 씀. 기본 실행은 ① `ui-converted.txt`에 맞는 파일은 0 ② 기준에 있는 파일은 기준 이하 ③ 기준에 없는 새 파일은 0 — 어기면 파일 · 수를 출력하고 종료 코드 1.
  - `check-parts-catalog.mjs`: `.claude/skills/police-ui-design/references/components.md`의 표에서 「상태」가 `구현됨`·`검증됨`인 행의 「파일」 경로가 있는지 + 4개 출입구 `index.ts`의 모든 값 export 이름이 표의 「부품」 열에 있는지 + `python3 .claude/hooks/parts_gate.py --check-all` 종료 코드 0. 하나라도 어기면 종료 코드 1.
  - `package.json` 스크립트: `"check:ui": "node scripts/ui/count-hex.mjs && node scripts/ui/check-parts-catalog.mjs && playwright test -c playwright.ui.config.ts"`, `"check:ui:baseline": "node scripts/ui/count-hex.mjs --write"`.

- [ ] **Step 1: 테스트(실패)** — `hex-count.test.ts`: `countHex('a "#1E2A3C" b #fff')` = 2; `countHex('href="#face" // hex-ok')` = 0(Review Focus 5); `countHex("#12345")` = 0(5자리는 색 아님); `countHex("#1e2a3cff")` = 1.
- [ ] **Step 2: 구현 + 기준 뜨기** — Run: `npm run check:ui:baseline` → `hex-baseline.json` 생성(합계가 설계서 §3 실측 1,698 근처인지 확인해 커밋 메시지에 적음).
- [ ] **Step 3: 확인** — Run: `npx vitest run src/shared/lib/hex-count.test.ts && node scripts/ui/count-hex.mjs` → PASS, 종료 코드 0. `check-parts-catalog.mjs`는 Task 9 · 10 뒤에 통과(지금은 `components.md` 없음 → 「components.md 없음」 한 줄로 실패하는지 확인).
- [ ] **Step 4: 커밋** — `chore(ui): hex 파일 단위 검사·부품 목록 검사·check:ui 묶음`

---

### Task 9: 부품표 관문 훅

**Files:**
- Create: `.claude/hooks/parts_gate.py`, `tests/hooks/test_parts_gate.py`, `docs/mockups/scas-redesign/parts-plan.md`, `src/pages/dev/parts/parts-plan.md`
- Modify: `.claude/settings.json`

**Interfaces:**
- Produces: `parts_gate.py`
  - 훅 모드(인자 없음): stdin JSON의 `tool_input.file_path`(없으면 `tool_input.path`)가 대상(`docs/mockups/scas-redesign/screens/*.js`, `docs/mockups/scas-redesign/assets/*.{js,css}`, `src/pages/dev/**`)이면 그 대상 묶음의 부품표(`docs/mockups/scas-redesign/parts-plan.md` 또는 `src/pages/dev/parts/parts-plan.md`)를 검사. 위반이면 stderr에 이유 + 종료 코드 2(쓰기 차단), 아니면 0. 대상이 아니면 즉시 0.
  - `--check-all`: 부품표 두 개를 모두 검사, 위반 시 1.
  - `validate_plan(text: str, catalog_names: set[str]) -> list[str]`(위반 목록): 「부품 불필요 — <사유>」 한 줄이면 통과 / 아니면 `| 자리 | 부품 | 판정 | 메모 |` 표에 행 ≥ 1, 판정 ∈ {그대로, 확장, 새로}, 「그대로」 부품은 `catalog_names`에 있음, 「확장 · 새로」 부품 이름은 `승인: MM/DD 소유자 — <이름>(…), …` 줄에 있어야 함.
  - `catalog_names`는 `components.md` 표의 「부품」 열. 경로는 `pathlib`로 처리하고 저장소 루트는 이 파일 위치(`Path(__file__).resolve().parents[2]`) 기준.
- `.claude/settings.json`: 기존 `enabledPlugins` 유지 + `"hooks": { "PreToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/parts_gate.py\"" }] }] }`.

- [ ] **Step 1: 테스트(실패)** — `tests/hooks/test_parts_gate.py`(`unittest`, `subprocess`로 훅 실행):
  - `test_no_plan_blocks`: 임시 저장소 사본 없이 — `validate_plan("", {"Button"})` 위반 1개 이상.
  - `test_keep_only_passes`: `| S01 검색 버튼 | Button | 그대로 | |` → 위반 0.
  - `test_unapproved_new_blocks`: `| … | StatTile | 새로 | |` 승인 줄 없음 → 위반 1.
  - `test_approved_new_passes`: 위 + `승인: 11/13 소유자 — StatTile(기본)` → 위반 0.
  - `test_korean_absolute_path`(Review Focus 4): stdin `{"tool_input":{"file_path":"/Users/x/Desktop/족적데이터_1802/police-new/src/pages/dev/parts/A.tsx"}}`를 훅에 넣었을 때 대상으로 인식(부품표 없음 → 종료 코드 2), 대상 밖 경로(`…/src/features/a.ts`) → 0.
  Run: `python3 -m unittest tests/hooks/test_parts_gate.py -v` → FAIL
- [ ] **Step 2: 구현 + 부품표 2개 작성** — 시안 부품표: Task 3에서 표식 붙인 6개 부품을 「그대로」 행으로(자리 = S01 · S02). 진열 화면 부품표: 같은 6개 「그대로」.
- [ ] **Step 3: 확인** — Run: `python3 -m unittest tests/hooks/test_parts_gate.py -v && python3 .claude/hooks/parts_gate.py --check-all` → PASS, 종료 코드 0(Task 10에서 `components.md`가 생긴 뒤 다시 실행).
- [ ] **Step 4: 커밋** — `chore(ui): 부품표 관문 훅 등록(PreToolUse)과 시안·진열 화면 부품표`

---

### Task 10: 정본 스킬 · 방아쇠 · 문서 연결

**Files:**
- Create: `.claude/skills/police-ui-design/SKILL.md`, `references/{tokens,components,visual-spec,motion,layout}.md`, `.claude/rules/ui-design.md`, `AGENTS.md`
- Modify: `CLAUDE.md`(「스타일링」 절), `docs/architecture.md`(§1 표 `shared` 행 또는 §6에 한 줄)

**Interfaces:**
- `SKILL.md` 앞머리: `name: police-ui-design`, `description:` 「족적 감정 플랫폼 화면 디자인 정본 — 토큰 · 부품 출입구(kit · viewer · ai · panel) · 부품 목록 · 추가 순서 · 상태 표시 · 하지 말 것. 화면 코드(.tsx · .css)나 시안(docs/mockups/scas-redesign)의 색 · 글꼴 · 간격 · 모서리 · 그림자 · 배치 · 상태 표시를 만들거나 고칠 때 먼저 읽는다.」 본문 = 설계서 §2 우선순위 · §8 순서 · §11 원칙 · 하지 말 것 · 갱신 절차를 **옮겨 적은 정본**(설계서는 이후 기록 문서).
- `components.md` 표 열: `| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |` — 설계서 §7 전체 + 이번 6개는 `파일` 채우고 `상태 = 검증됨`, 나머지 `후보`. 표 아래 「같은 부품인데 값이 다른 자리」 목록(Task 3 · 5~7에서 모은 것, 변형으로 보존 — 설계서 §14-2).
- `tokens.md` = 설계서 §5-2 표(확정본) + 쓰는 규칙. `visual-spec.md` = 6개 부품 상태별 값 표(Task 5~7 읽은 값) + 「입력 · 저장 · 오류」 절(설계서 §11-2, S01 · S02 · S13 `.inp` 상태에서 읽은 값). `motion.md` = 시안 `mockup.css`의 `fx-*` 키프레임 규칙과 움직임 줄이기 규칙. `layout.md` = 설계서 §5-3-1 반응형 표 + 스크롤 잘림 규칙 + §6-1 좌표 민감 영역.
- `.claude/rules/ui-design.md` 앞머리 `paths: ["src/**/*.tsx", "src/**/*.css", "docs/mockups/scas-redesign/**"]`, 본문 = 「먼저 `police-ui-design` 스킬을 연다」 + 참고 파일 5개 이름(내용 복사 금지).
- `AGENTS.md`: 같은 안내 + `npm run check:ui`.
- `CLAUDE.md` 「스타일링」: "다크 forensic 커맨드센터 팔레트(하드코딩 hex이 관례)…" 줄을 "색은 `police-ui-design` 스킬의 토큰만 — 기존 hex는 화면을 옮길 때 바꿈(검사 `npm run check:ui`)"으로 교체, 나머지 줄 유지.

- [ ] **Step 1: 「쓰는 화면」 다시 세기** — `scripts/ui/count-part-usage.mjs`(신설): `components.md` 각 행의 「원본」 클래스 · 그림 함수가 `screens/s00~s15*.js`와 `assets/core.js` 공용 틀에서 쓰이는 화면 번호를 세어 출력(설계서 §8-1 마지막 줄). 출력으로 §7 「쓰는 화면」 열을 확정해 `components.md`에 적는다.
- [ ] **Step 2: 작성**
- [ ] **Step 3: 확인** — Run: `node scripts/ui/check-parts-catalog.mjs` → 종료 코드 0(6개 경로 존재 · 출입구 export 전부 표에 있음 · 관문 통과)
- [ ] **Step 4: 커밋** — `docs(ui): police-ui-design 정본 스킬·방아쇠·AGENTS.md, CLAUDE.md 스타일링 규약 전환`

---

### Task 11: 반응형 확인 + 최종 검증

**Files:**
- Create: `tests/ui/responsive.spec.ts`

**Interfaces:**
- Consumes: 진열 화면 「S01 조립 예시」(Task 7)

- [ ] **Step 1: 테스트 작성** — 폭 1024 · 1280 · 1440 · 1920(높이 900)마다 `/dev/parts`: ① `document.documentElement.scrollWidth <= innerWidth`(가로 넘침 없음) ② 「S01 조립 예시」 안의 모든 `[data-part]`에 대해 같은 부모를 둔 형제끼리 사각형이 겹치지 않음 ③ 각 `[data-part]`의 오른쪽 끝이 부모 오른쪽 끝을 넘지 않음(부모 `overflow-x`가 `auto`·`scroll`이면 예외).
- [ ] **Step 2: 실행** — Run: `npx playwright test -c playwright.ui.config.ts responsive` → 4 passed. 실패하면 부품의 고정 폭 · `min-w-0` 누락을 고친다(시안 1440 대조가 깨지지 않는 범위에서 — 깨지면 멈추고 보고).
- [ ] **Step 3: 전체 검증** — Run: `npx tsc --noEmit && npx vitest run && npm run build && npx eslint src/shared/ui src/pages/dev && npm run check:ui && python3 -m unittest tests/hooks/test_parts_gate.py` → 전부 통과. `npm run build` 결과물에 `/dev/parts` 코드가 없는지 `grep -r "PartsGalleryPage" dist/ || echo 없음` → 「없음」.
- [ ] **Step 4: 커밋** — `test(ui): 진열 화면 반응형 확인(1024·1280·1440·1920)`

---

## 이번 계획에서 하지 않는 것 (설계서 §10 다음 단계)

나머지 후보 부품 구현, 시안 S03~S15 표식, `ScasShell` 껍데기와 앱 틀 전환, `retrieval-results-grid`의 `entities/shoe` 이동, 기존 화면의 hex 전환.
