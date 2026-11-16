import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 시연 단계 줄에서 누르면 갈 화면(시안 단계 줄 S02~S09) */
export type DemoScreen = "s02" | "s03" | "s04" | "s05" | "s06" | "s09"

/**
 * 「AI 감정 시연」에 쓰는 그림 주소(가짜 예시 그림 — 실제 사건 사진 금지). 위젯은 받은 주소를 그대로 그린다.
 * 시안 `M.sole` 의 scene · bin · shoe 그림과 `M.picon` 문양 3개에 해당한다.
 */
export interface LoginDemoArt {
  /** 현장 족적(scene, 무늬 dots · herring · grid, 일부 소실) */
  scene: string
  /** 같은 족적의 이진화(bin) */
  binary: string
  /** 정답 신발 305657 밑창(shoe) */
  answer: string
  /** 리랭킹 표의 다른 후보 4켤레(281904 · 305659 · 274466 · 301122 순) */
  candidates: readonly [string, string, string, string]
  /** 상 · 중 · 하 「AI 제안」 문양 그림(경로는 쓰는 쪽이 붙여서 넘김) */
  patterns: { top: string; mid: string; bottom: string }
}

/** 지난 로그인 안내(시안 핀 4) */
export interface LastLoginInfo {
  /** 「YYYY-MM-DD HH:mm」 */
  at: string
  /** 가린 PC 주소(예 10.14.43.***) */
  ip: string
  /** 그 뒤 실패 횟수 */
  failCount: number
}

/** 로그인과 비밀번호 변경이 함께 받는 값 */
interface LoginScreenBase {
  /** 신규(+α) 요소 보이기 — 시연 · 소개 · 안내 · 역할별 첫 화면 · 남은 시도 (기본 true) */
  showPlus?: boolean
  /** 관리자인가(역할별 첫 화면 줄의 「지금」 표시) */
  isAdmin?: boolean
  /** 보는 사람의 기능 권한(역할별 첫 화면 줄의 「지금」 표시) */
  features?: readonly FeatureCode[]
  /** 시연 그림. 없으면 시연 칸을 그리지 않는다 */
  demoArt?: LoginDemoArt
  /** 시연 단계 줄을 눌렀다 */
  onOpenDemoStep?: (screen: DemoScreen) => void
  /** 앱 「화면 설정 → 움직임 줄이기」. 켜면 시연이 다 끝난 모양으로 멈춘다(운영체제 설정은 화면이 따로 본다, 기본 false) */
  reducedMotion?: boolean
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
  /** 연속 실패 잠금 안내(시안 핀 2). 서버가 남은 횟수를 줄 때만 — 없으면 거절 문구만 보인다 */
  attempts?: { remaining: number; limit: number } | null
  /** 지난 로그인 · 그 뒤 실패 횟수(시안 핀 4). 없으면 그 줄을 그리지 않는다 */
  lastLogin?: LastLoginInfo | null
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
