// S00 「AI 감정 시연」 움직임 정의 — 시안 s00-login.js `ours()` 의 anim() 도우미(한 바퀴 14초)를 옮긴 것.
// 시안은 요소마다 CSS 키프레임을 만들지만, 이 앱은 손으로 쓴 CSS · 인라인 색을 쓰지 않으므로
// 같은 키프레임을 Web Animations(element.animate)로 건다. 값은 시안 % 그대로(offset = % / 100).
// 각 요소의 클래스(움직임 없는 모양)는 「다 끝난 상태」라, 움직임 줄이기 · animate 미지원이면 그대로 멈춰 보인다(motion.md).

/** 한 바퀴 길이(시안 CY = 14초) */
export const DEMO_CYCLE_MS = 14_000

type FrameProps = Record<string, string | number>
/** [시안 % 하나 또는 여러 개, 그 지점의 값] */
type Stop = [number | number[], FrameProps]

/** 캐시된 키프레임 묶음(같은 key 는 같은 객체 — ref 콜백이 매 렌더 다시 걸리지 않게) */
export interface DemoFrames {
  key: string
  keyframes: Keyframe[]
}

const cache = new Map<string, DemoFrames>()

function frames(key: string, stops: Stop[], easing = "linear"): DemoFrames {
  const hit = cache.get(key)
  if (hit) return hit
  const keyframes = stops
    .flatMap(([at, props]) => (Array.isArray(at) ? at : [at]).map((o) => ({ ...props, offset: o / 100, easing })))
    .sort((a, b) => a.offset - b.offset)
  const made = { key, keyframes }
  cache.set(key, made)
  return made
}

const SHOWN = { opacity: 1, transform: "none" }

/** 시안 appear(at): at% 까지 숨었다가 아래에서 5px 떠오름, 94% 뒤 사라짐 */
export const appear = (at: number) =>
  frames(
    `appear:${at}`,
    [
      [[0, at], { opacity: 0, transform: "translateY(5px)" }],
      [[at + 2, 94], SHOWN],
      [100, { opacity: 0, transform: "none" }],
    ],
    "ease-out",
  )

/** 시안 grow(at, w, dur): 폭 0 → w% */
export const grow = (at: number, w: number, dur = 6) =>
  frames(
    `grow:${at}:${w}:${dur}`,
    [
      [[0, at], { width: "0%", opacity: 1 }],
      [[at + dur, 94], { width: `${w}%`, opacity: 1 }],
      [100, { width: `${w}%`, opacity: 0 }],
    ],
    "ease-out",
  )

/** 시안 glow(s, e): 카드 청록 테두리가 단계 구간에만 켜짐(겹친 테두리 칸의 불투명도로 옮김) */
export const glow = (s: number, e: number) =>
  frames(`glow:${s}:${e}`, [
    [[0, s], { opacity: 0 }],
    [[s + 1, e], { opacity: 1 }],
    [[e + 1, 100], { opacity: 0 }],
  ])

/** 시안 draw(at): 대응점 선이 그어짐(pathLength=1) */
export const draw = (at: number, dur = 5) =>
  frames(
    `draw:${at}:${dur}`,
    [
      [[0, at], { strokeDashoffset: 1, opacity: 1 }],
      [[at + dur, 94], { strokeDashoffset: 0, opacity: 1 }],
      [100, { strokeDashoffset: 0, opacity: 0 }],
    ],
    "ease-out",
  )

/** 시안 showAfter(at) · hideAfter(at): 순위 글자 바꿔치기 */
export const showAfter = (at: number) =>
  frames(`show:${at}`, [
    [[0, at], { opacity: 0 }],
    [[at + 2, 100], { opacity: 1 }],
  ])
export const hideAfter = (at: number) =>
  frames(`hide:${at}`, [
    [[0, at], { opacity: 1 }],
    [[at + 2, 100], { opacity: 0 }],
  ])

/** 단계 줄 글자색: 흐림 → 진행 중 청록 → 끝남 밝은 회색 → (끝) 흐림 */
export const railLabel = (s: number, e: number) =>
  frames(`rail-label:${s}:${e}`, [
    [[0, s], { color: "var(--t-dim)" }],
    [[s + 0.5, e], { color: "var(--t-ai)" }],
    [[e + 0.5, 95], { color: "var(--t-fg-2)" }],
    [100, { color: "var(--t-dim)" }],
  ])

/** 단계 줄 진행 막대 */
export const railBar = (s: number, e: number) =>
  frames(`rail-bar:${s}:${e}`, [
    [[0, s], { width: "0%" }],
    [[e, 95], { width: "100%" }],
    [100, { width: "0%" }],
  ])

/** 이진화 그림이 위에서 아래로 드러남(스캔 선과 같은 구간) */
export const binaryReveal = frames("bin-reveal", [
  [[0, 8], { clipPath: "inset(0 0 100% 0)", opacity: 1 }],
  [[22, 94], { clipPath: "inset(0 0 0 0)", opacity: 1 }],
  [100, { clipPath: "inset(0 0 0 0)", opacity: 0 }],
])

/** 스캔 선(8~22%) */
export const scanLine = frames("scan-line", [
  [[0, 8], { top: "0%", opacity: 0 }],
  [9, { top: "7.14%", opacity: 1 }],
  [22, { top: "100%", opacity: 1 }],
  [[23, 100], { top: "100%", opacity: 0 }],
])

/** 리랭킹 행 자리 이동(46~52%) — 한 행 높이 44px */
export const rowMove = (from: number, to: number, rowH: number) =>
  frames(
    `row-move:${from}:${to}:${rowH}`,
    [
      [[0, 46], { top: `${from * rowH}px` }],
      [[52, 100], { top: `${to * rowH}px` }],
    ],
    "cubic-bezier(.6,0,.2,1)",
  )

/** 정답 행 청록 강조(50~54% 켜짐) */
export const answerHighlight = frames("answer-hl", [
  [[0, 50], { opacity: 0 }],
  [[54, 94], { opacity: 1 }],
  [100, { opacity: 0 }],
])

/** 「● RERANK」 표식이 리랭킹 순간 빛남 */
export const rerankMark = frames("rerank", [
  [[0, 45], { opacity: 0.35, textShadow: "0 0 0 transparent" }],
  [[47, 53], { opacity: 1, textShadow: "0 0 10px var(--t-ai)" }],
  [[55, 100], { opacity: 1, textShadow: "0 0 0 transparent" }],
])

/** 1위 신발 위 히트맵(62~68% 나타남) */
export const heatShow = frames("heat", [
  [[0, 62], { opacity: 0 }],
  [[68, 94], { opacity: 1 }],
  [100, { opacity: 0 }],
])

/** 신뢰도 반원 게이지(87% = dashoffset 13) */
export const gaugeFill = frames(
  "gauge",
  [
    [[0, 63], { strokeDashoffset: 100, opacity: 1 }],
    [[73, 94], { strokeDashoffset: 13, opacity: 1 }],
    [100, { strokeDashoffset: 13, opacity: 0 }],
  ],
  "ease-out",
)

/** 「초안」 도장(89~91% 찍힘) */
export const stampDrop = frames(
  "stamp",
  [
    [[0, 89], { opacity: 0, transform: "rotate(-8deg) scale(1.6)" }],
    [[91, 94], { opacity: 1, transform: "rotate(-8deg) scale(1)" }],
    [100, { opacity: 0, transform: "rotate(-8deg) scale(1)" }],
  ],
  "ease-out",
)

/** 「자동 재생」 빨간 점 깜빡임 */
export const liveBlink = frames("live-blink", [
  [[0, 100], { opacity: 1 }],
  [50, { opacity: 0.25 }],
])

const VAR_RE = /var\((--[\w-]+)\)/g

/** 키프레임 값 속 `var(--t-…)` 를 지금 테마의 실제 값으로 바꾼다(애니메이션 엔진이 변수를 못 읽는 브라우저 대비). */
export function resolveTokens(keyframes: Keyframe[], root: Element = document.documentElement): Keyframe[] {
  const style = getComputedStyle(root)
  return keyframes.map((k) => {
    const out: Keyframe = {}
    for (const [prop, value] of Object.entries(k)) {
      out[prop] = typeof value === "string" ? value.replace(VAR_RE, (_, name: string) => style.getPropertyValue(name).trim() || "currentColor") : value
    }
    return out
  })
}
