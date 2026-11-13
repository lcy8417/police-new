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
  /** 역할 코드(역할 `sort_ordr` 순). */
  roles: RoleCode[];
  /** 소속 관서 번호(`app.organization`). */
  org_id: number;
  /** 소속 관서 이름. */
  org_nm: string;
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
  /** 저장된 기능 권한(개인 권한 — 역할 권한은 여기 없음). */
  features: FeatureCode[];
  /** 마지막 로그인 시각(KST ISO) 또는 null. */
  lastLoginDt: string | null;
  /** 역할 코드(역할 `sort_ordr` 순). */
  roles: RoleCode[];
  /** 소속 관서 번호. */
  orgId: number;
  /** 소속 관서 이름. */
  orgNm: string;
}

/**
 * 역할 코드 — 서버 `app.role`(지금은 `INVESTIGATOR` 수사관 · `EXAMINER` 감정관 · `REVIEWER` 검증자).
 * 목록과 이름은 `GET /admin/roles`가 정본이라 화면에 고정하지 않는다(문자열로 둔다).
 * 관리자는 역할이 아니라 `userSe = "ADMIN"`으로만 판단한다(실증 확장 설계서 §5-A).
 */
export type RoleCode = string;

/** GET /admin/roles 한 행(snake). */
export interface RoleInfoDto {
  role_code: RoleCode;
  role_nm: string;
  sort_ordr: number;
  features: FeatureCode[];
}

/** 역할 선택지 한 행(camel). */
export interface RoleInfo {
  /** 역할 코드. */
  roleCode: RoleCode;
  /** 화면에 보일 역할 이름(예: 수사관). */
  roleNm: string;
  /** 표시 순서. */
  sortOrdr: number;
  /** 이 역할이 주는 기능 권한(기능 표시 순서). */
  features: FeatureCode[];
}

/** 관서 구분 — 본청 / 시도청 / 경찰서 / 타기관. 계층: 경찰서 ⊂ 시도청 ⊂ 본청, 타기관은 상위 없음. */
export type OrgSe = "HQ" | "PROVINCIAL" | "STATION" | "EXTERNAL";

/** GET /admin/orgs 한 행(snake). */
export interface OrgDto {
  org_id: number;
  upper_org_id: number | null;
  org_se: OrgSe;
  org_nm: string;
  grfc_code: string | null;
  use_at: YesNo;
  sort_ordr: number;
}

/** 관서 한 행(camel). */
export interface Org {
  /** 관서 번호. */
  orgId: number;
  /** 상위 관서 번호(본청 · 타기관은 null). */
  upperOrgId: number | null;
  /** 관서 구분. */
  orgSe: OrgSe;
  /** 관서 이름. */
  orgNm: string;
  /** SCAS 관서 코드(5자 이내, 확인된 것만) 또는 null. */
  grfcCode: string | null;
  /** `N` = 사용 중지(통폐합) — 새로 소속시킬 수 없다. */
  useAt: YesNo;
  /** 표시 순서. */
  sortOrdr: number;
}

/** POST /admin/orgs 본문(camel 그대로 전송). 계층 위반은 서버 400, 관서 코드 중복은 409. */
export interface CreateOrgInput {
  /** 관서 이름(1~100자). */
  orgNm: string;
  /** 관서 구분(본청 `HQ`는 새로 못 만듦). */
  orgSe: Exclude<OrgSe, "HQ">;
  /** 상위 관서 번호(시도청 → 본청, 경찰서 → 시도청, 타기관 → 없음). */
  upperOrgId?: number | null;
  /** SCAS 관서 코드(5자 이내) — 모르면 비움. */
  grfcCode?: string | null;
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
  /** 소속 관서 번호 — 안 보내면 그대로, 바꾸면 서버가 소속 이력을 닫고 새로 연다. 사용 중지된 관서는 400. */
  orgId?: number;
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
