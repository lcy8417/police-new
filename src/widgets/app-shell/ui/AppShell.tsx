import { Outlet } from "react-router-dom"

import { SidebarProvider } from "@/shared/ui/sidebar"

import { TopNav } from "./TopNav"
import { Sidebar } from "./Sidebar"

/**
 * Persistent shell: fixed TopNav (110px) + collapsible Sidebar around a
 * scrollable content outlet. TopNav/Sidebar sit outside the scroll
 * container so route navigation never disturbs them. `SidebarProvider`
 * wraps both TopNav and the row below it (`className="contents"` so it
 * contributes no layout box of its own) because `TopNav` renders
 * shadcn's `SidebarTrigger`, which needs the provider's context. `Sidebar`
 * stays `collapsible="none"` (see Sidebar.tsx) and drives its own width/
 * content collapse off `useSidebar()` state — the built-in fixed
 * offcanvas/icon variant would overlap this fixed-height TopNav. Page
 * title/actions flow through the `usePageHeaderStore` Zustand store — no
 * provider.
 */
// @MX:ANCHOR: [AUTO] AppShell - 앱 전역 레이아웃 셸(TopNav+Sidebar+Outlet), App.jsx 및 5개 페이지 라우트에서 사용되는 유일한 레이아웃 컴포넌트
// @MX:REASON: fan_in 6 — 모든 라우트가 거치는 단일 레이아웃 조립 지점, SidebarProvider·usePageHeaderStore 연동이 여기 집중
export function AppShell() {
  return (
    <div
      data-testid="app-shell"
      className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
    >
      <SidebarProvider className="contents">
        <TopNav />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-y-auto bg-background">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}
