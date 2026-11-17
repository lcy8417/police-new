# 토큰 — 값과 역할 (확정 대응표)

**결론: 색 값은 `src/index.css` `:root`의 값 토큰 `--t-*`에만 있다(시안 `assets/mockup.css :root`가 원본). 화면 코드는 값이 아니라 역할 이름(Tailwind `bg-panel`, `text-ai` …)을 쓴다. 기존 shadcn 이름(`--background` `--card` `--accent` …)은 이름도 뜻도 그대로 두고 값만 `--t-*`를 가리킨다 — 그래서 토큰을 들이면서 앱 화면 색은 하나도 바뀌지 않았다. 글꼴도 새 이름(`font-ui` · `font-code`)으로만 들여 기존 `font-mono` · 기본 글꼴은 그대로다(아래 「글꼴」).**

## 층 3개

| 층 | 예 | 자리 |
|---|---|---|
| 값 `--t-*` | `--t-panel-2: #0f1826` | `src/index.css` `:root` (hex는 여기에만) |
| shadcn 역할(기존 이름 유지) | `.dark { --card: var(--t-panel-2) }` | `src/index.css` `.dark` |
| 새 역할(Tailwind 이름) | `@theme inline { --color-panel: var(--t-panel) }` → `bg-panel` | `src/index.css` `@theme inline` |

읽는 법: 새 색은 맨 위 층에 값으로 넣고, 아래 층에서 이름을 붙여 쓴다. 화면 코드는 맨 아래(또는 가운데) 층 이름만 쓴다.

- `<html class="dark">`와 `.dark` 블록은 **유지**한다. `.dark`를 지우면 `dark:bg-input/30` 같은 기존 조건부 스타일이 꺼진다. `:root`(= 기존 운영 화면)는 다크 단일이고, 시안 화면만 `data-theme` 범위에서 밝은 팔레트를 쓴다(2026-11-16 사용자 결정 — 아래 「팔레트 · 글꼴 범위」).
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
| `--t-ai-scan-glow` | `rgba(45, 212, 191, 0.6)` | ScanOverlay 스캔선 번짐 `0 0 12px 3px`(시안 `.fx-scan`) |
| `--t-ai-shine` | `#b9fff4` | AiProgress `running` 반짝임 띠(시안 `.fx-bar.run` 그라데이션 가운데) |
| `--t-stat-glow` · `-brand` · `-ai` · `-warn` · `-danger` | `rgba(74, 158, 255, 0.14)` · `0.18` · `rgba(45, 212, 191, 0.2)` · `rgba(245, 158, 11, 0.2)` · `rgba(239, 68, 68, 0.2)` | StatTile 모서리 번짐(시안 `.stat::after` 의 `--glow`) |
| `--t-heat-yellow` | `#facc15` | HeatOverlay `match` 약한 일치 번짐(시안 S06 heatSvg) |
| `--t-picon-bg` (역할 이름 `--color-picon`, `bg-picon`) | `#f3f5f8` | PatternIcon 바탕 밝은 종이색(시안 `.picon`) |
| `--t-paper` (역할 `--color-paper`, `bg-paper` · `text-paper`) | 다크 `#e5e9f0`(= `--t-fg`와 같은 값) · 밝은 팔레트 `#f3f5f8` · `#ffffff` · `#eceef2` | 사진 · 그림 칸 「종이」 바탕(S05 카드 · S07 후보 · S10 …) + 파란 띠 · 빨간 배지 위 글자. 모든 팔레트에서 밝음(r3 polish) |
| `--t-ai-glow` | `rgba(45, 212, 191, 0.12)` | 새 행 첫 칸 번짐 `fx-glow` 끝값(밝은 팔레트는 ai 색 0.1) |
| `--t-emblem-from` · `--t-emblem-to` · `--t-emblem-stroke` | `#1f3f73` · `#0b1730` · `#7fb6ff` | ScasShell 방패 배지 바탕 그라데이션 · 바깥 선(시안 `.emblem`) |
| `--t-dot-grid` · `--t-glow-orb` | `rgba(74, 158, 255, 0.14)` · `rgba(37, 99, 235, 0.1)` | ScasShell 내용 영역 점 격자 · 번짐 빛(시안 `.content::before/::after`) |

읽는 법: 이 값들은 Tailwind 역할 이름 없이 `[box-shadow:0_0_18px_0_var(--t-brand-glow)]`, `bg-[var(--t-panel-head)]`처럼 쓴다. 여러 부품이 같은 값을 쓰게 되면 역할 이름(예: `--shadow-brand-glow`)으로 올린다.

## 글꼴

| 토큰(`@theme inline`) | 값 | Tailwind | 시안 이름 | 쓰는 자리 |
|---|---|---|---|---|
| `--font-ui` → `var(--t-font-ui)` | `:root` 기본값 `"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif` | `font-ui` | `--font-ui` | 기본 글자 |
| `--font-code` → `var(--t-font-code)` | `:root` 기본값 `"JetBrains Mono", "D2Coding", ui-monospace, Menlo, monospace` | `font-code` | `--font-mono` | **감정번호 · 신발 번호 · 점수 · 날짜**, AI 표식. 숫자는 `tabular-nums`(자리 폭 고정)도 같이 |

- r3(2026-11-16): 두 역할은 범위 변수 `--t-font-ui` · `--t-font-code`를 가리킨다. `:root` 값은 시안 목록 그대로라 범위 밖(부품 진열 · 기존 화면)의 계산값은 전과 같다. 시안 화면은 `[data-font]`로 바꾼다(아래 「팔레트 · 글꼴 범위」).

- **부품 · 새 코드는 `font-code` · `font-ui`를 쓴다. `font-mono` · `font-sans`는 쓰지 않는다.** 이 두 이름은 Tailwind 기본 글꼴(`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, …` · `ui-sans-serif, system-ui, …`)이고 기존 화면(`src/`의 39개 파일, 2026-11-13 셈)이 그대로 쓰고 있다. `@theme`에서 `--font-mono` · `--font-sans` · `--font-serif`를 다시 정의하면 기존 화면 글꼴이 모두 바뀌므로 금지(최종 검토 C1 · 판정 R33).
- 지키는 검사: `src/shared/ui/token-map.test.ts`(`@theme`에 세 이름이 없음, `--font-ui` · `--font-code`가 시안 목록과 글자까지 같음) · `tests/ui/token-regression.spec.ts`(로그인 화면에서 `font-mono` · `font-sans` · 기본 글꼴 계산값이 브랜치 이전 값과 같음).
- `:root` 목록의 글꼴 파일(IBM Plex Sans KR 400·500·600·700 · JetBrains Mono 400·600·700)도 저장소에 넣었다(`src/assets/fonts/`, `src/index.css` 「기본 글꼴」 `@font-face`) — 운영 환경이 인터넷 없는 내부망이라 Google Fonts 링크를 지웠다(2026-11-17, `police-server/docs/operations/airgap-audit.md`). Google Fonts 와 같은 판 · 같은 글자 범위(unicode-range)라 글자 모양은 예전과 같다. **외부 주소(글꼴 · CDN)를 다시 넣으면 `check:ui:static` · `npm run build`(postbuild)가 실패한다**(`scripts/ui/check-no-external.mjs`). 시안 화면 범위 글꼴 6종은 저장소에 넣었다(self-host, 2026-11-16 사용자 결정 「여러 개 받아서 선택할 수 있게」) — 아래 「팔레트 · 글꼴 범위」.

### 글자 크기 단계 (R6, 2026-11-17 — 창 모드 화면)

사건 창 탭 · 사건관리 목록 · 신발 DB 패널 · 로그인 · 사용자 관리 · 사용 기록은 아래 단계만 쓴다. 10.5 · 11.5 · 12 같은 사이 값은 가까운 단계로 옮긴다. 단독 진열(`/dev/sNN` 창 모드 아님)은 SCAS 시안 재현이라 시안 값 그대로.

| 단계 | 크기 · 굵기 | 쓰는 자리 |
|---|---|---|
| 제목 | 13 굵게 | 칸 머리(PaneHead) · 판 이름 · 순위 꼬리표 |
| 본문 | 12.5 | 표 줄 · 입력 칸 · 판 안 소제목(굵게) · 안내 한 줄 |
| 보조 | 11 | 흐린 설명 · 개수 · 작은 단추(WorkbenchButton sm) |
| 표식 | 10 | 칸 머리 이름 · 꼬리표 · 도구 타일 위 AI 표 |
| 숫자 | 16 굵게 | 점수 · 유사도(`font-code tabular-nums`) |

- 예외(부품 정본 값 그대로): WorkbenchButton md 12 · kit 목록 판(ListHeadRow 10.5 · ListRow 12, 로망 정본) · AI 대조 칸 대표 신뢰도 하나 28.

## 팔레트 · 글꼴 범위 (시안 r3, 2026-11-16 사용자 결정)

**결론: 시안 화면은 루트(`ScasShell` · S00 진열 틀 = `ThemeScope`)에 `data-theme` · `data-font` · `data-scale` · `data-motion`을 달고, `src/index.css`가 그 범위에서만 값 토큰 `--t-*`와 글꼴 변수를 다시 정의한다. `:root` 값은 그대로다 → 기존 운영 화면 · 부품 진열(`/dev/parts`, 범위 없음 = 다크)은 변화 0(`tests/ui/token-regression.spec.ts` · `tests/ui/theme-scope.spec.ts`). 화면 설정은 「화면 설정」 창(`ThemeSettings`)에서 고르고 이 브라우저에 기억한다(`src/shared/lib/display-prefs.ts`, localStorage `scas-mock.display-prefs.v1`, 실패 · 깨진 값 → 기본값).**

| 팔레트 `data-theme` | 이름표 | 뜻 | 바탕 `--t-bg` · 패널 `--t-panel` · 글자 `--t-fg` · 흐린 글자 `--t-dim` | 강조 `--t-brand` · AI `--t-ai` · 경고 `--t-warn` · 위험 `--t-danger` · 정상 `--t-ok` |
|---|---|---|---|---|
| `scas-light`(기본) | SCAS 밝게 | SCAS 실제 화면 문법 — 옅은 회색 바탕 + 흰 패널 · 얇은 회색 선 · 파란 강조 · 표 머리 옅은 회색. SCAS 남색(`#1f2a5a`)은 방패 배지 바탕만 | `#eef0f4` · `#ffffff` · `#1f2430` · `#5c6371` | `#3550c4` · `#0b6e64` · `#965000` · `#c0282b` · `#1a7342` |
| `light-contrast` | 또렷하게 | 흰 바탕 · 글자 · 선 더 진하게 · 번짐 장식 끔 · 굵은 초점(3px `--t-brand-3`) — 저시력 · 장시간 대조 | `#ffffff` · `#ffffff` · `#0b0d12` · `#3a414d` | `#1f3fae` · `#00564e` · `#7a3f00` · `#a3141a` · `#0d5c30` |
| `light-soft` | 부드럽게 | 옅은 회색 바탕 · 채도 낮은 강조 — 눈부심 적게 | `#e6e8ec` · `#f5f6f8` · `#262b34` · `#535a67` | `#34509e` · `#116258` · `#7f4a08` · `#a8323a` · `#26633f` |
| `dark` | 어둡게 | r3 시안 색 그대로 — 값 토큰은 `:root`와 **같은 블록**(`:root, [data-theme="dark"]`)에서 선언되어, 밝은 범위 안에 겹친 다크 영역(예: 팔레트 미리보기)도 다크 값이 된다 | `#05080d` · `#0b121d` · `#e5e9f0` · `#5b6b85` | `#4a9eff` · `#2dd4bf` · `#f59e0b` · `#ef4444` · `#22c55e` |

읽는 법: 밝은 팔레트의 나머지 토큰(패널 2 · 3, 선, 칩 바탕 · 테두리, 번짐 rgba 등) 값은 `src/index.css` `[data-theme="…"]` 블록 한 곳에만 있다(여기 옮겨 적지 않는다).

- **지키는 검사**: `src/shared/ui/palette-contrast.test.ts` — 밝은 팔레트마다 ① 본문 글자(`fg` · `fg-2` · `mute` · `dim` × 바탕 · 패널 · 띠) AA 4.5:1, `faint` 3:1 ② 상태 칩 · 버튼 글자(칩 짝 `brand/brand-bg` · `ai/ai-bg` · `ok-fg/ok-bg` · `warn/warn-bg` · `danger-fg/danger-bg` · `violet/violet-bg`, 패널 위 상태 글자, 흰 글자/`brand-3`) AA ③ 상태 의미 색(brand · ai · ok · warn · danger · violet)이 다크와 색상각 30° 이내(같은 뜻 = 같은 색 계열) ④ `:root`의 `#rrggbb` 토큰을 모두 다시 정의(다크 값이 새지 않게) ⑤ `dark`는 `:root`와 같은 값 토큰 블록을 함께 쓰고(값 같음), 그 밖의 `dark` 블록은 값 토큰을 다시 정의하지 않음. 새 `--t-*` 는 그 공유 블록에 넣는다.
- **겹침 창(포털)**: `ThemeScope`가 상자 끝에 포털 자리(`[data-theme-portal]`)를 두고 맥락(`useThemePortalContainer`)으로 알린다. `DialogShell`(modal · layer)은 범위 안이면 그 자리로 포털해 팔레트 · 글꼴 · 배율을 받고, 범위 밖이면 전과 같이 body. 앱 전체 알림 `Toaster`(`src/shared/ui/sonner.tsx`)는 범위가 열려 있을 때만(`useActiveThemeScope`) 같은 범위 속성 상자로 감싸고 sonner 테마를 light/dark 로 맞춘다. 새 포털 부품(팝오버 · 툴팁 등)을 시안 화면에 쓰면 같은 맥락을 받아 `container`로 넘긴다.
- **범위 안 shadcn 역할**: `.dark`는 `<html>`에서 이미 계산돼 내려오므로 `[data-theme]` 블록이 `--background` · `--card` · `--border` 등을 다시 가리킨다(dark 에서는 같은 값). 밝은 팔레트는 `--destructive`를 `var(--t-danger)`로, `color-scheme: light`.
- **새 토큰을 `:root`에 더하면** 밝은 팔레트 3블록에도 값을 넣는다(④가 막는다). 새 글자/바탕 짝이면 대비 검사 짝 목록에도 더한다.
- **바탕을 「밝은 종이」로 쓰는 자리는 `bg-paper`**(사진 · 그림 칸, 다크 값은 전과 같음) 또는 `bg-picon`(문양 아이콘). 둘 다 모든 팔레트에서 밝음. `bg-foreground`는 밝은 팔레트에서 진한 남색이 된다(글자색 역할이므로). 진한 바탕(파란 띠 · 빨간 배지) 위 밝은 글자는 `text-paper`.
- **Tooltip**(`shared/ui/tooltip`)은 범위 안이면 포털 자리로 열린다(`useThemePortalContainer`) — 팔레트를 받는다. 지금 11화면 중 Tooltip 을 쓰는 곳은 S03 편집 도구(ThresholdControls); Popover · Select 부품은 저장소에 없고 화면은 네이티브 select · 직접 만든 펼침(ColumnPicker · Combobox)을 쓴다.
- **shadcn Checkbox · Switch**(hex 고정)는 `src/index.css`의 밝은 팔레트 3종 범위 규칙(`[data-slot=checkbox|switch]`)이 토큰으로 덮는다. 다크 · 범위 밖은 그대로.

| 글꼴 `data-font` | 이름표 | 파일(`src/assets/fonts/…`, woff2 보통 400 · 굵게 700) | 받은 곳 · 라이선스 | 크기(보통 + 굵게) |
|---|---|---|---|---|
| `d2coding`(기본) | D2Coding | `d2coding/D2Coding-{Regular,Bold}.woff2` — 원본 TTF 를 글자 빼지 않고 woff2 로만 바꿈 | github.com/naver/d2-coding-font 릴리스 VER1.4.0 · OFL 1.1(예약 이름 D2Coding) | 1.48 + 1.58 MB |
| `pretendard` | Pretendard | `pretendard/Pretendard-{Regular,Bold}.subset.woff2` — 제작자 공식 서브셋(KS X 1001 2,350자) | github.com/orioncactus/pretendard v1.3.9 · OFL 1.1 | 0.27 + 0.27 MB |
| `nanum-gothic` | 나눔고딕 | `nanum-gothic/NanumGothic-{Regular,Bold}.woff2` — 원본 그대로 woff2 | github.com/google/fonts `ofl/nanumgothic`(NAVER 원본) · OFL 1.1 | 0.36 + 0.44 MB |
| `nanum-barun` | 나눔바른고딕 | `nanum-barun-gothic/NanumBarunGothic-{Regular,Bold}.woff2` — 원본 그대로 woff2 | NAVER 공식 웹폰트 hangeul.pstatic.net `webfont/NanumBarunGothic/` · OFL 1.1(NAVER 나눔글꼴 라이선스 전문, 예약 이름에 NanumBarunGothic 포함) | 1.45 + 1.55 MB |
| `ibm-plex` | IBM Plex Sans KR | `ibm-plex-sans-kr/IBMPlexSansKR-{Regular,Bold}.woff2` — 원본 그대로 woff2 | github.com/google/fonts `ofl/ibmplexsanskr` · OFL 1.1(예약 이름 Plex) | 0.56 + 0.54 MB |
| `noto-sans` | Noto Sans KR | `noto-sans-kr/NotoSansKR-{Regular,Bold}.subset.woff2` — 가변 글꼴에서 400 · 700 을 뽑아 KS X 1001 한글 2,350자 + 라틴 · 기호 · 호환 자모로 서브셋(저장소 `src/` 한글은 모두 이 안) | github.com/google/fonts `ofl/notosanskr` · OFL 1.1(예약 이름 Source 뿐) | 0.19 + 0.19 MB |

읽는 법: 각 폴더에 `OFL.txt`(라이선스 전문)가 있다. 합계 약 8.5 MB, 화면은 고른 글꼴 파일만 내려받는다(`font-display: swap`). 인터넷 없이 동작한다.

- **내려받는 양 · 운영 전 할 일**: 한 글꼴을 고르면 보통 + 굵게 두 파일(D2Coding · 나눔바른고딕은 약 3 MB, 나머지 0.4–1.1 MB)을 처음 한 번 받는다. `@font-face`가 `src/index.css`에 있어 운영 빌드 `dist/`에도 12개 파일이 복사된다(쓰지 않으면 받지는 않음). 운영 연결 전에 `@font-face` 묶음을 진열 전용 CSS(개발 실행에서만 가져오는 파일)로 옮기거나, 운영에서 쓸 글꼴만 남긴다.

- **서브셋은 예약 이름(RFN)이 없는 글꼴 · 제작자 공식 서브셋만**: OFL FAQ 2.6–2.8 — 글자를 빼면 「수정본」이라 예약 이름(D2Coding · Nanum · Plex)을 쓸 수 없다. 그래서 예약 이름이 걸린 글꼴은 글자를 빼지 않고 압축 형식(woff2)만 바꿨다(기능 동등). 더 줄이려면 이름을 바꾼 서브셋을 만들어야 한다.
- `@font-face` 이름은 `"Scas D2Coding"`처럼 앞에 `Scas`를 붙였다 — PC에 깔린 같은 이름 글꼴이나 기본 글꼴 `@font-face`(같은 이름 "IBM Plex Sans KR")와 섞이면 `:root` 목록(`"D2Coding"` · `"IBM Plex Sans KR"`)의 계산 결과가 바뀌기 때문.
- 범위 안 `font-code`는 어느 글꼴을 골라도 `"Scas D2Coding"`(고정폭) — 숫자 · 번호 자리 폭이 흔들리지 않게(설계서 §14-3).
- **글자 크기** `data-scale` `md`(보통) · `lg`(크게, `zoom: 1.125`) · `xl`(아주 크게, `zoom: 1.25`): 부품 글자가 px 고정이라 범위 전체 배율로 키운다. 범위가 겹치면 바깥 한 번만(`[data-scale] [data-scale] { zoom: 1 }`). 진열 틀은 화면 높이 상자 + 스크롤(`h-full overflow-auto`).
  - **설계서와 다른 점(판정 R3-5, 2026-11-16)**: 설계서 §14-4는 「루트 글자 배율」이었으나 시안(가짜 데이터)에서는 `zoom`을 유지한다.
  - **위험 — 좌표를 재는 캔버스 · 고정 겹침**: `zoom` 아래에서는 `getBoundingClientRect()`(배율이 곱해진 화면 px)와 `offsetWidth` · 캔버스 비트맵 크기(배율 전 CSS px)가 어긋난다. 문양 추출의 `render_size` · `line_ys`(`docs/api-communication.md` §4), 각도 보정 4점, 사진 위 대응점 · 히트맵처럼 마우스 좌표로 계산하는 자리가 틀린 값을 보낼 수 있고, `position: fixed` 겹침(팝오버 · 끌기 미리보기)도 자리가 밀릴 수 있다. 오래된 Chromium(표준화된 `zoom` 이전, 대략 128 미만)은 `getBoundingClientRect` · 마우스 좌표의 배율 처리가 지금과 달라 같은 코드가 다르게 동작한다.
  - **운영 연결 전 대응(둘 중 하나 이상)**: ① 좌표 캔버스 · 사진 편집 영역은 배율을 받지 않는 자리(범위 밖 포털 또는 그 상자에 `zoom: 1`을 되돌린 뒤 글자만 키움)에 둔다. ② 좌표를 읽을 때 배율로 정규화한다 — `scale = rect.width / el.offsetWidth`로 나눠 CSS px 로 바꾼 뒤 기존 정수화 · clamp 를 그대로 적용. 어느 쪽이든 「아주 크게」에서 문양 추출 · 각도 보정을 실제로 돌려 보는 검사를 붙인다. 장기적으로는 부품 글자를 rem 으로 옮겨 진짜 루트 글자 배율로 바꾸는 것이 설계서 원안.
- **움직임 줄이기** `data-motion="reduce"`: 범위 안 모든 `animation` · `transition` 끔(시안 규칙과 같음, `motion.md`). JS 로 도는 움직임(예: 자동 넘기기)은 `useDisplayPrefs().reducedMotion`을 함께 본다.

## 쓰는 규칙

- **새 코드에 hex · 인라인 색 · 컴포넌트 옆 `.css` 파일 금지.** 키프레임 · 토큰은 `src/index.css` 한 곳에만. 조건부 클래스는 `cn()`(`@/shared/lib/utils`).
- **인라인 `style`은 계산되는 위치값만**(`left` · `top` · `width` · `height` · `transform` — 사진 위 좌표처럼 실행 중에 계산되는 값). 색 · 간격은 Tailwind.
- **새 색 · 그림자가 필요하면**: ① 시안에 그 색이 있는지 확인(없으면 시안에 먼저) → ② 값 토큰 블록(`:root, [data-theme="dark"]`)에 `--t-이름: 값;`(한국어 주석으로 어디 쓰는지) + 밝은 팔레트 3블록에도 값 → ③ `@theme inline`에 `--color-이름: var(--t-이름);` → ④ 이 파일 표에 한 줄 → ⑤ 시안 `:root`에 있는 색이면 `src/shared/ui/token-map.test.ts` 대응에도 추가.
- 기존 shadcn 이름의 값을 바꾸지 않는다(바꾸면 그 이름을 쓰는 기존 화면이 모두 바뀐다).

## 기존 hex 1,675곳의 전환

**결론: 공용 틀은 검증 뒤 한 번에, 틀 안 화면은 그 화면을 옮길 때 바꾼다. 안 옮긴 화면을 고칠 때는 그 화면의 지금 모양을 유지하고 새 규칙을 일부만 섞지 않는다.**

- 검사는 **파일 단위**(`scripts/ui/count-hex.mjs`, `npm run check:ui` 첫 단계). `src/index.css`(토큰 정의)는 뺀다.
  - 「전환 완료 목록」 `scripts/ui/ui-converted.txt`(한 줄에 glob 하나)에 오른 파일 → hex **0**이어야 한다. 지금은 `src/pages/dev/**`.
  - 기준 목록(`scripts/ui/hex-baseline.json`, 2026-11-13 87개 파일 · 1,675곳)에 있는 파일 → 파일마다 기준 수보다 늘면 실패. 지우고 새로 넣는 바꿔치기도 잡힌다.
  - **기준 목록에 없는 파일(새 파일) → hex 0이어야 한다.** 새 파일을 기준 목록에 올려 hex를 허용받지 않는다.
- 기준 다시 쓰기(`npm run check:ui:baseline`)는 화면을 옮겨 hex 수가 **줄었을 때만** 돌린다. 늘어난 수를 기준으로 굳히려고 돌리지 않는다(돌리면 늘어난 hex가 그대로 허용된다).
- 테스트 파일처럼 hex 글자가 꼭 필요한 줄은 줄 끝에 `// hex-ok`를 붙이면 세지 않는다(화면 코드에는 쓰지 않는다).
