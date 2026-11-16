import type { Shoe } from "@/entities/shoe"
import { cn } from "@/shared/lib/utils"
import { AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Chip } from "@/shared/ui/kit"

import type { ShoeCardInfo, ShoeCardMark, ShoeWorkStatus } from "../model/types"

// 문양보기 카드 한 장(시안 S10 카드). info 가 있으면(신규 켬) 작업 상태 칩 + 이미지 위 AI 표시를 그린다.
const WARN_TAG = "border-warn-line bg-warn-bg text-warn"
const TAG_POS = "absolute top-[4px] right-[4px]"

const STATUS_CLASS: Record<ShoeWorkStatus, { variant: "blue" | "default" | "amber"; className?: string }> = {
  "승인 대기": { variant: "blue" },
  "문양 대기": { variant: "default" },
  "측면 없음": { variant: "default", className: "border-danger-line bg-danger-bg text-danger-fg" },
  "AI 확인 필요": { variant: "amber" },
}

function CardMark({ mark }: { mark: ShoeCardMark }) {
  if (mark === "scan") {
    return (
      <>
        <ScanOverlay active />
        <AiTag variant="progress" className={TAG_POS}>
          AI 읽는 중
        </AiTag>
      </>
    )
  }
  if (mark === "dup") {
    return <AiTag variant="progress" className={cn(TAG_POS, WARN_TAG)}>중복 의심</AiTag>
  }
  const low = mark < 0.7
  return (
    <AiTag variant="done" className={cn(TAG_POS, low && WARN_TAG)}>
      {`AI ${mark.toFixed(2)}`}
    </AiTag>
  )
}

interface ShoeCardProps {
  shoe: Shoe
  selected: boolean
  hasPattern: boolean
  info?: ShoeCardInfo
  onOpen: (ftwrId: string) => void
  /** (r3) 사진 칸 높이 클래스 — 카드 크기 */
  imageClass?: string
  /** (r3) 자동 넘기기가 가리키는 카드(파란 윤곽 · 열지는 않는다) */
  highlighted?: boolean
}

export function ShoeCard({ shoe, selected, hasPattern, info, onOpen, imageClass = "h-[92px]", highlighted = false }: ShoeCardProps) {
  const status = info ? STATUS_CLASS[info.status] : null
  return (
    // 카드 어디를 눌러도 열린다(시안: 카드 클릭 = 같은 자리 레이어 창). 키보드는 안쪽 버튼의 눌림이 여기로 올라온다.
    <div
      onClick={() => onOpen(shoe.ftwrId)}
      data-shoe-id={shoe.ftwrId}
      aria-current={highlighted ? "true" : undefined}
      className={cn(
        "grid min-w-0 cursor-pointer gap-[4px] rounded-[8px] border border-solid p-[4px]",
        selected ? "border-brand bg-brand-bg" : "border-line-2 bg-panel-2",
        highlighted && "outline-2 outline-offset-1 outline-brand",
      )}
    >
      <button
        type="button"
        aria-label={`${shoe.ftwrId} 열기`}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border border-solid border-border bg-canvas p-0",
          imageClass,
        )}
      >
        {shoe.image && <img src={shoe.image} alt="" className="size-full object-contain" />}
        {info?.mark !== undefined && (
          <span data-plus="" className="contents">
            <CardMark mark={info.mark} />
          </span>
        )}
      </button>
      <span className="flex items-center gap-[4px]">
        <span aria-hidden="true" className="size-[11px] rounded-[3px] border border-solid border-line-3" />
        <span className="truncate font-code text-[11.5px] text-foreground">{shoe.ftwrId}</span>
      </span>
      {info && status ? (
        <span data-plus="" className="justify-self-start">
          <Chip variant={status.variant} className={cn("h-[18px] px-[6px] text-[10px]", status.className)}>
            {info.status}
          </Chip>
        </span>
      ) : (
        <Chip className="justify-self-start">{hasPattern ? "입력" : "미입력"}</Chip>
      )}
    </div>
  )
}
