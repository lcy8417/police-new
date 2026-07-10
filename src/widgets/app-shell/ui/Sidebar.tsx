import { NavLink, useMatch } from "react-router-dom"
import { User, Settings } from "lucide-react"

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { Button } from "@/shared/ui/button"
import { TechCorners } from "@/shared/ui/tech-corners"
import { GlowOrb } from "@/shared/ui/glow-fx"

import { navItems, type NavItem } from "../model/nav-items"

/**
 * Fixed 250px left rail built on shadcn's Sidebar primitives
 * (`collapsible="none"` keeps it permanently expanded, matching the
 * previous hand-built `<aside>`). Primary nav on top, pinned user block +
 * logout at the bottom. Disabled items (감정 의뢰/결과) render as inert,
 * non-interactive rows until a case is selected upstream.
 */
export function Sidebar() {
  return (
    <SidebarPrimitive
      collapsible="none"
      className="h-full w-[250px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarContent className="gap-1 px-3 py-4">
        <span className="px-3 pb-1 text-[11px] font-semibold tracking-[0.25em] text-[#4A5568]">
          MENU
        </span>
        <SidebarMenu>
          {navItems.map((item) =>
            item.disabled ? (
              <DisabledNavItem key={item.label} item={item} />
            ) : (
              <SidebarNavItem key={item.label} item={item} />
            )
          )}
        </SidebarMenu>

        {/* Faint particle glow filling the empty rail space above the footer. */}
        <div className="relative min-h-0 flex-1">
          <GlowOrb className="top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 bg-[#2563EB]/10" />
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#16233B] ring-1 ring-[#26334A]">
              <User className="size-[18px] text-[#8A93A6]" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-[#E5E9F0]">사용자</span>
              <span className="truncate text-xs text-[#8A93A6]">
                ID: KCSI_001
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="설정"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#8A93A6] transition-colors hover:bg-white/5 hover:text-[#4A9EFF]"
          >
            <Settings className="size-[16px]" aria-hidden="true" />
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-[#26334A] bg-transparent text-[#E5E9F0] hover:bg-white/5 hover:text-[#E5E9F0]"
          onClick={() => {
            /* TODO: wire logout */
          }}
        >
          로그아웃
        </Button>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  const isActive = Boolean(useMatch({ path: item.to, end: false }))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="relative h-auto gap-3 px-3 py-2.5 text-[15px] hover:bg-white/5 hover:text-[#E5E9F0] data-[active=true]:shadow-[0_0_18px_rgba(37,99,235,0.35)] data-[active=true]:ring-1 data-[active=true]:ring-[#2563EB]/50 data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground"
      >
        <NavLink to={item.to}>
          {isActive ? (
            <>
              <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB] shadow-[0_0_8px_2px_rgba(37,99,235,0.7)]" />
              <TechCorners size={10} active />
            </>
          ) : null}
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function DisabledNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        aria-disabled="true"
        className="h-auto cursor-not-allowed gap-3 px-3 py-2.5 text-[15px] opacity-40 hover:bg-transparent hover:text-sidebar-foreground"
      >
        <div title={item.disabledReason}>
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          <span>{item.label}</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
