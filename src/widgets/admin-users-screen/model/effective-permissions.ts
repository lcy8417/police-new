import type { AdminUser, RoleInfo } from "@/entities/admin"
import { FEATURES, type FeatureCode } from "@/entities/session"

// S13 「사용자별 실제 권한」(시안 핀 14) 계산 — 표시 전용 순수 함수.
// 실제 권한 = 역할 권한(프리셋) ∪ 개인 권한(신발 등록·수정이 있으면 신발 조회 포함), 관리자는 전부.
// 프리셋과 다른 칸 = 개인 권한 중 역할 권한에 없는 것(주황 칸). 사용 중지 계정은 모두 꺼짐으로 본다.

export type PermissionCell = "on" | "off"

export interface EffectiveRow {
  user: AdminUser
  cells: { code: FeatureCode; value: PermissionCell; override: boolean }[]
  /** 프리셋과 다른 칸 수 */
  diff: number
  state: "active" | "locked" | "stopped"
}

/** 역할 코드들의 기능 합집합 */
export function presetFeatures(roleCodes: readonly string[], roles: readonly RoleInfo[]): Set<FeatureCode> {
  const out = new Set<FeatureCode>()
  for (const r of roles) if (roleCodes.includes(r.roleCode)) r.features.forEach((f) => out.add(f))
  return out
}

export function effectiveRow(user: AdminUser, roles: readonly RoleInfo[], codes: readonly FeatureCode[]): EffectiveRow {
  const preset = presetFeatures(user.roles, roles)
  const personal = new Set<FeatureCode>(user.features)
  if (personal.has(FEATURES.SHOE_EDIT)) personal.add(FEATURES.SHOE_VIEW)
  const isAdmin = user.userSe === "ADMIN"
  const stopped = user.useAt === "N"
  let diff = 0
  const cells = codes.map((code) => {
    const override = !isAdmin && personal.has(code) && !preset.has(code)
    if (override) diff++
    const on = isAdmin || preset.has(code) || personal.has(code)
    return { code, value: (on && !stopped ? "on" : "off") as PermissionCell, override }
  })
  return { user, cells, diff, state: stopped ? "stopped" : user.lockAt === "Y" ? "locked" : "active" }
}
