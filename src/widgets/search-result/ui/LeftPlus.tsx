import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/kit"

import type { SearchInsight, SearchTarget } from "../model/types"
import { KEYBOARD_NOTE, SIDE_BOX } from "./plus-style"

// 시안 S05 왼쪽 칸 +α: 검색 요약 · 본 위치 · 유사도 분포 · 확인대상 · 키보드 안내.

const BAR_W = 5

/** 유사도 분포(시안 r3): 순위 1 → 끝을 막대로 묶음. 본 위치까지 흐리게, 본 위치 세로선, 확인대상 ▼ */
function Distribution({ insight, total, targets }: { insight: SearchInsight; total: number; targets: readonly SearchTarget[] }) {
  const bins = insight.distribution
  const n = bins.length
  const width = n * BAR_W
  const xr = (rank: number) => (rank / total) * n * BAR_W
  return (
    <svg viewBox={`0 0 ${width} 58`} width="100%" height="64" role="img" aria-label="유사도 분포" className="block">
      {bins.map((v, i) => {
        const h = Math.max(3, (v - 44) * 1.6)
        const seen = (i + 1) * (total / n) <= insight.seenUpTo
        return (
          <rect
            key={i}
            x={i * BAR_W}
            y={48 - h}
            width={4}
            height={h}
            rx={1}
            className={seen ? "fill-brand-line" : "fill-brand"}
            opacity={seen ? 0.55 : 0.9 - (i / n) * 0.5}
          />
        )
      })}
      <line x1={xr(insight.seenUpTo)} y1={0} x2={xr(insight.seenUpTo)} y2={50} className="stroke-brand" strokeWidth={1.2} />
      {targets.map((t) => (
        <path key={t.ftwrId} d={`M${xr(t.rank) - 3} 0L${xr(t.rank) + 3} 0L${xr(t.rank)} 5Z`} className="fill-warn" />
      ))}
      <text x={0} y={57} fontSize={6} className="fill-dim font-code">{`1위 ${Math.round(insight.topSimilarity)}%`}</text>
      <text x={width} y={57} fontSize={6} textAnchor="end" className="fill-dim font-code">
        {`${total}위 ${Math.round(insight.bottomSimilarity)}%`}
      </text>
    </svg>
  )
}

export function LeftPlus({
  insight,
  total,
  targets,
  canEditTargets,
  onResume,
  onRemoveTarget,
  bare = false,
}: {
  insight: SearchInsight
  total: number
  targets: readonly SearchTarget[]
  /** 확인대상 제외 — 감정관 · 관리자 */
  canEditTargets: boolean
  onResume: () => void
  onRemoveTarget: (target: SearchTarget) => void
  /** 사건 창 안 — 상자 테두리 대신 가는 구분선 · 간격으로 묶고, 키보드 안내 줄은 부르는 쪽 ⓘ 로 */
  bare?: boolean
}) {
  const nextRank = insight.seenUpTo + 1
  const seenRatio = total > 0 ? insight.seenUpTo / total : 0
  const box = bare ? "grid gap-[6px] border-0 border-t border-solid border-line-2 pt-[10px]" : SIDE_BOX
  return (
    <>
      <div data-plus className="text-[11.5px] leading-[1.6] text-muted-foreground">
        검색번호 <b className="font-code text-fg-2">{insight.searchNo}</b> · {insight.searchMethod}
        <br />
        {insight.essentialSummary} · {insight.searchedAt}
      </div>

      <div data-plus data-seen-box className={box}>
        <div className="flex justify-between text-[12px]">
          <b>본 위치</b>
          <span className="font-code tabular-nums text-fg-2">{`${insight.seenUpTo}위 / ${total}건`}</span>
        </div>
        <div
          role="progressbar"
          aria-label="본 위치"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(seenRatio * 100)}
          className="h-[6px] rounded-[3px] bg-line-3"
        >
          <div className="h-full rounded-[3px] bg-brand-2" style={{ width: `${seenRatio * 100}%` }} />
        </div>
        <div className="flex items-center gap-[6px] text-[11px] text-dim">
          {`지난번 ${insight.seenAt}까지`}
          <Button size="sm" className="ml-auto" onClick={onResume}>
            {`${nextRank}위부터 이어 보기`}
          </Button>
        </div>
      </div>

      <div data-plus className={cn(box, "gap-[5px]")}>
        <div className="flex justify-between text-[12px]">
          <b>유사도 분포</b>
          <span className="font-code text-[10.5px] text-dim">{`${total}건 · 순위 →`}</span>
        </div>
        <Distribution insight={insight} total={total} targets={targets} />
        <div className="flex gap-[10px] text-[10px] text-dim">
          <span>
            <span className="text-warn">▼</span> 확인대상
          </span>
          <span>
            <span className="text-brand">│</span> 본 위치
          </span>
          <span className="ml-auto">{`${insight.tailFrom}위 뒤는 꼬리`}</span>
        </div>
      </div>

      <div
        data-plus
        data-target-box
        className={
          bare
            ? "grid gap-[4px] border-0 border-t border-solid border-line-2 pt-[10px]"
            : "grid gap-[4px] rounded-[8px] border border-solid border-warn-line bg-warn-bg px-[10px] py-[8px]"
        }
      >
        <div className="flex justify-between text-[12px] text-warn">
          <b>확인대상</b>
          <span className="tabular-nums">{`${targets.length}건`}</span>
        </div>
        {targets.map((t) => (
          <div key={t.ftwrId} className="flex items-center gap-[6px] text-[11.5px] text-fg-2">
            <span className="w-[38px] tabular-nums">{`${t.rank}위`}</span>
            <span className="font-code">{t.ftwrId}</span>
            <Button
              size="sm"
              className="ml-auto h-[20px] px-[6px]"
              locked={!canEditTargets}
              onClick={() => onRemoveTarget(t)}
            >
              확인대상 제외
            </Button>
          </div>
        ))}
      </div>

      {bare ? null : (
        <div data-plus className="text-[11px] leading-[1.6] text-dim">
          {KEYBOARD_NOTE}
        </div>
      )}
    </>
  )
}
