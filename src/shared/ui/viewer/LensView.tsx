import type * as React from "react"

import { cn } from "@/shared/lib/utils"

import type { LensSpot } from "./LensBox"
import { LENS_SCALE, type LensZoom } from "./view-tune"

export interface LensViewProps {
  /** 확대경이 보고 있는 자리(LensBox `onLensMove`) */
  spot: LensSpot
  /** 배율 */
  zoom: LensZoom
  /** 그릴 그림(누를 수 없는 복사본 — 확대경과 같은 것) */
  source: React.ReactNode
  /** 보기 조정 클래스(두 겹) */
  tune: { outer: string; inner: string }
  /** `data-slot` */
  slot?: string
  /** 크기 · 모서리는 부르는 쪽이 */
  className?: string
}

/**
 * 고정 확대 보기 — 확대경이 보고 있는 자리를 같은 배율로 칸 한가운데에 그린다(11/17 사용자 「확대경이랑 옆에 문양을 두고 딱 비교할 수 있게」).
 * 그림은 원래 상자 크기(spot.w × spot.h)로 두고 왼쪽 위 기준으로 키운 뒤, 보는 자리가 칸 가운데(50% · 50%)에 오도록 옮긴다.
 * 순수 장식(`pointer-events-none` · 읽지 않음). 옮기는 값은 런타임 좌표라 인라인 style(CLAUDE.md 예외).
 */
export function LensView({ spot, zoom, source, tune, slot = "lens-view", className }: LensViewProps) {
  const x = spot.rx * spot.w
  const y = spot.ry * spot.h
  return (
    <div aria-hidden="true" data-slot={slot} className={cn("pointer-events-none relative overflow-hidden bg-canvas", className)}>
      <div className="absolute top-1/2 left-1/2">
        <div
          className={cn("absolute origin-top-left", LENS_SCALE[zoom])}
          style={{ left: Math.round(-x * zoom), top: Math.round(-y * zoom), width: spot.w, height: spot.h }}
        >
          <div className={cn("size-full", tune.outer)}>
            <div className={cn("relative size-full", tune.inner)}>{source}</div>
          </div>
        </div>
      </div>
      <span className="absolute top-1/2 left-1/2 size-[6px] -translate-1/2 rounded-full border border-solid border-brand" />
      <span className="absolute bottom-[4px] left-[5px] rounded-[4px] bg-canvas/80 px-[4px] font-code text-[10px] text-fg-2">×{zoom}</span>
    </div>
  )
}
