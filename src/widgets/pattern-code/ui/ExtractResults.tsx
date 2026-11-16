import { AiProgress, AiTag, ConfidenceBar } from "@/shared/ui/ai"
import { PatternIcon } from "@/shared/ui/viewer"

import type { ExtractedPatternView, ExtractState } from "../model/types"
import { Band } from "./Band"

export interface ExtractResultsProps {
  state: ExtractState
  items: readonly ExtractedPatternView[]
  inserted: ReadonlySet<string>
  onInsert: (src: string) => void
  canEdit: boolean
}

/** 점수가 이보다 낮으면 ConfidenceBar 를 낮음(주황)으로 */
const LOW = 0.5

/**
 * AI 통합 추출 결과(F17 — 시안 핀 9 「AI 창 → 왼쪽 그림 안」). 점수 내림차순, 점수는 ConfidenceBar.
 * 누르면 고른 부위에 넣는다(지금 앱 「통합 추출란」의 끌어 넣기와 같은 일).
 */
export function ExtractResults({ state, items, inserted, onInsert, canEdit }: ExtractResultsProps) {
  const sorted = [...items].sort((a, b) => b.score - a.score)
  return (
    <section aria-label="AI 추출 결과" className="flex flex-col gap-[6px]">
      <Band title="AI 추출 결과">
        <AiTag />
      </Band>
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
          {state === "idle" ? "아직 추출하지 않았습니다 — 버튼 줄 끝 「… 추출」로 AI 문양을 찾습니다." : "AI가 찾은 문양이 없습니다."}
        </p>
      )}
    </section>
  )
}
