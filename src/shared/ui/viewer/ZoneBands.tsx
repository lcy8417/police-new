import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 사진 위에 얹는 상 · 중 · 하 띠(S04 · S05 · S06). 클릭을 막지 않는 겹 장식이라 루트가 `pointer-events-none` 이다.
// 부모가 `relative` 이고 크기를 가진 상자여야 한다. 띠 위치는 부모 높이 대비 비율(0~1)이며 확신도는 표시하지 않는다.
export interface ZoneBand {
  key: "top" | "mid" | "bottom"
  label: string
  /** 시작 비율 0~1 */
  from: number
  /** 끝 비율 0~1 */
  to: number
}

const TONE: Record<ZoneBand["key"], string> = {
  top: "border-brand-line bg-brand-bg/40 text-brand",
  mid: "border-ai-line bg-ai-bg/40 text-ai",
  bottom: "border-violet-line bg-violet-bg/40 text-violet",
}

export interface ZoneBandsProps extends Omit<React.ComponentProps<"div">, "children"> {
  zones: ZoneBand[]
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const pct = (r: number) => Math.round(r * 10000) / 100

export function ZoneBands({ zones, partId, className, ...props }: ZoneBandsProps) {
  return (
    <div
      {...partAttrs("ZoneBands", { id: partId })}
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    >
      {zones.map((z) => (
        <div
          key={z.key}
          data-zone={z.key}
          // 좌표 파생 위치값(비율)만 인라인 style
          style={{ top: `${pct(z.from)}%`, height: `${pct(z.to - z.from)}%` }}
          className={cn("absolute inset-x-0 border-y border-dashed", TONE[z.key])}
        >
          <span className="absolute top-[2px] left-[4px] rounded-[3px] bg-canvas/70 px-[4px] text-[10px] font-semibold">
            {z.label}
          </span>
        </div>
      ))}
    </div>
  )
}
