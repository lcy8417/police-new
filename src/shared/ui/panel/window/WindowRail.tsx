import * as React from "react"
import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { ResizeHandle } from "../../kit"
import { partAttrs } from "../../part-attrs"

// r4 로망 이식: 창 머리 아래 왼쪽 작은 목록. 생김새 기준은 로망 `qa/HistoryRail`(시안 office-qa-mockup
// `.wgrid` 232 | 본문 · `.rail` 연한 바탕 + 오른쪽 선 · `.rail-top` 위 칸 · `.rday` 묶음 머리 · `.ritem` 줄 모서리 9 · 여백 8 9 ·
// 고른 줄 연분홍 + aria-current · 올리면 회색)과 `doc/DocListRail`(묶음 이름 + 수).
// 줄 = 작은 썸네일 + 이름(12 굵게) + 아래 한 줄(10.5 회색, 있을 때만) + 오른쪽 상태 알약 칸(폭 고정 · 가운데 — 알약 길이가 달라도 줄이 맞는다).
// 색만 대응: rail 바탕 → panel-2, 연분홍 고른 줄 → brand-bg, 회색 올림 → strip, 먹 글자 → foreground, 회색 → muted-foreground.
// (확장 11/17 사용자 「왼쪽 사이드바 기본적으로 접혀있을까?? 그리고 정렬이 맘에 안들고, 이 소제목도 맘에 안들어」)
// 접힘(`collapsed`) = 폭 64 썸네일 줄(썸네일 + 번호 + 귀퉁이 표식) · 위 「»」 펼치기 · 아래 `footerCollapsed`. 펼침 = 232 · 위 칸 오른쪽 「«」 접기.
// 묶음 머리는 묶음이 둘 이상일 때만(한 묶음이면 위 칸 제목이 같은 말이라 뺀다).
// (확장 11/17 사용자 「이 사이드바는 좌우 크기 조정 가능하게」) 펼침일 때 `onWidthChange` 를 주면 오른쪽 가장자리에 폭 조절 손잡이(kit ResizeHandle `bare`),
// 폭은 `width`(부르는 쪽이 들고 기억) — 접힘(64)은 그대로.

export interface WindowRailItem {
  id: string
  /** 줄 이름(「_1」) */
  name: string
  /** 이름 아래 작은 글자 */
  sub?: ReactNode
  /** 썸네일 그림 주소(없으면 그리지 않음) */
  thumbSrc?: string
  /** 오른쪽 상태 알약 */
  pill?: ReactNode
  /** 접혔을 때 썸네일 귀퉁이 작은 표식(「✓」 등) — 알약 대신 */
  mark?: ReactNode
  /** 화면 읽기 이름(기본 = 이름). 접혔을 때는 마우스 설명으로도 쓴다 */
  ariaLabel?: string
}

export interface WindowRailGroup {
  /** 묶음 이름(없으면 머리 없이 줄만) */
  name?: string
  items: readonly WindowRailItem[]
}

export interface WindowRailProps {
  /** 목록 접근성 이름(「현장 이미지 목록」) */
  label: string
  groups: readonly WindowRailGroup[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** 위 칸 슬롯(요약 한 줄 등) — 아래 선으로 나눈다. 접히면 숨김 */
  top?: ReactNode
  /** 맨 아래 칸 슬롯(사진 추가 · 끌어 놓기 등) — 위 선으로 나누고 목록이 길어도 바닥에 붙는다. 접히면 숨김 */
  footer?: ReactNode
  /** 접혔을 때 맨 아래 칸(「+」 단추 등) */
  footerCollapsed?: ReactNode
  /** 폭 208(기본 232) */
  narrow?: boolean
  /** 접힘 — 폭 64 썸네일 줄 */
  collapsed?: boolean
  /** 주면 위 칸에 접기 「«」 · 펼치기 「»」 단추 */
  onToggle?: () => void
  /** 펼친 폭(px) — 주면 이 폭(사람이 끌어 정한 런타임 값이라 인라인 style), 없으면 232(`narrow` 208) */
  width?: number
  /** 주면 펼쳤을 때 오른쪽 가장자리에 폭 조절 손잡이(끌기 · ← → 키 — kit ResizeHandle) */
  onWidthChange?: (width: number) => void
  /** 손잡이 두 번 누름 — 기본 폭으로 */
  onWidthReset?: () => void
  /** 폭 범위(기본 200 ~ 380) */
  minWidth?: number
  maxWidth?: number
  /** 위치 식별자(`data-part-id`) */
  partId?: string
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"
const TOGGLE = cn(
  "m-0 grid size-7 flex-none cursor-pointer place-items-center rounded-[8px] border border-solid border-border bg-panel p-0 text-[14px] font-bold leading-none text-fg-2 transition-colors duration-150 hover:bg-strip motion-reduce:transition-none",
  FOCUS
)

export function WindowRail({
  label,
  groups,
  selectedId,
  onSelect,
  top,
  footer,
  footerCollapsed,
  narrow = false,
  collapsed = false,
  onToggle,
  width,
  onWidthChange,
  onWidthReset,
  minWidth = 200,
  maxWidth = 380,
  partId,
}: WindowRailProps) {
  const navRef = React.useRef<HTMLElement>(null)
  const showGroupHead = groups.filter((g) => g.items.length > 0).length > 1
  const toggle = onToggle ? (
    <button
      type="button"
      aria-label={collapsed ? "이미지 목록 펼치기" : "이미지 목록 접기"}
      aria-expanded={!collapsed}
      title={collapsed ? "펼치기" : "접기"}
      onClick={onToggle}
      className={TOGGLE}
    >
      {collapsed ? "»" : "«"}
    </button>
  ) : null

  if (collapsed) {
    return (
      <nav
        {...partAttrs("WindowRail", { variant: "collapsed", id: partId })}
        aria-label={label}
        data-slot="window-rail"
        data-collapsed=""
        className="flex min-h-0 w-[64px] flex-col border-r border-solid border-border bg-panel-2"
      >
        {toggle ? <div className="flex justify-center border-b border-solid border-border py-2.5">{toggle}</div> : null}
        <ul className="m-0 flex min-h-0 flex-1 list-none flex-col items-center gap-1 overflow-y-auto px-1.5 pt-2 pb-3">
          {groups.flatMap((g) => g.items).map((item) => {
            const on = item.id === selectedId
            return (
              <li key={item.id} className="w-full">
                <button
                  type="button"
                  data-slot="window-rail-item"
                  aria-current={on ? "true" : undefined}
                  aria-label={item.ariaLabel ?? item.name}
                  title={item.ariaLabel ?? item.name}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "m-0 flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-[9px] border-0 px-1 py-1.5 transition-colors duration-150 motion-reduce:transition-none",
                    on ? "bg-brand-bg" : "bg-transparent hover:bg-strip",
                    FOCUS
                  )}
                >
                  <span className="relative block h-[40px] w-[28px] flex-none">
                    {item.thumbSrc ? (
                      <span className="block size-full overflow-hidden rounded-[5px] border border-solid border-border bg-canvas">
                        <img src={item.thumbSrc} alt="" className="block size-full object-contain" />
                      </span>
                    ) : null}
                    {item.mark ? (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full border border-solid border-panel bg-panel-3 px-0.5 text-[9px] font-bold leading-none text-fg-2"
                      >
                        {item.mark}
                      </span>
                    ) : null}
                  </span>
                  <b className={cn("font-code text-[11px] font-bold", on ? "text-foreground" : "text-fg-2")}>{item.name}</b>
                </button>
              </li>
            )
          })}
        </ul>
        {footerCollapsed ? (
          <div data-slot="window-rail-footer" className="flex shrink-0 justify-center border-t border-solid border-border py-2.5">
            {footerCollapsed}
          </div>
        ) : null}
      </nav>
    )
  }

  return (
    <nav
      ref={navRef}
      {...partAttrs("WindowRail", { variant: narrow ? "narrow" : undefined, id: partId })}
      aria-label={label}
      data-slot="window-rail"
      className={cn(
        "relative flex min-h-0 flex-col border-r border-solid border-border bg-panel-2",
        width === undefined && (narrow ? "w-[208px]" : "w-[232px]")
      )}
      style={width === undefined ? undefined : { width }}
    >
      {onWidthChange ? (
        // 오른쪽 가장자리 선 위에 겹친 손잡이(평소 선은 목록 테두리 — 올리거나 초점 · 끄는 중에만 brand 선)
        <ResizeHandle
          label="이미지 목록 폭"
          value={width ?? (narrow ? 208 : 232)}
          min={minWidth}
          max={maxWidth}
          onChange={onWidthChange}
          onReset={onWidthReset}
          grow="right"
          measure={() => navRef.current?.getBoundingClientRect().width}
          bare
          className="absolute inset-y-0 -right-[6px] z-[2]"
        />
      ) : null}
      {top || toggle ? (
        <div className="flex items-start gap-2 border-b border-solid border-border px-3 pt-2.5 pb-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">{top}</div>
          {toggle}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-1.5 pb-3">
        {groups.map((group, gi) => (
          <div key={group.name ?? gi} className="flex flex-col gap-0.5">
            {group.name && showGroupHead ? (
              <p className="m-0 flex items-center gap-2 px-1.5 pt-2.5 pb-1 text-[10.5px] font-bold text-muted-foreground">
                {group.name}
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
                <small className="text-[10.5px] font-normal">{group.items.length}</small>
              </p>
            ) : null}
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {group.items.map((item) => {
                const on = item.id === selectedId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-slot="window-rail-item"
                      aria-current={on ? "true" : undefined}
                      aria-label={item.ariaLabel}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "m-0 flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 px-[9px] py-1 text-left transition-colors duration-150 motion-reduce:transition-none",
                        on ? "bg-brand-bg" : "bg-transparent hover:bg-strip",
                        FOCUS
                      )}
                    >
                      {item.thumbSrc ? (
                        <span className="block h-[40px] w-[28px] flex-none overflow-hidden rounded-[5px] border border-solid border-border bg-canvas">
                          <img src={item.thumbSrc} alt="" className="block size-full object-contain" />
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-1 flex-col gap-px">
                        <b className={cn("truncate font-code text-[12.5px] font-bold", on ? "text-foreground" : "text-fg-2")}>
                          {item.name}
                        </b>
                        {item.sub ? <small className="truncate text-[10.5px] text-muted-foreground">{item.sub}</small> : null}
                      </span>
                      {item.pill ? <span className="flex w-[60px] flex-none justify-center">{item.pill}</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer ? (
        <div data-slot="window-rail-footer" className="flex shrink-0 flex-col gap-2 border-t border-solid border-border px-3 pt-2.5 pb-3">
          {footer}
        </div>
      ) : null}
    </nav>
  )
}
