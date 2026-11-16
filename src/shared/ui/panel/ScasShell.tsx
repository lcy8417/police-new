import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Avatar, Chip, Field } from "../kit"
import { partAttrs } from "../part-attrs"

// 시안 `M.shell`(core.js)의 부품판: 위 메뉴(.topnav) · 탭 줄(.mdi) · 왼쪽 메뉴(.side) · 내용(.content).
// 메뉴 · 사용자 · 탭 목록을 받아서 그리기만 한다(권한 판단 · 세션 없음 — 무엇을 보일지는 쓰는 쪽이 정한다).

export interface ScasMenuItem {
  label: string
  /** 있으면 링크, 없으면 글자만(진열 화면용) */
  href?: string
  /** 항목 오른쪽 건수(주황 숫자) */
  count?: number
  /** 시안 `oos`: 자리만 유지하는 SCAS 메뉴(흐리게 + 「SCAS」 꼬리표, 누를 수 없음) */
  disabled?: boolean
}

export interface ScasMenuGroup {
  group: string
  items: ScasMenuItem[]
}

/** 메뉴 링크를 그리는 쪽이 정한다(예: react-router `Link`로 화면 새로고침 없이 이동). 없으면 `<a href>`. */
export interface ScasLinkProps {
  href: string
  className: string
  "aria-current"?: "page"
  children: React.ReactNode
}

export interface ScasShellProps {
  /** 현재 메뉴 항목 이름(`aria-current="page"` + 강조) */
  active: string
  /** 위 메뉴 가운데 제목. 없으면 active */
  title?: string
  /** 탭 줄. 없으면 active 하나 */
  tabs?: string[]
  /** 현재 탭. 없으면 탭 첫째 */
  tabOn?: string
  menu: ScasMenuGroup[]
  /** 메뉴 링크 그리기(선택). 껍데기는 라우터를 모른다 */
  renderLink?: (props: ScasLinkProps) => React.ReactNode
  user: { name: string; org: string; roleLabel: string }
  children: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
}

const ITEM_BASE =
  "relative flex items-center gap-[8px] rounded-[7px] py-[6px] pr-[10px] pl-[18px] text-[12.5px] text-muted-foreground no-underline"
const ITEM_ON =
  "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand-line)] " +
  "before:absolute before:top-[7px] before:bottom-[7px] before:left-[4px] before:w-[3px] before:rounded-[2px] " +
  "before:bg-brand before:content-[''] before:[box-shadow:0_0_8px_var(--t-brand)]"
const ITEM_OOS =
  "opacity-[0.45] cursor-default after:ml-auto after:font-code after:text-[9px] after:font-semibold after:text-faint after:content-['SCAS']"

function MenuItem({
  item,
  active,
  renderLink,
}: {
  item: ScasMenuItem
  active: boolean
  renderLink?: ScasShellProps["renderLink"]
}) {
  const className = cn(ITEM_BASE, active && ITEM_ON, item.disabled && ITEM_OOS)
  const inner = (
    <>
      {item.label}
      {item.count != null && (
        <span className="ml-auto font-code text-[10.5px] font-semibold text-warn">{item.count}</span>
      )}
    </>
  )
  // 링크가 아닌 항목(비활성 · href 없음)은 글자만 그린다
  if (item.disabled || item.href == null) {
    return (
      <span
        aria-disabled={item.disabled ? "true" : undefined}
        aria-current={active && !item.disabled ? "page" : undefined}
        className={className}
      >
        {inner}
      </span>
    )
  }
  const current = active ? ("page" as const) : undefined
  if (renderLink) {
    return <>{renderLink({ href: item.href, className, "aria-current": current, children: inner })}</>
  }
  return (
    <a href={item.href} aria-current={current} className={className}>
      {inner}
    </a>
  )
}

export function ScasShell({ active, title, tabs, tabOn, menu, renderLink, user, children, partId }: ScasShellProps) {
  const tabList = tabs ?? [active]
  const currentTab = tabOn ?? tabList[0]
  return (
    <div
      {...partAttrs("ScasShell", { id: partId })}
      className="grid min-h-[860px] grid-rows-[auto_auto_minmax(0,1fr)] bg-canvas text-foreground"
    >
      <div
        className={
          "relative flex h-[64px] items-center gap-[14px] border-b border-solid border-border bg-strip px-[20px] " +
          "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:opacity-[0.55] after:content-[''] " +
          "after:bg-[linear-gradient(90deg,transparent,var(--t-brand)_30%,transparent_75%)]"
        }
      >
        <span
          aria-hidden="true"
          className={
            "grid size-[36px] place-items-center rounded-full " +
            "bg-[radial-gradient(circle_at_35%_30%,var(--t-emblem-from),var(--t-emblem-to))] " +
            "[box-shadow:0_0_18px_0_var(--t-brand-glow),inset_0_0_0_1px_var(--t-brand-line)]"
          }
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="size-[18px]">
            <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z" className="stroke-[var(--t-emblem-stroke)]" />
            <path d="M8.5 12.5l2.4 2.3 4.6-5" className="stroke-brand" />
          </svg>
        </span>
        <span>
          <b className="block text-[14px] leading-[1.2]">경찰청 과학수사</b>
          <small className="font-code text-[9px] font-semibold tracking-[0.18em] text-dim">
            FOOTWEAR FORENSICS · 족윤적 감정
          </small>
        </span>
        <span className="h-[28px] w-px bg-border" />
        <span className="text-[15px] font-semibold">{title ?? active}</span>
        <span className="flex-1" />
        <Field
          icon="search"
          variant="search-shell"
          readOnly
          aria-label="감정번호 · 문서번호 · 화류번호 바로 찾기"
          placeholder="감정번호·문서번호·화류번호 바로 찾기"
        />
        <span className="flex items-center gap-[10px] text-[12px] text-muted-foreground">
          <span className="text-right">
            <b className="block text-[12px] font-semibold text-fg-2">{user.name}</b>
            {user.org}
          </span>
          <Chip variant="blue">{user.roleLabel}</Chip>
          {/* 옆에 이름 글자가 이미 있어 이니셜 그림은 읽지 않는다 */}
          <span aria-hidden="true" className="inline-flex">
            <Avatar name={user.name} />
          </span>
        </span>
      </div>

      <div
        role="tablist"
        className="flex h-[36px] items-end gap-[2px] overflow-hidden border-b border-solid border-border bg-background px-[12px]"
      >
        {tabList.map((tab) => {
          const on = tab === currentTab
          return (
            <span
              key={tab}
              role="tab"
              aria-selected={on}
              className={cn(
                "inline-flex h-[30px] items-center gap-[8px] whitespace-nowrap rounded-t-[8px] border border-b-0 border-solid border-border px-[12px] text-[12.5px]",
                on ? "bg-canvas text-foreground [box-shadow:inset_0_2px_0_var(--t-brand)]" : "bg-panel text-muted-foreground",
              )}
            >
              {tab}
              <span aria-hidden="true" className="text-[11px] text-faint">
                ✕
              </span>
            </span>
          )
        })}
      </div>

      <div className="grid min-h-0 grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="메뉴" className="border-r border-solid border-border bg-strip px-[10px] py-[14px]">
          <h5 className="mx-[8px] mt-[14px] mb-[6px] font-code text-[9.5px] font-semibold tracking-[0.2em] text-faint">
            족윤적
          </h5>
          {menu.map((group) => (
            <React.Fragment key={group.group}>
              <div className="mx-[8px] mt-[8px] mb-[2px] flex justify-between text-[12.5px] font-semibold text-fg-2">
                {group.group}
              </div>
              {group.items.map((item) => (
                <MenuItem key={item.label} item={item} active={item.label === active} renderLink={renderLink} />
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div
          className={
            "relative min-w-0 overflow-hidden px-[20px] pt-[18px] pb-[24px] [&>*]:relative [&>*]:z-[1] " +
            // 점 격자 · 번짐 빛: 순수 장식(클릭을 막지 않는다)
            "before:pointer-events-none before:absolute before:inset-0 before:content-[''] " +
            "before:bg-[radial-gradient(var(--t-dot-grid)_1px,transparent_1px)] before:[background-size:24px_24px] " +
            "before:[mask-image:radial-gradient(ellipse_at_60%_0%,black_0%,transparent_70%)] " +
            "after:pointer-events-none after:absolute after:top-[-120px] after:right-[20%] after:size-[300px] after:rounded-full " +
            "after:bg-[var(--t-glow-orb)] after:blur-[60px] after:content-['']"
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}
