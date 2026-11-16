import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import { ScasShell, ThemeScope, ThemeSettings, type ScasMenuGroup } from "@/shared/ui/panel"
import { useDisplayPrefs } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"

import { DEV_SCREENS } from "./dev-screens"
import { DEV_VIEWER_KEYS, DEV_VIEWERS, useDevPlus, useDevViewerKey, type DevViewerInfo } from "./dev-viewers"
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

// 보는 사람(`as`)과 신규 기능 끄기(`plus=0`)는 화면을 옮겨도 유지한다. 케이스(`case`)는 화면마다 다르므로 넘기지 않는다.
// 메뉴는 보는 사람의 기능 권한으로 거른다(`widgets/app-shell/model/nav-items.ts` 와 같은 규칙: 권한 없으면 숨김).
function menuFor(viewer: DevViewerInfo, as: string | null, plusOff: boolean): ScasMenuGroup[] {
  const parts = [as ? `as=${encodeURIComponent(as)}` : "", plusOff ? "plus=0" : ""].filter(Boolean)
  const query = parts.length > 0 ? `?${parts.join("&")}` : ""
  const toItem = (s: (typeof DEV_SCREENS)[number]) => ({ label: s.title, href: `/dev/${s.id}${query}` })
  const visible = DEV_SCREENS.filter(
    (s) => !s.admin && s.id !== "s00" && (!s.feature || viewer.isAdmin || viewer.features.includes(s.feature)),
  )
  const groups: ScasMenuGroup[] = []
  if (visible.length > 0) groups.push({ group: "족윤적 감정", items: visible.map(toItem) })
  if (viewer.isAdmin) groups.push({ group: "관리", items: DEV_SCREENS.filter((s) => s.admin).map(toItem) })
  return groups
}

// 틀 = 화면 높이 상자 + 세로 스크롤. html · body · #root 가 overflow:hidden 이라 틀이 스스로 스크롤해야
// 키운 글자(「크게」 · 「아주 크게」)나 긴 화면의 아래쪽까지 볼 수 있다(r3 화면 설정).
const FRAME_SCROLL = "h-full overflow-auto bg-canvas"

const PILL ="rounded-[999px] border border-solid px-[8px] py-[1px] font-code text-[11px] no-underline"

export function DevScreenFrame({ screen, title, cases, bare = false, children }: DevScreenFrameProps) {
  const { pathname, search } = useLocation()
  const as = new URLSearchParams(search).get("as")
  const plus = useDevPlus()
  const activeCase = useDevCase(cases, cases[0] ?? "ready")
  const viewerKey = useDevViewerKey()
  const viewer = DEV_VIEWERS[viewerKey]
  const display = useDisplayPrefs()

  const hrefWith = (key: string, value: string) => {
    const params = new URLSearchParams(search)
    if (value === "") params.delete(key)
    else params.set(key, value)
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
          className={cn(PILL, k === viewerKey ? "border-brand-line bg-brand-bg text-brand" : "border-line-3 text-muted-foreground")}
        >
          {DEV_VIEWERS[k].label}
        </Link>
      ))}
      <span className="text-muted-foreground">
        {viewer.who} · {viewer.org}
      </span>
      <Link
        to={hrefWith("plus", plus ? "0" : "")}
        aria-pressed={plus}
        className={cn(PILL, "ml-[10px]", plus ? "border-brand-line bg-brand-bg text-brand" : "border-line-3 text-muted-foreground")}
      >
        신규 기능 보기 {plus ? "켜짐" : "꺼짐"}
      </Link>
    </div>
  )

  // 화면 설정(r3, 설계서 §14-4): 진열 막대까지 같은 범위로 감싸 팔레트 · 글꼴 · 글자 크기가 화면 전체에 걸린다.
  // bare(S00 로그인)는 껍데기가 없으므로 진열 막대 끝에 「화면 설정」을 둔다.
  if (bare) {
    return (
      <ThemeScope prefs={display} className={FRAME_SCROLL + " text-foreground"}>
        <div className="relative">
          {bar}
          <ThemeSettings className="absolute top-[2px] right-[12px] z-20" />
        </div>
        {children}
      </ThemeScope>
    )
  }

  return (
    <ThemeScope prefs={display} className={FRAME_SCROLL}>
      {bar}
      <ScasShell
        active={title}
        menu={menuFor(viewer, as, !plus)}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        user={{ name: viewer.who.split(" ")[0], org: viewer.org, roleLabel: viewer.label }}
        display={display}
        headerEnd={<ThemeSettings />}
      >
        {children}
      </ScasShell>
    </ThemeScope>
  )
}
