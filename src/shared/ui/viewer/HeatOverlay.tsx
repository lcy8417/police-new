import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 유사 부위 히트 그림(시안 S06 「겹쳐 보기」 heatSvg · S00/S01/S07 sole 의 heat). 그림만 — 부모를 꽉 채우고
// `pointer-events-none` 이라 캔버스 판정을 막지 않는다. 위치 · 크기는 부모(화면)가 정한다(시안 S06 은 left 25% · top 5.33% · 50% × 88%).
// 좌표는 밑창 좌표(viewBox 0 0 100 264)에 늘려 맞춘다(preserveAspectRatio none). 붉을수록 일치 근거가 몰린 곳.
// - match(기본): 상 · 중 큰 붉은 번짐 + 하 약한 노란 번짐 + 소실을 뜻하는 점선 고리(S06)
// - spots: 작은 원 3개(S00 · S01 · S07 작은 밑창 그림, 불투명 .55)
// children 이 있으면 기본 번짐 대신 그것을 그린다(viewBox 는 같음). 움직임 없음.
export type HeatVariant = "match" | "spots"

export interface HeatOverlayProps extends Omit<React.ComponentProps<"svg">, "children"> {
  variant?: HeatVariant
  /** 0~1. 기본: match 1(번짐 자체 불투명도가 들어 있음) · spots 0.55 */
  opacity?: number
  children?: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const STOP = {
  hot: "var(--t-danger)",
  warm: "var(--t-warn)",
  yellow: "var(--t-heat-yellow)",
  ok: "var(--t-ok)",
} as const

export function HeatOverlay({ variant = "match", opacity, children, partId, className, ...props }: HeatOverlayProps) {
  const uid = React.useId().replace(/:/g, "")
  const a = `${uid}a`
  const b = `${uid}b`
  const op = opacity ?? (variant === "spots" ? 0.55 : 1)
  return (
    <svg
      {...partAttrs("HeatOverlay", { variant, id: partId })}
      viewBox="0 0 100 264"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("pointer-events-none block size-full mix-blend-screen", className)}
      opacity={op}
      {...props}
    >
      {children ?? (
        <>
          <defs>
            {variant === "match" ? (
              <>
                <radialGradient id={a}>
                  <stop offset="0" stopColor={STOP.hot} stopOpacity=".9" />
                  <stop offset=".45" stopColor={STOP.warm} stopOpacity=".55" />
                  <stop offset="1" stopColor={STOP.warm} stopOpacity="0" />
                </radialGradient>
                <radialGradient id={b}>
                  <stop offset="0" stopColor={STOP.yellow} stopOpacity=".55" />
                  <stop offset="1" stopColor={STOP.yellow} stopOpacity="0" />
                </radialGradient>
              </>
            ) : (
              <>
                <radialGradient id={a}>
                  <stop offset="0" stopColor={STOP.hot} />
                  <stop offset=".5" stopColor={STOP.warm} stopOpacity=".6" />
                  <stop offset="1" stopColor={STOP.warm} stopOpacity="0" />
                </radialGradient>
                <radialGradient id={b}>
                  <stop offset="0" stopColor={STOP.ok} />
                  <stop offset="1" stopColor={STOP.ok} stopOpacity="0" />
                </radialGradient>
              </>
            )}
          </defs>
          {variant === "match" ? (
            <>
              <ellipse cx="48" cy="52" rx="38" ry="40" fill={`url(#${a})`} />
              <ellipse cx="48" cy="136" rx="34" ry="36" fill={`url(#${a})`} opacity=".8" />
              <ellipse cx="42" cy="214" rx="22" ry="22" fill={`url(#${b})`} />
              <ellipse
                cx="86"
                cy="168"
                rx="14"
                ry="26"
                fill="none"
                strokeWidth="1.6"
                strokeDasharray="3 3"
                className="stroke-danger-fg"
              />
            </>
          ) : (
            <>
              <circle cx="40" cy="60" r="26" fill={`url(#${a})`} />
              <circle cx="62" cy="150" r="22" fill={`url(#${b})`} />
              <circle cx="46" cy="222" r="18" fill={`url(#${a})`} />
            </>
          )}
        </>
      )}
    </svg>
  )
}
