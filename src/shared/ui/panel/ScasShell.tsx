import * as React from "react"
import { ChevronDown, FileText, Search } from "lucide-react"
import { DropdownMenu } from "radix-ui"

import { themeScopeAttrs, useThemePortalContainer, type DisplayPrefs } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"
import { Avatar, Chip, CountDot } from "../kit"
import { partAttrs } from "../part-attrs"

// 진열 화면 앱 틀. r4(2026-11-16 사용자 결정): 생김새는 로망 새 앱 틀(romang `widgets/app-shell/ui/ShellSidebar` ·
// `ShellNavRow` · `ShellTopBar` · `ShellLogo` · `AppShell` PC 구조)을 따르고 색만 경찰 토큰.
// 바깥 어두운 틀(--t-emblem-to: scas-light = SCAS 남색) | 왼쪽 사이드바 232 | 오른쪽 둥근 내용 판(위 막대 h-14 + 내용).
// r3 의 탭 줄 · 점 격자 · 번짐 장식은 로망 틀에 없어 뺐다. 접기는 이번 범위 밖.
// 메뉴 · 사용자를 받아서 그리기만 한다(권한 판단 · 세션 없음 — 무엇을 보일지는 쓰는 쪽이 정한다).

/** 메뉴 아이콘(lucide 아이콘 등) — 틀이 크기 · 선 굵기를 정한다 */
export type ScasMenuIcon = React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>

export interface ScasMenuItem {
  label: string
  /** 있으면 링크, 없으면 글자만(진열 화면용) */
  href?: string
  /** 항목 오른쪽 건수(동그라미 — 0 · 모름은 안 그림) */
  count?: number
  /** 자리만 유지하는 SCAS 메뉴(흐리게 + 「SCAS」 꼬리표, 누를 수 없음) */
  disabled?: boolean
  /** 메뉴 아이콘(없으면 문서 아이콘) */
  icon?: ScasMenuIcon
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
  /** 위 막대 왼쪽 화면 제목. 없으면 active */
  title?: string
  /** 사이드바 메뉴(sidebar). topbar 는 쓰지 않는다 */
  menu?: ScasMenuGroup[]
  /** 메뉴 링크 그리기(선택). 껍데기는 라우터를 모른다 */
  renderLink?: (props: ScasLinkProps) => React.ReactNode
  user: { name: string; org: string; roleLabel: string }
  children: React.ReactNode
  /** 시안 위치 식별자(`data-part-id`) */
  partId?: string
  /** 화면 설정(r3): 주면 루트에 범위 속성(data-theme · data-font · data-scale · data-motion)을 단다. 없으면 :root 값 그대로 */
  display?: DisplayPrefs
  /** 위 막대 오른쪽 끝 자리(예: `<ThemeSettings />` 「화면 설정」). 없으면 그리지 않는다 */
  headerEnd?: React.ReactNode
  /**
   * (11/17 확장) 틀 모양. `sidebar`(기본) = 왼쪽 사이드바 + 둥근 판 안 위 막대,
   * `topbar` = 사이드바 없이 남색 막대 한 줄(로고 · 제목 · meta · 바로 찾기 · barItems · headerEnd · 사용자) + 아래 둥근 판
   */
  layout?: "sidebar" | "topbar"
  /** (topbar) 로고 자리 대신 「← 사건관리」 같은 돌아가기 링크 */
  back?: { label: string; href: string }
  /** (topbar) 제목 뒤 작은 글자(건수 · 갱신 시각 등) */
  meta?: React.ReactNode
  /** (topbar) 바로 찾기 칸을 동작하게 — 없으면 바로 찾기 칸을 그리지 않는다 */
  search?: ScasShellSearch
  /** (topbar) 막대 단추(신발 DB · 관리 ▾) */
  barItems?: readonly ScasBarItem[]
}

/** (topbar) 막대 바로 찾기 칸 — 값은 쓰는 쪽이 들고 있다 */
export interface ScasShellSearch {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 화면 읽기 이름 */
  label?: string
}

/** (topbar) 막대 단추 하나 — href 면 링크, items 면 ▾ 펼침 메뉴(링크 목록) */
export interface ScasBarItem {
  label: string
  icon?: ScasMenuIcon
  href?: string
  /** 지금 열려 있음(brand-3 채움 + aria-current) */
  active?: boolean
  items?: readonly { label: string; href: string }[]
}

// 어두운 틀 위 키보드 초점 — 로망 연분홍 2px 링 → 종이색(항상 밝음) 테
const DARK_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-paper"
// 메뉴 줄 — 높이 36 · 모서리 10 · 여백 0 10 · 아이콘 17 · 사이 10 · 13 굵게 종이색 70%(로망 visual-spec 12-2)
const ROW =
  "relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-bold no-underline transition-colors duration-150 motion-reduce:transition-none"
const ROW_IDLE = "text-paper/70 hover:bg-paper/14 hover:text-paper"
// 고른 메뉴 = brand-3 채움 + 같은 계열 옅은 빛(로망 `bg-cta shadow-shell-select`)
const ROW_ACTIVE = "bg-brand-3 text-paper [box-shadow:0_6px_16px_-6px_var(--t-brand-glow)]"
const ROW_OOS = "cursor-default opacity-[0.45]"
// 위 막대 흰 알약 — 높이 32 · 모서리 10 · 흰 · 테 없음 · 옅은 그림자 · 12 굵게(로망 `SHELL_TOP_BUTTON`)
const TOP_PILL =
  "inline-flex h-8 items-center gap-2 rounded-[10px] bg-panel px-2.5 text-[12px] font-bold text-fg-2 " +
  "[box-shadow:0_1px_2px_var(--t-panel-drop),0_1px_3px_var(--t-panel-drop)]"

function MenuItem({
  item,
  active,
  renderLink,
}: {
  item: ScasMenuItem
  active: boolean
  renderLink?: ScasShellProps["renderLink"]
}) {
  const Icon = item.icon ?? FileText
  const className = cn(ROW, active && !item.disabled ? ROW_ACTIVE : ROW_IDLE, item.disabled && ROW_OOS, DARK_FOCUS)
  const inner = (
    <>
      <Icon aria-hidden className="size-[17px] shrink-0" strokeWidth={1.8} />
      <span className="truncate">{item.label}</span>
      {item.disabled ? (
        <span
          aria-hidden="true"
          className="ml-auto shrink-0 rounded-full border border-solid border-paper/22 px-[7px] text-[9.5px] font-bold leading-4 text-paper/40"
        >
          SCAS
        </span>
      ) : item.count != null ? (
        <CountDot count={item.count} selected={active} className="ml-auto" />
      ) : null}
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

/** 사이드바 맨 위 로고 — 경찰 방패 배지 + 「경찰청 과학수사」 / 「족윤적 감정」, 아래 종이색 8% 1px 선(로망 `ShellLogo`) */
function ShellLogo() {
  return (
    <div className="mb-1 flex shrink-0 items-center gap-[9px] border-b border-solid border-paper/8 px-2 pt-0.5 pb-[18px]">
      <span
        aria-hidden="true"
        className={
          "grid size-[34px] shrink-0 place-items-center rounded-full " +
          "bg-[radial-gradient(circle_at_35%_30%,var(--t-emblem-from),var(--t-emblem-to))] " +
          "[box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--t-paper)_22%,transparent)]"
        }
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="size-[18px]">
          <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z" className="stroke-[var(--t-emblem-stroke)]" />
          <path d="M8.5 12.5l2.4 2.3 4.6-5" className="stroke-paper" />
        </svg>
      </span>
      <span className="min-w-0 leading-[1.25]">
        <b className="block truncate text-[14px] font-bold text-paper">경찰청 과학수사</b>
        <small className="block truncate text-[10.5px] font-bold tracking-[0.14em] text-paper/50">족윤적 감정</small>
      </span>
    </div>
  )
}

// ── (11/17 확장) topbar — 남색 막대 한 줄 48 ──
// 막대 단추 — 높이 30 · 모서리 9 · 12 굵게 종이색 75%(사이드바 메뉴 줄과 같은 말), 켜짐 = brand-3 채움
const BAR_BTN =
  "inline-flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] border-0 bg-transparent px-2.5 text-[12px] font-bold whitespace-nowrap text-paper/75 no-underline transition-colors duration-150 hover:bg-paper/14 hover:text-paper motion-reduce:transition-none"
const BAR_BTN_ON = "bg-brand-3 text-paper [box-shadow:0_6px_16px_-6px_var(--t-brand-glow)] hover:bg-brand-3"
const BAR_MENU_ITEM =
  "flex h-8 w-full cursor-pointer items-center rounded-[8px] px-2.5 text-left text-[12.5px] text-fg-2 no-underline outline-none data-[highlighted]:bg-brand-bg"

function BarLink({
  href,
  className,
  current,
  renderLink,
  children,
}: {
  href: string
  className: string
  current?: boolean
  renderLink?: ScasShellProps["renderLink"]
  children: React.ReactNode
}) {
  const aria = current ? ("page" as const) : undefined
  if (renderLink) return <>{renderLink({ href, className, "aria-current": aria, children })}</>
  return (
    <a href={href} aria-current={aria} className={className}>
      {children}
    </a>
  )
}

function BarItem({ item, renderLink }: { item: ScasBarItem; renderLink?: ScasShellProps["renderLink"] }) {
  const portal = useThemePortalContainer()
  const Icon = item.icon
  const inner = (
    <>
      {Icon ? <Icon aria-hidden className="size-[15px] shrink-0" strokeWidth={1.8} /> : null}
      {item.label}
    </>
  )
  const className = cn(BAR_BTN, item.active && BAR_BTN_ON, DARK_FOCUS)
  if (item.items) {
    return (
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger className={className}>
          {inner}
          <ChevronDown aria-hidden className="size-3.5 opacity-70" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal container={portal}>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            data-slot="scas-bar-menu"
            className="z-50 w-[180px] rounded-[10px] border border-solid border-border bg-panel p-1.5 [box-shadow:0_8px_30px_0_var(--t-panel-drop)]"
          >
            {item.items.map((sub) => (
              // asChild 는 자식 요소에 메뉴 속성 · 이벤트를 합친다 — 감싼 함수 컴포넌트가 아니라 링크 요소를 바로 넘긴다
              <DropdownMenu.Item key={sub.href} asChild>
                {renderLink ? (
                  renderLink({ href: sub.href, className: BAR_MENU_ITEM, children: sub.label })
                ) : (
                  <a href={sub.href} className={BAR_MENU_ITEM}>
                    {sub.label}
                  </a>
                )}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }
  if (item.href == null) return <span className={className}>{inner}</span>
  return (
    <BarLink href={item.href} className={className} current={item.active} renderLink={renderLink}>
      {inner}
    </BarLink>
  )
}

function TopbarShell({
  title,
  active,
  renderLink,
  user,
  children,
  partId,
  display,
  headerEnd,
  back,
  meta,
  search,
  barItems = [],
}: ScasShellProps) {
  return (
    <div
      {...partAttrs("ScasShell", { variant: "topbar", id: partId })}
      {...(display ? themeScopeAttrs(display) : {})}
      className="flex min-h-[860px] flex-col bg-[var(--t-emblem-to)] text-foreground"
    >
      <header className="flex h-12 shrink-0 items-center gap-3 px-4 text-paper">
        {back ? (
          <BarLink href={back.href} className={cn(BAR_BTN, "-ml-1.5", DARK_FOCUS)} renderLink={renderLink}>
            <span aria-hidden="true">←</span> {back.label}
          </BarLink>
        ) : (
          <span className="flex shrink-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={
                "grid size-[26px] shrink-0 place-items-center rounded-full " +
                "bg-[radial-gradient(circle_at_35%_30%,var(--t-emblem-from),var(--t-emblem-to))] " +
                "[box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--t-paper)_22%,transparent)]"
              }
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="size-[14px]">
                <path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z" className="stroke-[var(--t-emblem-stroke)]" />
                <path d="M8.5 12.5l2.4 2.3 4.6-5" className="stroke-paper" />
              </svg>
            </span>
            <b className="text-[13px] font-bold whitespace-nowrap text-paper/85">족적 감정</b>
          </span>
        )}
        <span aria-hidden="true" className="h-[18px] w-px shrink-0 bg-paper/22" />
        <h1 className="m-0 shrink-0 truncate text-[14px] font-bold text-paper">{title ?? active}</h1>
        {meta ? <span className="flex min-w-0 items-center gap-2 text-[11.5px] text-paper/60">{meta}</span> : null}
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          {search ? (
            <label
              className={cn(
                TOP_PILL,
                "mr-1 h-[30px] w-[280px] min-w-[150px] shrink cursor-text text-muted-foreground focus-within:ring-2 focus-within:ring-paper"
              )}
            >
              <Search aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                aria-label={search.label ?? "바로 찾기"}
                placeholder={search.placeholder ?? "바로 찾기"}
                className="m-0 w-full min-w-0 border-0 bg-transparent p-0 text-[12px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
              />
              {search.value !== "" ? (
                <button
                  type="button"
                  aria-label="찾기 지우기"
                  onClick={() => search.onChange("")}
                  className="m-0 shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[13px] leading-none text-faint hover:text-foreground"
                >
                  ×
                </button>
              ) : null}
            </label>
          ) : null}
          {barItems.length > 0 ? (
            <nav aria-label="메뉴" className="flex items-center gap-1">
              {barItems.map((item) => (
                <BarItem key={item.label} item={item} renderLink={renderLink} />
              ))}
            </nav>
          ) : null}
          {headerEnd}
          {/* 사용자 — 이니셜 · 이름 · 역할(소속은 마우스 설명) */}
          <span title={`${user.name} · ${user.org} · ${user.roleLabel}`} className="flex shrink-0 items-center gap-1.5 pl-1 text-[12px]">
            <span aria-hidden="true" className="inline-flex">
              <Avatar name={user.name} className="size-[22px] text-[10.5px]" />
            </span>
            <b className="font-bold whitespace-nowrap text-paper">{user.name}</b>
            <span className="whitespace-nowrap text-paper/60">{user.roleLabel}</span>
          </span>
        </div>
      </header>
      {/* 아래 둥근 내용 판 — 넘침은 자르되 스크롤 칸은 만들지 않는다(사건 창 틀 sticky 가 바깥 스크롤을 따라가게) */}
      <div className="relative mx-2.5 mb-2.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-[16px] bg-canvas px-[18px] pt-3.5 pb-6">
        {children}
      </div>
    </div>
  )
}

export function ScasShell(props: ScasShellProps) {
  if (props.layout === "topbar") return <TopbarShell {...props} />
  return <SidebarShell {...props} />
}

function SidebarShell({
  active,
  title,
  menu,
  renderLink,
  user,
  children,
  partId,
  display,
  headerEnd,
}: ScasShellProps) {
  return (
    <div
      {...partAttrs("ScasShell", { id: partId })}
      {...(display ? themeScopeAttrs(display) : {})}
      className="flex min-h-[860px] bg-[var(--t-emblem-to)] text-foreground"
    >
      {/* 왼쪽 사이드바 232(로망 PC 펼침 폭) — 접기는 이번 범위 밖 */}
      <aside className="flex w-[232px] shrink-0 flex-col px-3.5 pt-5 pb-3.5">
        <ShellLogo />
        <nav aria-label="메뉴" className="min-h-0 flex-1 overflow-y-auto pt-3 [scrollbar-width:none]">
          {(menu ?? []).map((group, index) => (
            <div key={group.group}>
              {/* 구역 이름표 — 10.5 굵게 종이색 40% · 자간 0.14em · 위 16 아래 5 */}
              <p
                className={cn(
                  "m-0 mb-[5px] px-2.5 text-[10.5px] font-bold tracking-[0.14em] text-paper/40",
                  index > 0 && "mt-4"
                )}
              >
                {group.group}
              </p>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <MenuItem item={item} active={item.label === active} renderLink={renderLink} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* 오른쪽 열 — 위 · 오른쪽 · 아래 10 띄움 + 모서리 18 + 바탕(canvas) */}
      <div className="my-2.5 mr-2.5 flex min-w-0 flex-1 flex-col rounded-[18px] bg-canvas">
        <header className="flex h-14 shrink-0 items-center gap-2 pr-[22px] pl-[26px]">
          <b className="truncate text-[15px] font-bold text-foreground">{title ?? active}</b>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {/* 바로 찾기 — 흰 알약(로망 빠른 조회 자리). 시안이라 아직 동작 없음(읽기 전용) */}
            <label
              className={cn(
                TOP_PILL,
                "w-[300px] min-w-[160px] shrink cursor-text text-muted-foreground focus-within:ring-2 focus-within:ring-brand"
              )}
            >
              <Search aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
              <input
                readOnly
                aria-label="감정번호 · 문서번호 · 화류번호 바로 찾기"
                placeholder="감정번호·문서번호·화류번호 바로 찾기"
                className="m-0 w-full min-w-0 border-0 bg-transparent p-0 text-[12px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-faint"
              />
            </label>
            {/* 사용자 — 이니셜 · 이름 · 소속 · 역할 칩 */}
            <span className={cn(TOP_PILL, "shrink-0 pl-1.5")}>
              {/* 옆에 이름 글자가 이미 있어 이니셜 그림은 읽지 않는다 */}
              <span aria-hidden="true" className="inline-flex">
                <Avatar name={user.name} className="size-[22px] text-[10.5px]" />
              </span>
              <b className="font-bold text-foreground">{user.name}</b>
              <span className="font-normal text-muted-foreground">{user.org}</span>
              <Chip variant="blue">{user.roleLabel}</Chip>
            </span>
            {headerEnd}
          </div>
        </header>
        {/* 넘침은 자르되 스크롤 칸은 만들지 않는다(overflow-clip) — 판 위에 여는 창 틀(CaseWindowFrame)의 sticky 가
            바깥 진열 틀 스크롤을 따라가게 */}
        <div className="relative min-w-0 flex-1 overflow-clip px-[22px] pt-1 pb-6">{children}</div>
      </div>
    </div>
  )
}
