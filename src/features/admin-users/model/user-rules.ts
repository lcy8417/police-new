/**
 * 사용자·권한 관리 화면 규칙 — 계정 상태 판정, 기능 권한 포함 관계, 역할 선택, 아이디 규칙.
 */
import type { AdminUser, RoleCode, RoleInfo } from "@/entities/admin"
import { FEATURES, FEATURE_ORDER, type FeatureCode } from "@/entities/session"

/**
 * 역할 하나를 켜고 끈 새 목록 — 서버 역할 순서(`order`, `GET /admin/roles`)로 정렬하고,
 * 목록에 없는 기존 역할 코드는 지우지 않고 뒤에 그대로 둔다(서버에 보내는 본문도 늘 같은 순서).
 */
export function toggleRole(
  selected: readonly RoleCode[],
  code: RoleCode,
  on: boolean,
  order: readonly RoleCode[]
): RoleCode[] {
  const next = new Set(selected)
  if (on) next.add(code)
  else next.delete(code)
  const known = order.filter((item) => next.has(item))
  const unknown = [...next].filter((item) => !order.includes(item))
  return [...known, ...unknown]
}

/** 두 역할 목록이 (순서와 무관하게) 같은가. */
export function sameRoles(a: readonly RoleCode[], b: readonly RoleCode[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((code) => set.has(code))
}

/** 역할 이름 한 줄(`수사관 · 감정관`) — 이름은 서버 역할 목록에서, 모르는 코드는 코드 그대로. 역할이 없으면 null. */
export function roleNames(codes: readonly RoleCode[], roles: readonly RoleInfo[]): string | null {
  if (codes.length === 0) return null
  const byCode = new Map(roles.map((role) => [role.roleCode, role.roleNm]))
  return codes.map((code) => byCode.get(code) ?? code).join(" · ")
}

/** 계정 상태 — 사용 / 잠금(연속 실패) / 중지. 중지가 잠금보다 우선한다. */
export type UserStatus = "ACTIVE" | "LOCKED" | "DISABLED"

export function userStatus(user: Pick<AdminUser, "useAt" | "lockAt">): UserStatus {
  if (user.useAt === "N") return "DISABLED"
  if (user.lockAt === "Y") return "LOCKED"
  return "ACTIVE"
}

/** 화면에 보일 계정 상태 이름. */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "사용",
  LOCKED: "잠금",
  DISABLED: "중지",
}

/**
 * `SHOE_EDIT`(신발 등록·수정)를 켜면 `SHOE_VIEW`(신발 조회)도 켜진 것(서버 실효 권한 규칙,
 * 설계서 §2). 토글·체크박스에서 `SHOE_VIEW`를 켠 채로 고정해 보여 줄 때 쓴다.
 */
export function isImpliedFeature(selected: readonly FeatureCode[], code: FeatureCode): boolean {
  return code === FEATURES.SHOE_VIEW && selected.includes(FEATURES.SHOE_EDIT)
}

/** 기능 하나를 켜고 끈 새 목록. `SHOE_EDIT`를 켜면 `SHOE_VIEW`도 함께 켠다. */
export function toggleFeature(
  selected: readonly FeatureCode[],
  code: FeatureCode,
  on: boolean
): FeatureCode[] {
  const next = new Set(selected)
  if (on) {
    next.add(code)
    if (code === FEATURES.SHOE_EDIT) next.add(FEATURES.SHOE_VIEW)
  } else {
    next.delete(code)
  }
  // 화면 표시 순서로 정렬(서버에 보내는 본문도 늘 같은 순서).
  return FEATURE_ORDER.filter((item) => next.has(item))
}

/** 두 기능 목록이 (순서와 무관하게) 같은가. */
export function sameFeatures(a: readonly FeatureCode[], b: readonly FeatureCode[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((code) => set.has(code))
}

/** 아이디 규칙(서버와 같음): 영문·숫자·`_` 4~20자. */
export const USER_ID_PATTERN = /^[A-Za-z0-9_]{4,20}$/

/** 화면 검사 문구. */
export const USER_FORM_MESSAGES = {
  userId: "아이디는 영문·숫자·_ 4~20자로 입력하세요",
  userNm: "이름을 입력하세요",
} as const
