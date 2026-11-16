import * as React from "react"
import { Check } from "lucide-react"

import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Field, Segmented } from "@/shared/ui/kit"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PALETTE_KINDS, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones, ExtractedPatternView, ExtractState, PaletteKind } from "../model/types"

export interface PatternLibraryProps {
  kind: PaletteKind
  onKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로(전체 목록) */
  palette: readonly string[]
  zones: CrimeZones
  /** 넣을 부위 */
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  /** 고른 부위에 넣기 */
  onInsert: (src: string) => void
  /** 부위의 문양 빼기 */
  onRemove: (zone: PatternZone, index: number) => void
  canEdit: boolean
  /** AI 추출 결과(위 한 줄) */
  extracted?: readonly ExtractedPatternView[]
  extractState?: ExtractState
  /** 마지막으로 고른 문양 설명 */
  codeNote?: { code: string; text: string } | null
  /** 살펴보기 판 안 — 격자를 조금 더 크게 */
  roomy?: boolean
  className?: string
}

const ZONE_ITEMS = ZONE_ROWS.map(({ zone, label }) => ({ value: zone, label }))

/** 문양 한 칸 — 누르면 넣기 · 이미 넣었으면 빼기, 끌어서 부위 행에 놓기 */
function LibraryItem({
  src,
  name,
  inserted,
  zoneLabel,
  canEdit,
  onToggle,
  score,
}: {
  src: string
  name: string
  inserted: boolean
  zoneLabel: string
  canEdit: boolean
  onToggle: () => void
  /** AI 점수(추출 줄) */
  score?: number
}) {
  return (
    <button
      type="button"
      aria-pressed={inserted}
      aria-label={inserted ? `${zoneLabel}에서 ${name} 빼기` : `${zoneLabel}에 ${name} 넣기${score === undefined ? "" : `(AI ${score.toFixed(2)})`}`}
      title={`${name}${score === undefined ? "" : ` · AI ${score.toFixed(2)}`} — ${inserted ? `${zoneLabel}에 들어 있음, 누르면 빼기` : `누르면 ${zoneLabel}에 넣기 · 끌어서 다른 부위에`}`}
      disabled={!canEdit}
      draggable={canEdit && !inserted}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_FORMAT, src)
        e.dataTransfer.effectAllowed = "copy"
      }}
      onClick={onToggle}
      className={cn(
        "relative m-0 grid cursor-pointer justify-items-center gap-[2px] rounded-[8px] border border-solid bg-transparent p-[3px] transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand disabled:cursor-default disabled:opacity-60",
        inserted ? "border-brand-line bg-brand-bg" : "border-transparent hover:bg-panel-3"
      )}
    >
      <PatternIcon name={name} src={src} size="md" />
      {score !== undefined ? (
        <span className={cn("font-code text-[9.5px] leading-none tabular-nums", score < 0.5 ? "text-warn" : "text-ai")}>{score.toFixed(2)}</span>
      ) : null}
      {inserted ? (
        <span aria-hidden="true" className="absolute top-[1px] right-[1px] grid size-[14px] place-items-center rounded-full bg-brand-3 text-paper">
          <Check className="size-[10px]" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}

/**
 * 전체 문양 목록(11/17 사용자 「전체 문양 리스트 … 원래 있었잖아. 그걸로 문양 넣었다 뺏다 하고 … 윤곽도 있어」).
 * 종류 8개(지금 앱 팔레트와 같은 순서 · 글자만) · 코드 찾기 · 컴팩트 격자. 누르면 지금 고른 부위에 넣고, 이미 넣은 문양은
 * 표시(✓)되어 다시 누르면 뺀다. 끌어서 다른 부위 행에 놓을 수도 있다. 비교는 이름 기준(docs/pattern-data-model.md §2).
 * 맨 위 한 줄은 AI 추출 결과(이 탭의 유일한 AI 자리 — 점수 글자만 AI 색).
 */
export function PatternLibrary({
  kind,
  onKindChange,
  palette,
  zones,
  selectedZone,
  onSelectZone,
  onInsert,
  onRemove,
  canEdit,
  extracted,
  extractState,
  codeNote,
  roomy = false,
  className,
}: PatternLibraryProps) {
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const shown = q ? palette.filter((src) => patternName(src).toLowerCase().includes(q)) : palette
  const zoneLabel = ZONE_ROWS.find((z) => z.zone === selectedZone)?.label ?? ""
  const names = zones[selectedZone].map(([p]) => patternName(p))
  const toggle = (src: string) => {
    const at = names.indexOf(patternName(src))
    if (at >= 0) onRemove(selectedZone, at)
    else onInsert(src)
  }
  const ai = [...(extracted ?? [])].sort((a, b) => b.score - a.score)
  const grid = roomy ? "grid-cols-[repeat(auto-fill,minmax(46px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(42px,1fr))]"

  return (
    <section aria-label="문양 목록" className={cn("flex min-h-0 min-w-0 flex-col gap-[8px]", className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-[6px]">
        <span className="text-[10.5px] font-semibold text-muted-foreground">넣을 부위</span>
        <Segmented
          aria-label="넣을 부위"
          items={ZONE_ITEMS}
          value={selectedZone}
          onValueChange={(v) => onSelectZone(v as PatternZone)}
          className="p-[2px] [&_button]:px-[9px] [&_button]:py-[2px] [&_button]:text-[11.5px]"
        />
      </div>
      <Segmented
        aria-label="문양 종류"
        items={PALETTE_KINDS.map((k) => ({ value: k, label: k }))}
        value={kind}
        onValueChange={(v) => onKindChange(v as PaletteKind)}
        className="grid shrink-0 grid-cols-4 p-[2px] [&_button]:px-0 [&_button]:py-[2px] [&_button]:text-[11.5px]"
      />
      <Field aria-label="문양 찾기" placeholder="⌕ 코드 찾기 (예 n32)" value={query} onChange={(e) => setQuery(e.target.value)} className="shrink-0 text-[11.5px]" />
      {ai.length > 0 || extractState === "running" || extractState === "failed" ? (
        <div role="group" aria-label="AI 추출" className="flex shrink-0 flex-col gap-[4px] border-0 border-b border-solid border-line-2 pb-[8px]">
          <span className="flex items-center gap-[6px] text-[10.5px] font-semibold text-muted-foreground">
            <span className="font-code text-[10px] font-bold tracking-[0.1em] text-ai">AI</span>
            추출 {ai.length}
          </span>
          {extractState === "running" || extractState === "failed" ? <AiProgress state={extractState} label="문양 추출" /> : null}
          {ai.length > 0 ? (
            <div className={cn("grid gap-[3px]", grid)}>
              {ai.map((it) => (
                <LibraryItem
                  key={it.code}
                  src={it.src}
                  name={it.code}
                  score={it.score}
                  inserted={names.includes(it.code)}
                  zoneLabel={zoneLabel}
                  canEdit={canEdit}
                  onToggle={() => toggle(it.src)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div role="group" aria-label={`${kind} 문양 ${shown.length}개`} className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
        {shown.length > 0 ? (
          <div className={cn("grid gap-[3px]", grid)}>
            {shown.map((src) => {
              const name = patternName(src)
              return (
                <LibraryItem
                  key={src}
                  src={src}
                  name={name}
                  inserted={names.includes(name)}
                  zoneLabel={zoneLabel}
                  canEdit={canEdit}
                  onToggle={() => toggle(src)}
                />
              )
            })}
          </div>
        ) : (
          <p className="m-0 py-[12px] text-center text-[11.5px] text-muted-foreground">「{query}」 코드의 {kind} 문양이 없습니다.</p>
        )}
      </div>
      {codeNote ? (
        <p title={codeNote.text} className="m-0 line-clamp-2 shrink-0 border-0 border-t border-solid border-line-2 pt-[6px] text-[11px] leading-[1.45] text-muted-foreground">
          <b className="mr-[6px] font-code font-semibold text-fg-2">{codeNote.code}</b>
          {codeNote.text}
        </p>
      ) : null}
    </section>
  )
}
