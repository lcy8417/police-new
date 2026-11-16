import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../dialog"
import { partAttrs } from "../part-attrs"
import { Button } from "./Button"

// 시안 레이어 팝업(S02 `modal`)의 부품판: 머리(제목 + 오른쪽 동작 + 닫기) · 몸. shadcn `dialog.tsx` 를 감싼다.
// 머리 오른쪽에는 SCAS 순서의 버튼 줄(`actions`, 보통 panel 의 ButtonBar)을 받는다 — kit 은 panel 을 가져오지 않는다.
// `large` 는 큰 팝업(폭 90%). 기본 크기의 폭은 시안 S02 모달 폭이 화면마다 달라 임시값이다(노트 「남은 차이」).
export type DialogShellSize = "default" | "large"

export interface DialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  size?: DialogShellSize
  /** 머리 오른쪽 동작(닫기 앞) */
  actions?: React.ReactNode
  children: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const SIZE_CLASS: Record<DialogShellSize, string> = {
  default: "w-[calc(100%-2rem)] sm:max-w-[720px]",
  large: "w-[90%] sm:max-w-none",
}

export function DialogShell({ open, onOpenChange, title, size = "default", actions, children, partId }: DialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...partAttrs("DialogShell", { variant: size === "large" ? "large" : undefined, id: partId })}
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 p-0 rounded-[12px] border-brand-line bg-panel text-foreground [box-shadow:0_24px_70px_var(--t-panel-drop)]",
          SIZE_CLASS[size]
        )}
      >
        <div className="flex h-[42px] shrink-0 items-center gap-[8px] rounded-t-[12px] border-b border-solid border-brand-line bg-brand-bg pr-[10px] pl-[14px]">
          <DialogTitle className="text-[13.5px] leading-[normal] font-bold text-foreground">{title}</DialogTitle>
          <span className="ml-auto flex items-center gap-[6px]">
            {actions}
            <DialogClose asChild>
              <Button size="sm">닫기</Button>
            </DialogClose>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
