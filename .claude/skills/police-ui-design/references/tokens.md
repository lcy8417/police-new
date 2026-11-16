# 토큰 — 값과 역할 (확정 대응표)

**결론: 색 값은 `src/index.css` `:root`의 값 토큰 `--t-*`에만 있다(시안 `assets/mockup.css :root`가 원본). 화면 코드는 값이 아니라 역할 이름(Tailwind `bg-panel`, `text-ai` …)을 쓴다. 기존 shadcn 이름(`--background` `--card` `--accent` …)은 이름도 뜻도 그대로 두고 값만 `--t-*`를 가리킨다 — 그래서 토큰을 들이면서 앱 화면 색은 하나도 바뀌지 않았다. 글꼴도 새 이름(`font-ui` · `font-code`)으로만 들여 기존 `font-mono` · 기본 글꼴은 그대로다(아래 「글꼴」).**

## 층 3개

| 층 | 예 | 자리 |
|---|---|---|
| 값 `--t-*` | `--t-panel-2: #0f1826` | `src/index.css` `:root` (hex는 여기에만) |
| shadcn 역할(기존 이름 유지) | `.dark { --card: var(--t-panel-2) }` | `src/index.css` `.dark` |
| 새 역할(Tailwind 이름) | `@theme inline { --color-panel: var(--t-panel) }` → `bg-panel` | `src/index.css` `@theme inline` |

읽는 법: 새 색은 맨 위 층에 값으로 넣고, 아래 층에서 이름을 붙여 쓴다. 화면 코드는 맨 아래(또는 가운데) 층 이름만 쓴다.

- `<html class="dark">`와 `.dark` 블록은 **유지**한다. `.dark`를 지우면 `dark:bg-input/30` 같은 기존 조건부 스타일이 꺼진다. 다크 단일 테마다(라이트 없음).
- **기존 이름을 새 뜻으로 쓰지 않는다.** `--accent`는 어두운 선택 배경(`#16233b`, 고스트 버튼 마우스 올림 · 토글 선택)이다. 밝은 파랑은 `brand`.
- `--destructive`(oklch 값)와 `--chart-*`는 손대지 않았다(바꾸면 화면이 변함). 빨강이 필요하면 `danger`.

## 대응표 — 시안 색 (설계서 §5-2 확정본)

| 값 토큰 | 값 | 시안 이름 | 기존 shadcn 이름(그대로) | 새 역할(Tailwind) |
|---|---|---|---|---|
| `--t-bg` | `#05080d` | `--bg` | — | `bg-canvas` |
| `--t-bg-2` | `#0a0f1a` | `--bg2` | `--background` | `bg-background` |
| `--t-panel` | `#0b121d` | `--panel` | — | `bg-panel` |
| `--t-panel-2` | `#0f1826` | `--panel2` | `--card` · `--popover` | `bg-panel-2` |
| `--t-panel-3` | `#141f30` | `--panel3` | — | `bg-panel-3` |
| `--t-strip` | `#0d1420` | `--strip` | `--sidebar` · `--input` | `bg-strip` |
| `--t-select` | `#16233b` | (앱 전용) | `--secondary` · `--muted` · `--accent` · `--sidebar-accent` | — |
| `--t-line` | `#1e2a3c` | `--line` | `--border` | `border-border` |
| `--t-line-2` | `#141d2c` | `--line2` | — | `border-line-2` |
| `--t-line-3` | `#26334a` | `--line3` | — | `border-line-3` |
| `--t-fg` | `#e5e9f0` | `--fg` | `--foreground` | `text-foreground` |
| `--t-fg-2` | `#c7cedb` | `--fg2` | — | `text-fg-2` |
| `--t-mute` | `#8a93a6` | `--mute` | `--muted-foreground` | `text-muted-foreground` |
| `--t-dim` | `#5b6b85` | `--dim` | — | `text-dim` |
| `--t-faint` | `#4a5568` | `--faint` | — | `text-faint` |
| `--t-brand` | `#4a9eff` | `--blue` | — | `text-brand` |
| `--t-brand-2` | `#3b82f6` | `--blue2` | `--accent-foreground` · `--sidebar-accent-foreground` | `bg-brand-2` |
| `--t-brand-3` | `#2563eb` | `--blue3` | `--primary` · `--ring` · `--sidebar-primary` | `bg-brand-3` |
| `--t-brand-bg` | `#152238` | `--blue-bg` | — | `bg-brand-bg` |
| `--t-ai` | `#2dd4bf` | `--teal` | — | `text-ai` (AI · 신발 원본 역할) |
| `--t-ai-bg` | `#0f2624` | `--teal-bg` | — | `bg-ai-bg` |
| `--t-danger` · `--t-danger-bg` | `#ef4444` · `#1a1013` | `--red` · `--red-bg` | (`--destructive`는 기존 oklch 유지) | `text-danger` · `bg-danger-bg` |
| `--t-ok` · `--t-ok-bg` | `#22c55e` · `#12241a` | `--green` · `--green-bg` | — | `text-ok` · `bg-ok-bg` |
| `--t-warn` · `--t-warn-bg` | `#f59e0b` · `#241b0c` | `--amber` · `--amber-bg` | — | `text-warn` · `bg-warn-bg` |
| `--t-violet` · `--t-violet-bg` | `#a78bfa` · `#1b1630` | `--violet` · `--violet-bg` | — | `text-violet` · `bg-violet-bg` |

읽는 법: 시안에서 `var(--panel2)`를 보면 앱에서는 `bg-panel-2`(또는 기존 이름 `bg-card`)를 쓴다. 「새 역할」의 `bg-` · `text-` · `border-`는 바꿔 붙일 수 있다(`text-brand`도 `bg-brand`도 된다).

- `--t-brand-bg`는 처음 표(설계서 §5-2)에 없었으나 칩 `blue` 배경이 정확히 이 값이라 추가했다(2026-11-13 판정 R3b). 토큰 대응 검사(`src/shared/ui/token-map.test.ts`)에 들어 있다.
- `bg-panel-2` 역할도 처음 표에 없던 것(Task 5에서 추가) — 값은 `--card`와 같다. 새 부품은 `bg-panel-2`, 기존 화면은 `bg-card` 그대로.
- `--k-*`(시안 주석 핀) · `--s-*`(SCAS 와이어프레임)는 **시안 전용**이라 앱 토큰에 넣지 않는다.

## 대응표 — 시안이 hex로 직접 쓴 색 (부품 구현 때 추가)

시안 `mockup.css`가 이름 없이 hex로 쓴 테두리 · 글자 색이다. 부품을 옮기며 값 토큰으로 이름을 붙였다.

| 값 토큰 | 값 | 시안에서 쓰는 자리 | 새 역할(Tailwind) |
|---|---|---|---|
| `--t-brand-line` | `#2b4a78` | `.chip.blue` 테두리 · `.seg` 고름 안쪽 선 | `border-brand-line` |
| `--t-ai-line` | `#1d4a44` | `.btn.ai` · `.chip.teal` · `.ai-tag` 테두리 | `border-ai-line` |
| `--t-ok-line` · `--t-ok-fg` | `#1f4a2f` · `#4ade80` | `.btn.ok` · `.chip.green` 테두리 · 글자 | `border-ok-line` · `text-ok-fg` |
| `--t-warn-line` | `#4d3a12` | `.btn.warn` · `.chip.amber` 테두리, Field `select-warn` 테두리 | `border-warn-line` |
| `--t-danger-line` · `--t-danger-fg` | `#4a1f24` · `#f87171` | `.btn.danger` · `.chip.red` 테두리 · 글자 | `border-danger-line` · `text-danger-fg` |
| `--t-violet-line` | `#3b3266` | `.chip.violet` 테두리 | `border-violet-line` |
| `--t-ai-bg-deep` | `#0b2a26` | S01 표 안 작은 AI 표식 배경(인라인) | `bg-ai-bg-deep` |

## 그림자 · 반투명 값 (역할 없이 `var()`로 씀)

| 값 토큰 | 값 | 쓰는 부품 |
|---|---|---|
| `--t-brand-glow` | `rgba(37, 99, 235, 0.35)` | Button `pri` 빛번짐 `0 0 18px` |
| `--t-panel-edge` | `rgba(255, 255, 255, 0.03)` | Panel 안쪽 윗선 `inset 0 1px 0` |
| `--t-panel-drop` | `rgba(0, 0, 0, 0.35)` | Panel 바깥 그림자 `0 0 40px` |
| `--t-panel-head` | `rgba(13, 20, 32, 0.6)` | Panel 머리 배경(`.panel-h`) |
| `--t-corner-glow` | `rgba(59, 130, 246, 0.6)` | Panel `tc` 모서리 `drop-shadow(0 0 4px)` |
| `--t-ai-tag-drop` | `rgba(0, 0, 0, 0.6)` | AiTag `progress` 그림자 `0 2px 6px` |
| `--t-ai-pulse` | `rgba(45, 212, 191, 0.55)` | AiTag 맥박 점 키프레임 `ai-pulse` |
| `--t-emblem-from` · `--t-emblem-to` · `--t-emblem-stroke` | `#1f3f73` · `#0b1730` · `#7fb6ff` | ScasShell 방패 배지 바탕 그라데이션 · 바깥 선(시안 `.emblem`) |
| `--t-dot-grid` · `--t-glow-orb` | `rgba(74, 158, 255, 0.14)` · `rgba(37, 99, 235, 0.1)` | ScasShell 내용 영역 점 격자 · 번짐 빛(시안 `.content::before/::after`) |

읽는 법: 이 값들은 Tailwind 역할 이름 없이 `[box-shadow:0_0_18px_0_var(--t-brand-glow)]`, `bg-[var(--t-panel-head)]`처럼 쓴다. 여러 부품이 같은 값을 쓰게 되면 역할 이름(예: `--shadow-brand-glow`)으로 올린다.

## 글꼴

| 토큰(`@theme inline`) | 값 | Tailwind | 시안 이름 | 쓰는 자리 |
|---|---|---|---|---|
| `--font-ui` | `"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif` | `font-ui` | `--font-ui` | 기본 글자 |
| `--font-code` | `"JetBrains Mono", "D2Coding", ui-monospace, Menlo, monospace` | `font-code` | `--font-mono` | **감정번호 · 신발 번호 · 점수 · 날짜**, AI 표식. 숫자는 `tabular-nums`(자리 폭 고정)도 같이 |

- **부품 · 새 코드는 `font-code` · `font-ui`를 쓴다. `font-mono` · `font-sans`는 쓰지 않는다.** 이 두 이름은 Tailwind 기본 글꼴(`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, …` · `ui-sans-serif, system-ui, …`)이고 기존 화면(`src/`의 39개 파일, 2026-11-13 셈)이 그대로 쓰고 있다. `@theme`에서 `--font-mono` · `--font-sans` · `--font-serif`를 다시 정의하면 기존 화면 글꼴이 모두 바뀌므로 금지(최종 검토 C1 · 판정 R33).
- 지키는 검사: `src/shared/ui/token-map.test.ts`(`@theme`에 세 이름이 없음, `--font-ui` · `--font-code`가 시안 목록과 글자까지 같음) · `tests/ui/token-regression.spec.ts`(로그인 화면에서 `font-mono` · `font-sans` · 기본 글꼴 계산값이 브랜치 이전 값과 같음).
- 글꼴 파일은 `index.html`의 Google Fonts 링크로 받는다(오프라인이면 목록의 다음 글꼴). 직접 내려받아 두기(self-host)는 아직 안 함 — 사용자 결정 대기.

## 쓰는 규칙

- **새 코드에 hex · 인라인 색 · 컴포넌트 옆 `.css` 파일 금지.** 키프레임 · 토큰은 `src/index.css` 한 곳에만. 조건부 클래스는 `cn()`(`@/shared/lib/utils`).
- **인라인 `style`은 계산되는 위치값만**(`left` · `top` · `width` · `height` · `transform` — 사진 위 좌표처럼 실행 중에 계산되는 값). 색 · 간격은 Tailwind.
- **새 색 · 그림자가 필요하면**: ① 시안에 그 색이 있는지 확인(없으면 시안에 먼저) → ② `:root`에 `--t-이름: 값;`(한국어 주석으로 어디 쓰는지) → ③ `@theme inline`에 `--color-이름: var(--t-이름);` → ④ 이 파일 표에 한 줄 → ⑤ 시안 `:root`에 있는 색이면 `src/shared/ui/token-map.test.ts` 대응에도 추가.
- 기존 shadcn 이름의 값을 바꾸지 않는다(바꾸면 그 이름을 쓰는 기존 화면이 모두 바뀐다).

## 기존 hex 1,675곳의 전환

**결론: 공용 틀은 검증 뒤 한 번에, 틀 안 화면은 그 화면을 옮길 때 바꾼다. 안 옮긴 화면을 고칠 때는 그 화면의 지금 모양을 유지하고 새 규칙을 일부만 섞지 않는다.**

- 검사는 **파일 단위**(`scripts/ui/count-hex.mjs`, `npm run check:ui` 첫 단계). `src/index.css`(토큰 정의)는 뺀다.
  - 「전환 완료 목록」 `scripts/ui/ui-converted.txt`(한 줄에 glob 하나)에 오른 파일 → hex **0**이어야 한다. 지금은 `src/pages/dev/**`.
  - 기준 목록(`scripts/ui/hex-baseline.json`, 2026-11-13 87개 파일 · 1,675곳)에 있는 파일 → 파일마다 기준 수보다 늘면 실패. 지우고 새로 넣는 바꿔치기도 잡힌다.
  - **기준 목록에 없는 파일(새 파일) → hex 0이어야 한다.** 새 파일을 기준 목록에 올려 hex를 허용받지 않는다.
- 기준 다시 쓰기(`npm run check:ui:baseline`)는 화면을 옮겨 hex 수가 **줄었을 때만** 돌린다. 늘어난 수를 기준으로 굳히려고 돌리지 않는다(돌리면 늘어난 hex가 그대로 허용된다).
- 테스트 파일처럼 hex 글자가 꼭 필요한 줄은 줄 끝에 `// hex-ok`를 붙이면 세지 않는다(화면 코드에는 쓰지 않는다).
