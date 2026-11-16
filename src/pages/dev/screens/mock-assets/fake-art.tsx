

// 가짜 사진 · 밑창 그림이 같이 쓰는 조각(시안 core.js 의 SOLE · TEX 이식). 개발 진열 전용.
// 색은 hex 없이 토큰 변수(`var(--t-…)`)를 속성에 둔다. 데이터 URL 로 뽑을 때는 resolvePalette 가 실제 값으로 바꾼다
// (<img> 안의 SVG 는 페이지 CSS 변수를 못 읽기 때문).

export type Zone = "herring" | "grid" | "wave" | "dots" | "blocks" | "tri" | "lines"
export type ZoneTriple = [Zone, Zone, Zone]

// 밑창 윤곽(시안 SOLE, viewBox 100×264)
export const SOLE_PATH =
  "M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z"

export const ZONE_BANDS: [number, number][] = [
  [0, 92],
  [92, 176],
  [176, 264],
]

export function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "")
}

/** 무늬 한 종류의 `<pattern>` — 시안 TEX 와 같은 모양 */
export function Texture({ id, kind, color }: { id: string; kind: Zone; color: string }) {
  switch (kind) {
    case "herring":
      return (
        <pattern id={id} width="12" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 7L6 2L12 7" fill="none" stroke={color} strokeWidth="2.4" />
        </pattern>
      )
    case "wave":
      return (
        <pattern id={id} width="16" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4Q4 0 8 4T16 4" fill="none" stroke={color} strokeWidth="2.2" />
        </pattern>
      )
    case "dots":
      return (
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2.2" fill={color} />
        </pattern>
      )
    case "blocks":
      return (
        <pattern id={id} width="18" height="13" patternUnits="userSpaceOnUse">
          <rect x="1.5" y="1.5" width="15" height="9.5" rx="2" fill={color} />
        </pattern>
      )
    case "tri":
      return (
        <pattern id={id} width="12" height="11" patternUnits="userSpaceOnUse">
          <path d="M6 1L11 10H1Z" fill={color} />
        </pattern>
      )
    case "lines":
      return (
        <pattern id={id} width="8" height="6" patternUnits="userSpaceOnUse">
          <rect y="1" width="8" height="2.6" fill={color} />
        </pattern>
      )
    case "grid":
    default:
      return (
        <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect x="1.2" y="1.2" width="6.6" height="6.6" rx="1" fill={color} />
        </pattern>
      )
  }
}

/** 상 · 중 · 하 띠(무늬로 채운 사각 3개) */
export function ZoneRects({ prefix }: { prefix: string }) {
  return (
    <>
      {ZONE_BANDS.map(([y0, y1], i) => (
        <rect key={i} x="0" y={y0} width="100" height={y1 - y0} fill={`url(#${prefix}${i})`} />
      ))}
    </>
  )
}

/** 색 이름 → CSS 값. 기본은 토큰 변수, 데이터 URL 은 resolvePalette 로 실제 값. */
export type Palette = Record<string, string>

/** 변수 참조를 실제 값으로 바꾼다. 읽지 못하면(테스트 · 서버) 회색 계열 이름으로 대신한다. */
export function resolvePalette(palette: Palette): Palette {
  const style = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null
  const out: Palette = {}
  for (const [k, v] of Object.entries(palette)) {
    const m = /^var\((--[\w-]+)\)$/.exec(v)
    if (!m) {
      out[k] = v
      continue
    }
    const real = style?.getPropertyValue(m[1]).trim()
    out[k] = real || "gray"
  }
  return out
}
