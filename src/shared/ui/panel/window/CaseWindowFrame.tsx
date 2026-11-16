import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식(`shared/ui/panel/window/ClientWindowFrame` + `use-client-window-escape`): 목록 위 오른쪽에서 열리는 큰 창 틀.
// 로망은 판 위 한 겹에 가림막(판 자리만) + 오른쪽 창(흰 · 모서리 14 · 서랍 그림자)을 그리고, 사이드바는 그대로 둔다.
// 경찰 진열 틀에서는 ScasShell 둥근 내용 판(relative · overflow-clip)이 그 「판 자리」다 — 틀은 그 판을 꽉 채우는 한 겹.
// 높이: 로망 `sticky top-0 h-[calc(100dvh-76px)]`(위 막대 56 + 띄움 20) → 경찰 진열 틀은 진열 막대 30 + 판 위 띄움 10 +
// 위 막대 56 + 판 아래 띄움 10 = 106 을 뺀다. 판이 화면보다 짧으면 판 높이(max-h-full)까지만.
// 색만 대응: 가림막 먹 28% → emblem-to 28%, 서랍 그림자 → panel-drop. 업무 말 · 판정은 없다(머리 · 목록 · 본문은 쓰는 쪽이 넣는다).

/** 다른 층(대화상자 · 확인 창 · 떠 있는 고르기)이 열려 있으면 Esc 는 그 층 몫이다 — 맨 위 것부터 하나씩(로망 스킬 6-2) */
const OTHER_LAYER = '[role="dialog"][data-state="open"], [role="alertdialog"], [data-radix-popper-content-wrapper]'

export interface CaseWindowFrameProps {
  /** 창 이름(화면 읽기) — 「00001-25-0649 주거침입 사건 창」 */
  label: string
  /** 가림막 누름 · Esc */
  onClose: () => void
  /** 본문 */
  children: React.ReactNode
  /** 판 폭 그대로(왼쪽 띄움 22 = 목록 판 왼쪽 끝). 기본 true. false 면 왼쪽 60(판이 조금 보임) */
  wide?: boolean
  /** 창 바로 위 작업 탭 줄(WorkTabStrip). 주면 창 왼쪽 위 모서리를 0 으로 붙인다 */
  tabs?: React.ReactNode
  /** 창 머리(WindowHead) — 창 맨 위 한 줄 */
  head?: React.ReactNode
  /** 머리 아래 왼쪽 목록(WindowRail) — 주면 「목록 | 본문」 격자 */
  rail?: React.ReactNode
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

export function CaseWindowFrame({
  label,
  onClose,
  children,
  wide = true,
  tabs,
  head,
  rail,
  partId,
}: CaseWindowFrameProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  // 닫기는 최신 함수로(창이 열려 있는 동안 사건이 바뀌어도 Esc 등록을 다시 하지 않게)
  const closeRef = React.useRef(onClose)
  React.useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  // Esc 닫기 — 다른 층이 받은 Esc · 위에 뜬 창이 있으면 건드리지 않는다
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector(OTHER_LAYER)) return
      closeRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // 열 때 창으로 초점, 닫힐 때(틀이 사라질 때) 연 곳으로 초점을 돌려준다
  React.useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus({ preventScroll: true })
    return () => {
      if (opener && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  const width = "w-[min(1140px,100%)]"
  const body = rail ? (
    <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
      {rail}
      <div data-slot="case-window-body" className="min-h-0 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  ) : (
    <div data-slot="case-window-body" className="min-h-0 min-w-0 flex-1 overflow-auto">
      {children}
    </div>
  )
  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      data-slot="case-window"
      className={cn(
        "pointer-events-auto flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[14px] bg-panel text-foreground outline-none",
        "[box-shadow:-24px_0_56px_var(--t-panel-drop)]",
        tabs ? "w-full flex-1 rounded-tl-none" : width
      )}
    >
      {head}
      {body}
    </div>
  )

  return (
    <div {...partAttrs("CaseWindowFrame", { variant: wide ? "wide" : undefined, id: partId })} className="contents">
      <div
        data-slot="case-window-scrim"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 z-20 bg-[color-mix(in_srgb,var(--t-emblem-to)_28%,transparent)]"
      />
      {/* 판을 꽉 채우는 한 겹 — 창 칸은 판 스크롤과 함께 붙어 있다(sticky) */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <div
          data-wide={wide || undefined}
          className={cn(
            "sticky top-0 flex h-[calc(100dvh-106px)] max-h-full justify-end py-3 pr-[22px]",
            wide ? "pl-[22px]" : "pl-[60px]"
          )}
        >
          {tabs ? (
            <div data-slot="case-window-tabbed" className={cn("flex min-h-0 min-w-0 flex-col", width)}>
              <div className="pointer-events-auto relative z-[1]">{tabs}</div>
              {dialog}
            </div>
          ) : (
            dialog
          )}
        </div>
      </div>
    </div>
  )
}
