import * as React from "react"
import { Footprints, Settings2 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { ScasShell, ThemeScope, ThemeSettings, type ScasBarItem, type ScasShellSearch } from "@/shared/ui/panel"
import { useDisplayPrefs } from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"

import { DEV_SCREENS, devScreen } from "./dev-screens"
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
  /** 위 막대 제목 뒤 작은 글자(사건관리 = 「116건 · ● 09:12 갱신」) */
  meta?: React.ReactNode
  /** 위 막대 바로 찾기 칸을 동작하게(사건관리 = 사건 목록 거르기). 없으면 칸이 없다 */
  search?: ScasShellSearch
}

// 11/17 사용자 「응」: 왼쪽 사이드바를 없애고 남색 위 막대 한 줄 —
//  [방패 족적 감정 │ 사건관리 116건 ● 갱신   바로 찾기 · 신발 DB · 관리 ▾ · ⚙ · 사용자]
// 신발 DB 는 사건관리 위 슬라이드 패널(`/dev/s01?shoe=1`), 관리 ▾(관리자만) = 사용자 관리 · 사용 기록 전체 화면 페이지.
// 사건관리 밖 화면(S13 · S14, 개별 진열 S02–S07 · S10)은 막대 왼쪽에 「← 사건관리」.
// 보는 사람(`as`)과 신규 기능 끄기(`plus=0`)는 화면을 옮겨도 유지한다. 케이스(`case`)는 화면마다 다르므로 넘기지 않는다.
// 막대 단추는 보는 사람의 기능 권한으로 거른다(`widgets/app-shell/model/nav-items.ts` 와 같은 규칙: 권한 없으면 숨김).

function keepQuery(as: string | null, plusOff: boolean, extra: string[] = []): string {
  const parts = [...extra, as ? `as=${encodeURIComponent(as)}` : "", plusOff ? "plus=0" : ""].filter(Boolean)
  return parts.length > 0 ? `?${parts.join("&")}` : ""
}

function barItemsFor(
  viewer: DevViewerInfo,
  id: string,
  shoeHref: string,
  shoeOpen: boolean,
  query: string,
): ScasBarItem[] {
  const shoe = devScreen("s10")
  const items: ScasBarItem[] = []
  if (!shoe.feature || viewer.isAdmin || viewer.features.includes(shoe.feature)) {
    items.push({ label: shoe.title, icon: Footprints, href: shoeHref, active: shoeOpen })
  }
  if (viewer.isAdmin) {
    items.push({
      label: "관리",
      icon: Settings2,
      active: id === "s13" || id === "s14",
      items: DEV_SCREENS.filter((s) => s.admin).map((s) => ({ label: s.title, href: `/dev/${s.id}${query}` })),
    })
  }
  return items
}

// 틀 = 화면 높이 상자 + 세로 스크롤. html · body · #root 가 overflow:hidden 이라 틀이 스스로 스크롤해야
// 키운 글자(「크게」 · 「아주 크게」)나 긴 화면의 아래쪽까지 볼 수 있다(r3 화면 설정).
const FRAME_SCROLL = "h-full overflow-auto bg-canvas"

const PILL = "rounded-[999px] border border-solid px-[8px] py-[1px] font-code text-[11px] no-underline"

export function DevScreenFrame({ screen, title, cases, bare = false, children, meta, search: barSearch }: DevScreenFrameProps) {
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
      {/* bare(S00 로그인)는 껍데기가 없으므로 진열 막대 끝(흐름 안 — 줄이 접혀도 겹치지 않게)에 「화면 설정」 */}
      {bare && <ThemeSettings className="ml-auto" />}
    </div>
  )

  // 화면 설정(r3, 설계서 §14-4): 진열 막대까지 같은 범위로 감싸 팔레트 · 글꼴 · 글자 크기가 화면 전체에 걸린다.
  if (bare) {
    return (
      <ThemeScope prefs={display} className={FRAME_SCROLL + " text-foreground"}>
        {bar}
        {children}
      </ThemeScope>
    )
  }

  const id = pathname.split("/")[2] ?? ""
  const onCases = id === "s01"
  const query = keepQuery(as, !plus)
  // 사건관리에서는 지금 주소에 shoe=1 만 더하고(열린 사건 탭 유지), 다른 화면에서는 사건관리로 가며 연다
  const shoeOpen = onCases && new URLSearchParams(search).get("shoe") === "1"
  const shoeHref = onCases ? hrefWith("shoe", "1") : `/dev/s01${keepQuery(as, !plus, ["shoe=1"])}`

  return (
    <ThemeScope prefs={display} className={FRAME_SCROLL}>
      {bar}
      <ScasShell
        layout="topbar"
        active={title}
        title={title}
        meta={meta}
        search={barSearch}
        back={onCases ? undefined : { label: devScreen("s01").title, href: `/dev/s01${query}` }}
        barItems={barItemsFor(viewer, id, shoeHref, shoeOpen, query)}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        user={{ name: viewer.who.split(" ")[0], org: viewer.org, roleLabel: viewer.label }}
        display={display}
        headerEnd={<ThemeSettings compact />}
      >
        {children}
      </ScasShell>
    </ThemeScope>
  )
}
