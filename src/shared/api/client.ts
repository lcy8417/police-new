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
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(`GET ${path} failed`, response.status);
  }

  return (await response.json()) as T;
}

/** POST/PUT/PATCH/DELETE a JSON body. Returns the raw `Response` (mirrors crud.js/api.js, which mostly discard or partially read the body). */
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
    throw new ApiError(`${method} ${path} failed`, response.status);
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
