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
  CreateUserInput,
  EventFilters,
  FeatureInfo,
  FeatureInfoDto,
  SessionFilters,
  UpdateUserInput,
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

/** PUT /admin/users/{user_id} — 이름·구분·사용 여부. */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<void> {
  await apiSend(userPath(userId), "PUT", {
    userNm: input.userNm,
    userSe: input.userSe,
    useAt: input.useAt,
  });
}

/** PUT /admin/users/{user_id}/features — 기능 권한 전체 교체. */
export async function replaceUserFeatures(userId: string, features: FeatureCode[]): Promise<void> {
  await apiSend(`${userPath(userId)}/features`, "PUT", { features });
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
