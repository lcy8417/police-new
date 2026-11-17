import { useEffect, type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { toast } from "sonner"

import type { FeatureCode } from "@/entities/session"

import { firstAllowedPath } from "../model/feature-routes"
import { hasAnyFeature, hasFeature, useSessionStore } from "../model/session-store"
import { NoPermissionNotice } from "./NoPermissionNotice"

const ACCESS_DENIED_MESSAGE = "접근 권한이 없습니다"

/** 안내 토스트를 띄우고 허용된 화면으로 보낸다. 같은 id라 StrictMode 이중 실행에도 토스트는 1개. */
function DeniedRedirect({ to }: { to: string }) {
  useEffect(() => {
    toast.error(ACCESS_DENIED_MESSAGE, { id: "access-denied" })
  }, [])
  return <Navigate to={to} replace />
}

/**
 * 권한이 없을 때 보일 것 — 허용된 첫 화면이 있으면 안내 후 그리로, 없으면 권한 없음 안내.
 * `RequireFeature`·`RequireAdmin`이 함께 쓴다.
 */
export function AccessDenied() {
  const user = useSessionStore((s) => s.user)
  const target = firstAllowedPath(user)
  if (!target) return <NoPermissionNotice />
  return <DeniedRedirect to={target} />
}

/** 기능 하나(`code`) 또는 여럿 중 하나(`anyOf`) — 둘 중 하나만 준다(B 단계 0단계: `/cases`가 여러 권한으로 열림). */
type RequireFeatureProps =
  | { /** 이 화면에 필요한 기능 권한. */ code: FeatureCode; anyOf?: never; children: ReactNode }
  | { code?: never; /** 이 중 하나라도 있으면 허용. 빈 목록이면 거부. */ anyOf: readonly FeatureCode[]; children: ReactNode }

/**
 * 기능 권한 가드(`RequireAuth` 안쪽에서 쓴다). 세션 재확인으로 권한이 회수되면 store가 바뀌어
 * 지금 보고 있는 화면에서도 즉시 다시 판단된다.
 */
export function RequireFeature({ code, anyOf, children }: RequireFeatureProps) {
  const allowed = useSessionStore((s) => (anyOf ? hasAnyFeature(s.user, anyOf) : hasFeature(s.user, code)))
  if (!allowed) return <AccessDenied />
  return <>{children}</>
}
