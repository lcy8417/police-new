import { isAdmin, useSessionStore } from "@/features/auth"
import type { FeatureCode } from "@/entities/session"

/** 보는 사람(로그인 세션) — 위젯 권한 판정에 넘기는 관리자 여부 · 기능 코드 */
export interface TabViewer {
  isAdmin: boolean
  features: readonly FeatureCode[]
}

const NO_FEATURES: readonly FeatureCode[] = []

export function useViewer(): TabViewer {
  const user = useSessionStore((s) => s.user)
  return { isAdmin: isAdmin(user), features: user?.features ?? NO_FEATURES }
}
