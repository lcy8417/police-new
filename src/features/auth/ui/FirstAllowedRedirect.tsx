import { Navigate } from "react-router-dom"

import { firstAllowedPath } from "../model/feature-routes"
import { useSessionStore } from "../model/session-store"
import { NoPermissionNotice } from "./NoPermissionNotice"

/** `/` 진입 — 허용된 첫 화면으로 보내고, 없으면 권한 없음 안내. */
export function FirstAllowedRedirect() {
  const user = useSessionStore((s) => s.user)
  const target = firstAllowedPath(user)
  if (!target) return <NoPermissionNotice />
  return <Navigate to={target} replace />
}
