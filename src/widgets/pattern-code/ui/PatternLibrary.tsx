import * as React from "react"

import { PatternLibrary as LibraryView, type PatternLibraryItem, type PatternZone } from "@/entities/pattern"
import { AiProgress } from "@/shared/ui/ai"

import { PALETTE_KINDS, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones, ExtractedPatternView, ExtractState, PaletteKind } from "../model/types"

export interface PatternLibraryProps {
  kind: PaletteKind
  onKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로(전체 목록) */
  palette: readonly string[]
  /** 종류별 문양 수(알약 탭 개수) */
  kindCounts?: Partial<Record<PaletteKind, number>>
  zones: CrimeZones
  /** 넣을 부위 — 가운데 4부위 행에서 고른 행을 따른다 */
  selectedZone: PatternZone
  /** (지금은 쓰지 않음 — 넣을 부위는 가운데 행에서 고른다) */
  onSelectZone?: (zone: PatternZone) => void
  /** 고른 부위에 넣기 */
  onInsert: (src: string) => void
  /** 부위의 문양 빼기 */
  onRemove: (zone: PatternZone, index: number) => void
  canEdit: boolean
  /** AI 추출 결과(「AI」 탭) */
  extracted?: readonly ExtractedPatternView[]
  extractState?: ExtractState
  /** 마지막으로 고른 문양 설명(그 칸 마우스 설명에) */
  codeNote?: { code: string; text: string } | null
  /** 마우스를 올린 문양(확대 보기 칸) */
  onHoverItem?: (item: PatternLibraryItem | null) => void
  /** 살펴보기 판 안 — 한 줄 칸 수를 늘린다 */
  roomy?: boolean
  className?: string
}

/**
 * 문양 코드 탭의 문양 목록 — 종류 탭(+ AI 추출 탭) · crime 튜플 비교를 맡고, 그리기는 공용 `PatternLibrary`(entities/pattern).
 * 누르면 고른 부위에 넣고, 이미 넣은 문양(이름 기준)은 다시 누르면 뺀다.
 */
export function PatternLibrary({
  kind,
  onKindChange,
  palette,
  kindCounts,
  zones,
  selectedZone,
  onInsert,
  onRemove,
  canEdit,
  extracted,
  extractState,
  codeNote,
  onHoverItem,
  roomy = false,
  className,
}: PatternLibraryProps) {
  const ai = React.useMemo(() => [...(extracted ?? [])].sort((a, b) => b.score - a.score), [extracted])
  const hasAi = ai.length > 0 || extractState === "running" || extractState === "failed"
  const [aiTab, setAiTab] = React.useState(false)
  const tab = aiTab && hasAi ? "AI" : kind
  const zoneLabel = ZONE_ROWS.find((z) => z.zone === selectedZone)?.label ?? ""
  const names = zones[selectedZone].map(([p]) => patternName(p))
  const noteOf = (name: string) => (codeNote && codeNote.code === name ? codeNote.text : undefined)
  const toggle = (item: PatternLibraryItem) => {
    const at = names.indexOf(item.name)
    if (at >= 0) onRemove(selectedZone, at)
    else onInsert(item.src)
  }
  const tabs = [
    ...(hasAi ? [{ key: "AI", label: "AI", count: ai.length, ai: true }] : []),
    ...PALETTE_KINDS.map((k) => ({ key: k, label: k, count: k === kind ? palette.length : kindCounts?.[k] })),
  ]
  const items: PatternLibraryItem[] =
    tab === "AI"
      ? ai.map((it) => ({ src: it.src, name: it.code, score: it.score, note: noteOf(it.code) }))
      : palette.map((src) => {
          const name = patternName(src)
          return { src, name, note: noteOf(name) }
        })

  return (
    <LibraryView
      tabs={tabs}
      tab={tab}
      onTabChange={(t) => {
        if (t === "AI") setAiTab(true)
        else {
          setAiTab(false)
          onKindChange(t as PaletteKind)
        }
      }}
      items={items}
      itemsLabel={tab === "AI" ? `AI 추출 ${ai.length}개` : `${kind} 문양 ${palette.length}개`}
      insertedNames={names}
      zoneLabel={zoneLabel}
      onToggle={toggle}
      onHoverItem={onHoverItem}
      canEdit={canEdit}
      head={tab === "AI" && (extractState === "running" || extractState === "failed") ? <AiProgress state={extractState} label="문양 추출" /> : null}
      columns={roomy ? 5 : 4}
      className={className}
    />
  )
}
