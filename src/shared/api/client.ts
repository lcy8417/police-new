/**
 * Small typed fetch wrapper shared by every entity's `api` module.
 * Port of the fetch boilerplate duplicated across services/crud.js and
 * services/api.js — same base URL env var, same JSON content type, same
 * "throw on !res.ok" contract.
 */

const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** GET a JSON resource and parse the body as `T`. Throws `ApiError` on non-2xx. */
// @MX:ANCHOR: [AUTO] apiGet - 유일한 GET 요청 경로, entities/crime·entities/shoe API 계층이 공유하는 단일 HTTP 클라이언트
// @MX:REASON: 구조상 유일한 fetch 래퍼(services/crud.js·services/api.js의 fetch 보일러플레이트를 대체하는 정본) — VITE_API_URL 처리·에러 계약이 여기 집중
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new ApiError("서버 요청에 실패했습니다", response.status);
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
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new ApiError("서버 요청에 실패했습니다", response.status);
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
