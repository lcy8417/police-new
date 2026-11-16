import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Chip } from "@/shared/ui/kit"

import type { QuickPeek } from "../model/types"
import { PHOTO_LABEL } from "./plus-style"
import { SoleHeat } from "./SoleHeat"

// 시안 r3 「빠른 비교」 창: 초점 카드 옆에 뜨는 작은 창 — 현장 ↔ 후보 밑창, 상 · 중 · 하 부위별 점수와 이유.
// 카드가 오른쪽 절반에 있으면 왼쪽으로 펼친다(화면 밖으로 넘치지 않게).
export function QuickPeekWindow({
  peek,
  rank,
  ftwrId,
  similarity,
  shoeImage,
  side,
}: {
  peek: QuickPeek
  rank: number
  ftwrId: string
  similarity: string
  shoeImage: string
  side: "right" | "left"
}) {
  return (
    <div
      data-plus
      data-quick-peek
      role="dialog"
      aria-label="빠른 비교"
      className={cn(
        "absolute top-[-6px] z-[6] w-[400px] rounded-[12px] border border-solid border-brand-line bg-canvas p-[10px]",
        // 시안 그림자 rgba(0,0,0,.75) → 가장 가까운 짙은 그림자 토큰(.6)
        "[box-shadow:0_18px_50px_0_var(--t-ai-tag-drop),0_0_0_1px_var(--t-brand-glow)]",
        side === "right" ? "left-[calc(100%+6px)]" : "right-[calc(100%+6px)]",
      )}
    >
      <div className="mb-[8px] flex items-center gap-[8px] text-[12px]">
        <b>빠른 비교</b>
        <span className="font-code text-muted-foreground">{`${rank}위 · ${ftwrId} · ${similarity}`}</span>
        <span className="ml-auto text-[10.5px] text-dim">Enter 상세조회 · S ★</span>
      </div>
      <div className="grid grid-cols-[96px_96px_minmax(0,1fr)] gap-[8px]">
        <span className="relative h-[148px] overflow-hidden rounded-[7px] border border-solid border-border">
          <img src={peek.sceneImage} alt="현장 족적" className="block size-full object-cover" />
          <span className={cn(PHOTO_LABEL, "text-fg-2")}>현장</span>
        </span>
        <span className="relative h-[148px] overflow-hidden rounded-[7px] border border-solid border-brand-line bg-foreground">
          <img src={shoeImage} alt={`신발 ${ftwrId} 밑창`} className="block size-full object-contain" />
          <SoleHeat />
          <span className={cn(PHOTO_LABEL, "text-ai")}>{ftwrId}</span>
        </span>
        <div className="grid content-start gap-[7px] text-[11px]">
          {peek.zones.map((z) => {
            const low = z.score < 50
            return (
              <div key={z.zone} data-peek-zone={z.zone} className="grid gap-[3px]">
                <span className="flex justify-between">
                  <b>{z.zone}</b>
                  <b className={cn("font-code", low ? "text-warn" : "text-ai")}>{z.score}</b>
                </span>
                <AiProgress
                  state="done"
                  value={z.score / 100}
                  label={`${z.zone} 부위 점수`}
                  className={cn(low && "[&>i]:bg-none [&>i]:bg-warn")}
                />
                <span className="text-[10px] leading-[1.3] text-dim">{z.why}</span>
              </div>
            )
          })}
          <Chip variant="amber-h19" className="justify-self-start">
            {peek.caution}
          </Chip>
        </div>
      </div>
    </div>
  )
}
