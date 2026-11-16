import type { AdminUser, FeatureInfo, Org, RoleInfo } from "@/entities/admin"
import { FEATURE_LABELS, FEATURE_ORDER, FEATURES } from "@/entities/session"
import type { AdminHistoryRow, AdminUsersOverview } from "@/widgets/admin-users-screen"

// S13 사용자 관리 진열용 가짜 값. 이름은 가렸고(박○○), 기능 목록은 서버 `GET /admin/features` 모양 12종 그대로.

/** 서버 기능 목록 12종(`FeatureInfo[]`, 표시 순서 10~120) */
export const MOCK_FEATURES: FeatureInfo[] = FEATURE_ORDER.map((featureCode, i) => ({
  featureCode,
  featureNm: FEATURE_LABELS[featureCode],
  sortOrdr: (i + 1) * 10,
}))

export const MOCK_ROLES: RoleInfo[] = [
  { roleCode: "INVESTIGATOR", roleNm: "수사관", sortOrdr: 10, features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH, FEATURES.CASE_STATUS_VIEW, FEATURES.REPORT_VIEW] },
  { roleCode: "EXAMINER", roleNm: "감정관", sortOrdr: 20, features: [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW, FEATURES.EXAM_DECIDE, FEATURES.CROSS_REVIEW, FEATURES.REPORT_WRITE] },
  { roleCode: "REVIEWER", roleNm: "검증자", sortOrdr: 30, features: [FEATURES.CRIME_SEARCH, FEATURES.CROSS_REVIEW, FEATURES.REPORT_APPROVE, FEATURES.REPORT_SEND] },
]

export const MOCK_ORGS: Org[] = [
  { orgId: 1, upperOrgId: null, orgSe: "HQ", orgNm: "경찰청 범죄분석과", grfcCode: "11000", useAt: "Y", sortOrdr: 10 },
  { orgId: 2, upperOrgId: 1, orgSe: "PROVINCIAL", orgNm: "대구청 과학수사계", grfcCode: "27000", useAt: "Y", sortOrdr: 20 },
  { orgId: 3, upperOrgId: 1, orgSe: "PROVINCIAL", orgNm: "경북청 과학수사계", grfcCode: "47000", useAt: "Y", sortOrdr: 30 },
  { orgId: 4, upperOrgId: 1, orgSe: "PROVINCIAL", orgNm: "부산청 과학수사계", grfcCode: "26000", useAt: "Y", sortOrdr: 40 },
  { orgId: 5, upperOrgId: 1, orgSe: "EXTERNAL", orgNm: "과학수사관리관실", grfcCode: null, useAt: "Y", sortOrdr: 50 },
  { orgId: 6, upperOrgId: 1, orgSe: "STATION", orgNm: "서울특별시경찰청 과학수사과 범죄분석계 족적감정팀 (임시 파견 · 2026년 하반기)", grfcCode: null, useAt: "Y", sortOrdr: 60 },
]

const base: Pick<AdminUser, "lockAt" | "useAt" | "features" | "roles"> = { lockAt: "N", useAt: "Y", features: [], roles: [] }

export const MOCK_USERS: AdminUser[] = [
  { ...base, userId: "park0412", userNm: "박○○ 경위", userSe: "USER", roles: ["EXAMINER"], features: [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW, FEATURES.EXAM_DECIDE], orgId: 1, orgNm: "경찰청 범죄분석과", lastLoginDt: "2026-11-15T17:58:00+09:00" },
  { ...base, userId: "kim0301", userNm: "김○○ 경위", userSe: "USER", roles: ["EXAMINER"], features: [FEATURES.CRIME_SEARCH], orgId: 1, orgNm: "경찰청 범죄분석과", lastLoginDt: "2026-11-15T16:20:00+09:00" },
  { ...base, userId: "choi0115", userNm: "최○○ 경감", userSe: "USER", roles: ["REVIEWER"], features: [FEATURES.REPORT_APPROVE], orgId: 1, orgNm: "경찰청 범죄분석과", lastLoginDt: "2026-11-15T15:02:00+09:00" },
  { ...base, userId: "lee0508", userNm: "이○○ 경사", userSe: "USER", roles: ["INVESTIGATOR"], lockAt: "Y", features: [FEATURES.CRIME_REGISTER], orgId: 2, orgNm: "대구청 과학수사계", lastLoginDt: "2026-11-13T18:03:00+09:00" },
  // 시안 핀 14 의 예외 예시: 수사관인데 신발 조회를 따로 켬(역할 프리셋과 다른 칸)
  { ...base, userId: "han0911", userNm: "한○○ 경사", userSe: "USER", roles: ["INVESTIGATOR"], features: [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW], orgId: 3, orgNm: "경북청 과학수사계", lastLoginDt: "2026-11-12T09:12:00+09:00" },
  { ...base, userId: "admin01", userNm: "시스템 관리자", userSe: "ADMIN", orgId: 5, orgNm: "과학수사관리관실", lastLoginDt: "2026-11-16T08:51:00+09:00" },
  { ...base, userId: "yoon0203", userNm: "윤○○ 경장", userSe: "USER", useAt: "N", roles: ["INVESTIGATOR"], orgId: 4, orgNm: "부산청 과학수사계", lastLoginDt: "2026-03-02T10:05:00+09:00" },
  { ...base, userId: "newbie01", userNm: "정○○ 순경", userSe: "USER", roles: ["INVESTIGATOR"], features: [FEATURES.CASE_STATUS_VIEW], orgId: 1, orgNm: "경찰청 범죄분석과", lastLoginDt: null },
  { ...base, userId: "seo0322", userNm: "서○○ 주무관", userSe: "USER", roles: ["EXAMINER"], features: [FEATURES.SHOE_EDIT, FEATURES.SHOE_VIEW], orgId: 6, orgNm: MOCK_ORGS[5].orgNm, lastLoginDt: null },
]

/** 로그인한 관리자(진열) */
export const MOCK_CURRENT_USER_ID = "admin01"

// ── r2(시안 r3 +α) 예시 값 — 시안 s13-admin-users.js 그대로 ──

/** 계정 운영 상태 타일(핀 12 · 13). 전체 계정 38명 기준 집계(표의 9명은 그 일부) */
export const MOCK_OVERVIEW: AdminUsersOverview = {
  total: 38,
  roleShares: [
    { label: "수사관", count: 18, tone: "mute" },
    { label: "감정관", count: 14, tone: "brand" },
    { label: "기술책임자", count: 3, tone: "violet" },
    { label: "관리자", count: 3, tone: "fg2" },
  ],
  locked: { count: 1, sub: "lee0508 · 07-22 18:03 비밀번호 5회 실패" },
  passwordExpired: { count: 2, sub: "다음 로그인 때 바꾸게 함 (예시 규칙)" },
  idle: { count: 2, sub: "yoon0203(중지) 외 1명 · 중지 검토" },
  approverShortage: { count: 1, pending: 536, sub: "3월분 미승인 · 하루 약 50매면 약 11일 걸림 · 승인 담당 추가 검토" },
}

/** 관리자 변경 이력(핀 10) */
export const MOCK_ADMIN_HISTORY: AdminHistoryRow[] = [
  { at: "07-24 09:10", who: "admin01 → park0412", change: "문양 입력(SHOE_PATTERN) 켬", reason: "3월분 536건 문양 입력 지원" },
  { at: "07-23 14:00", who: "admin01 → jang0105", change: "신발 승인(SHOE_APPROVE) 켬", reason: "승인 담당 지정" },
  { at: "07-22 18:03", who: "시스템 → lee0508", change: "계정 잠금", reason: "비밀번호 5회 연속 실패", tone: "warn" },
  { at: "07-21 11:20", who: "admin01 → choi0115", change: "역할 감정관 → 기술책임자", reason: "기술책임자 지정" },
  { at: "07-20 10:02", who: "admin01 → admin01", change: "본인 권한 변경 시도", reason: "거절: 본인 권한은 다른 관리자만", tone: "danger" },
]

/** 실제 권한 표 아래 예외 사유(핀 14) */
export const MOCK_PERMISSION_NOTES = [{ userId: "han0911", text: "신발 조회 켬 — 사유 「경북청 신발 조회 협조」 · 07-19 admin01" }]
