import type { AdminUser, RoleInfo } from "@/entities/admin"
import { FEATURES, type FeatureCode } from "@/entities/session"

import type { ShoeDuty } from "./types"

// S13 「역할별 기본 권한」(시안 핀 3) · 「사용자별 실제 권한」(핀 14) 계산 — 표시 전용 순수 함수.
// 칸은 시안의 9개: 역할 기능 6(서버 기능 코드로 판정, ◐ 보기만은 보기 코드) + 신발 DB 분업 3(사람마다 지정).
// 실제 권한 = 역할 권한(프리셋) ∪ 개인 권한(신발 등록·수정이 있으면 신발 조회 포함), 관리자는 전부, 사용 중지는 모두 꺼짐.
// 프리셋과 다른 칸 = 역할 기능 칸에서 개인 권한이 프리셋보다 넓은 칸(주황). 분업 칸은 사람마다라 비교하지 않는다.

/** 칸 값: 켜짐 ● · 보기만 ◐ · 분업 맡음 ◆ · 꺼짐 — */
export type PermissionCell = "on" | "view" | "duty" | "off"

/** 신발 DB 분업 코드 — 신발 등록은 서버 기능 SHOE_EDIT, 나머지 둘은 아직 서버에 없는 시안 코드 */
export type DutyCode = typeof FEATURES.SHOE_EDIT | ShoeDuty

export interface RoleColumn {
  kind: "role"
  key: string
  name: string
  short: [string, string]
  on: FeatureCode
  view?: FeatureCode
  memo: string
  /** 시안 「신규」 표시 */
  isNew?: boolean
}

export interface DutyColumn {
  kind: "duty"
  key: DutyCode
  name: string
  short: [string, string]
  memo: string
  isNew?: boolean
}

export type PermissionColumn = RoleColumn | DutyColumn

/** 시안 FEAT 6줄(역할에 따라 켜지는 기능) */
export const ROLE_COLUMNS: readonly RoleColumn[] = [
  { kind: "role", key: "crime-register", name: "사건 등록", short: ["사건", "등록"], on: FEATURES.CRIME_REGISTER, memo: "감정관은 「임의 등록」" },
  {
    kind: "role",
    key: "crime-search",
    name: "사건 조회",
    short: ["사건", "조회"],
    on: FEATURES.CRIME_SEARCH,
    view: FEATURES.CASE_STATUS_VIEW,
    memo: "수사관은 우리 청 의뢰만",
  },
  { kind: "role", key: "cross", name: "교차 검증", short: ["교차", "검증"], on: FEATURES.CROSS_REVIEW, memo: "남이 요청한 건만 · 자기 건 불가", isNew: true },
  {
    kind: "role",
    key: "report",
    name: "감정서 작성",
    short: ["감정서", "작성"],
    on: FEATURES.REPORT_WRITE,
    view: FEATURES.REPORT_VIEW,
    memo: "수사관은 발급본 열람",
    isNew: true,
  },
  { kind: "role", key: "sign", name: "감정서 결재", short: ["감정서", "결재"], on: FEATURES.REPORT_APPROVE, memo: "서명란 감정관·감정관·기술책임자", isNew: true },
  { kind: "role", key: "shoe-view", name: "신발 조회", short: ["신발", "조회"], on: FEATURES.SHOE_VIEW, memo: "" },
]

/** 시안 DUTY 3줄(신발 DB 분업 — 역할과 따로, 사람마다) */
export const DUTY_COLUMNS: readonly DutyColumn[] = [
  { kind: "duty", key: FEATURES.SHOE_EDIT, name: "신발 등록", short: ["신발", "등록"], memo: "수집 검수·엑셀 일괄 등록" },
  { kind: "duty", key: "SHOE_PATTERN", name: "문양 입력", short: ["문양", "입력"], memo: "상·중·하·윤곽 입력", isNew: true },
  { kind: "duty", key: "SHOE_APPROVE", name: "신발 승인", short: ["신발", "승인"], memo: "신발 DB 확정 · 하루 약 50매", isNew: true },
]

export const PERMISSION_COLUMNS: readonly PermissionColumn[] = [...ROLE_COLUMNS, ...DUTY_COLUMNS]

const RANK: Record<PermissionCell, number> = { off: 0, view: 1, on: 2, duty: 2 }

/** 역할 코드들의 기능 합집합 */
export function presetFeatures(roleCodes: readonly string[], roles: readonly RoleInfo[]): Set<FeatureCode> {
  const out = new Set<FeatureCode>()
  for (const r of roles) if (roleCodes.includes(r.roleCode)) r.features.forEach((f) => out.add(f))
  return out
}

/** 한 역할 칸의 값(기능 묶음 기준) */
export function roleCellOf(col: RoleColumn, features: ReadonlySet<FeatureCode>): PermissionCell {
  if (features.has(col.on)) return "on"
  if (col.view && features.has(col.view)) return "view"
  return "off"
}

/** 사람이 맡은 분업(신발 등록 = 개인 SHOE_EDIT, 나머지 = 분업 지정) */
export function dutiesOf(user: Pick<AdminUser, "features" | "userSe">, assigned: readonly ShoeDuty[]): DutyCode[] {
  if (user.userSe === "ADMIN") return []
  return [...(user.features.includes(FEATURES.SHOE_EDIT) ? [FEATURES.SHOE_EDIT] : []), ...assigned]
}

export interface EffectiveRow {
  user: AdminUser
  cells: { key: string; kind: PermissionColumn["kind"]; value: PermissionCell; override: boolean }[]
  /** 프리셋과 다른 칸 수 */
  diff: number
  state: "active" | "locked" | "stopped"
}

export function effectiveRow(user: AdminUser, roles: readonly RoleInfo[], assigned: readonly ShoeDuty[]): EffectiveRow {
  const preset = presetFeatures(user.roles, roles)
  const personal = new Set<FeatureCode>(user.features)
  if (personal.has(FEATURES.SHOE_EDIT)) personal.add(FEATURES.SHOE_VIEW)
  const isAdmin = user.userSe === "ADMIN"
  const stopped = user.useAt === "N"
  const duties = dutiesOf(user, assigned)
  let diff = 0
  const cells = PERMISSION_COLUMNS.map((col) => {
    if (isAdmin) return { key: col.key, kind: col.kind, value: (stopped ? "off" : "on") as PermissionCell, override: false }
    if (col.kind === "duty") {
      const on = duties.includes(col.key)
      return { key: col.key, kind: col.kind, value: (on && !stopped ? "duty" : "off") as PermissionCell, override: false }
    }
    const pv = roleCellOf(col, preset)
    const uv = roleCellOf(col, personal)
    const override = RANK[uv] > RANK[pv]
    if (override) diff++
    const value = RANK[uv] > RANK[pv] ? uv : pv
    return { key: col.key, kind: col.kind, value: stopped ? "off" : value, override }
  })
  return { user, cells, diff, state: stopped ? "stopped" : user.lockAt === "Y" ? "locked" : "active" }
}
