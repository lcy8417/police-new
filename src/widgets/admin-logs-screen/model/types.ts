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
  /** 대상 번호(감정번호 · 화류번호 등, 기능 기록 탭만) — 신규(+α) 칸, 지금 서버 API 에는 없음 */
  targetNo?: string
}

/** 탭 — `admin`(관리자 행위)은 신규(+α) 탭이라 `showPlus` 일 때만 보인다 */
export type LogTab = "sessions" | "events" | "admin"

/** 관리자 행위 탭 한 줄(시안 핀 5 — 서버 API 가 아직 없어 쓰는 쪽이 넘김) */
export interface AdminActionRow {
  /** 「MM-DD HH:mm」 */
  at: string
  /** 한 관리자(또는 시스템) */
  who: string
  /** 무엇을 했나 */
  text: string
  /** 강조: 잠금 = warn, 거절 = danger */
  tone?: "warn" | "danger"
}

/** 한 로그인의 기능 타임라인(행을 펼칠 때 따로 불러오므로 상태도 따로) */
export interface SessionTimeline {
  status: ScreenStatus
  events: AdminEvent[]
}

/** 기능 종류 칩 색(시안 ACT: 조회 기본 · 검색 파랑 · 등록 초록 · 수정 주황 · 삭제 빨강 · 보고서 보라 …) */
export type AuditKindTone = "default" | "blue" | "green" | "amber" | "red" | "violet"

/** 이상 징후 한 줄(시안 핀 11) */
export interface LogAlert {
  /** bad = 확인 필요(!) · warn = 주의(?) · ok = 없음(✓) */
  tone: "bad" | "warn" | "ok"
  title: string
  /** 아래 흐린 글자(누가 · 언제 · 몇 건) */
  detail: string
  /** 오른쪽 칩 글자 */
  badge: string
  badgeTone: "red" | "amber" | "default" | "none"
}

/**
 * S14 시안 r3 요약 칸 값(시간대별 사용량 · 이상 징후 · 기록 무결성 · 감사 항목 · 내려받기 제한 · 관리자 행위).
 * 지금 서버 API 에 없는 집계라 진열 페이지가 시안 예시 값을 넘긴다.
 */
export interface AdminLogsInsights {
  activity: {
    /** 0~23시 오늘 한 시간 기능 기록 수 */
    hourly: number[]
    /** 0~23시 최근 7일 평균 */
    weekAvg: number[]
    /** 「지금」 선을 그을 시(0~24) */
    nowHour: number
    /** 오늘 기능 기록 수 */
    total: number
    /** 로그인 · 업무 시간 밖 · 실패·권한 없음 */
    logins: number
    offHours: number
    failures: number
  }
  alerts: LogAlert[]
  integrity: {
    /** 해시 사슬 끝 5개(번호 · 지문 앞 4자) */
    chain: { no: number; hash: string }[]
    checks: { text: string; note: string }[]
  }
  auditKinds: { label: string; count: number; desc: string; tone: AuditKindTone }[]
  exportRules: string[]
  adminActs: { at: string; who: string; text: string }[]
}

export interface AdminLogsScreenProps {
  /** 신규(+α) 요소 보이기 — 요약 칸 · 보존 기간 · 엑셀 · 감사 항목 등 (기본 true) */
  showPlus?: boolean
  /** 시안 r3 요약 칸 값. 없으면 그 칸들을 그리지 않는다 */
  insights?: AdminLogsInsights | null
  /** 「엑셀 내보내기」(동작 없는 신규 버튼 — 진열은 「시안 — 기능 준비 중」) */
  onExport?: () => void
  /** 탭 옆 숫자(시안 38 · 412 · 9) */
  tabCounts?: { sessions: number; events: number; admin: number } | null
  /** 관리자 행위 탭 목록(최신순) */
  adminActions?: AdminActionRow[]
  /** 표 아래 「더 보기」(시안). 쪽 넘김은 그대로 둔다 */
  onLoadMore?: () => void
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
  /** 펼친 세션 번호(제어형 — 펼칠 때 기능 기록을 불러와야 하므로 쓰는 쪽이 안다) */
  expandedSessionIds: string[]
  /** 세션 행을 펼치거나 접었다 */
  onToggleSession: (sessionId: string, open: boolean) => void
  /** 1부터 시작하는 쪽 번호 */
  page: number
  onPageChange: (page: number) => void
}
