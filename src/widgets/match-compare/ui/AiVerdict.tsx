import { ChevronDown } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { AiTag, ConfidenceBar } from "@/shared/ui/ai"

import type { MatchVerdict } from "../model/types"

// 사건 창 정밀 대조 오른쪽 칸 「AI 대조」(11/17 사용자 「AI 대조 적힌 부분 … 컴팩트하고 딱 일목요연하게. 고급지게」).
// 종합 점수(큰 숫자) · 상 · 중 · 하 점수 막대 · 한 줄 의견(참고) · 지표는 접힌 「자세히」 — 그 밖의 설명 상자 · 겹쳐 보기 미리보기는 뺐다.
// 값은 +α(insight — 진열)나 실제 값(verdict) 둘 다 받는다. 실제 값에 없는 칸(부위 · 의견 · 지표)은 그 줄을 그리지 않는다.

const LABEL = "text-[10px] font-semibold tracking-[0.04em] text-muted-foreground"

export function AiVerdict({ insight, plus = true }: { insight: MatchVerdict; plus?: boolean }) {
  const ok = insight.pairs.filter((p) => p.ok).length
  const details = [...insight.metrics, ...insight.preStats]
  return (
    <section aria-label="AI 대조" data-plus={plus ? "" : undefined} data-ai-verdict className="flex min-w-0 flex-col gap-[12px]">
      <div className="flex items-center gap-[6px]">
        <AiTag>AI 대조 · 참고</AiTag>
        <span className="ml-auto font-code text-[10px] text-dim">{insight.preparedAt}</span>
      </div>

      <div className="grid gap-[6px]">
        <span className={LABEL}>종합</span>
        <span className="flex items-baseline gap-[4px]">
          <b data-ai-score className="font-code text-[28px] leading-none font-bold tracking-[-0.02em] text-ai tabular-nums">
            {insight.confidence}
          </b>
          <span className="font-code text-[13px] font-semibold text-ai">%</span>
          {insight.pairs.length > 0 ? (
            <span className="ml-auto font-code text-[11px] text-muted-foreground tabular-nums">{`대응점 ${ok}/${insight.pairs.length}`}</span>
          ) : null}
        </span>
        <ConfidenceBar value={insight.confidence} scale="percent" label="종합 신뢰도" className="[&>span]:hidden" />
      </div>

      {insight.basis.length > 0 ? (
        <ul aria-label="부위별 점수" className="m-0 grid list-none gap-[7px] border-0 border-t border-solid border-border p-0 pt-[10px]">
          {insight.basis.map((r) => (
            <li key={r.zone} data-basis-zone={r.zone} title={r.why} className="grid grid-cols-[18px_minmax(0,1fr)_14px] items-center gap-[8px]">
              <b className="text-[12.5px] text-foreground">{r.zone}</b>
              <ConfidenceBar
                value={r.score}
                scale="unit"
                threshold={0.5}
                label={`${r.zone} 부위 점수`}
                className={cn("[&>span]:w-[30px] [&>span]:text-right [&>span]:text-[11px] [&>span]:font-semibold", r.ok ? "[&>span]:text-ai" : "[&>span]:text-warn")}
              />
              <span aria-label={r.ok ? "일치" : "불일치"} className={cn("text-center text-[11px] font-bold", r.ok ? "text-ai" : "text-warn")}>
                {r.ok ? "✓" : "✕"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {insight.opinion ? (
        <p className="m-0 border-0 border-l-2 border-solid border-ai-line pl-[8px] text-[12.5px] leading-[1.45] text-fg-2">{insight.opinion}</p>
      ) : null}

      {details.length > 0 ? (
        <details className="group border-0 border-t border-solid border-border pt-[8px]">
          <summary className="flex cursor-pointer list-none items-center gap-[4px] text-[11px] font-semibold text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            자세히
            <ChevronDown aria-hidden="true" className="size-[13px] transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <dl className="m-0 mt-[8px] grid grid-cols-2 gap-x-[12px] gap-y-[5px] text-[11px]">
            {details.map(([k, v]) => (
              <div key={k} className="flex min-w-0 justify-between gap-[6px]">
                <dt className="truncate text-muted-foreground">{k}</dt>
                <dd className="m-0 font-code text-fg-2 tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </section>
  )
}
