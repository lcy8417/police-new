import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "../kit"
import { partAttrs } from "../part-attrs"

// 두 그림 비교(S03 뷰어 B · S06 · S07 · S08): 나란히 · 겹쳐 · 밀어서. 그림은 부모가 만들어 넘긴다.
// 표시 크기를 재서 좌표를 보내는 캔버스 화면에는 쓰지 않는다(layout.md) — 겹침 · 밀기 틀이 크기를 바꾼다.
export type CompareMode = "side" | "overlay" | "slide"

const MODES: { value: CompareMode; label: string }[] = [
  { value: "side", label: "나란히" },
  { value: "overlay", label: "겹쳐" },
  { value: "slide", label: "밀어서" },
]

export interface CompareViewProps extends Omit<React.ComponentProps<"div">, "children"> {
  left: React.ReactNode
  right: React.ReactNode
  mode: CompareMode
  /** 있으면 모드 전환 버튼 줄을 그린다 */
  onModeChange?: (mode: CompareMode) => void
  leftLabel: string
  rightLabel: string
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-code text-[10.5px] font-semibold text-fg-2">{children}</span>
}

export function CompareView({
  left,
  right,
  mode,
  onModeChange,
  leftLabel,
  rightLabel,
  partId,
  className,
  ...props
}: CompareViewProps) {
  const [pos, setPos] = React.useState(50)
  return (
    <div
      {...partAttrs("CompareView", { variant: mode, id: partId })}
      className={cn("flex min-w-0 flex-col gap-[8px]", className)}
      {...props}
    >
      {onModeChange ? (
        <div className="flex gap-[4px]">
          {MODES.map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={m.value === mode ? "pri" : "default"}
              aria-pressed={m.value === mode}
              onClick={() => onModeChange(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      ) : null}

      {mode === "side" ? (
        <div className="grid min-w-0 grid-cols-2 gap-[8px]">
          <div className="flex min-w-0 flex-col gap-[4px]">
            <Label>{leftLabel}</Label>
            <div className="min-w-0 overflow-hidden">{left}</div>
          </div>
          <div className="flex min-w-0 flex-col gap-[4px]">
            <Label>{rightLabel}</Label>
            <div className="min-w-0 overflow-hidden">{right}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between">
            <Label>{leftLabel}</Label>
            <Label>{rightLabel}</Label>
          </div>
          <div className="relative min-w-0 overflow-hidden">
            <div>{left}</div>
            {mode === "overlay" ? (
              <div className="pointer-events-none absolute inset-0 opacity-50">{right}</div>
            ) : (
              <div
                className="pointer-events-none absolute inset-0"
                // 좌표 파생 값(가르는 위치)만 인라인 style
                style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
              >
                {right}
              </div>
            )}
            {mode === "slide" ? (
              <input
                type="range"
                min={0}
                max={100}
                value={pos}
                aria-label="밀어서 비교"
                onChange={(e) => setPos(Number(e.target.value))}
                className="absolute inset-x-0 bottom-[6px] z-10 w-full cursor-ew-resize"
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
