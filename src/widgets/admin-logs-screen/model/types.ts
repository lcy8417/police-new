import type { ActionInfo, ActivityResult, AdminEvent, AdminSession, AdminUser } from "@/entities/admin"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 결과 필터 — 빈 값 = 전체. 기능 기록 탭에만 적용된다 */
export type ResultFilter = "" | Exclude<ActivityResult, "SUCCESS">

/** 필터 막대 값(빈 문자열 = 조건 없음). 날짜는 KST `YYYY-MM-DD`(끝 날짜 포함) */
export interface LogFilters {
  /** 사용자 ID */
  userId: string
  /** 시작 날짜 */
  from: string
  /** 끝 날짜 */
  to: string
  /** 결과(기능 기록 탭만) */
  result: ResultFilter
  /** 기능 이름표 코드(기능 기록 탭만) */
  actionCode: string
}

export type LogTab = "sessions" | "events"

/** 한 로그인의 기능 타임라인(행을 펼칠 때 따로 불러오므로 상태도 따로) */
export interface SessionTimeline {
  status: ScreenStatus
  events: AdminEvent[]
}

export interface AdminLogsScreenProps {
  /** 현재 탭의 목록 조회 상태 */
  status: ScreenStatus
  /** error 일 때 확인을 시도한 시각 「시:분」 */
  errorAt?: string
  onRetry: () => void
  /** 관리자인가 — 아니면 「관리자만 볼 수 있습니다」(진열 전용 가드) */
  isAdmin: boolean
  tab: LogTab
  onTabChange: (tab: LogTab) => void
  filters: LogFilters
  onFiltersChange: (next: LogFilters) => void
  onResetFilters: () => void
  /** 사용자 필터 선택지 */
  users: AdminUser[]
  /** 기능 필터 선택지(`GET /admin/actions`) */
  actions: ActionInfo[]
  /** 지금 쪽의 로그인 기록(최대 50개) */
  sessions: AdminSession[]
  /** 지금 쪽의 기능 기록(최대 50개) */
  events: AdminEvent[]
  /** 세션 번호 → 펼쳤을 때 보일 타임라인. 없으면 불러오는 중으로 본다 */
  timelines: Record<string, SessionTimeline>
  onRetryTimeline: (sessionId: string) => void
  /** 1부터 시작하는 쪽 번호 */
  page: number
  onPageChange: (page: number) => void
}
