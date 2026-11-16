import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 로그인과 비밀번호 변경이 함께 받는 값 */
interface LoginScreenBase {
  /** 요청 상태. loading = 제출 중(버튼 잠김), error = 서버에 닿지 못함. empty 는 없다 */
  status: Exclude<ScreenStatus, "empty">
  /** 서버가 준 거절 문구 그대로(401 불일치 · 423 잠금 · 400 규칙 …). 없으면 null */
  errorMessage: string | null
  /** 확인을 시도한 시각 「시:분」(error 일 때만 보임) */
  errorAt?: string
  /** error 일 때 「다시」 */
  onRetry: () => void
  /** 폼 제출(엔터 포함) */
  onSubmit: () => void
}

/** 로그인 모드 값 */
export interface LoginModeProps extends LoginScreenBase {
  mode: "login"
  userId: string
  onUserIdChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  /** 아이디 저장 */
  remember: boolean
  onRememberChange: (value: boolean) => void
}

/** 비밀번호 변경 모드 값 */
export interface PasswordChangeModeProps extends LoginScreenBase {
  mode: "password-change"
  currentPassword: string
  onCurrentPasswordChange: (value: string) => void
  newPassword: string
  onNewPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  /** 관리자가 초기화한 임시 비밀번호로 들어와 꼭 바꿔야 하는가 */
  forced: boolean
  /** 지금 로그인한 계정(머리 아래에 보임) */
  account: { userNm: string; userId: string } | null
  /** 강제면 「로그아웃」, 아니면 「취소」 */
  onSecondary: () => void
}

export type LoginScreenProps = LoginModeProps | PasswordChangeModeProps
