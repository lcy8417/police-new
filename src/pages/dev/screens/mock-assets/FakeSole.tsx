import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { resolvePalette, sanitizeId, SOLE_PATH, Texture, ZoneRects, type Palette, type ZoneTriple } from "./fake-art"
import { svgToUrl } from "./svg-url"

// 시안 core.js `M.sole`(72줄)의 SVG 컴포넌트판 — 가짜 밑창 그림. 개발 진열 전용(실제 신발 사진 금지).
// kind: shoe(등록 신발 밑창) · scene(먼지 · 잡음 · 일부 소실 현장 족적) · bin(이진화)
export type FakeSoleKind = "shoe" | "scene" | "bin"

export const SOLE_PALETTE: Record<FakeSoleKind, Palette> = {
  // 시안의 짙은 회청 · 중간 회색 · 밝은 회색 · 윤곽 회색에 가장 가까운 토큰
  shoe: { ink: "var(--t-line-3)", base: "var(--t-mute)", ground: "var(--t-fg)", edge: "var(--t-dim)" },
  scene: { ink: "var(--t-warn)", base: "transparent", ground: "var(--t-panel)", edge: "var(--t-dim)" },
  bin: { ink: "var(--t-bg)", base: "white", ground: "white", edge: "var(--t-bg)" },
}
const RULER: Palette = { paper: "var(--t-fg)", tick: "var(--t-bg)" }

export interface FakeSoleProps extends Omit<React.ComponentProps<"svg">, "children"> {
  kind?: FakeSoleKind
  /** 상 · 중 · 하 무늬 */
  zones?: ZoneTriple
  /** 오른쪽 눈금 자 */
  ruler?: boolean
  /** 좌우반전 */
  flip?: boolean
  /** 현장 족적의 일부 소실 */
  cut?: boolean
  /** 잡음 시드(scene) */
  seed?: number
  /** 색을 실제 값으로 바꿔 넘길 때(데이터 URL용) */
  palette?: Palette
}

export function FakeSole({
  kind = "shoe",
  zones = ["herring", "grid", "blocks"],
  ruler = false,
  flip = false,
  cut = false,
  seed = 1,
  palette,
  className,
  ...props
}: FakeSoleProps) {
  const id = sanitizeId(React.useId())
  const c = palette ?? SOLE_PALETTE[kind]
  const rc = palette ?? RULER
  const scene = kind === "scene"
  const vbw = ruler ? 114 : 100
  return (
    <svg
      data-part="FakeSole"
      data-part-variant={kind}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbw} 264`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={scene ? "현장 족적(가짜 예시)" : "밑창(가짜 예시)"}
      className={cn("block size-full", className)}
      {...props}
    >
      <defs>
        {zones.map((z, i) => (
          <Texture key={i} id={`${id}p${i}`} kind={z} color={c.ink} />
        ))}
        {scene ? (
          <>
            <filter id={`${id}n`}>
              <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed={seed} />
              <feColorMatrix values="0 0 0 0 .85  0 0 0 0 .76  0 0 0 0 .48  0 0 0 1.1 -.55" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <mask id={`${id}m`}>
              <rect width="100" height="264" fill="white" />
              {cut ? <path d="M100 120C70 140 64 190 100 210Z" fill="black" /> : null}
              <rect width="100" height="264" fill="black" opacity=".15" />
            </mask>
          </>
        ) : null}
        <clipPath id={`${id}c`}>
          <path d={SOLE_PATH} />
        </clipPath>
      </defs>
      <rect x="-20" y="-20" width="160" height="310" fill={c.ground} />
      <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined} mask={scene ? `url(#${id}m)` : undefined}>
        <g clipPath={`url(#${id}c)`} filter={scene ? `url(#${id}n)` : undefined}>
          <rect width="100" height="264" fill={c.base} />
          <ZoneRects prefix={`${id}p`} />
        </g>
        {scene ? null : <path d={SOLE_PATH} fill="none" stroke={c.edge} strokeWidth="1.6" />}
      </g>
      {ruler ? (
        <g transform="translate(100 0)">
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x="2" y={6 + i * 20} width="8" height="10" fill={i % 2 ? rc.tick : rc.paper} />
          ))}
          <rect x="2" y="6" width="8" height="250" fill="none" stroke={rc.paper} strokeWidth=".6" />
        </g>
      ) : null}
    </svg>
  )
}

/** `<img src>` 에 쓸 데이터 URL. 색은 지금 테마의 토큰 값으로 굳힌다. */
export function fakeSoleUrl(opts: Omit<FakeSoleProps, "palette" | "className"> = {}): string {
  const kind = opts.kind ?? "shoe"
  const palette = { ...resolvePalette(SOLE_PALETTE[kind]), ...resolvePalette(RULER) }
  return svgToUrl(<FakeSole {...opts} palette={palette} />)
}
