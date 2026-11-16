# ai 갈래 노트 (Task 4) — 컨트롤러가 반영할 것

## 1. components.md 행 (상태 `구현됨`)

| 부품 | 파일 | 변형(`data-part-variant`) | 상태(`data-part-state`) |
|---|---|---|---|
| AiProgress | `src/shared/ui/ai/AiProgress.tsx` | `running` · `done` · `failed` | — |
| ConfidenceBar | `src/shared/ui/ai/ConfidenceBar.tsx` | `unit` · `percent`(척도) | `low`(임계 미만) · `ok`(임계 있고 이상) |
| ScanOverlay | `src/shared/ui/ai/ScanOverlay.tsx` | (없음, active=false 면 렌더 안 함) | — |
| LiveDot | `src/shared/ui/ai/LiveDot.tsx` | `busy` · `idle` | — |

공통 내부 파일: `src/shared/ui/ai/fx-bar.ts`(막대 트랙 · 채움 클래스, 0~1 clamp).

## 2. src/index.css 에 추가해 달라는 키프레임 · 토큰

코드는 이미 `motion-safe:animate-fx-*` 를 달아 두었다(키프레임이 없으면 클래스가 만들어지지 않아 멈춘 모양). 아래를 넣으면 켜진다.

```css
/* @theme inline 안 */
--animate-fx-scan: fx-scan 3.2s ease-in-out infinite;
--animate-fx-fill: fx-fill 1.4s ease-out;
--animate-fx-shimmer: fx-shimmer 1.6s linear infinite;

@keyframes fx-scan { 0% { top: 0; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
@keyframes fx-fill { from { width: 0; } }
@keyframes fx-shimmer { 0% { background-position: -120% 0; } 100% { background-position: 220% 0; } }
```

주의: 시안 `.fx-bar.run > i` 는 `fx-fill` 과 `fx-shimmer` 를 동시에 건다(`animation: fx-fill 1.4s ease-out, fx-shimmer 1.6s linear infinite`). 부품은 `animate-fx-fill`(채움 클래스) 과 `animate-fx-shimmer`(running) 를 둘 다 다는데 Tailwind 에서 `animation` 속성이 하나라 뒤 클래스가 앞을 덮는다. 켤 때는 `--animate-fx-run: fx-fill 1.4s ease-out, fx-shimmer 1.6s linear infinite;` 하나를 정의하고 AiProgress 의 running 클래스를 `motion-safe:animate-fx-run` 으로 바꿀 것(요청). 또 shimmer 는 막대 배경이 `linear-gradient(90deg, blue2, teal 40%, #b9fff4 50%, teal 60%, blue2)` + `background-size: 200% 100%` 인데 `#b9fff4` 토큰이 없어 부품은 그라데이션 띠 없이 기본 그라데이션만 쓴다(멈춘 모양과 같음).

토큰 틈(없어서 근사로 대체):
- 스캔선 번짐: 시안 `rgba(45,212,191,.6)` ↔ 앱엔 `--t-ai-pulse`(.55)뿐. ScanOverlay 는 `--t-ai-pulse` 로 근사. 정확히 맞추려면 `--t-ai-scan-glow: rgba(45,212,191,.6)` 추가.
- shimmer 하이라이트 `#b9fff4` 토큰 없음(위).
- 막대 바탕 `--line` 은 `bg-border`(= `--t-line`, dark 에서)로 썼다. 전용 `bg-line` 별칭이 없음.

## 3. 측정 · 시안 값 (visual-spec.md 에 넣을 내용; 대조는 미실행, 시안 CSS 에서 읽은 값)

| 부품 | 값 |
|---|---|
| `.fx-bar` / AiProgress | 높이 4px · 모서리 3px · 바탕 `--line` · overflow hidden · 채움 `linear-gradient(90deg, blue2(brand-2), teal(ai))` · 채움 폭 = 값% |
| `.fx-bar.run` | 같은 막대 + shimmer 그라데이션(motion.md) |
| AiProgress failed (시안에 없음) | 채움 `danger`, 오른쪽에 글자 「실패」(danger-fg 11px 600) |
| ConfidenceBar (S04 `title="AI 확신도"`) | 가로 flex · 간격 4px · 막대 높이 3px · 숫자 mono 9.5px · 평소 `mute` / 임계 미만 `amber(warn)` 채움 + 숫자 · 숫자 형식 unit=`toFixed(2)`, percent=`반올림%` |
| `.fx-scan` / ScanOverlay | 높이 2px · `top:100%` · opacity 0 · 배경 `teal` · 그림자 `0 0 12px 3px rgba(45,212,191,.6)` · absolute inset-x 0 · pointer-events none |
| `.fx-live` / LiveDot | 7px 원 · 배경 teal · 맥박 `ai-pulse`(1.8s). idle 은 `dim` 점 + 맥박 없음(시안에 idle 정의 없음 — 시안 S03 인라인 `st ? col : transparent` 와 별개로 부품 규약) |

시안 크기가 다른 자리(점 5·6px, 막대 높이 3·5px)는 `className` 으로 덮어 쓴다(화면 소유).

## 4. 시안 `data-part-id` 표식 요청 (+ parts-plan.md 행)

fixtures-ai 가 가정한 위치 · id (이미 쓰인 id 와 안 겹침; S01-21/22/23, S04-31 은 현재 없음):

- `S01-21` LiveDot busy — s01-case-list.js 「AI 사전 처리」 머리 `<span class="fx-live">`
- `S01-22` AiProgress running — 같은 카드 `<span class="fx-bar run"><i style="width:62%">`
- `S01-23` AiProgress done — 「결과 확인 전」 `<span class="fx-bar"><i style="width:58%">`
- `S04-31` ConfidenceBar unit/low — s04-pattern-code.js 의 `it.cf` 막대 래퍼(`cf<0.5` 인 행 예시)
- ScanOverlay 는 진열 예시 없음(정지 모양이 안 보이는 선이라 대조 대상 아님). 시안 자리 S11 `<span class="fx-scan">`, 필요하면 `data-part="ScanOverlay"` + id 요청 가능.

## 5. 진열 파일

`src/pages/dev/parts/fixtures-ai.tsx` (`AI_FIXTURE_RENDERS`) · `fixtures-ai-meta.ts` (`AI_PART_FIXTURES`). 컨트롤러가 `FIXTURE_RENDERS` / `PART_FIXTURES` 에 합쳐 연결. `parentWidth`(200·300·300·80) 와 `surface` 는 시안에서 측정하지 않은 추정 값 — 대조 전 확인.

## 6. 부품 · 변형 · 대조 id · 남은 차이

| 부품 | 변형 | 대조 id | 남은 차이 |
|---|---|---|---|
| LiveDot | busy | S01-21 | 맥박 프레임 값은 같은 `ai-pulse`. 루트 안에 sr-only 글자 span 이 있음(시각 영향 없음, 자식 트리 비교 시 차이 가능) |
| AiProgress | running | S01-22 | shimmer · fill 키프레임 미적용(2번). 루트에 progressbar role 속성 추가 |
| AiProgress | done | S01-23 | — |
| ConfidenceBar | unit(low) | S04-31 | 시안은 `<span>` 래퍼(`display:flex; width:80px`) · 부품은 `div`, 폭은 `w-full`(진열 상자 80px 로 맞춤) |
| ScanOverlay | — | (없음) | 스캔 키프레임 미적용 시 보이지 않음 |

## 7. 리뷰 수정 반영(보이는 동작 변경)

- LiveDot: 루트가 `inline-flex` 래퍼(점 + 보이는 label 글자 11px muted, 간격 6px)로 바뀜. idle 점은 속이 빈 고리(`border-dim`, 투명) — busy 는 꽉 찬 ai 점 + 맥박. 옆에 같은 뜻 글자가 이미 있는 화면만 `hideLabel`. 따라서 S01-21 대조(점 7px 단독)는 `hideLabel` + 루트 래퍼 차이를 고려해야 함(진열 예시는 `hideLabel` 필요).
- ConfidenceBar: 낮음일 때 sr-only 「낮음」 + 루트 `title="낮음"`(시안에 보이는 표식 없음). 표시 숫자는 막대와 같은 범위로 자름, NaN 은 「—」(aria-valuenow 없음).
