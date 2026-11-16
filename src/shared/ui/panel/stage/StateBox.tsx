import { cn } from "@/shared/lib/utils"

import { NUM_TONE, type PanelState } from "./state-tone"

// r4 로망 이식(`shared/ui/panel/stage/StateBox.tsx` StepNum): 단계 띠 · 할 일 상자의 번호 동그라미. 색 표는 state-tone.ts.

/** [UI] 번호 동그라미 — 끝 ✓ · 해당 없음 – · 나머지 번호. size = 단계 띠 17 · 할 일 상자 16(로망 시안 실측). now = 지금 칸 위 흰 동그라미 */
export function StepNum({ state, n, size = 17, now = false }: { state: PanelState; n: number | string; size?: 16 | 17; now?: boolean }) {
  return (
    <i
      aria-hidden="true"
      data-slot="panel-step-num"
      data-num-state={now ? "now" : state}
      className={cn(
        "grid flex-none place-items-center rounded-full font-bold not-italic leading-none",
        size === 16 ? "size-4 text-[10px]" : "size-[17px] text-[10.5px]",
        NUM_TONE[now && state !== "done" ? "now" : state]
      )}
    >
      {state === "done" ? "✓" : state === "notApplicable" ? "–" : n}
    </i>
  )
}
