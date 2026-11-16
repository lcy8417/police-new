import * as React from "react"

import { PatternZoneBoard, PATTERN_ZONES, type PatternZone, type PatternZoneCards } from "@/entities/pattern"

import { PATTERN_COUNTS, patternName } from "../model/constants"
import type { CrimeZones, PatternCount, PatternMetaMap, WeightLevel } from "../model/types"
import { describeWeight, type PatternWeightMap } from "../model/weight-rules"

export interface ZoneBoardProps {
  zones: CrimeZones
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  onDropToZone: (zone: PatternZone, src: string) => void
  onRemovePattern: (zone: PatternZone, index: number) => void
  onToggleEssential: (zone: PatternZone, index: number) => void
  canEdit: boolean
  meta?: PatternMetaMap
  weights: PatternWeightMap
  onWeightChange?: (zone: PatternZone, index: number, level: WeightLevel | null) => void
  onConfirmSuggestion?: (zone: PatternZone, index: number) => void
  onCountChange?: (zone: PatternZone, index: number, count: PatternCount) => void
}

const isCount = (v: string): v is PatternCount => (PATTERN_COUNTS as readonly string[]).includes(v)

/**
 * 사건 창 4부위 문양 행 — crime 튜플 `[경로, 필수]` · 카드 덧붙임(AI 점수 · 개수) · 가중치를 공용 표시 부품
 * `PatternZoneBoard`(entities/pattern)의 값 모양으로 바꿔 넘긴다. 이름 기준(docs/pattern-data-model.md §2).
 */
export function ZoneBoard({
  zones,
  selectedZone,
  onSelectZone,
  onDropToZone,
  onRemovePattern,
  onToggleEssential,
  canEdit,
  meta,
  weights,
  onWeightChange,
  onConfirmSuggestion,
  onCountChange,
}: ZoneBoardProps) {
  const cards = React.useMemo(() => {
    const out = {} as Record<PatternZone, PatternZoneCards[PatternZone]>
    for (const { zone } of PATTERN_ZONES) {
      out[zone] = zones[zone].map(([path, essential]) => {
        const name = patternName(path)
        const m = meta?.[zone]?.[name] ?? { status: "manual" as const }
        const w = weights[zone]?.[name]
        return {
          name,
          src: path,
          status: m.status,
          must: Boolean(essential),
          score: m.status === "manual" ? undefined : m.confidence,
          doubtful: m.doubtful,
          count: m.count ?? "1",
          weight: w ? { level: w.level, manual: w.source === "manual", why: describeWeight(w) } : undefined,
        }
      })
    }
    return out as PatternZoneCards
  }, [zones, meta, weights])

  return (
    <PatternZoneBoard
      zones={cards}
      selectedZone={selectedZone}
      onSelectZone={onSelectZone}
      onDropToZone={onDropToZone}
      onRemove={onRemovePattern}
      onToggleMust={onToggleEssential}
      onConfirm={onConfirmSuggestion}
      onCount={onCountChange ? (zone, index, c) => (isCount(c) ? onCountChange(zone, index, c) : undefined) : undefined}
      countOptions={PATTERN_COUNTS}
      onWeight={onWeightChange}
      canEdit={canEdit}
      outlineAiNote
    />
  )
}
