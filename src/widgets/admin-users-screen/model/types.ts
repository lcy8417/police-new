import type { AdminUser, FeatureInfo, Org, RoleCode, RoleInfo } from "@/entities/admin"
import type { FeatureCode, UserSe } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 선택한 사용자의 아직 저장하지 않은 편집 값(제어형 — 보관은 쓰는 쪽) */
export interface UserDraft {
  /** 이름 */
  userNm: string
  /** 계정 구분 */
  userSe: UserSe
  /** 소속 관서 번호 */
  orgId: number
  /** 개인 기능 권한(역할 권한은 여기 없음) */
  features: FeatureCode[]
  /** 역할 코드 */
  roles: RoleCode[]
}

/** 사용자 추가 창 입력 값 */
export interface CreateUserDraft {
  userId: string
  userNm: string
  userSe: UserSe
  /** 임시 비밀번호 */
  initialPassword: string
  /** 켤 기능 권한(관리자는 전부라 쓰지 않음) */
  features: FeatureCode[]
}

/** 열려 있는 창 — 값 입력 · 닫기는 `onDialogChange` 로 알린다 */
export type UserDialogState =
  | { kind: "none" }
  | { kind: "create"; draft: CreateUserDraft; error: string | null }
  | { kind: "reset"; userId: string; tempPassword: string; error: string | null }

/** 역할 분포 막대 한 칸 색(시안: 수사관 회색 · 감정관 파랑 · 기술책임자 보라 · 관리자 밝은 회색) */
export type RoleShareTone = "mute" | "brand" | "violet" | "fg2"

/** 운영 상태 타일 한 칸(숫자 + 보조 글자) */
export interface OverviewCount {
  count: number
  /** 타일 아래 흐린 글자 */
  sub: string
}

/** 계정 운영 상태 타일 값(시안 핀 12 · 13) — 전체 계정 기준 집계라 표의 행과 따로 받는다 */
export interface AdminUsersOverview {
  /** 전체 계정 수 */
  total: number
  /** 역할 분포 */
  roleShares: { label: string; count: number; tone: RoleShareTone }[]
  /** 잠긴 계정 */
  locked: OverviewCount
  /** 비밀번호 90일 지남 */
  passwordExpired: OverviewCount
  /** 30일 넘게 미접속 */
  idle: OverviewCount
  /** 신발 승인 담당 부족 — 담당 수 · 밀린 미승인 건수 */
  approverShortage: OverviewCount & { pending: number }
}

/** 관리자 변경 이력 한 줄(시안 핀 10) */
export interface AdminHistoryRow {
  /** 「MM-DD HH:mm」 */
  at: string
  /** 「누가 → 대상」 */
  who: string
  change: string
  reason: string
  /** 강조 색: 잠금 = warn, 거절 = danger */
  tone?: "warn" | "danger"
}

export interface AdminUsersScreenProps {
  /** 신규(+α) 요소 보이기 — 운영 타일 · 담당 부족 경고 · 역할별 기본 권한 · 실제 권한 표 · 변경 이력 · 엑셀 (기본 true) */
  showPlus?: boolean
  /** 운영 상태 타일 값. 없으면 타일 줄을 그리지 않는다 */
  overview?: AdminUsersOverview | null
  /** 관리자 변경 이력(최신순) */
  adminHistory?: AdminHistoryRow[]
  /** 실제 권한 표 아래 예외 사유 줄(사용자 ID + 글) */
  permissionNotes?: { userId: string; text: string }[]
  /** 「엑셀」(동작 없는 신규 버튼 — 진열은 「시안 — 기능 준비 중」) */
  onExport?: () => void
  status: ScreenStatus
  /** error 일 때 확인을 시도한 시각 「시:분」 */
  errorAt?: string
  onRetry: () => void
  /** 관리자인가 — 아니면 「관리자만 볼 수 있습니다」(진열 전용 가드, 실제 가드는 운영 연결 때) */
  isAdmin: boolean
  users: AdminUser[]
  /** 서버 기능 목록 `GET /admin/features`(12종 그대로) */
  featureList: FeatureInfo[]
  roles: RoleInfo[]
  orgs: Org[]
  /** 지금 로그인한 관리자 ID — 본인 계정은 구분 · 사용 여부를 바꿀 수 없다 */
  currentUserId: string | null
  selectedUserId: string | null
  onSelectUser: (userId: string) => void
  draft: UserDraft | null
  onDraftChange: (patch: Partial<UserDraft>) => void
  onSaveInfo: () => void
  onSaveRoles: () => void
  onSaveFeatures: () => void
  onUnlock: (userId: string) => void
  onSetUseAt: (userId: string, useAt: "Y" | "N") => void
  dialog: UserDialogState
  onDialogChange: (next: UserDialogState) => void
  onDialogSubmit: () => void
}
