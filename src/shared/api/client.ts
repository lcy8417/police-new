/**
 * Small typed fetch wrapper shared by every entity's `api` module.
 * Port of the fetch boilerplate duplicated across services/crud.js and
 * services/api.js — same JSON content type, same "throw on !res.ok" contract.
 * 실제 요청은 공용 `backendFetch`(쿠키 포함·401/403 처리)가 보낸다.
 */
import { backendFetch } from "./backend-fetch";

const DEFAULT_ERROR_MESSAGE = "서버 요청에 실패했습니다";

/**
 * 서버가 사용자용 한국어 `detail` 문구를 돌려주는 상태 코드: 검증 실패 400, 로그인 실패 401,
 * 권한 없음·사용 중지 403, 중복 409, 계정 잠김 423(설계서 §6).
 */
const DETAIL_STATUSES = new Set([400, 401, 403, 409, 423]);

export class ApiError extends Error {
  readonly status: number;
  /** 서버 응답 `{"detail": "..."}`의 한국어 문구(`DETAIL_STATUSES`일 때만). 없으면 null. */
  readonly detail: string | null;

  constructor(message: string, status: number, detail: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * 실패 응답을 `ApiError`로 바꾼다. `DETAIL_STATUSES`이고 본문 `detail`이 문자열이면 그 문구를
 * `detail`과 `message`(토스트가 읽는 값) 양쪽에 담는다. 그 외(404·500, FastAPI 422의
 * 배열 detail, JSON이 아닌 본문)는 기본 문구로 둔다.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let detail: string | null = null;
  if (DETAIL_STATUSES.has(response.status)) {
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // 본문이 JSON이 아니면 기본 문구를 쓴다.
    }
  }
  return new ApiError(detail ?? DEFAULT_ERROR_MESSAGE, response.status, detail);
}

/** GET a JSON resource and parse the body as `T`. Throws `ApiError` on non-2xx. */
// @MX:ANCHOR: [AUTO] apiGet - 유일한 GET 요청 경로, entities/crime·entities/shoe API 계층이 공유하는 단일 HTTP 클라이언트
// @MX:REASON: entities API 계층의 GET 정본 — 에러 계약(ApiError)이 여기 집중, 전송은 backendFetch
export async function apiGet<T>(path: string): Promise<T> {
  const response = await backendFetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}

/** POST/PUT/PATCH/DELETE a JSON body. Returns the raw `Response` (mirrors crud.js/api.js, which mostly discard or partially read the body). */
// @MX:ANCHOR: [AUTO] apiSend - 유일한 POST/PUT/PATCH/DELETE 요청 경로, entities/crime·entities/shoe 쓰기 API가 공유
// @MX:REASON: apiGet과 동일한 단일 HTTP 클라이언트 계약(에러 시 ApiError) — 변경 시 모든 쓰기 요청에 영향
export async function apiSend(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<Response> {
  const response = await backendFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response;
}

/**
 * Strip the `data:image/...;base64,` prefix from a data URL.
 * Mirror of crud.js#fetchCrimeRegister:
 *   `formData.image.replace(/^data:image\/[a-z]+;base64,/, "")`
 * Assumes `dataUrl` is present (the register flow validates this before calling).
 */
export function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
}

/**
 * Split a data URL on its comma and return the base64 payload, or `null` if
 * the input is missing/not a data URL. Mirror of the pattern duplicated in
 * crud.js#fetchHistorySave (`editImage`) and crud.js#fetchEditImageSave (`image`):
 *   `value?.startsWith("data:image/") ? value.split(",")[1] : null`
 */
export function stripDataUrl(b64: string | undefined | null): string | null {
  return b64?.startsWith("data:image/") ? b64.split(",")[1] : null;
}
