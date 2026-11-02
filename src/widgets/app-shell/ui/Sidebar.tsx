import { useState } from "react"
import { NavLink, useMatch } from "react-router-dom"
import { LogOut, Settings, User } from "lucide-react"

import type { SessionUser } from "@/entities/session"
import { PASSWORD_PATH, isAdmin, logoutAndReload, useSessionStore } from "@/features/auth"
import { cn } from "@/shared/lib/utils"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { GlowOrb } from "@/shared/ui/glow-fx"

import { visibleNavItems, type NavItem } from "../model/nav-items"

/**
 * Left rail built on shadcn's Sidebar primitives. Stays `collapsible="none"`
 * (normal document flow, no fixed positioning) because this app's TopNav is
 * a fixed 110px bar above it — shadcn's built-in fixed offcanvas/icon
 * variant would overlap it. Width and content instead toggle off shadcn's
 * own `useSidebar()` state, so the provider's toggle button, `Ctrl/Cmd+B`
 * shortcut, and cookie-persisted state still drive the collapse. Primary
 * nav on top, pinned user block + logout at the bottom. Disabled items
 * (감정 의뢰/결과) render as inert, non-interactive rows until a case is
 * selected upstream.
 *
 * 권한(설계서 §7-5): 기능 권한이 없는 메뉴는 숨기고(`visibleNavItems`), 관리자에게만
 * "ADMIN" 구역(사용자·권한, 사용 기록)을 붙인다. 로그아웃은 서버 세션을 닫고
 * `/login`으로 전체 새로고침(`logoutAndReload`).
 */
export function Sidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const user = useSessionStore((s) => s.user)
  const [loggingOut, setLoggingOut] = useState(false)

  const items = user ? visibleNavItems(user) : []
  const mainItems = items.filter((item) => !item.adminOnly)
  const adminItems = items.filter((item) => item.adminOnly)

  const handleLogout = () => {
    if (loggingOut) return
    setLoggingOut(true)
    void logoutAndReload()
  }

  return (
    <SidebarPrimitive
      collapsible="none"
      className={cn(
        "h-full shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
        collapsed ? "w-16" : "w-[250px]"
      )}
    >
      <SidebarContent
        className={cn("gap-1 py-4", collapsed ? "px-2" : "px-3")}
      >
        {mainItems.length > 0 && (
          <NavSection label="MENU" items={mainItems} collapsed={collapsed} />
        )}
        {adminItems.length > 0 && (
          <NavSection
            label="ADMIN"
            items={adminItems}
            collapsed={collapsed}
            className={cn(mainItems.length > 0 && "mt-4 border-t border-sidebar-border pt-4")}
          />
        )}

        {/* Faint particle glow filling the empty rail space above the footer. */}
        <div className="relative min-h-0 flex-1">
          <GlowOrb className="top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 bg-[#2563EB]/10" />
        </div>
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "gap-0 border-t border-sidebar-border p-4",
          collapsed && "px-2"
        )}
      >
        <div
          className={cn(
            "mb-3 flex items-center gap-2",
            collapsed ? "flex-col" : "justify-between"
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#16233B] ring-1 ring-[#26334A]">
              <User className="size-[18px] text-[#8A93A6]" aria-hidden="true" />
            </span>
            {!collapsed && user && <UserSummary user={user} />}
          </div>
          {!collapsed && (
            <NavLink
              to={PASSWORD_PATH}
              aria-label="비밀번호 변경"
              title="비밀번호 변경"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8A93A6] transition-colors outline-none hover:bg-white/5 hover:text-[#4A9EFF] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
            >
              <Settings className="size-[16px]" aria-hidden="true" />
            </NavLink>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="로그아웃"
          disabled={loggingOut}
          className="w-full border-[#26334A] bg-transparent text-[#E5E9F0] hover:bg-white/5 hover:text-[#E5E9F0] focus-visible:border-[#3B82F6] focus-visible:ring-[#3B82F6]/40"
          onClick={handleLogout}
        >
          <LogOut className="size-[16px]" aria-hidden="true" />
          {!collapsed && "로그아웃"}
        </Button>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}

/** 구역 라벨(`MENU`·`ADMIN`) + 메뉴 묶음. 접힌 상태에서는 라벨을 숨긴다. */
function NavSection({
  label,
  items,
  collapsed,
  className,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {!collapsed && (
        <span className="px-3 pb-1 text-[11px] font-semibold tracking-[0.25em] text-[#4A5568]">
          {label}
        </span>
      )}
      <SidebarMenu>
        {items.map((item) =>
          item.disabled ? (
            <DisabledNavItem key={item.label} item={item} collapsed={collapsed} />
          ) : (
            <SidebarNavItem key={item.label} item={item} collapsed={collapsed} />
          )
        )}
      </SidebarMenu>
    </div>
  )
}

/** 하단 사용자 블록 — 이름, `ID: {userId}`, 구분 칩(관리자 = blue, 사용자 = 회색). */
function UserSummary({ user }: { user: SessionUser }) {
  const admin = isAdmin(user)
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm text-[#E5E9F0]">{user.userNm}</span>
        <span
          className={cn(
            "shrink-0 rounded-full border px-1.5 py-px text-[10px] leading-4 font-semibold tracking-wider",
            admin
              ? "border-[#3B82F6]/40 bg-[#152238] text-[#4A9EFF]"
              : "border-[#26334A] bg-[#111A28] text-[#8A93A6]"
          )}
        >
          {admin ? "관리자" : "사용자"}
        </span>
      </div>
      <span className="truncate font-mono text-xs text-[#8A93A6]">ID: {user.userId}</span>
    </div>
  )
}

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem
  collapsed: boolean
}) {
  const Icon = item.icon
  const isActive = Boolean(useMatch({ path: item.to, end: false }))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={collapsed ? item.label : undefined}
        className={cn(
          "relative h-auto gap-3 py-2.5 text-[15px] hover:bg-white/5 hover:text-[#E5E9F0] data-[active=true]:shadow-[0_0_18px_rgba(37,99,235,0.35)] data-[active=true]:ring-1 data-[active=true]:ring-[#2563EB]/50 data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground",
          collapsed ? "justify-center px-0" : "px-3"
        )}
      >
        <NavLink to={item.to}>
          {isActive ? (
            <>
              <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB] shadow-[0_0_8px_2px_rgba(37,99,235,0.7)]" />
              <TechCorners size={10} active />
            </>
          ) : null}
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function DisabledNavItem({
  item,
  collapsed,
}: {
  item: NavItem
  collapsed: boolean
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        aria-disabled="true"
        tooltip={collapsed ? item.label : undefined}
        className={cn(
          "h-auto cursor-not-allowed gap-3 py-2.5 text-[15px] opacity-40 hover:bg-transparent hover:text-sidebar-foreground",
          collapsed ? "justify-center px-0" : "px-3"
        )}
      >
        <div title={item.disabledReason}>
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span>{item.label}</span>}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
