import * as React from "react"
import { Check } from "lucide-react"

import type { PatternZone } from "@/entities/pattern"
import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT, PALETTE_KINDS, patternName, ZONE_ROWS } from "../model/constants"
import type { CrimeZones, ExtractedPatternView, ExtractState, PaletteKind } from "../model/types"

export interface PatternLibraryProps {
  kind: PaletteKind
  onKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로(전체 목록) */
  palette: readonly string[]
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
  /** 살펴보기 판 안 — 격자를 조금 더 크게 */
  roomy?: boolean
  className?: string
}

type LibTab = PaletteKind | "AI"

const FOCUS = "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"

/** 문양 한 칸 — 누르면 넣기 · 이미 넣었으면 빼기, 끌어서 부위 행에 놓기 */
function LibraryItem({
  src,
  name,
  inserted,
  zoneLabel,
  canEdit,
  onToggle,
  score,
  note,
}: {
  src: string
  name: string
  inserted: boolean
  zoneLabel: string
  canEdit: boolean
  onToggle: () => void
  /** AI 점수(「AI」 탭) */
  score?: number
  /** SCAS 코드 설명 */
  note?: string
}) {
  const scoreText = score === undefined ? "" : ` · AI ${score.toFixed(2)}`
  return (
    <button
      type="button"
      aria-pressed={inserted}
      aria-label={inserted ? `${zoneLabel}에서 ${name} 빼기` : `${zoneLabel}에 ${name} 넣기${score === undefined ? "" : `(AI ${score.toFixed(2)})`}`}
      title={`${name}${scoreText}${note ? ` — ${note}` : ""}\n${inserted ? `${zoneLabel}에 들어 있음 · 누르면 빼기` : `누르면 ${zoneLabel}에 넣기 · 끌어서 다른 부위에`}`}
      disabled={!canEdit}
      draggable={canEdit && !inserted}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_FORMAT, src)
        e.dataTransfer.effectAllowed = "copy"
      }}
      onClick={onToggle}
      className={cn(
        "relative m-0 grid aspect-square cursor-pointer place-items-center rounded-[6px] border border-solid bg-transparent p-[2px] transition-colors duration-150 motion-reduce:transition-none",
        FOCUS,
        "disabled:cursor-default disabled:opacity-60",
        inserted ? "border-brand-line bg-brand-bg" : "border-transparent hover:border-line-3 hover:bg-panel-3"
      )}
    >
      <PatternIcon name={name} src={src} size="sm" />
      {score !== undefined ? (
        <span className={cn("absolute bottom-[1px] left-[2px] font-code text-[8.5px] leading-none tabular-nums", score < 0.5 ? "text-warn" : "text-ai")}>
          {score.toFixed(2)}
        </span>
      ) : null}
      {inserted ? (
        <span aria-hidden="true" className="absolute top-[1px] right-[1px] grid size-[12px] place-items-center rounded-full bg-brand-3 text-paper">
          <Check className="size-[9px]" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  )
}

/**
 * 전체 문양 목록(11/17 사용자 「문양 목록 너무 디자인이 구린데. 좀 탭으로 컴팩트하고, 코드 찾기는 필요없어」).
 * 종류 = 밑줄 탭 한 줄(넘치면 가로 스크롤) + 작은 균일 격자만. 넣을 부위는 가운데 4부위 행 중 고른 행을 따른다.
 * 누르면 그 부위에 넣고, 넣은 문양은 ✓ — 다시 누르면 뺀다. 끌어서 다른 부위 행에 놓을 수도 있다. 비교는 이름 기준(docs/pattern-data-model.md §2).
 * AI 추출 결과는 탭 하나(「AI」 — 점수 글자만 AI 색). 코드 설명은 마우스 설명으로.
 */
export function PatternLibrary({
  kind,
  onKindChange,
  palette,
  zones,
  selectedZone,
  onInsert,
  onRemove,
  canEdit,
  extracted,
  extractState,
  codeNote,
  roomy = false,
  className,
}: PatternLibraryProps) {
  const ai = [...(extracted ?? [])].sort((a, b) => b.score - a.score)
  const hasAi = ai.length > 0 || extractState === "running" || extractState === "failed"
  const [aiTab, setAiTab] = React.useState(false)
  const tab: LibTab = aiTab && hasAi ? "AI" : kind
  const tabsId = React.useId()
  const zoneLabel = ZONE_ROWS.find((z) => z.zone === selectedZone)?.label ?? ""
  const names = zones[selectedZone].map(([p]) => patternName(p))
  const toggle = (src: string) => {
    const at = names.indexOf(patternName(src))
    if (at >= 0) onRemove(selectedZone, at)
    else onInsert(src)
  }
  const grid = roomy ? "grid-cols-[repeat(auto-fill,minmax(40px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(36px,1fr))]"
  const tabs: LibTab[] = hasAi ? ["AI", ...PALETTE_KINDS] : [...PALETTE_KINDS]
  const pick = (t: LibTab) => {
    if (t === "AI") setAiTab(true)
    else {
      setAiTab(false)
      onKindChange(t)
    }
  }
  const noteOf = (name: string) => (codeNote && codeNote.code === name ? codeNote.text : undefined)

  return (
    <section aria-label="문양 목록" className={cn("flex min-h-0 min-w-0 flex-col gap-[6px]", className)}>
      <div className="flex shrink-0 items-end border-0 border-b border-solid border-border">
        <div role="tablist" aria-label="문양 종류" title={`넣을 부위: ${zoneLabel} — 가운데 4부위 행을 눌러 바꿉니다`} className="flex min-w-0 flex-1 items-end overflow-x-auto [scrollbar-width:none]">
          {tabs.map((t) => {
            const on = t === tab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={`${tabsId}-${t}`}
                aria-selected={on}
                onClick={() => pick(t)}
                className={cn(
                  "-mb-px shrink-0 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-[6px] pt-[3px] pb-[5px] text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none",
                  FOCUS,
                  on ? "border-brand text-brand-3" : "border-transparent text-muted-foreground hover:text-foreground",
                  t === "AI" && "font-code text-[11px] tracking-[0.08em]",
                  t === "AI" && !on && "text-ai"
                )}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>
      {tab === "AI" ? (
        <div role="tabpanel" aria-labelledby={`${tabsId}-AI`} className="flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto pr-[2px]">
          {extractState === "running" || extractState === "failed" ? <AiProgress state={extractState} label="문양 추출" /> : null}
          <div role="group" aria-label={`AI 추출 ${ai.length}개`} className={cn("grid gap-[2px]", grid)}>
            {ai.map((it) => (
              <LibraryItem
                key={it.code}
                src={it.src}
                name={it.code}
                score={it.score}
                note={noteOf(it.code)}
                inserted={names.includes(it.code)}
                zoneLabel={zoneLabel}
                canEdit={canEdit}
                onToggle={() => toggle(it.src)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby={`${tabsId}-${kind}`} className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
          <div role="group" aria-label={`${kind} 문양 ${palette.length}개`} className={cn("grid gap-[2px]", grid)}>
            {palette.map((src) => {
              const name = patternName(src)
              return (
                <LibraryItem
                  key={src}
                  src={src}
                  name={name}
                  note={noteOf(name)}
                  inserted={names.includes(name)}
                  zoneLabel={zoneLabel}
                  canEdit={canEdit}
                  onToggle={() => toggle(src)}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
