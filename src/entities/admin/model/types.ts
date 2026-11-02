/**
 * 관리자 API 타입 — `/admin/*`(설계서 §6). 서버는 snake로 응답하고(`*Dto`),
 * 프론트는 `convertKeysToCamelCase`로 바꿔 쓴다. 시각은 ISO 8601 + `+09:00`(KST).
 */
import type { FeatureCode, UserSe } from "@/entities/session";

/** 사용 여부·잠김 여부 플래그(SCAS 관례 `Y`/`N`). */
export type YesNo = "Y" | "N";

/** 기능 이벤트 결과 — 성공 / 실패 / 권한 없음. */
export type ActivityResult = "SUCCESS" | "FAIL" | "DENIED";

/** 로그인 기록 종료 사유 — 로그아웃 / 시간 초과 / 만료 / 관리자 종료 / 비밀번호 초기화. */
export type LogoutReason = "LOGOUT" | "IDLE" | "EXPIRED" | "ADMIN" | "PASSWORD_RESET";

/** GET /admin/users 한 행(snake). */
export interface AdminUserDto {
  user_id: string;
  user_nm: string;
  user_se: UserSe;
  /** `N` = 사용 중지. */
  use_at: YesNo;
  /** `Y` = 연속 실패로 잠김. */
  lock_at: YesNo;
  /** 저장된 기능 권한(관리자는 비어 있어도 전부 허용). */
  features: FeatureCode[];
  /** 마지막 로그인 시각(KST ISO) 또는 null. */
  last_login_dt: string | null;
}

/** 사용자 표 한 행(camel). */
export interface AdminUser {
  /** 로그인 ID. */
  userId: string;
  /** 사용자 이름. */
  userNm: string;
  /** 계정 구분. */
  userSe: UserSe;
  /** `N` = 사용 중지. */
  useAt: YesNo;
  /** `Y` = 잠김(관리자가 해제). */
  lockAt: YesNo;
  /** 저장된 기능 권한. */
  features: FeatureCode[];
  /** 마지막 로그인 시각(KST ISO) 또는 null. */
  lastLoginDt: string | null;
}

/** POST /admin/users 본문(camel 그대로 전송). */
export interface CreateUserInput {
  /** 로그인 ID(영문·숫자·`_`, 4~20자). */
  userId: string;
  /** 사용자 이름. */
  userNm: string;
  /** 계정 구분. */
  userSe: UserSe;
  /** 임시 비밀번호(8자 이상, UTF-8 72바이트 이하) — 첫 로그인 후 변경 강제. */
  initialPassword: string;
  /** 켤 기능 권한. */
  features: FeatureCode[];
}

/** PUT /admin/users/{user_id} 본문(camel 그대로 전송). */
export interface UpdateUserInput {
  /** 사용자 이름. */
  userNm: string;
  /** 계정 구분(자기 자신·마지막 관리자는 `USER`로 못 바꿈 — 서버 400). */
  userSe: UserSe;
  /** `N` = 사용 중지(자기 자신은 불가 — 서버 400). */
  useAt: YesNo;
}

/** GET /admin/sessions 필터(빈 값은 쿼리에 넣지 않음). 날짜는 `YYYY-MM-DD`(KST, 끝 날짜 포함). */
export interface SessionFilters {
  /** 사용자 ID. */
  userId?: string;
  /** 시작 날짜. */
  from?: string;
  /** 끝 날짜. */
  to?: string;
  /** 0부터 시작하는 페이지(50개씩, 최신순). */
  page?: number;
}

/** GET /admin/events 필터 — 결과·기능 필터는 기능 기록 탭에만 적용. */
export interface EventFilters extends SessionFilters {
  /** 결과(`FAIL` = 실패만 보기 등). */
  result?: ActivityResult;
  /** 기능 이름표 코드(`GET /admin/actions` 목록). */
  actionCode?: string;
}

/** 로그인 기록 한 행(snake). */
export interface AdminSessionDto {
  session_id: string;
  user_id: string;
  user_nm: string;
  login_dt: string;
  logout_dt: string | null;
  logout_reason: LogoutReason | null;
  ip_addr: string | null;
  event_cnt: number;
  fail_cnt: number;
}

/** 로그인 기록 한 행(camel). */
export interface AdminSession {
  /** 세션 번호(uuid). */
  sessionId: string;
  /** 사용자 ID. */
  userId: string;
  /** 사용자 이름. */
  userNm: string;
  /** 로그인 시각(KST ISO). */
  loginDt: string;
  /** 로그아웃 시각 — null이면 "사용 중". */
  logoutDt: string | null;
  /** 종료 사유 — 사용 중이면 null. */
  logoutReason: LogoutReason | null;
  /** 접속 IP. */
  ipAddr: string | null;
  /** 이 로그인의 기능 이벤트 수. */
  eventCnt: number;
  /** 실패(`FAIL`) 이벤트 수 — 권한 없음(`DENIED`)은 제외. */
  failCnt: number;
}

/** 기능 이벤트 한 행(snake). */
export interface AdminEventDto {
  log_id: number;
  session_id: string | null;
  user_id: string | null;
  user_nm: string | null;
  occurred_dt: string;
  action_code: string;
  action_nm: string;
  feature_code: FeatureCode | null;
  target_id: string | null;
  result: ActivityResult;
  status_code: number | null;
  error_code: string | null;
  error_msg: string | null;
  duration_ms: number | null;
}

/** 기능 이벤트 한 행(camel). */
export interface AdminEvent {
  /** 기록 번호. */
  logId: number;
  /** 세션 번호 — 로그인 실패처럼 세션이 없으면 null. */
  sessionId: string | null;
  /** 사용자 ID(로그인 실패면 입력한 ID). */
  userId: string | null;
  /** 사용자 이름(모르는 ID면 null). */
  userNm: string | null;
  /** 발생 시각(KST ISO). */
  occurredDt: string;
  /** 기능 이름표 코드. */
  actionCode: string;
  /** 화면에 보일 기능 이름. */
  actionNm: string;
  /** 관련 기능 권한(없으면 null). */
  featureCode: FeatureCode | null;
  /** 대상 ID(감정물 번호·신발 ID 등). */
  targetId: string | null;
  /** 결과. */
  result: ActivityResult;
  /** HTTP 상태 코드. */
  statusCode: number | null;
  /** 오류 코드. */
  errorCode: string | null;
  /** 오류 메시지(최대 1000자). */
  errorMsg: string | null;
  /** 처리 시간(ms). */
  durationMs: number | null;
}

/** GET /admin/features 한 행(snake). */
export interface FeatureInfoDto {
  feature_code: FeatureCode;
  feature_nm: string;
  sort_ordr: number;
}

/** 기능 권한 목록 한 행(camel). */
export interface FeatureInfo {
  /** 기능 코드. */
  featureCode: FeatureCode;
  /** 기능 이름. */
  featureNm: string;
  /** 표시 순서. */
  sortOrdr: number;
}

/** GET /admin/actions 한 행(snake). */
export interface ActionInfoDto {
  action_code: string;
  action_nm: string;
}

/** 기능 이름표 한 행(camel) — 사용 기록 화면의 "기능" 필터 선택지. */
export interface ActionInfo {
  /** 기능 이름표 코드. */
  actionCode: string;
  /** 화면에 보일 이름. */
  actionNm: string;
}
