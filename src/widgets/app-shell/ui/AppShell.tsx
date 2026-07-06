import { Outlet } from "react-router-dom"

import { SidebarProvider } from "@/shared/ui/sidebar"

import { PageHeaderProvider } from "../model/page-header"

import { TopNav } from "./TopNav"
import { Sidebar } from "./Sidebar"

/**
 * Persistent shell: fixed TopNav (110px) + fixed Sidebar (250px) around a
 * scrollable content outlet. TopNav/Sidebar sit outside the scroll
 * container so route navigation never disturbs them. `SidebarProvider`
 * is required by shadcn's Sidebar primitives; the sidebar itself uses
 * `collapsible="none"` so it stays a permanently fixed rail.
 */
export function AppShell() {
  return (
    <PageHeaderProvider>
      <div
        data-testid="app-shell"
        className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
      >
        <TopNav />
        <SidebarProvider className="min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto bg-background">
            <Outlet />
          </main>
        </SidebarProvider>
      </div>
    </PageHeaderProvider>
  )
}
