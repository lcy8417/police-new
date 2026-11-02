import type { ReactNode } from "react"

import { isAdmin, useSessionStore } from "../model/session-store"
import { AccessDenied } from "./RequireFeature"

interface RequireAdminProps {
  children: ReactNode
}

/** 관리자 전용 가드(`/manage/*`). 사용자는 안내 후 허용된 첫 화면으로. */
export function RequireAdmin({ children }: RequireAdminProps) {
  const admin = useSessionStore((s) => isAdmin(s.user))
  if (!admin) return <AccessDenied />
  return <>{children}</>
}
