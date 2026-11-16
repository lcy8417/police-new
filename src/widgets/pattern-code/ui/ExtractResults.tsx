import { PATTERN_DRAG_AI_FORMAT } from "@/entities/pattern"
import { AiProgress, AiTag, ConfidenceBar } from "@/shared/ui/ai"
import { PatternIcon } from "@/shared/ui/viewer"

import { DRAG_FORMAT } from "../model/constants"
import type { ExtractedPatternView, ExtractState } from "../model/types"
import { Band } from "./Band"

export interface ExtractResultsProps {
  state: ExtractState
  items: readonly ExtractedPatternView[]
  inserted: ReadonlySet<string>
  onInsert: (src: string) => void
  canEdit: boolean
  /** 사건 창 안 — 띠 머리 없이(탭 이름이 맡음), 안내 글은 추출 단추 자리에 맞춤 */
  bare?: boolean
}

/** 점수가 이보다 낮으면 ConfidenceBar 를 낮음(주황)으로 */
const LOW = 0.5

/**
 * AI 통합 추출 결과(F17 — 시안 핀 9 「AI 창 → 왼쪽 그림 안」). 점수 내림차순, 점수는 ConfidenceBar.
 * 누르면 고른 부위에 넣고, 끌어서 부위 행에 놓을 수도 있다(지금 앱 「통합 추출란」의 끌어 넣기).
 */
export function ExtractResults({ state, items, inserted, onInsert, canEdit, bare = false }: ExtractResultsProps) {
  const sorted = [...items].sort((a, b) => b.score - a.score)
  return (
    <section aria-label="AI 추출 결과" className="flex flex-col gap-[6px]">
      {bare ? null : (
        <Band title="AI 추출 결과">
          <AiTag />
        </Band>
      )}
      {state === "running" || state === "failed" ? (
        <AiProgress state={state} label="문양 추출" />
      ) : null}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-2 gap-[6px]">
          {sorted.map((it) => {
            const done = inserted.has(it.code)
            return (
              <button
                key={it.code}
                type="button"
                aria-label={`${it.code} 넣기(AI ${it.score.toFixed(2)})`}
                disabled={!canEdit || done}
                draggable={canEdit && !done}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_FORMAT, it.src)
                  // AI 추출 결과에서 끌었다는 표시 — 놓는 부위가 AI 출처 · 확신도를 남긴다(2회차 검수)
                  e.dataTransfer.setData(PATTERN_DRAG_AI_FORMAT, "1")
                  e.dataTransfer.effectAllowed = "copy"
                }}
                onClick={() => onInsert(it.src)}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-[4px] rounded-[9px] border border-dashed border-ai-line bg-ai-bg/40 px-[4px] py-[6px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PatternIcon name={it.code} src={it.src} ai />
                <span className="font-code text-[10.5px] text-fg-2">{it.code}</span>
                <ConfidenceBar value={it.score} scale="unit" threshold={LOW} label="AI 확신도" className="w-[80px]" />
              </button>
            )
          })}
        </div>
      ) : state === "running" ? null : (
        <p className="text-[11.5px] text-muted-foreground">
          {state === "idle"
            ? `아직 추출하지 않았습니다 — ${bare ? "현장 이미지 아래" : "버튼 줄 끝"} 「… 추출」로 AI 문양을 찾습니다.`
            : "AI가 찾은 문양이 없습니다."}
        </p>
      )}
    </section>
  )
}
