import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { Chip } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones } from "../model/types"

export interface ZoneRowsProps {
  zones: CrimeZones
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  onRemovePattern: (zone: PatternZone, index: number) => void
  onToggleEssential: (zone: PatternZone, index: number) => void
  canEdit: boolean
}

/**
 * 상 · 중 · 하 · 윤곽 4부위 행(SCAS 「현장 이미지 문양」). 지금 앱 `PatternZones`와 같은 조작:
 * 부위 머리 클릭 = 넣을 부위 고르기, 문양 클릭 = 빼기, 우클릭 = 필수 켜고 끄기.
 */
export function ZoneRows({ zones, selectedZone, onSelectZone, onRemovePattern, onToggleEssential, canEdit }: ZoneRowsProps) {
  return (
    <div role="group" aria-label="현장 이미지 문양" className="flex flex-col gap-[4px]">
      {ZONE_ROWS.map(({ zone, label }) => {
        const items = zones[zone]
        const on = zone === selectedZone
        return (
          <div
            key={zone}
            className={cn(
              "grid grid-cols-[64px_minmax(0,1fr)] items-center gap-[10px] rounded-[10px] px-[10px] py-[8px]",
              on ? "bg-danger-bg/40 [box-shadow:inset_0_0_0_2px_var(--t-danger)]" : "border-b border-solid border-line-2",
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
              ) : items.length === 0 ? (
                <span className="text-[11px] text-faint">비어 있음 — 부위를 고르고 팔레트 문양을 누릅니다</span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
