import type { ActionInfo, ActivityResult, AdminEvent, AdminSession } from "@/entities/admin"
import type { AdminActionRow, AdminLogsInsights, SessionTimeline } from "@/widgets/admin-logs-screen"

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

// ── r2(시안 r3 +α) 요약 칸 예시 값 — 시안 s14-admin-logs.js 그대로(서버 API 에 없는 집계) ──

/** 탭 옆 숫자(시안: 로그인 38 · 기능 412 · 관리자 행위 9) */
export const MOCK_TAB_COUNTS = { sessions: 38, events: 412, admin: 9 } as const

/** 관리자 행위 탭 9줄 — 시안 S14 「관리자 행위 · 최근」 5줄 + S13 관리자 변경 이력 · 예외 사유(같은 사건) */
export const MOCK_ADMIN_ACTIONS: AdminActionRow[] = [
  { at: "07-24 09:10", who: "admin01", text: "park0412 문양 입력 담당 지정" },
  { at: "07-23 16:40", who: "admin01", text: "기초코드 FT002200 사용여부 Y → N" },
  { at: "07-23 14:00", who: "admin01", text: "jang0105 신발 승인 담당 지정" },
  { at: "07-22 18:20", who: "admin01", text: "lee0508 잠금 사유 확인 요청(대구청)" },
  { at: "07-22 18:03", who: "시스템", text: "lee0508 계정 잠금 — 비밀번호 5회 연속 실패", tone: "warn" },
  { at: "07-22 10:00", who: "admin01", text: "모델 검색 v3.1 운영 전환" },
  { at: "07-21 11:20", who: "admin01", text: "choi0115 역할 감정관 → 기술책임자" },
  { at: "07-20 10:02", who: "admin01", text: "본인 권한 변경 시도 — 거절: 본인 권한은 다른 관리자만", tone: "danger" },
  { at: "07-19", who: "admin01", text: "han0911 신발 조회 켬 — 경북청 신발 조회 협조" },
]

export const MOCK_INSIGHTS: AdminLogsInsights = {
  activity: {
    hourly: [0, 0, 0, 0, 0, 0, 0, 0, 6, 58, 61, 55, 24, 34, 52, 49, 41, 32, 0, 0, 0, 0, 0, 0],
    weekAvg: [0, 0, 0, 0, 0, 0, 0, 1, 9, 50, 57, 52, 22, 36, 49, 47, 40, 26, 6, 1, 0, 2, 0, 0],
    nowHour: 18,
    total: 412,
    logins: 38,
    offHours: 0,
    failures: 3,
  },
  alerts: [
    { tone: "bad", title: "업무 시간 밖 대량 내려받기", detail: "seo0322 · 07-23 21:47 · 원본 이미지 46건 (기준 20건·예시)", badge: "확인 전", badgeTone: "red" },
    { tone: "bad", title: "로그인 연속 실패 → 계정 잠금", detail: "lee0508 · 07-22 17:58–18:03 · 5회 · 10.21.8.***", badge: "잠금 유지", badgeTone: "amber" },
    { tone: "warn", title: "관리자가 본인 권한 변경 시도", detail: "admin01 · 07-20 10:02 · 서버가 거절", badge: "거절됨", badgeTone: "default" },
    { tone: "warn", title: "권한 없는 기능 반복 시도", detail: "park0412 · 오늘 12:04·12:06 · 승인·삭제", badge: "2건", badgeTone: "default" },
    { tone: "ok", title: "같은 아이디 두 곳 동시 로그인", detail: "없음", badge: "0건", badgeTone: "none" },
  ],
  integrity: {
    chain: [
      { no: 455, hash: "a91f" },
      { no: 456, hash: "07c2" },
      { no: 457, hash: "e4b8" },
      { no: 458, hash: "5d30" },
      { no: 459, hash: "c16e" },
    ],
    checks: [
      { text: "오늘 기록 459건 · 사슬 끊김 0", note: "18:00 검사" },
      { text: "보관 저장소 사본과 일치", note: "매일 02:00" },
      { text: "지운 기록 0 · 고친 기록 0", note: "고칠 수 없음" },
      { text: "이 화면을 본 일도 기록됨", note: "오늘 6회" },
    ],
  },
  auditKinds: [
    { label: "조회", count: 212, desc: "사건·신발·이미지를 열어 본 기록", tone: "default" },
    { label: "검색", count: 96, desc: "문양 검색·재검색(검색번호)", tone: "blue" },
    { label: "등록", count: 34, desc: "사건·신발·확인대상 등록", tone: "green" },
    { label: "수정", count: 41, desc: "문양·기본정보·판단 수정", tone: "amber" },
    { label: "삭제", count: 3, desc: "무엇을 지웠는지 원본 값과 함께", tone: "red" },
    { label: "보고서 생성", count: 8, desc: "감정서 초안·확정", tone: "violet" },
    { label: "다운로드", count: 11, desc: "파일·이미지 내려받기", tone: "blue" },
    { label: "출력", count: 7, desc: "인쇄(프린터 이름)", tone: "violet" },
    { label: "교차 검증", count: 6, desc: "요청·접수·의견 일치/불일치", tone: "violet" },
    { label: "감정서 검토", count: 4, desc: "감정서 검토 요청·완료(기술책임자)", tone: "violet" },
    { label: "신발 승인", count: 37, desc: "신발 DB 확정(승인 담당)", tone: "green" },
  ],
  exportRules: [
    "감정서·원본 이미지 내려받기는 감정관·관리자만",
    "모든 파일에 내려받은 사람·시각 워터마크",
    "하루 20건 넘으면 관리자 확인 (예시 기준)",
    "원본 이미지와 처리 이미지는 따로 저장, 원본은 고칠 수 없음",
  ],
  adminActs: [
    { at: "07-24 09:10", who: "admin01", text: "park0412 문양 입력 담당 지정" },
    { at: "07-23 14:00", who: "admin01", text: "jang0105 신발 승인 담당 지정" },
    { at: "07-23 16:40", who: "admin01", text: "기초코드 FT002200 사용여부 Y → N" },
    { at: "07-22 18:20", who: "admin01", text: "lee0508 잠금 사유 확인 요청(대구청)" },
    { at: "07-22 10:00", who: "admin01", text: "모델 검색 v3.1 운영 전환" },
  ],
}
