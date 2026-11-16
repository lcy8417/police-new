import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { useThemePortalContainer } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"
import { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "../dialog"
import { partAttrs } from "../part-attrs"
import { Button } from "./Button"

// 시안 레이어 팝업(S02 `modal`)의 부품판: 머리(제목 + 오른쪽 동작 + 닫기) · 몸. shadcn `dialog.tsx` 를 감싼다.
// 머리 오른쪽에는 SCAS 순서의 버튼 줄(`actions`, 보통 panel 의 ButtonBar)을 받는다 — kit 은 panel 을 가져오지 않는다.
// `large` 는 큰 팝업(폭 90%). 기본 크기의 폭은 시안 S02 모달 폭이 화면마다 달라 임시값이다(노트 「남은 차이」).
// `variant="layer"` 는 시안 S10 의 「뒤 목록 위에 깔리는 창」: 화면 전체가 아니라 `container`(position 이 잡힌 칸) 안에
// 절대 위치(왼쪽 150 · 위 500 · 폭 880)로 뜨고, 덮개는 그 칸에만 씌운다. 머리 오른쪽은 `headerRight` + ✕.
export type DialogShellSize = "default" | "large"
export type DialogShellVariant = "modal" | "layer"

export interface DialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  size?: DialogShellSize
  /** `layer` 면 시안의 레이어 창(기본 `modal`) */
  variant?: DialogShellVariant
  /** `layer` 가 붙을 칸(position: relative). 없으면 문서 본문 */
  container?: HTMLElement | null
  /** 제목 바로 옆(아이디 · 칩 등) */
  titleExtra?: React.ReactNode
  /** 머리 오른쪽 끝(닫기 앞)의 안내 문구 등. `actions` 보다 뒤 */
  headerRight?: React.ReactNode
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

export function DialogShell({
  open,
  onOpenChange,
  title,
  size = "default",
  variant = "modal",
  container,
  titleExtra,
  headerRight,
  actions,
  children,
  partId,
}: DialogShellProps) {
  // 시안 화면 범위(ThemeScope) 안이면 그 범위의 포털 자리로 띄워 팔레트 · 글꼴 · 배율을 받는다. 범위 밖이면 null → body(전과 같음)
  const scopePortal = useThemePortalContainer()
  if (variant === "layer") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal container={container ?? scopePortal ?? undefined}>
          <DialogOverlay className="absolute z-[5] bg-canvas/55 backdrop-blur-none" />
          <DialogPrimitive.Content
            {...partAttrs("DialogShell", { variant: "layer", id: partId })}
            aria-describedby={undefined}
            className="absolute top-[480px] left-[150px] z-[6] flex max-h-none w-[880px] max-w-full flex-col rounded-[14px] border border-solid border-line-3 bg-panel text-foreground shadow-[0_30px_80px_var(--t-panel-drop)] outline-none"
          >
            <div className="flex min-h-[40px] shrink-0 items-center gap-[10px] rounded-t-[14px] border-b border-solid border-line-2 bg-brand-bg px-[14px]">
              <DialogTitle className="text-[13px] leading-[normal] font-semibold text-foreground">{title}</DialogTitle>
              {titleExtra}
              <span className="ml-auto flex items-center gap-[6px]">
                {actions}
                {headerRight}
                <DialogClose aria-label="닫기" className="cursor-pointer border-0 bg-transparent p-0 text-muted-foreground">
                  ✕
                </DialogClose>
              </span>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...partAttrs("DialogShell", { variant: size === "large" ? "large" : undefined, id: partId })}
        showCloseButton={false}
        container={scopePortal}
        aria-describedby={undefined}
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 p-0 rounded-[12px] border-brand-line bg-panel text-foreground shadow-[0_24px_70px_var(--t-panel-drop)]",
          SIZE_CLASS[size]
        )}
      >
        <div className="flex h-[42px] shrink-0 items-center gap-[8px] rounded-t-[12px] border-b border-solid border-brand-line bg-brand-bg pr-[10px] pl-[14px]">
          <DialogTitle className="text-[13.5px] leading-[normal] font-bold text-foreground">{title}</DialogTitle>
          {titleExtra}
          <span className="ml-auto flex items-center gap-[6px]">
            {actions}
            {headerRight}
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
