import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import { ScasShell, type ScasMenuGroup } from "@/shared/ui/panel"
import { cn } from "@/shared/lib/utils"

import { DEV_SCREENS } from "./dev-screens"
import { DEV_VIEWER_KEYS, DEV_VIEWERS, useDevViewer, type DevViewerInfo } from "./dev-viewers"
import { useDevCase } from "./use-dev-case"

// 진열 화면 틀: 얇은 전환 막대(케이스 · 보는 사람)와 시안 껍데기(ScasShell)로 children 을 감싼다.
// 전환 막대는 진열용이라 시안 대조 대상이 아니다. bare 면 껍데기 없이(S00 로그인).
export interface DevScreenFrameProps {
  screen: string
  title: string
  cases: readonly string[]
  bare?: boolean
  children: React.ReactNode
}

// 보는 사람(`as`)은 화면을 옮겨도 유지한다. 케이스(`case`)는 화면마다 다르므로 넘기지 않는다.
// 메뉴는 보는 사람의 기능 권한으로 거른다(`widgets/app-shell/model/nav-items.ts` 와 같은 규칙: 권한 없으면 숨김).
function menuFor(viewer: DevViewerInfo, as: string | null): ScasMenuGroup[] {
  const query = as ? `?as=${encodeURIComponent(as)}` : ""
  const toItem = (s: (typeof DEV_SCREENS)[number]) => ({ label: s.title, href: `/dev/${s.id}${query}` })
  const visible = DEV_SCREENS.filter(
    (s) => !s.admin && s.id !== "s00" && (!s.feature || viewer.isAdmin || viewer.features.includes(s.feature)),
  )
  const groups: ScasMenuGroup[] = []
  if (visible.length > 0) groups.push({ group: "족윤적 감정", items: visible.map(toItem) })
  if (viewer.isAdmin) groups.push({ group: "관리", items: DEV_SCREENS.filter((s) => s.admin).map(toItem) })
  return groups
}

const PILL = "rounded-[999px] border border-solid px-[8px] py-[1px] font-code text-[11px] no-underline"

export function DevScreenFrame({ screen, title, cases, bare = false, children }: DevScreenFrameProps) {
  const { pathname, search } = useLocation()
  const as = new URLSearchParams(search).get("as")
  const activeCase = useDevCase(cases, cases[0] ?? "ready")
  const viewer = useDevViewer()
  const viewerKey = DEV_VIEWER_KEYS.find((k) => DEV_VIEWERS[k] === viewer) ?? "investigator"

  const hrefWith = (key: string, value: string) => {
    const params = new URLSearchParams(search)
    params.set(key, value)
    return `${pathname}?${params.toString()}`
  }

  const bar = (
    <div
      data-dev-bar
      className="flex flex-wrap items-center gap-[10px] border-b border-solid border-border bg-strip px-[12px] py-[4px] text-[11px] text-dim"
    >
      <Link to="/dev" className="font-code font-semibold text-brand no-underline">
        {screen}
      </Link>
      <span>케이스</span>
      {cases.map((c) => (
        <Link
          key={c}
          to={hrefWith("case", c)}
          aria-current={c === activeCase ? "true" : undefined}
          className={cn(PILL, c === activeCase ? "border-brand-line bg-brand-bg text-brand" : "border-line-3 text-muted-foreground")}
        >
          {c}
        </Link>
      ))}
      <span className="ml-[10px]">보는 사람</span>
      {DEV_VIEWER_KEYS.map((k) => (
        <Link
          key={k}
          to={hrefWith("as", k)}
          aria-current={k === viewerKey ? "true" : undefined}
          title={DEV_VIEWERS[k].label}
          className={cn(PILL, k === viewerKey ? "border-brand-line bg-brand-bg text-brand" : "border-line-3 text-muted-foreground")}
        >
          {k}
        </Link>
      ))}
    </div>
  )

  if (bare) {
    return (
      <div className="min-h-screen bg-canvas text-foreground">
        {bar}
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      {bar}
      <ScasShell
        active={title}
        menu={menuFor(viewer, as)}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        user={{ name: "박○○", org: "경찰청 범죄분석과", roleLabel: viewer.label }}
      >
        {children}
      </ScasShell>
    </div>
  )
}
