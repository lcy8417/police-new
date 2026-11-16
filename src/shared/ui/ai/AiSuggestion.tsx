import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "../kit"
import { partAttrs } from "../part-attrs"

// AI 제안 한 줄(시안 S03 「AI 제안」 aiRow · S12 「AI 연결 제안」 · S02 채취 방법 제안). 제안 + 근거 + 「적용」 버튼.
// 제안은 사람이 눌러야 반영된다 — onApply 가 없으면 버튼을 그리지 않는다(읽기만 하는 자리).
// confidence: 0~1 확신도(시안 S12 의 `0.93` / `0.71`). lowBelow 미만이면 주황(시안: 낮으면 노란색) + 「낮음」 글자 알림.
// actionTone: 버튼 색. warn 은 시안 「반전」 처럼 되돌리기 어려운 변경(주황 버튼).
export interface AiSuggestionProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  title: React.ReactNode
  /** 흐린 근거 한 줄 */
  reason?: React.ReactNode
  confidence?: number
  /** 이 값 미만이면 낮음(기본 0.8) */
  lowBelow?: number
  actionLabel?: string
  actionTone?: "default" | "warn"
  onApply?: () => void
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

export function AiSuggestion({
  title,
  reason,
  confidence,
  lowBelow = 0.8,
  actionLabel = "적용",
  actionTone = "default",
  onApply,
  partId,
  className,
  ...props
}: AiSuggestionProps) {
  const hasConf = confidence !== undefined && Number.isFinite(confidence)
  const low = hasConf && confidence < lowBelow
  return (
    <div
      {...partAttrs("AiSuggestion", { state: low ? "low" : undefined, id: partId })}
      className={cn(
        "grid items-center gap-[6px] text-[11px] leading-[1.35]",
        hasConf ? "grid-cols-[minmax(0,1fr)_auto_auto]" : "grid-cols-[minmax(0,1fr)_auto]",
        className,
      )}
      {...props}
    >
      <span>
        <b className="font-bold text-foreground">{title}</b>
        {reason != null && (
          <>
            <br />
            <span className="text-dim">{reason}</span>
          </>
        )}
      </span>
      {hasConf && (
        <b
          title={low ? "낮음" : undefined}
          aria-label={low ? `확신도 ${confidence.toFixed(2)} 낮음` : `확신도 ${confidence.toFixed(2)}`}
          className={cn("font-code text-[12px] font-bold tabular-nums", low ? "text-warn" : "text-ai")}
        >
          {confidence.toFixed(2)}
        </b>
      )}
      {onApply && (
        <Button
          size="sm"
          variant={actionTone === "warn" ? "warn" : "default"}
          className="h-[22px] px-[7px]"
          onClick={onApply}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
