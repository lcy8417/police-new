import { cn } from "@/shared/lib/utils"

import { candidateWindow } from "../model/stage"
import type { CompareCandidate, MatchImage } from "../model/types"

// r3 「1:3 · 1:5」 비교: 왼쪽 현장(유류) 1장 + 지금 후보부터 n장을 나란히. 사진만 놓는 보기라 대응 박스 · 선은 1:1 에서 본다.
// 후보 칸을 누르면 그 후보가 지금 후보가 된다(1:1 로 돌아가면 그 후보와 정밀 대조).

type Look = "rgb" | "sketch"

// 칸 수 → 정적 클래스(Tailwind 가 읽을 수 있게 전부 적는다): 현장 1 + 후보 n
const COLS: Record<number, string> = { 3: "grid-cols-4", 5: "grid-cols-6" }

/** 퍼센트(0~100) 반올림 — 숫자가 아니면 「—」 */
function percent(similarity: number | string): string {
  const v = typeof similarity === "number" ? similarity : Number.parseFloat(similarity)
  return Number.isFinite(v) ? `${Math.round(Math.min(100, Math.max(0, v)))}%` : "—"
}

const HEAD = "truncate rounded-[4px] bg-strip px-[6px] py-[3px] text-[11.5px] text-muted-foreground"

export function MultiStage({
  count,
  crimeImage,
  crimeCaption,
  look,
  candidates,
  currentIndex,
  onPick,
}: {
  /** 후보 칸 수(3 · 5) */
  count: 3 | 5
  crimeImage: MatchImage
  crimeCaption: string
  look: Look
  candidates: readonly CompareCandidate[]
  /** 지금 후보 칸(목록 안 번호, 없으면 -1) */
  currentIndex: number
  onPick: (candidate: CompareCandidate) => void
}) {
  const { start, end } = candidateWindow(candidates.length, Math.max(0, currentIndex), count)
  const shown = candidates.slice(start, end)
  return (
    <div data-multi-stage={`1:${count}`} className={cn("grid min-w-0 gap-[8px]", COLS[count])}>
      <figure className="m-0 grid min-w-0 gap-[4px]">
        <figcaption className={HEAD}>유류 이미지</figcaption>
        <span className="relative block h-[300px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
          <img src={look === "rgb" ? crimeImage.rgb : crimeImage.sketch} alt="유류 이미지" className="block size-full object-contain" />
        </span>
        <span className="truncate font-code text-[11px] text-fg-2">{crimeCaption}</span>
      </figure>
      {shown.map((c, i) => {
        const index = start + i
        const current = index === currentIndex
        return (
          <button
            key={`${c.ftwrId}-${c.rank ?? "x"}`}
            type="button"
            data-candidate-tile={c.ftwrId}
            aria-current={current ? "true" : undefined}
            aria-label={`후보 ${c.rank != null ? `${c.rank}위 ` : ""}${c.ftwrId}${current ? " — 지금 후보" : " 고르기"}`}
            onClick={() => onPick(c)}
            className="grid min-w-0 cursor-pointer gap-[4px] border-0 bg-transparent p-0 text-left"
          >
            <span className={cn(HEAD, current && "bg-brand-bg text-foreground")}>
              {c.rank != null ? `#${c.rank} ` : ""}
              {`No. ${c.ftwrId}`}
            </span>
            <span
              className={cn(
                "relative block h-[300px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas hover:border-brand-line",
                current && "border-brand [box-shadow:0_0_0_2px_var(--t-brand)]",
              )}
            >
              <img src={look === "rgb" ? c.rgb : c.sketch} alt={`신발 ${c.ftwrId} 밑창`} className="block size-full object-contain" />
            </span>
            <span className="flex items-center justify-between font-code text-[11px] tabular-nums text-fg-2">
              <span>{percent(c.similarity)}</span>
              {current ? <span className="text-brand">지금 후보</span> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
