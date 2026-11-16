import { resolvePalette } from "../mock-assets/fake-art"
import { svgToUrl } from "../mock-assets/svg-url"

// 시안 S06 sideShoe()(측면 이미지 자리)의 가짜 신발 옆모습. 색은 시안이 쓴 토큰(panel · panel3 · line3 · dim)을
// 지금 테마 값으로 굳혀 데이터 URL 로 만든다(S05 상세조회 칸 · S06 측면 이미지가 함께 쓴다). 개발 진열 전용.
const PALETTE = {
  bg: "var(--t-panel)",
  body: "var(--t-panel-3)",
  line: "var(--t-line-3)",
  sole: "var(--t-dim)",
}

export function fakeSideShoeUrl(): string {
  const c = resolvePalette(PALETTE)
  return svgToUrl(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" preserveAspectRatio="xMidYMid meet">
      <rect width="200" height="90" fill={c.bg} />
      <path
        d="M20 62C20 40 40 30 70 28L95 18C110 12 125 22 130 32C150 36 175 44 182 56L182 68L20 70Z"
        fill={c.body}
        stroke={c.line}
      />
      <path d="M18 70L184 70L182 76L22 78Z" fill={c.sole} />
      <path d="M98 24L120 40M92 30L114 44" stroke={c.line} strokeWidth={2} />
    </svg>,
  )
}
