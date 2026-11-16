import type { AdminUser, RoleCode } from "@/entities/admin"
import { FEATURES, FEATURE_ORDER, type FeatureCode } from "@/entities/session"

// 화면 안에서 쓰는 표시 규칙(서버 호출 없음). features/admin-users 의 규칙과 같은 값을 따른다.

export type UserStatus = "ACTIVE" | "LOCKED" | "DISABLED"

/** 계정 상태 — 중지가 잠금보다 우선 */
export function userStatus(user: Pick<AdminUser, "useAt" | "lockAt">): UserStatus {
  if (user.useAt === "N") return "DISABLED"
  if (user.lockAt === "Y") return "LOCKED"
  return "ACTIVE"
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = { ACTIVE: "사용", LOCKED: "잠금", DISABLED: "중지" }

/** 신발 등록·수정을 켜면 신발 조회도 켜진 것(서버 실효 권한 규칙) */
export function isImpliedFeature(selected: readonly FeatureCode[], code: FeatureCode): boolean {
  return code === FEATURES.SHOE_VIEW && selected.includes(FEATURES.SHOE_EDIT)
}

/** 기능 하나를 켜고 끈 새 목록(표시 순서로 정렬, 목록에 없는 코드는 뒤에 보존) */
export function toggleFeature(selected: readonly FeatureCode[], code: FeatureCode, on: boolean): FeatureCode[] {
  const next = new Set(selected)
  if (on) {
    next.add(code)
    if (code === FEATURES.SHOE_EDIT) next.add(FEATURES.SHOE_VIEW)
  } else {
    next.delete(code)
  }
  const known = FEATURE_ORDER.filter((c) => next.has(c))
  const unknown = [...next].filter((c) => !FEATURE_ORDER.includes(c))
  return [...known, ...unknown]
}

export function toggleRole(selected: readonly RoleCode[], code: RoleCode, on: boolean, order: readonly RoleCode[]): RoleCode[] {
  const next = new Set(selected)
  if (on) next.add(code)
  else next.delete(code)
  return [...order.filter((c) => next.has(c)), ...[...next].filter((c) => !order.includes(c))]
}

export function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}
