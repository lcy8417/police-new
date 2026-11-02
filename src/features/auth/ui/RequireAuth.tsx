import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { LOGIN_PATH, PASSWORD_PATH } from "../model/feature-routes"
import { useSessionStore } from "../model/session-store"
import { SessionLoadingScreen } from "./SessionLoadingScreen"

/**
 * 보호 화면 루트 표시(`data-protected-root`). 뒤로 가기 캐시(bfcache)로 페이지가 보관될 때
 * `SessionProvider`가 이 요소에 `invisible`을 붙여, 되살아나는 순간 로그아웃 전 화면이 보이지 않게 한다.
 */
export const PROTECTED_ROOT_SELECTOR = "[data-protected-root]"

interface RequireAuthProps {
  children: ReactNode
}

/**
 * 로그인 가드 — 확인 중이면 로딩, 로그인 전이면 `/login?from=<현재 주소>`,
 * 비밀번호 변경이 필요하면 `/password`(그 화면 자신은 통과).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const status = useSessionStore((s) => s.status)
  const user = useSessionStore((s) => s.user)
  const location = useLocation()

  if (status === "loading") return <SessionLoadingScreen />

  if (status === "anonymous" || !user) {
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${LOGIN_PATH}?from=${from}`} replace />
  }

  if (user.passwordChangeRequired && location.pathname !== PASSWORD_PATH) {
    return <Navigate to={PASSWORD_PATH} replace />
  }

  // `contents`: 레이아웃 상자를 만들지 않아 셸(h-screen) 배치를 바꾸지 않는다.
  // `invisible`(visibility)은 자식에게 상속되므로 이 요소 하나로 화면 전체를 숨길 수 있다.
  return (
    <div data-protected-root="" className="contents">
      {children}
    </div>
  )
}
