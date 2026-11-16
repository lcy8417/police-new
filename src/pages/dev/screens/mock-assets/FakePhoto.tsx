import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { resolvePalette, sanitizeId, SOLE_PATH, Texture, ZoneRects, type Palette, type ZoneTriple } from "./fake-art"
import { svgToUrl } from "./svg-url"

// 시안 core.js `M.photo`(115줄)의 SVG 컴포넌트판 — 현장 족적 「사진」(바닥 질감 + 먼지 족적 + L자 자 + 증거 번호표).
// 개발 진열 전용(실제 사건 사진 금지). viewBox 200×300, 일부가 잘리는 틀(`slice`) — 캔버스 화면에는 쓰지 않는다.
export type FakePhotoLook = "raw" | "binary" | "invert" | "contrast"

// 시안 색에 가장 가까운 토큰. 바닥 갈색은 토큰이 없어 faint(회청색)로 대신한다.
export const PHOTO_PALETTE: Record<"raw" | "bin", Palette> = {
  raw: { ink: "var(--t-fg-2)", ground: "var(--t-faint)", paper: "var(--t-fg)", tick: "var(--t-bg)", tag: "var(--t-warn)", shade: "var(--t-bg)" },
  bin: { ink: "var(--t-bg)", ground: "white", paper: "white", tick: "var(--t-bg)", tag: "var(--t-warn)", shade: "var(--t-bg)" },
}

const FILTER: Record<FakePhotoLook, string | undefined> = {
  raw: undefined,
  binary: undefined,
  invert: "invert(1)",
  contrast: "grayscale(1) contrast(1.55) brightness(1.08)",
}

export interface FakePhotoProps extends Omit<React.ComponentProps<"svg">, "children"> {
  look?: FakePhotoLook
  /** 사진 속 족적 기울기(도) */
  rotate?: number
  flip?: boolean
  zones?: ZoneTriple
  /** 번호표 글자(빈 문자열이면 없음) */
  tag?: string
  /** L자 자 */
  ruler?: boolean
  /** 잡음 시드(같은 값이면 같은 질감) */
  seed?: number
  /** 색을 실제 값으로 바꿔 넘길 때(데이터 URL용) */
  palette?: Palette
}

export function FakePhoto({
  look = "raw",
  rotate = -4,
  flip = false,
  zones = ["dots", "herring", "grid"],
  tag = "2",
  ruler = true,
  seed = 1,
  palette,
  className,
  style,
  ...props
}: FakePhotoProps) {
  const id = sanitizeId(React.useId())
  const bin = look === "binary"
  const c = palette ?? PHOTO_PALETTE[bin ? "bin" : "raw"]
  const filter = FILTER[look]
  const ticksV = Array.from({ length: 27 }, (_, i) => i)
  const ticksH = Array.from({ length: 14 }, (_, i) => i)
  return (
    <svg
      data-part="FakePhoto"
      data-part-variant={look}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="현장 족적 사진(가짜 예시)"
      className={cn("block size-full", className)}
      style={filter ? { ...style, filter } : style}
      {...props}
    >
      <defs>
        {zones.map((z, i) => (
          <Texture key={i} id={`${id}t${i}`} kind={z} color={c.ink} />
        ))}
        <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed={seed} />
          <feColorMatrix values="0 0 0 0 .62  0 0 0 0 .57  0 0 0 0 .5  0 0 0 .55 -.08" />
        </filter>
        <radialGradient id={`${id}v`} cx="50%" cy="48%" r="70%">
          <stop offset=".55" stopColor={c.shade} stopOpacity="0" />
          <stop offset="1" stopColor={c.shade} stopOpacity=".6" />
        </radialGradient>
        <filter id={`${id}q`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed={seed + 7} />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -.75" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`${id}c`}>
          <path d={SOLE_PATH} />
        </clipPath>
        <mask id={`${id}m`}>
          <rect x="-30" y="-10" width="160" height="290" fill="white" />
          <ellipse cx="96" cy="170" rx="22" ry="40" fill="black" />
          <ellipse cx="10" cy="40" rx="14" ry="18" fill="black" opacity=".6" />
        </mask>
      </defs>
      {bin ? (
        <rect x="-60" y="-60" width="320" height="420" fill={c.ground} />
      ) : (
        <>
          <rect x="-60" y="-60" width="320" height="420" fill={c.ground} />
          <rect x="-60" y="-60" width="320" height="420" filter={`url(#${id}g)`} />
          <rect x="-60" y="-60" width="320" height="420" fill={`url(#${id}v)`} />
        </>
      )}
      <g transform={`translate(100 150) rotate(${rotate}) ${flip ? "scale(-1 1)" : ""} translate(-50 -134)`}>
        {ruler ? (
          <g>
            <rect x="-24" y="-4" width="12" height="282" fill={c.paper} stroke={c.tick} strokeWidth=".4" />
            <rect x="-24" y="268" width="140" height="12" fill={c.paper} stroke={c.tick} strokeWidth=".4" />
            {ticksV.map((i) => (
              <line key={`v${i}`} x1="-12" y1={i * 10} x2={i % 5 ? -15 : -19} y2={i * 10} stroke={c.tick} strokeWidth={i % 5 ? 0.6 : 1} />
            ))}
            {bin
              ? null
              : Array.from({ length: 6 }, (_, i) => (
                  <text key={i} x="-21" y={i * 50 + 3} fontSize="5" textAnchor="end" fill={c.tick} className="font-code">
                    {i * 5}
                  </text>
                ))}
            {ticksH.map((i) => (
              <line key={`h${i}`} x1={-12 + i * 10} y1="270" x2={-12 + i * 10} y2={i % 5 ? 273 : 277} stroke={c.tick} strokeWidth={i % 5 ? 0.6 : 1} />
            ))}
            {bin ? null : (
              <text x="100" y="279" fontSize="4.6" textAnchor="end" fill={c.tick} className="font-code">
                cm
              </text>
            )}
          </g>
        ) : null}
        <g mask={`url(#${id}m)`}>
          <g clipPath={`url(#${id}c)`} filter={bin ? undefined : `url(#${id}q)`} opacity={bin ? 1 : 0.92}>
            <ZoneRects prefix={`${id}t`} />
          </g>
        </g>
      </g>
      {tag && !bin ? (
        <g transform="translate(160 22) rotate(6)">
          <path d="M-12 10L0 -10L12 10Z" fill={c.tag} stroke={c.tick} strokeWidth=".8" />
          <text y="7" fontSize="10" fontWeight="700" textAnchor="middle" fill={c.tick}>
            {tag}
          </text>
        </g>
      ) : null}
    </svg>
  )
}

/** `<img src>` 에 쓸 데이터 URL. 색은 지금 테마의 토큰 값으로 굳힌다. */
export function fakePhotoUrl(opts: Omit<FakePhotoProps, "palette" | "className" | "style"> = {}): string {
  const palette = resolvePalette(PHOTO_PALETTE[opts.look === "binary" ? "bin" : "raw"])
  return svgToUrl(<FakePhoto {...opts} palette={palette} />)
}
