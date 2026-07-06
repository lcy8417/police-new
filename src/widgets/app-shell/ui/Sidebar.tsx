import { NavLink, useMatch } from "react-router-dom"
import { User } from "lucide-react"

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { Button } from "@/shared/ui/button"

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
        <SidebarMenu>
          {navItems.map((item) =>
            item.disabled ? (
              <DisabledNavItem key={item.label} item={item} />
            ) : (
              <SidebarNavItem key={item.label} item={item} />
            )
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#16233B]">
            <User className="size-[18px] text-[#8A93A6]" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-[#E5E9F0]">사용자</span>
            <span className="truncate text-xs text-[#8A93A6]">
              ID: KCSI_001
            </span>
          </div>
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
        className="relative h-auto gap-3 px-3 py-2.5 text-[15px] hover:bg-white/5 hover:text-[#E5E9F0] data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground"
      >
        <NavLink to={item.to}>
          {isActive ? (
            <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB]" />
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
