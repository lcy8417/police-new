import type { ActionInfo, ActivityResult, AdminEvent, AdminSession } from "@/entities/admin"
import type { SessionTimeline } from "@/widgets/admin-logs-screen"

import { MOCK_USERS } from "../s13/mock-cases"

// S14 사용·감사 기록 진열용 가짜 값. 이름은 가렸고 IP 는 끝자리를 가렸다. 시각은 ISO + `+09:00`(KST).

// 진열 케이스(frame/dev-screens.ts): 기본 4개에 「한 쪽이 꽉 찬 경우」(full-page 62개, exact-page 딱 50개 — 다음 쪽이 비어 있음)를 더한다.

export const MOCK_LOG_USERS = MOCK_USERS

export const MOCK_ACTIONS: ActionInfo[] = [
  { actionCode: "AUTH_LOGIN", actionNm: "로그인" },
  { actionCode: "CRIME_VIEW", actionNm: "사건 조회" },
  { actionCode: "PATTERN_SEARCH", actionNm: "문양 검색" },
  { actionCode: "REPORT_PRINT", actionNm: "감정서 출력" },
  { actionCode: "SHOE_APPROVE", actionNm: "신발 승인" },
]

const LONG_ERROR =
  "프린터 응답 없음 — 프린터 3층-A 가 120초 동안 응답하지 않아 작업을 취소했습니다. 용지 걸림 또는 네트워크 단절일 수 있습니다. " +
  "관리자는 프린터 상태를 확인한 뒤 다시 출력하세요. ".repeat(4)

let nextLogId = 9000
const ev = (
  sessionId: string,
  time: string,
  actionCode: string,
  actionNm: string,
  targetId: string | null,
  result: ActivityResult,
  extra: Partial<AdminEvent> = {}
): AdminEvent => ({
  logId: nextLogId++,
  sessionId,
  userId: null,
  userNm: null,
  occurredDt: `2026-11-15T${time}:00+09:00`,
  actionCode,
  actionNm,
  featureCode: null,
  targetId,
  result,
  statusCode: result === "SUCCESS" ? 200 : null,
  errorCode: null,
  errorMsg: null,
  durationMs: 120,
  ...extra,
})

const S1 = "sess-0001"
const park: Partial<AdminEvent> = { userId: "park0412", userNm: "박○○ 경위" }
const PARK_EVENTS: AdminEvent[] = [
  ev(S1, "09:02", "AUTH_LOGIN", "로그인", null, "SUCCESS", park),
  ev(S1, "09:05", "CRIME_VIEW", "사건 조회", "00001-25-0646", "SUCCESS", park),
  ev(S1, "09:12", "PATTERN_SEARCH", "문양 검색", "검색번호 572414", "SUCCESS", park),
  ev(S1, "11:58", "REPORT_DOWNLOAD", "감정서 PDF 다운로드", "SCAS수사부-2944", "SUCCESS", park),
  ev(S1, "12:01", "REPORT_PRINT", "감정서 출력", "SCAS수사부-2944", "FAIL", { ...park, statusCode: 504, errorCode: "PRINTER_TIMEOUT", errorMsg: LONG_ERROR }),
  ev(S1, "12:04", "SHOE_APPROVE", "신발 승인", "화류번호 303349", "DENIED", { ...park, statusCode: 403, errorCode: "FORBIDDEN", errorMsg: "SHOE_COLLECT_REVIEW 권한 없음" }),
]

const sessionRow = (n: number, userId: string, userNm: string, loginDt: string, over: Partial<AdminSession> = {}): AdminSession => ({
  sessionId: `sess-${String(n).padStart(4, "0")}`,
  userId,
  userNm,
  loginDt,
  logoutDt: null,
  logoutReason: null,
  ipAddr: "10.14.43.***",
  eventCnt: 0,
  failCnt: 0,
  ...over,
})

export const MOCK_SESSIONS: AdminSession[] = [
  sessionRow(1, "park0412", "박○○ 경위", "2026-11-15T09:02:00+09:00", { eventCnt: PARK_EVENTS.length, failCnt: 1 }),
  sessionRow(2, "kim0301", "김○○ 경위", "2026-11-15T08:47:00+09:00", { logoutDt: "2026-11-15T12:10:00+09:00", logoutReason: "LOGOUT", eventCnt: 9 }),
  sessionRow(3, "choi0115", "최○○ 경감", "2026-11-15T08:31:00+09:00", { logoutDt: "2026-11-15T11:02:00+09:00", logoutReason: "IDLE", ipAddr: "10.14.41.***", eventCnt: 6 }),
  sessionRow(4, "lee0508", "이○○ 경사", "2026-11-13T17:58:00+09:00", { logoutDt: "2026-11-13T18:03:00+09:00", logoutReason: "EXPIRED", ipAddr: "10.21.8.***", eventCnt: 5, failCnt: 5 }),
  sessionRow(5, "admin01", "시스템 관리자", "2026-11-15T08:51:00+09:00", { eventCnt: 7, ipAddr: "10.14.40.***" }),
  // 긴 값: 이름 · 아이디 · IP 가 길어도 표 안에서 줄바꿈된다
  sessionRow(6, "seo0322_temp_dispatch", "서○○ 주무관 (서울특별시경찰청 과학수사과 족적감정팀 파견 담당)", "2026-11-14T09:05:00+09:00", {
    logoutDt: "2026-11-14T18:20:00+09:00",
    logoutReason: "PASSWORD_RESET",
    ipAddr: "2001:0db8:85a3:0000:0000:8a2e:0370:7334 (사내 VPN 우회 접속)",
    eventCnt: 2,
  }),
]

/** 세션 번호 → 펼쳤을 때 타임라인. lee0508 은 못 읽은 경우, 나머지는 몇 줄 */
export const MOCK_TIMELINES: Record<string, SessionTimeline> = {
  "sess-0001": { status: "ready", events: PARK_EVENTS },
  "sess-0002": { status: "ready", events: [ev("sess-0002", "08:47", "AUTH_LOGIN", "로그인", null, "SUCCESS", { userId: "kim0301", userNm: "김○○ 경위" })] },
  "sess-0003": { status: "ready", events: [] },
  "sess-0004": { status: "error", events: [] },
}

export const MOCK_EVENTS: AdminEvent[] = Object.values(MOCK_TIMELINES)
  .flatMap((t) => t.events)
  .sort((a, b) => b.occurredDt.localeCompare(a.occurredDt))

/** 「한 쪽이 꽉 찬」 케이스용 62개(50 + 12) */
export const MANY_SESSIONS: AdminSession[] = Array.from({ length: 62 }, (_, i) =>
  sessionRow(100 + i, `user${String(i).padStart(4, "0")}`, `이용자${i + 1}`, `2026-11-14T${String(8 + (i % 10)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00+09:00`, {
    logoutDt: "2026-11-14T19:00:00+09:00",
    logoutReason: "LOGOUT",
    eventCnt: i % 7,
  })
)
