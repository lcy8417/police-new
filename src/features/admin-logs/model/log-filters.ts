/**
 * 사용 기록 화면 상수(설계서 §6·§7-4). 필터 값 모양은 위젯(`widgets/admin-logs-screen` `LogFilters`)이 정본.
 */

/** 서버 페이지 크기 — 50개씩, 최신순. 한 페이지가 꽉 차지 않으면 마지막 페이지. */
export const LOG_PAGE_SIZE = 50

/** 기본 기간 = 오늘 포함 최근 7일(KST). */
export const DEFAULT_RANGE_DAYS = 7
