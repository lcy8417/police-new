import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiSuggestion, LiveDot } from "@/shared/ui/ai"
import { Button } from "@/shared/ui/kit"

import type { ImageEditAiSuggestion, ImageEditHistoryEntry } from "../model/types"

// S03 A 오른쪽 칸(시안 r3 `sidePanel`) — AI 제안 · 원본 → 편집본 · 편집 이력 + 원본 해시. 모두 +α 라
// 부르는 쪽(CuttingPane)이 showPlus 일 때만 그리고, 칸마다 `data-plus` 를 단다.

/** 시안 `side()` 칸 틀 */
function Side({
  label,
  head,
  className,
  children,
}: {
  label: string
  head: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-label={label}
      data-plus=""
      className={cn(
        "grid gap-[6px] rounded-[10px] border border-solid border-border bg-panel-2 px-[10px] py-[9px]",
        className,
      )}
    >
      <b className="text-[11.5px] text-fg-2">{head}</b>
      {children}
    </section>
  )
}

export interface AiSidePanelProps {
  suggestions?: readonly ImageEditAiSuggestion[]
  onApplySuggestion?: (id: string) => void
  beforeAfter?: { original: string; edited: string }
  history?: readonly ImageEditHistoryEntry[]
  originalHash?: string
  canUndo: boolean
  onUndo: () => void
  canEdit: boolean
}

/** 편집 이력 줄들(없으면 흐린 한 줄) */
function HistoryList({ history }: { history: readonly ImageEditHistoryEntry[] }) {
  return history.length > 0 ? (
    <ol className="m-0 grid list-none gap-[6px] p-0">
      {history.map((h) => (
        <li key={h.no} className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-[6px] text-[11px]">
          <b className="font-code text-brand">{h.no}</b>
          <span className="text-fg-2">{h.label}</span>
          <span className="font-code text-[10px] text-dim">{h.at}</span>
        </li>
      ))}
    </ol>
  ) : (
    <span className="text-[11px] text-dim">아직 편집하지 않았습니다.</span>
  )
}

/** 원본 → 편집본 작은 그림 두 장. `tall` = 사건 창 오른쪽 칸(폭이 넓어 그림을 크게) */
function BeforeAfterPair({ beforeAfter, tall = false }: { beforeAfter: { original: string; edited: string }; tall?: boolean }) {
  const box = cn("relative overflow-hidden rounded-[5px] border border-solid", tall ? "h-[120px]" : "h-[96px]")
  return (
    <>
      <div className="grid grid-cols-[1fr_14px_1fr] items-center gap-[4px]">
        <span className={cn(box, "border-line-3")}>
          <img src={beforeAfter.original} alt="받은 원본" className="size-full object-cover" />
        </span>
        <span aria-hidden="true" className="text-center font-code text-[11px] font-semibold text-dim">
          ›
        </span>
        <span className={cn(box, "border-brand-line")}>
          <img src={beforeAfter.edited} alt="저장될 편집본" className="size-full object-cover" />
        </span>
      </div>
      <span className="flex justify-between text-[10px] text-dim">
        <span>받은 그대로</span>
        <span className="text-brand">저장될 모습</span>
      </span>
    </>
  )
}

/** 원본 해시 줄 */
function HashNote({ hash }: { hash: string }) {
  return (
    <div className="mt-[2px] grid gap-[2px] border-t border-solid border-line-2 pt-[6px] text-[10.5px] text-dim">
      <span>원본 보관 · SHA-256</span>
      <b className="font-code font-medium text-fg-2">{hash}</b>
      <span>저장하면 편집본 해시와 이 이력이 사용 기록(S14)에 남습니다</span>
    </div>
  )
}

export function AiSidePanel({
  suggestions,
  onApplySuggestion,
  beforeAfter,
  history,
  originalHash,
  canUndo,
  onUndo,
  canEdit,
}: AiSidePanelProps) {
  return (
    <div className="grid content-start gap-[8px]">
      {suggestions && suggestions.length > 0 ? (
        <Side
          label="AI 제안"
          className="border-ai-line bg-[linear-gradient(160deg,var(--t-ai-bg),var(--t-panel-2))]"
          head={
            <span className="flex items-center gap-[6px]">
              <LiveDot state="busy" label="AI 제안" hideLabel />
              <span aria-hidden="true" className="text-ai">
                AI 제안
              </span>
              <span className="ml-auto text-[10px] font-normal text-dim">누르면 반영</span>
            </span>
          }
        >
          {suggestions.map((s, i) => (
            <AiSuggestion
              key={s.id}
              partId={i === 0 ? "S03-41" : undefined}
              title={s.title}
              reason={s.reason}
              actionLabel={s.actionLabel}
              actionTone={s.tone === "warn" ? "warn" : "default"}
              onApply={canEdit && onApplySuggestion ? () => onApplySuggestion(s.id) : undefined}
            />
          ))}
        </Side>
      ) : null}

      {beforeAfter ? (
        <Side label="원본 → 편집본" head="원본 → 편집본">
          <BeforeAfterPair beforeAfter={beforeAfter} />
        </Side>
      ) : null}

      {history ? (
        <Side
          label="편집 이력"
          head={
            <span className="flex items-center">
              편집 이력
              <Button
                size="sm"
                className="ml-auto h-[20px] px-[6px] font-normal"
                disabled={!canEdit || !canUndo}
                onClick={onUndo}
              >
                <span aria-hidden="true">↶</span>되돌리기
              </Button>
            </span>
          }
        >
          <HistoryList history={history} />
          {originalHash ? <HashNote hash={originalHash} /> : null}
        </Side>
      ) : null}
    </div>
  )
}
