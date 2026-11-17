/**
 * 사용자·권한 관리 화면 규칙 — 계정 상태 판정, 기능 권한 포함 관계, 역할 선택, 아이디 규칙.
 */
import type { AdminUser, OrgSe, RoleCode, RoleInfo } from "@/entities/admin"
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

/** 켜면 신발 조회(`SHOE_VIEW`)가 함께 켜지는 신발 DB 일 — 등록·수정 · 문양 입력 · 승인(서버 실효 권한 규칙, B 단계 §3-1 · 0017). */
const SHOE_WORK_FEATURES: readonly FeatureCode[] = [FEATURES.SHOE_EDIT, FEATURES.SHOE_PATTERN, FEATURES.SHOE_APPROVE]

/**
 * 신발 DB 일(`SHOE_EDIT` · `SHOE_PATTERN` · `SHOE_APPROVE`)을 켜면 `SHOE_VIEW`(신발 조회)도 켜진 것(서버 실효 권한 규칙,
 * 설계서 §2 · B 단계 §3-1). 토글·체크박스에서 `SHOE_VIEW`를 켠 채로 고정해 보여 줄 때 쓴다.
 */
export function isImpliedFeature(selected: readonly FeatureCode[], code: FeatureCode): boolean {
  return code === FEATURES.SHOE_VIEW && SHOE_WORK_FEATURES.some((c) => selected.includes(c))
}

/**
 * 기능 하나를 켜고 끈 새 목록. 신발 DB 일을 켜면 `SHOE_VIEW`도 함께 켠다.
 * 화면 표시 순서(`FEATURE_ORDER`)로 정렬하고, 목록에 없는 기존 기능 코드(서버에 새로 생긴 기능 등)는
 * 지우지 않고 뒤에 그대로 둔다 — 다른 기능을 켜고 끄다가 모르는 권한이 몰래 빠지지 않게(`toggleRole`과 같은 규칙).
 */
export function toggleFeature(
  selected: readonly FeatureCode[],
  code: FeatureCode,
  on: boolean
): FeatureCode[] {
  const next = new Set(selected)
  if (on) {
    next.add(code)
    if (SHOE_WORK_FEATURES.includes(code)) next.add(FEATURES.SHOE_VIEW)
  } else {
    next.delete(code)
  }
  // 화면 표시 순서로 정렬(서버에 보내는 본문도 늘 같은 순서).
  const known = FEATURE_ORDER.filter((item) => next.has(item))
  const unknown = [...next].filter((item) => !FEATURE_ORDER.includes(item))
  return [...known, ...unknown]
}

/** 직원 역할 — 서버 `auth/entities.py` `STAFF_ROLES`와 같다(관서 범위 없이 전체를 봄). */
export const STAFF_ROLES: readonly RoleCode[] = ["EXAMINER", "REVIEWER"]

/** 직원인가 — 관리자이거나 감정관·검증자 역할(서버 `SessionUser.is_staff`와 같은 규칙, 저장된 역할 기준). */
export function isStaffUser(user: Pick<AdminUser, "userSe" | "roles">): boolean {
  return user.userSe === "ADMIN" || user.roles.some((code) => STAFF_ROLES.includes(code))
}

/**
 * 개인 기능 사건 조회(`CRIME_SEARCH`)가 전국 사건 사진 열람이 되는가 — 사건 사진(static)은 관서 범위 없이
 * 「직원 또는 CRIME_SEARCH」로 열린다(서버 `auth/middleware.can_view_crime_photos`). 직원은 원래 전체를 본다.
 */
export function grantsNationwidePhotos(staff: boolean, features: readonly FeatureCode[]): boolean {
  return !staff && features.includes(FEATURES.CRIME_SEARCH)
}

/**
 * 관서를 지정해야 하는가 — 본청 소속 비직원은 의뢰를 하나도 볼 수 없다(서버 `request_repo.scope_org_ids`,
 * 새 사용자의 기본 소속이 본청). 관서 구분을 모르면(목록 못 읽음) 말하지 않는다.
 */
export function needsOrgAssignment(
  user: Pick<AdminUser, "userSe" | "roles">,
  orgSe: OrgSe | undefined
): boolean {
  return orgSe === "HQ" && !isStaffUser(user)
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
  /** 사용자 추가 — 새 계정의 기본 소속은 본청(만든 뒤 상세에서 관서를 바꾼다). */
  newUserHq: "새 사용자는 본청 소속 — 관서를 지정하세요",
  /** 상세 — 본청 소속 비직원(needsOrgAssignment). */
  hqNonStaff: "본청 소속이라 의뢰를 볼 수 없습니다 — 관서를 지정하세요",
  /** 비직원에게 개인 사건 조회(grantsNationwidePhotos). */
  nationwidePhotos: "전국 사건 사진을 볼 수 있게 됩니다",
} as const
