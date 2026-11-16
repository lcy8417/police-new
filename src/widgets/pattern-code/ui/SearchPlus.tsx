import { cn } from "@/shared/lib/utils"
import { LiveDot } from "@/shared/ui/ai"
import { Chip } from "@/shared/ui/kit"

import { SEARCH_METHODS } from "../model/constants"
import type { FunnelStep, SearchMethod } from "../model/types"
import { Band } from "./Band"

// S04 오른쪽 칸 시안 r2 덧붙임 — 검색 방식(핀 7) · 검색 전 미리보기 깔때기(핀 12). 둘 다 +α 라 `data-plus`.

/** 검색 방식 3가지 — 이미지 검색을 추천으로 강조(시안 핀 7) */
export function SearchMethodPicker({
  value,
  onChange,
  disabled,
}: {
  value: SearchMethod
  onChange: (next: SearchMethod) => void
  disabled: boolean
}) {
  return (
    <section data-plus="" aria-label="검색 방식 덧붙임" className="flex flex-col gap-[6px]">
      <Band
        title={
          <>
            검색 방식 <span className="text-[11px] font-normal text-ai">덧붙임</span>
          </>
        }
      />
      <div role="radiogroup" aria-label="검색 방식" className="grid gap-[6px] text-[12px]">
        {SEARCH_METHODS.map((m) => {
          const on = m.value === value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(m.value)}
              className={cn(
                "grid cursor-pointer gap-[2px] rounded-[8px] border border-solid text-left disabled:cursor-not-allowed",
                on ? "border-ai bg-ai-bg px-[10px] py-[8px] text-foreground" : "border-border bg-transparent px-[10px] py-[6px] text-fg-2",
              )}
            >
              <span className="flex flex-wrap items-center gap-[4px]">
                <span aria-hidden="true" className={on ? "text-ai" : "text-faint"}>
                  {on ? "◉" : "○"}
                </span>
                {on ? <b>{m.label}</b> : <span>{m.label}</span>}
                {m.recommended ? (
                  <Chip variant="h18" className="border-ai-line bg-ai-bg px-[6px] text-[10.5px] text-ai">
                    추천
                  </Chip>
                ) : null}
                {on ? null : <span className="text-[11px] text-dim">{m.note}</span>}
              </span>
              {on ? <span className="text-[11px] text-muted-foreground">{m.note}</span> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/** 깔때기 단별 막대 색(시안: line3 · blue3 · blue2 · teal + 번짐) */
const BAR_TONE = ["bg-line-3", "bg-brand-3", "bg-brand-2", "bg-ai shadow-[0_0_10px_var(--t-ai-scan-glow)]"]

/** 검색 전 미리보기 — 신발 DB → 매칭 조건 → 필수 문양 → 먼저 볼 후보(시안 핀 12) */
export function SearchFunnel({ steps, note }: { steps: readonly FunnelStep[]; note: string }) {
  return (
    <section
      data-plus=""
      aria-label="검색 전 미리보기"
      className="grid gap-[6px] rounded-[10px] border border-solid border-ai-line bg-[linear-gradient(160deg,var(--t-ai-bg),var(--t-panel-2))] p-[10px]"
    >
      <span className="flex items-center gap-[6px] text-[11.5px]">
        <LiveDot state="busy" label="검색 전 미리보기" hideLabel />
        <b aria-hidden="true" className="text-ai">
          검색 전 미리보기
        </b>
        <span className="ml-auto text-[10px] text-dim">문양 바꾸면 바로 다시 셈</span>
      </span>
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        const ratio = Math.min(100, Math.max(0, s.ratio))
        return (
          <div key={s.label} className="grid gap-[3px]">
            <span className="flex justify-between text-[11px]">
              <span className={last ? "text-ai" : "text-muted-foreground"}>{s.label}</span>
              <b className="font-code text-foreground tabular-nums">{s.value}</b>
            </span>
            <span
              aria-hidden="true"
              className={cn("block h-[6px] rounded-[3px]", BAR_TONE[Math.min(i, BAR_TONE.length - 1)])}
              // 깔때기 폭(계산값) — 가운데 맞춤 좌우 여백만 인라인 style
              style={{ marginInline: `${(100 - ratio) / 2}%` }}
            />
          </div>
        )
      })}
      <span className="text-[10.5px] leading-[1.45] text-dim">{note}</span>
    </section>
  )
}
