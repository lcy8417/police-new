/**
 * 관리자 API — `/admin/*`(설계서 §6). 응답은 `convertKeysToCamelCase`로 camel 변환,
 * 요청 본문은 camel 그대로 보낸다. 실패는 `ApiError`(서버 한국어 `detail` 포함,
 * 예 400 `"관리자는 최소 1명 있어야 합니다"`, 409 중복).
 */
import { apiGet, apiSend } from "@/shared/api";
import { convertKeysToCamelCase } from "@/shared/lib";
import type { FeatureCode } from "@/entities/session";
import type {
  ActionInfo,
  ActionInfoDto,
  AdminEvent,
  AdminEventDto,
  AdminSession,
  AdminSessionDto,
  AdminUser,
  AdminUserDto,
  CreateOrgInput,
  CreateUserInput,
  EventFilters,
  FeatureInfo,
  FeatureInfoDto,
  Org,
  OrgDto,
  RoleCode,
  RoleInfo,
  RoleInfoDto,
  SessionFilters,
  UpdateUserInput,
  YesNo,
} from "../model/types";

/** 사용자 ID를 URL 경로 조각으로 — 허용 문자만 쓰지만 방어용으로 인코딩한다. */
const userPath = (userId: string) => `/admin/users/${encodeURIComponent(userId)}`;

/** 필터 → 쿼리 문자열(`?a=1&b=2`). 빈 값(`undefined`·`""`)은 넣지 않는다. 키는 서버 snake 이름. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** GET /admin/users — 사용자 표. */
export async function fetchUsers(): Promise<AdminUser[]> {
  const data = await apiGet<AdminUserDto[]>("/admin/users");
  return convertKeysToCamelCase<AdminUser[]>(data);
}

/** POST /admin/users — 201, 중복 ID면 409. */
export async function createUser(input: CreateUserInput): Promise<void> {
  await apiSend("/admin/users", "POST", {
    userId: input.userId,
    userNm: input.userNm,
    userSe: input.userSe,
    initialPassword: input.initialPassword,
    features: input.features,
  });
}

/** PUT /admin/users/{user_id} — 이름·구분·사용 여부, 소속 관서(`orgId`는 줄 때만 보낸다 — 안 보내면 그대로). */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<void> {
  await apiSend(userPath(userId), "PUT", {
    userNm: input.userNm,
    userSe: input.userSe,
    useAt: input.useAt,
    ...(input.orgId !== undefined && { orgId: input.orgId }),
  });
}

/** PUT /admin/users/{user_id}/features — 기능 권한 전체 교체. */
export async function replaceUserFeatures(userId: string, features: FeatureCode[]): Promise<void> {
  await apiSend(`${userPath(userId)}/features`, "PUT", { features });
}

/** PUT /admin/users/{user_id}/roles — 역할 전체 교체(모르는 역할 코드는 서버 400). */
export async function replaceUserRoles(userId: string, roles: RoleCode[]): Promise<void> {
  await apiSend(`${userPath(userId)}/roles`, "PUT", { roles });
}

/** GET /admin/roles — 역할 선택지(역할 표시 순서, 역할마다 주는 기능 권한 포함). */
export async function fetchRoles(): Promise<RoleInfo[]> {
  const data = await apiGet<RoleInfoDto[]>("/admin/roles");
  return convertKeysToCamelCase<RoleInfo[]>(data);
}

/** GET /admin/orgs — 모든 관서(사용 중지 포함), 표시 순서·번호 순. */
export async function fetchOrgs(): Promise<Org[]> {
  const data = await apiGet<OrgDto[]>("/admin/orgs");
  return convertKeysToCamelCase<Org[]>(data);
}

/** POST /admin/orgs — 관서 추가(201). 계층 위반 400, 관서 코드 중복 409. 만든 관서를 돌려준다. */
export async function createOrg(body: CreateOrgInput): Promise<Org> {
  const response = await apiSend("/admin/orgs", "POST", {
    orgNm: body.orgNm,
    orgSe: body.orgSe,
    upperOrgId: body.upperOrgId ?? null,
    grfcCode: body.grfcCode ?? null,
  });
  return convertKeysToCamelCase<Org>(await response.json());
}

/** PUT /admin/orgs/{org_id} — 사용 여부만 바꾼다(통폐합은 `N` + 새 관서). 없는 관서 404, 본청 400. */
export async function updateOrgUse(orgId: number, useAt: YesNo): Promise<Org> {
  const response = await apiSend(`/admin/orgs/${encodeURIComponent(orgId)}`, "PUT", { useAt });
  return convertKeysToCamelCase<Org>(await response.json());
}

/** POST /admin/users/{user_id}/password-reset — 204, 그 사용자의 열린 세션은 모두 종료된다. */
export async function resetPassword(userId: string, tempPassword: string): Promise<void> {
  await apiSend(`${userPath(userId)}/password-reset`, "POST", { tempPassword });
}

/** POST /admin/users/{user_id}/unlock — 204, 잠금 해제·실패 횟수 0. */
export async function unlockUser(userId: string): Promise<void> {
  await apiSend(`${userPath(userId)}/unlock`, "POST");
}

/** GET /admin/sessions?user_id&from&to&page — 로그인 기록(50개씩 최신순). */
export async function fetchSessions(filters: SessionFilters = {}): Promise<AdminSession[]> {
  const query = toQuery({
    user_id: filters.userId,
    from: filters.from,
    to: filters.to,
    page: filters.page,
  });
  const data = await apiGet<AdminSessionDto[]>(`/admin/sessions${query}`);
  return convertKeysToCamelCase<AdminSession[]>(data);
}

/** GET /admin/sessions/{session_id}/events — 그 로그인의 기능 이벤트(시간순). */
export async function fetchSessionEvents(sessionId: string): Promise<AdminEvent[]> {
  const data = await apiGet<AdminEventDto[]>(
    `/admin/sessions/${encodeURIComponent(sessionId)}/events`
  );
  return convertKeysToCamelCase<AdminEvent[]>(data);
}

/** GET /admin/events?user_id&result&action_code&from&to&page — 기능 이벤트 검색(50개씩 최신순). */
export async function fetchEvents(filters: EventFilters = {}): Promise<AdminEvent[]> {
  const query = toQuery({
    user_id: filters.userId,
    result: filters.result,
    action_code: filters.actionCode,
    from: filters.from,
    to: filters.to,
    page: filters.page,
  });
  const data = await apiGet<AdminEventDto[]>(`/admin/events${query}`);
  return convertKeysToCamelCase<AdminEvent[]>(data);
}

/** GET /admin/features — 기능 권한 목록. */
export async function fetchFeatures(): Promise<FeatureInfo[]> {
  const data = await apiGet<FeatureInfoDto[]>("/admin/features");
  return convertKeysToCamelCase<FeatureInfo[]>(data);
}

/** GET /admin/actions — 기능 이름표(사용 기록 "기능" 필터 선택지). */
export async function fetchActions(): Promise<ActionInfo[]> {
  const data = await apiGet<ActionInfoDto[]>("/admin/actions");
  return convertKeysToCamelCase<ActionInfo[]>(data);
}
