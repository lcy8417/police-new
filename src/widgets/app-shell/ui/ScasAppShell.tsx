import { Link, Outlet, useLocation } from "react-router-dom"

import { isAdmin, useSessionStore } from "@/features/auth"
import { useDisplayPrefs } from "@/shared/lib/display-prefs"
import { ScasShell, ThemeScope, ThemeSettings } from "@/shared/ui/panel"

import { CASES_PATH, barItemsFor, barTitleOf, canSeeCases } from "../model/bar-items"
import { usePageHeaderStore } from "../model/page-header"
import { AccountActions } from "./AccountActions"

/**
 * 새 앱 틀(11/17 결정 기록 §1 · 화면 이식 계획 §1 「셸」): 공용 `ScasShell` 의 topbar — 사이드바 없이 남색 위 막대 한 줄 +
 * 아래 둥근 내용 판(Outlet). 새 라우트(`/cases` · `/manage/*`)만 이 틀을 쓰고, 옛 라우트는 넘겨주기 전까지 옛 `AppShell`
 * (TopNav + Sidebar)을 그대로 쓴다(두 틀 공존 — 계획 §1).
 * 막대 = 로고(사건관리) 또는 「← 사건관리」 · 화면 이름 · 건수(페이지가 올림) · 바로 찾기(사건관리만) · 신발 DB · 관리 ▾ ·
 * 페이지 단추 · 화면 설정 · 계정(비밀번호 변경 · 로그아웃) · 사용자.
 * 권한 가드 · 세션 처리는 바깥(`RequireAuth` 등)이 그대로 맡고, 이 틀은 보이는 단추만 권한으로 거른다.
 * 화면 설정(팔레트 · 글꼴 · 글자 크기)은 `ThemeScope` 가 틀 전체에 건다. html · body 가 overflow:hidden 이라 틀이 스스로 스크롤한다.
 */
export function ScasAppShell() {
  const user = useSessionStore((s) => s.user)
  const { pathname, search } = useLocation()
  const display = useDisplayPrefs()
  const actions = usePageHeaderStore((s) => s.actions)
  const meta = usePageHeaderStore((s) => s.meta)
  const barSearch = usePageHeaderStore((s) => s.search)

  const title = barTitleOf(pathname)
  const showBack = pathname !== CASES_PATH && user !== null && canSeeCases(user)

  return (
    <ThemeScope prefs={display} data-testid="scas-app-shell" className="h-screen w-screen overflow-auto bg-canvas text-foreground">
      <ScasShell
        layout="topbar"
        active={title}
        title={title}
        meta={meta ?? undefined}
        search={barSearch ?? undefined}
        back={showBack ? { label: "사건관리", href: CASES_PATH } : undefined}
        barItems={user ? barItemsFor(user, pathname, search) : []}
        renderLink={({ href, children, ...rest }) => (
          <Link to={href} {...rest}>
            {children}
          </Link>
        )}
        user={{
          name: user?.userNm ?? "",
          // 소속 관서 이름(서버 `/auth/me` `org_nm` — B 단계 0단계). 옛 서버라 없으면 아이디
          org: user?.orgNm ?? user?.userId ?? "",
          roleLabel: user && isAdmin(user) ? "관리자" : "사용자",
        }}
        display={display}
        headerEnd={
          <>
            {actions}
            <ThemeSettings compact />
            <AccountActions />
          </>
        }
      >
        <Outlet />
      </ScasShell>
    </ThemeScope>
  )
}
