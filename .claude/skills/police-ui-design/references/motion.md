# 움직임 — AI가 일하는 자리에만, 멈춘 모양이 최종 상태

**결론: 움직이는 효과는 AI가 실제로 일하는 자리(진행 막대 · 사진 훑기 · 처리 중 점 · 방금 들어온 행)에만 쓴다. 움직임 줄이기(운영체제 설정 「동작 줄이기」, CSS `prefers-reduced-motion: reduce`)가 켜져 있으면 모두 멈추고, 멈춘 모양이 곧 최종 상태여야 한다 — 그래서 각 요소의 기본(움직임 없는) 스타일을 「다 끝난 모양」으로 잡고, 움직임은 그 위에 덧붙인다.**

원본: 시안 `docs/mockups/scas-redesign/assets/mockup.css` 끝의 「r3 움직임 · 광택」 절.

## 시안의 키프레임(`fx-*`)

| 키프레임 | 길이 · 반복 | 무엇이 움직이나 | 멈춘 모양(기본 스타일) | 쓰는 클래스 → 부품 |
|---|---|---|---|---|
| `fx-scan` | 3.2s ease-in-out 무한 | 사진 위 가로 선(2px · ai 색 · 번짐 `0 0 12px 3px rgba(45,212,191,.6)`)이 위(`top: 0`)에서 아래(`100%`)로, 처음 8% · 마지막 8%에 나타났다 사라짐 | `top: 100%` · 불투명도 0 = **안 보임** | `.fx-scan` → ScanOverlay(구현됨) |
| `fx-pulse` | 1.8s ease-in-out 무한 | 7px 점의 불투명도 1 ↔ .55, 바깥 고리 그림자 0 → 5px로 퍼지며 사라짐(`rgba(45,212,191,.55)` → 0) | 불투명도 1 · 그림자 없음 = **켜진 점** | `.fx-live` → LiveDot(구현됨), AiTag `progress` 점(구현) |
| `fx-fill` | 1.4s ease-out 1회 | 막대가 폭 0에서 목표 폭까지 참 | **목표 폭** | `.fx-bar > i` → AiProgress(구현됨) |
| `fx-shimmer` | 1.6s linear 무한 | 막대 안 밝은 띠(`#b9fff4`)가 왼쪽에서 오른쪽으로 지나감(배경 위치 -120% → 220%) | 그라데이션 막대 그대로 | `.fx-bar.run > i` → AiProgress `running`(구현됨 · `fx-fill` + `fx-shimmer` 를 한 번에 거는 `animate-fx-run`) |
| `fx-glow` | 2.4s ease-in-out 무한 | 표 첫 칸 왼쪽 3px ai 선 + 바깥 번짐 0 ↔ 22px `rgba(45,212,191,.12)` | 왼쪽 3px ai 선만 | `tr.fx-new td:first-child` → DataGrid 「새 행 강조」(후보) |

읽는 법: 「멈춘 모양」 열이 움직임 줄이기 상태이자 스크린샷 대조 때의 모양이다. 새 효과를 만들 때도 이 열부터 정한다.

- 쓰는 화면: `.fx-scan` S01–S07 · S10 · S11, `.fx-live` S01–S06 · S08 · S10 · S11 · S14 · S15, `.fx-bar` S01 · S02 · S04–S12(반짝임 `.run`은 S01 · S02 · S07 · S10 · S11), `tr.fx-new` S01 · S11.
- S00 로그인의 소개 그림은 화면 안에서 키프레임을 직접 만든다(`anim()` 도우미, 한 바퀴 14초) — 그 화면 고유 연출이라 공용 키프레임이 아니다.

## 움직임 줄이기 규칙

| 자리 | 규칙 |
|---|---|
| 시안 | `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }` — 모든 움직임을 끔 |
| 앱 | 움직임 클래스에 `motion-safe:`를 붙인다(예: `motion-safe:animate-ai-pulse`). 움직임 줄이기면 클래스가 적용되지 않아 기본(멈춘) 모양이 남는다 |
| 검사(Playwright) | 테스트마다 `page.emulateMedia({ reducedMotion: "reduce" })`를 **직접** 부른다. `playwright.ui.config.ts`의 `use.reducedMotion` 설정은 실제로 적용되지 않음이 확인됐다(판정 R9) |

읽는 법: 앱 코드에서 `animate-*`를 `motion-safe:` 없이 쓰면 규칙 위반이다.

## 앱으로 옮기는 법

- 키프레임과 움직임 토큰은 **`src/index.css` 한 곳**에만 둔다(컴포넌트 옆 CSS 금지). `@keyframes 이름 { … }` + `@theme inline { --animate-이름: 이름 길이 곡선 반복; }` → Tailwind `animate-이름`.
- 색은 키프레임 안에서도 토큰으로(`var(--t-ai-pulse)` 등, `tokens.md`).
- 지금 옮긴 것: `ai-pulse`(= 시안 `fx-pulse`, 1.8s ease-in-out 무한) + `--animate-ai-pulse` — AiTag `progress`의 맥박 점이 `motion-safe:animate-ai-pulse`로 쓴다. 부품 잠금(Task 5)에서 `fx-scan`(`animate-fx-scan`, ScanOverlay) · `fx-fill`(`animate-fx-fill`, AiProgress `done` · ConfidenceBar) · `fx-shimmer`와 합친 `animate-fx-run`(= `fx-fill 1.4s ease-out, fx-shimmer 1.6s linear infinite`, AiProgress `running`)을 `src/index.css`에 옮겼다. 시안은 한 요소에 두 애니메이션을 동시에 걸지만 Tailwind는 `animation`이 하나라 합친 이름 `--animate-fx-run`을 따로 정의한다. `fx-glow`(2.4s ease-in-out 무한, `animate-fx-glow`, 색은 `--t-ai` · `--t-ai-glow`)도 옮겼다 — S01 CaseTable 새 행 첫 칸이 쓴다(멈춘 모양 = 왼쪽 3px ai 선만). DataGrid 부품의 「새 행 강조」는 아직 없음. 모두 `motion-safe:`로만 건다.
- 길이 · 곡선 · 반복은 시안 값 그대로. 바꾸려면 시안에서 먼저 바꾸고 승인받는다.
- 움직이는 요소가 사진 위에 겹치면 `pointer-events-none`(사진의 좌표 판정을 막지 않게 — `layout.md`).
