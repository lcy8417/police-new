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

export interface AdminUsersScreenProps {
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
