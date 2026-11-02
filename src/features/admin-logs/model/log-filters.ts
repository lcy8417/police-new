/**
 * 사용 기록 화면 필터·표시 규칙(설계서 §6·§7-4).
 */
import type { ActivityResult, EventFilters, LogoutReason, SessionFilters } from "@/entities/admin"
import { kstDateString } from "@/shared/lib"

/** 서버 페이지 크기 — 50개씩, 최신순. 한 페이지가 꽉 차지 않으면 마지막 페이지. */
export const LOG_PAGE_SIZE = 50

/** 기본 기간 = 오늘 포함 최근 7일(KST). */
export const DEFAULT_RANGE_DAYS = 7

/** 결과 필터 — 빈 값 = 전체. */
export type ResultFilter = "" | Exclude<ActivityResult, "SUCCESS">

/** 화면 필터 상태(빈 문자열 = 조건 없음). 날짜는 `YYYY-MM-DD`(KST, 끝 날짜 포함). */
export interface LogFilters {
  userId: string
  from: string
  to: string
  /** 기능 기록 탭에만 적용. */
  result: ResultFilter
  /** 기능 기록 탭에만 적용(`GET /admin/actions`의 코드). */
  actionCode: string
}

/** 초기 필터 — 전체 사용자, 최근 7일, 결과·기능 전체. */
export function defaultLogFilters(now: Date = new Date()): LogFilters {
  return {
    userId: "",
    from: kstDateString(now, -(DEFAULT_RANGE_DAYS - 1)),
    to: kstDateString(now),
    result: "",
    actionCode: "",
  }
}

const orUndefined = (value: string) => (value === "" ? undefined : value)

/** 로그인 기록 탭 요청 필터(결과·기능 제외). */
export function toSessionFilters(filters: LogFilters): Omit<SessionFilters, "page"> {
  return { userId: orUndefined(filters.userId), from: orUndefined(filters.from), to: orUndefined(filters.to) }
}

/** 기능 기록 탭 요청 필터. */
export function toEventFilters(filters: LogFilters): Omit<EventFilters, "page"> {
  return {
    ...toSessionFilters(filters),
    result: filters.result === "" ? undefined : filters.result,
    actionCode: orUndefined(filters.actionCode),
  }
}

/** 결과 필터 선택지. */
export const RESULT_FILTER_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: "", label: "전체" },
  { value: "FAIL", label: "실패만" },
  { value: "DENIED", label: "권한 없음" },
]

/** 로그인 기록 종료 사유 이름. */
export const LOGOUT_REASON_LABELS: Record<LogoutReason, string> = {
  LOGOUT: "로그아웃",
  IDLE: "시간 초과",
  EXPIRED: "만료",
  ADMIN: "관리자 종료",
  PASSWORD_RESET: "비밀번호 초기화",
}

/** 사용자 이름이 없는 기록(출처 거절·모르는 아이디의 로그인 실패 등). */
export const UNKNOWN_USER_LABEL = "알 수 없음"
