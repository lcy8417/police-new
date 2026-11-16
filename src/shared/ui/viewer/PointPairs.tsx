import * as React from "react"

import type { MatchBox } from "@/entities/match"
import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 대응점 박스와 번호를 그리는 겹 그림(S00 · S06 · S08). 그림만 — 대응점 편집은 화면에서 한다.
// 부모(`relative`)의 그림 위에 얹으며, `width` · `height` 는 박스 좌표가 속한 이미지 좌표계 크기(viewBox)다.
// 루트는 `pointer-events-none` 이고 박스만 눌린다. 표시 크기를 재서 서버로 좌표를 보내는 곳에는 쓰지 않는다(layout.md).
export interface PointPairsProps extends Omit<React.ComponentProps<"svg">, "children" | "onSelect"> {
  boxes: MatchBox[]
  /** 어느 쪽 그림인가 — 색만 다르다 */
  side: "crime" | "shoe"
  /** 강조할 박스 번호(0부터), 없으면 null */
  activeIndex: number | null
  onHover?: (index: number | null) => void
  onSelect?: (index: number) => void
  width: number
  height: number
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const TONE = {
  crime: "stroke-brand text-brand",
  shoe: "stroke-ai text-ai",
} as const

export function PointPairs({
  boxes,
  side,
  activeIndex,
  onHover,
  onSelect,
  width,
  height,
  partId,
  className,
  ...props
}: PointPairsProps) {
  return (
    <svg
      {...partAttrs("PointPairs", { variant: side, id: partId })}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
      {...props}
    >
      {boxes.map((b, i) => {
        const active = activeIndex === i
        const dimmed = activeIndex !== null && !active
        const x = b.cx - b.size / 2
        const y = b.cy - b.size / 2
        return (
          <g
            key={i}
            data-pair={i}
            data-active={active ? "true" : undefined}
            role="button"
            tabIndex={0}
            aria-label={`대응 ${i + 1}`}
            className={cn("pointer-events-auto cursor-pointer", TONE[side], dimmed && "opacity-30")}
            onClick={() => onSelect?.(i)}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.(i)
            }}
          >
            <rect
              x={x}
              y={y}
              width={b.size}
              height={b.size}
              rx={3}
              className="fill-transparent"
              strokeWidth={active ? 4 : 2}
              vectorEffect="non-scaling-stroke"
            />
            <rect x={x} y={y} width={22} height={18} rx={3} className="fill-canvas stroke-0" />
            <text x={x + 11} y={y + 13} fontSize={12} fontWeight={700} textAnchor="middle" className="fill-current font-code">
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
