import { Undo2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { PaneHead } from "@/shared/ui/panel"

import { stepLook } from "../model/step-look"
import type { ImageEditHistoryEntry } from "../model/types"

// 사건 창 이미지 편집 오른쪽 칸 — 편집 이력만(11/17 사용자 「편집 이력만 남겨 AI 제안 빼 … 편집 이력은 당연 미리보기 가능해야하고.
// 각각 리스트마다」). 줄마다 그 단계까지 편집한 모습의 작은 그림, 줄을 누르면 작업대에서 그 단계를 미리 본다(부르는 쪽이 그림).
// 0번 줄 = 받은 원본. 마지막 줄 = 지금. 되돌리기는 머리 오른쪽.

export interface EditHistoryPaneProps {
  history: readonly ImageEditHistoryEntry[]
  /** 받은 원본 그림(작은 그림 바탕) — 없으면 그림 없이 줄만 */
  originalSrc?: string
  originalHash?: string
  /** 미리 보는 단계(0 = 원본, null = 미리보기 아님) */
  previewNo: number | null
  onPreview: (no: number | null) => void
  canUndo: boolean
  onUndo: () => void
  canEdit: boolean
}

export function EditHistoryPane({ history, originalSrc, originalHash, previewNo, onPreview, canUndo, onUndo, canEdit }: EditHistoryPaneProps) {
  const last = history.length > 0 ? history[history.length - 1].no : 0
  const rows: { no: number; label: string; at?: string }[] = [{ no: 0, label: "받은 원본" }, ...history]
  return (
    <section aria-label="편집 이력" data-plus="" className="flex min-h-0 min-w-0 flex-1 flex-col gap-[8px]">
      <PaneHead
        title="편집 이력"
        sub={`${history.length}단계`}
        end={
          <button
            type="button"
            disabled={!canEdit || !canUndo}
            onClick={onUndo}
            className="inline-flex h-[28px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-solid border-border bg-panel px-[10px] text-[12px] font-semibold text-fg-2 transition-colors hover:bg-strip disabled:cursor-default disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"
          >
            <Undo2 aria-hidden="true" className="size-[14px]" strokeWidth={1.9} />
            되돌리기
          </button>
        }
      />
      <ol className="m-0 flex min-h-0 flex-1 list-none flex-col gap-[4px] overflow-y-auto p-0">
        {rows.map((r) => {
          const on = previewNo === r.no
          const now = r.no === last
          return (
            <li key={r.no}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${r.no === 0 ? "원본" : `${r.no}단계 ${r.label}`} 미리보기`}
                onClick={() => onPreview(on ? null : r.no)}
                className={cn(
                  "m-0 grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)] items-center gap-[10px] rounded-[10px] border border-solid p-[6px] text-left transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand",
                  on ? "border-brand-line bg-brand-bg" : "border-transparent bg-transparent hover:bg-strip"
                )}
              >
                <span className="relative block h-[58px] w-[44px] overflow-hidden rounded-[6px] border border-solid border-border bg-canvas">
                  {originalSrc ? (
                    <img src={originalSrc} alt="" className={cn("block size-full object-cover", stepLook(history, r.no))} />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className="flex items-center gap-[6px]">
                    <b className="font-code text-[11px] font-bold text-muted-foreground">{r.no === 0 ? "원본" : String(r.no).padStart(2, "0")}</b>
                    {now ? (
                      <span className="rounded-full bg-brand-3 px-[6px] text-[10px] font-bold leading-[16px] text-paper">지금</span>
                    ) : null}
                    {on ? <span className="ml-auto text-[10.5px] font-semibold text-brand-3">보는 중</span> : null}
                  </span>
                  <span className={cn("truncate text-[12.5px] font-semibold", on ? "text-foreground" : "text-fg-2")}>{r.label}</span>
                  {r.at ? <span className="font-code text-[10.5px] text-muted-foreground">{r.at}</span> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {originalHash ? (
        <p className="m-0 shrink-0 border-0 border-t border-solid border-border pt-[8px] text-[10.5px] leading-[1.5] text-muted-foreground">
          원본 보관 · SHA-256 <b className="font-code font-medium text-fg-2">{originalHash}</b>
        </p>
      ) : null}
    </section>
  )
}
