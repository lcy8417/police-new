import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../part-attrs"

// 조회 실패 한 줄: 회색 「확인 못 함 · 시:분 · 다시」(SKILL 「상태 표시」). 「결과 없음」과 다른 모양이다.
// 빨강 대신 회색을 쓴다 — 모르는 것을 틀린 것으로 보이게 하지 않는다. 실패는 그 자리에 남고 다시 시도 버튼이 있다.
export interface InlineErrorProps {
  message: string
  /** 확인을 시도한 시각 「시:분」 */
  at?: string
  onRetry?: () => void
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  className?: string
}

export function InlineError({ message, at, onRetry, partId, className }: InlineErrorProps) {
  return (
    <span
      {...partAttrs("InlineError", { id: partId })}
      role="status"
      className={cn("inline-flex items-center gap-[6px] text-[12px] text-muted-foreground", className)}
    >
      <span>{message}</span>
      {at ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="font-code tabular-nums">{at}</span>
        </>
      ) : null}
      {onRetry ? (
        <>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onRetry}
            className="border-0 bg-transparent p-0 text-[inherit] text-brand cursor-pointer underline-offset-2 hover:underline"
          >
            다시
          </button>
        </>
      ) : null}
    </span>
  )
}
