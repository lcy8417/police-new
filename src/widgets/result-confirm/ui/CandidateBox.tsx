import { cn } from "@/shared/lib/utils"
import { AiTag, CheckList, ScanOverlay } from "@/shared/ui/ai"
import { Chip } from "@/shared/ui/kit"
import { HeatOverlay } from "@/shared/ui/viewer"

import { JUDGEMENT_LABEL } from "../model/judgement"
import type { BlockInsight, ConfirmTarget } from "../model/types"

// 시안 S07 r3 확인대상 상자(핀 5 · 6 · 13): 첫 확인대상은 「현장 → 후보(일치 부위 히트맵)」 한 쌍 + AI 추천 · 대조 %,
// 나머지 후보는 찾은 검색번호 · AI 리랭킹 표시 · ☐ 제외. 확인대상이 없으면 AI 가 왜 그 판정을 추천했는지 근거 2줄.

const CHIP_TEAL = "h-[16px] border-ai-line bg-ai-bg px-[5px] text-[9.5px] text-ai"

function ExcludeButton({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={cn("cursor-pointer border-none bg-transparent p-0 text-[11px]", checked ? "text-warn" : "text-muted-foreground")}
    >
      {checked ? "☑" : "☐"} 제외
    </button>
  )
}

/** 밑창 비율(100:264) 칸에 맞춘 히트 그림 */
function SoleHeat() {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-1/2 aspect-[100/264] h-full -translate-x-1/2">
      <HeatOverlay variant="spots" />
    </span>
  )
}

export function CandidateBox({
  insight,
  target,
  sceneImage,
  onAction,
}: {
  insight: BlockInsight
  target: ConfirmTarget | null
  sceneImage: string
  onAction: (label: string) => void
}) {
  if (!target) {
    return (
      <div data-plus data-candidates="none" className="grid w-full content-start gap-[2px]">
        <span className="flex items-center justify-between text-[12px] text-dim">
          확인대상 없음
          <AiTag>{`AI 근거 · ${JUDGEMENT_LABEL[insight.aiRecommend]} 추천 이유`}</AiTag>
        </span>
        <CheckList
          dense
          topLine
          className="text-fg-2"
          items={insight.reasons.map((r) => ({ tone: r.tone, text: r.text }))}
        />
      </div>
    )
  }
  return (
    <div data-plus data-candidates="list" className="flex min-w-0 flex-wrap gap-[8px]">
      <div
        data-best-candidate
        className="grid w-[132px] justify-items-center gap-[2px] rounded-[8px] bg-[linear-gradient(180deg,var(--t-ai-bg),transparent)] pt-[3px] pb-[2px] [box-shadow:inset_0_0_0_1px_var(--t-ai-line)]"
      >
        <span className="flex items-center gap-[3px]">
          <span className="relative block h-[84px] w-[54px] overflow-hidden rounded-[6px] border border-solid border-border bg-canvas">
            <img src={sceneImage} alt="현장 족적" className="block size-full object-cover" />
          </span>
          <span className="text-[11px] text-ai">→</span>
          <span className="relative block h-[84px] w-[54px] overflow-hidden rounded-[6px] border border-solid border-border bg-foreground">
            <img src={target.image} alt={`신발 ${target.ftwrId} 밑창`} className="block size-full object-contain" />
            <SoleHeat />
            <ScanOverlay active className="motion-safe:[animation-duration:2.8s]" />
          </span>
        </span>
        <b className="font-code text-[11px] text-foreground">{target.ftwrId}</b>
        {insight.targetFrom ? <span className="font-code text-[9.5px] text-dim">{insight.targetFrom}</span> : null}
        <span className="flex gap-[3px]">
          <AiTag className="h-[16px]">AI 추천</AiTag>
          {insight.targetCompare !== undefined ? <Chip className={CHIP_TEAL}>{`대조 ${insight.targetCompare}%`}</Chip> : null}
        </span>
        <ExcludeButton checked={false} onClick={() => onAction(`${target.ftwrId} 제외`)} />
      </div>
      {insight.others.map((c) => (
        <div
          key={c.ftwrId}
          data-candidate={c.ftwrId}
          data-excluded={c.excluded ? "true" : undefined}
          className={cn("grid w-[112px] justify-items-center gap-[2px] pt-[3px]", c.excluded && "opacity-45")}
        >
          <span className="relative block h-[84px] w-[62px] overflow-hidden rounded-[10px] border border-solid border-border bg-foreground">
            <img src={c.image} alt={`신발 ${c.ftwrId} 밑창`} className="block size-full object-contain" />
          </span>
          <b className={cn("font-code text-[11px] text-foreground", c.excluded && "line-through")}>{c.ftwrId}</b>
          <span className="font-code text-[9.5px] text-dim">{c.from}</span>
          {c.aiRerank ? <Chip className={CHIP_TEAL}>{c.aiRerank}</Chip> : <span className="h-[16px]" />}
          <ExcludeButton checked={!!c.excluded} onClick={() => onAction(`${c.ftwrId} 제외`)} />
        </div>
      ))}
    </div>
  )
}
