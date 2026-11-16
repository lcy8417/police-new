import * as React from "react"

import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { Chip } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones } from "../model/types"

export interface ZoneRowsProps {
  zones: CrimeZones
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  /** 끌어 온 문양을 놓은 부위에 넣기 */
  onDropToZone: (zone: PatternZone, src: string) => void
  onRemovePattern: (zone: PatternZone, index: number) => void
  onToggleEssential: (zone: PatternZone, index: number) => void
  canEdit: boolean
}

/**
 * 상 · 중 · 하 · 윤곽 4부위 행(SCAS 「현장 이미지 문양」). 지금 앱 `PatternZones`와 같은 조작:
 * 부위 머리 클릭 = 넣을 부위 고르기, 문양 클릭 = 빼기, 우클릭 = 필수 켜고 끄기, 행마다 끌어 놓기 대상.
 */
export function ZoneRows({
  zones,
  selectedZone,
  onSelectZone,
  onDropToZone,
  onRemovePattern,
  onToggleEssential,
  canEdit,
}: ZoneRowsProps) {
  // 끌고 있는 문양이 올라와 있는 부위 — 「여기에 놓기」 표시 전용(저장되지 않는 화면 안 상태)
  const [dragOver, setDragOver] = React.useState<PatternZone | null>(null)

  return (
    <div role="group" aria-label="현장 이미지 문양" className="flex flex-col gap-[4px]">
      {ZONE_ROWS.map(({ zone, label }) => {
        const items = zones[zone]
        const on = zone === selectedZone
        const over = dragOver === zone
        return (
          <div
            key={zone}
            data-drop-zone={zone}
            onDragOver={
              canEdit
                ? (e) => {
                    // preventDefault 가 있어야 drop 이 생긴다
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                    if (!over) setDragOver(zone)
                  }
                : undefined
            }
            onDragLeave={canEdit ? () => setDragOver((z) => (z === zone ? null : z)) : undefined}
            onDrop={
              canEdit
                ? (e) => {
                    e.preventDefault()
                    setDragOver(null)
                    const src = e.dataTransfer.getData(DRAG_FORMAT)
                    if (src) onDropToZone(zone, src)
                  }
                : undefined
            }
            className={cn(
              "relative grid grid-cols-[64px_minmax(0,1fr)] items-center gap-[10px] rounded-[10px] px-[10px] py-[8px]",
              on ? "bg-danger-bg/40 [box-shadow:inset_0_0_0_2px_var(--t-danger)]" : "border-b border-solid border-line-2",
              over && "bg-brand-bg [box-shadow:inset_0_0_0_2px_var(--t-brand)]",
            )}
          >
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${label} 부위 ${items.length}개${on ? " 입력 중" : ""}`}
              onClick={() => onSelectZone(zone)}
              className="grid cursor-pointer justify-items-start gap-[2px] border-0 bg-transparent p-0 text-left text-foreground"
            >
              <b className="text-[15px]">{label}</b>
              <span className="text-[10.5px] leading-[1.3] text-dim">{on ? "입력 중" : `${items.length}개`}</span>
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-[8px]">
              {items.map(([path, essential], index) => {
                const name = patternName(path)
                const must = Boolean(essential)
                return (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    disabled={!canEdit}
                    aria-label={`${label} ${name}${must ? " 필수" : ""}`}
                    title="누르면 빼기 · 우클릭하면 필수 켜고 끄기"
                    onClick={() => onRemovePattern(zone, index)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      onToggleEssential(zone, index)
                    }}
                    className={cn(
                      "cursor-pointer rounded-[8px] border border-solid bg-panel-2 p-[6px] disabled:cursor-not-allowed",
                      must ? "border-danger-line" : "border-line-3",
                    )}
                  >
                    <PatternIcon name={name} src={path} essential={must} />
                  </button>
                )
              })}
              {zone === "outline" ? (
                <span className="inline-flex items-center gap-[6px] text-[11px] text-muted-foreground">
                  <Chip variant="h19">AI 미지원</Chip>
                  윤곽은 감정관이 직접 넣습니다
                </span>
              ) : null}
              {items.length === 0 ? (
                <span className="inline-grid h-[50px] min-w-[92px] place-items-center rounded-[9px] border border-dashed border-line-3 px-[8px] text-[11px] text-faint">
                  여기로 드래그
                </span>
              ) : null}
            </div>
            {over ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid place-items-center rounded-[10px] bg-canvas/60 text-[12px] font-semibold text-brand"
              >
                여기에 놓기
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
