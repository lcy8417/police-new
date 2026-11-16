import type { AdminUser, RoleInfo } from "@/entities/admin"
import { userStatus, USER_STATUS_LABELS } from "@/features/admin-users"
import type { FilterGroup } from "@/shared/ui/kit"

import { DUTY_COLUMNS, dutiesOf } from "./effective-permissions"
import type { ShoeDuty } from "./types"

// S13 사용자 표 거르기(r3). 묶음 안은 「또는」, 묶음끼리는 「그리고」. 검색어는 아이디 · 이름.
export const USER_FILTER_KEYS = { role: "role", duty: "duty", state: "state" } as const

export interface UserFilterValue {
  query: string
  /** 묶음 key → 고른 값 */
  groups: Record<string, string[]>
}

export const EMPTY_USER_FILTER: UserFilterValue = { query: "", groups: {} }

/** 표 열(SCAS 순서). 아이디는 잠금 */
export const USER_COLUMNS = [
  { key: "userId", label: "아이디", locked: true },
  { key: "userNm", label: "이름" },
  { key: "role", label: "구분(역할)" },
  { key: "org", label: "소속 관서" },
  { key: "status", label: "상태" },
  { key: "last", label: "마지막 로그인" },
] as const

const ADMIN_ROLE = "ADMIN"

function rolesOf(u: AdminUser): string[] {
  return u.userSe === "ADMIN" ? [ADMIN_ROLE, ...u.roles] : u.roles
}

export function isUserFilterActive(f: UserFilterValue): boolean {
  return f.query.trim() !== "" || Object.values(f.groups).some((v) => v.length > 0)
}

export function filterUsers(
  users: readonly AdminUser[],
  duties: Record<string, ShoeDuty[]>,
  f: UserFilterValue
): AdminUser[] {
  const q = f.query.trim().toLowerCase()
  const pick = (k: string) => f.groups[k] ?? []
  return users.filter((u) => {
    if (q && !u.userId.toLowerCase().includes(q) && !u.userNm.toLowerCase().includes(q)) return false
    const role = pick(USER_FILTER_KEYS.role)
    if (role.length > 0 && !rolesOf(u).some((r) => role.includes(r))) return false
    const duty = pick(USER_FILTER_KEYS.duty)
    if (duty.length > 0 && !dutiesOf(u, duties[u.userId] ?? []).some((d) => duty.includes(d))) return false
    const state = pick(USER_FILTER_KEYS.state)
    if (state.length > 0 && !state.includes(userStatus(u))) return false
    return true
  })
}

/** FilterBar 묶음(역할 · 신발 DB · 상태). 숫자는 전체 사용자 기준. `withDuty=false` 면 신발 DB 묶음 없음 */
export function userFilterGroups(
  users: readonly AdminUser[],
  roles: readonly RoleInfo[],
  duties: Record<string, ShoeDuty[]>,
  value: UserFilterValue,
  withDuty = true
): FilterGroup[] {
  const sel = (k: string) => value.groups[k] ?? []
  const groups: FilterGroup[] = [
    {
      key: USER_FILTER_KEYS.role,
      label: "역할",
      value: sel(USER_FILTER_KEYS.role),
      options: [
        ...roles.map((r) => ({ value: r.roleCode, label: r.roleNm, count: users.filter((u) => rolesOf(u).includes(r.roleCode)).length })),
        { value: ADMIN_ROLE, label: "관리자", count: users.filter((u) => u.userSe === "ADMIN").length },
      ],
    },
  ]
  if (withDuty) {
    groups.push({
      key: USER_FILTER_KEYS.duty,
      label: "신발 DB",
      value: sel(USER_FILTER_KEYS.duty),
      options: DUTY_COLUMNS.map((d) => ({
        value: d.key,
        label: d.name.replace("신발 ", ""),
        count: users.filter((u) => dutiesOf(u, duties[u.userId] ?? []).includes(d.key)).length,
      })),
    })
  }
  groups.push({
    key: USER_FILTER_KEYS.state,
    label: "상태",
    value: sel(USER_FILTER_KEYS.state),
    options: (["ACTIVE", "LOCKED", "DISABLED"] as const).map((s) => ({
      value: s,
      label: USER_STATUS_LABELS[s],
      count: users.filter((u) => userStatus(u) === s).length,
    })),
  })
  return groups
}
