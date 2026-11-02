/**
 * 서버 이미지 주소 ↔ 백엔드 요청 경로 변환.
 *
 * 서버는 이미지 주소를 루트 기준 상대 경로(`/crime_images/<번호>.png`)로 준다(설계서 §3-1).
 * - 화면 표시(`<img src>`)용: `backendMediaUrl`이 `VITE_API_URL`을 앞에 붙인다(중계면 빈 값이라 그대로).
 * - 코드로 내려받기(`backendFetch`)용: `toBackendPath`가 다시 경로만 남긴다.
 */
import { apiBaseUrl } from "./backend-fetch";

/** `http://`·`https://`·`//`로 시작하는 절대 주소, 또는 `data:`·`blob:` URL. */
const ABSOLUTE_OR_INLINE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * 서버가 준 이미지 경로(또는 직접 만든 `/shoes_images/B/...`)를 화면에서 쓸 주소로 바꾼다.
 * - `null`·`undefined`·빈 문자열 → `null`
 * - 루트 기준 상대 경로(`/...`) → `${VITE_API_URL}${path}`
 * - 이미 절대 주소·data URL이면 그대로(서버가 아직 절대 주소를 주던 때도 그대로 동작)
 * - 그 외(접두어 없는 base64 등)도 그대로
 */
export function backendMediaUrl(path: string): string;
export function backendMediaUrl(path: string | null | undefined): string | null;
export function backendMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (ABSOLUTE_OR_INLINE.test(path) || !path.startsWith("/")) return path;
  return `${apiBaseUrl()}${path}`;
}

/** `/crime_history/<파일 이름>` — 하위 폴더·`..`·쿼리 없이 파일 하나. */
const CRIME_HISTORY_FILE = /^\/crime_history\/[A-Za-z0-9_.-]+$/;

/**
 * 편집본 저장(`POST /crime/{번호}/edit-save`) 응답의 `image_path`를 확인한다(설계서 §5-1).
 * 서버가 파일 이름을 정리해 저장하므로 화면은 이름을 조립하지 않고 이 경로로 다시 불러온다.
 * `/crime_history/` 아래 파일 하나가 아니면(`..`·다른 폴더·절대 주소·빈 값) `null`.
 */
export function crimeHistoryPath(path: unknown): string | null {
  if (typeof path !== "string" || !CRIME_HISTORY_FILE.test(path)) return null;
  if (path.includes("..")) return null;
  return path;
}

/**
 * 이미지 주소를 `backendFetch`에 넘길 루트 기준 경로(+쿼리)로 바꾼다.
 * - 루트 기준 상대 경로 → 그대로
 * - `VITE_API_URL` 또는 지금 페이지 주소(중계)로 시작하는 절대 주소 → 경로 + 쿼리만
 * - 그 외(외부 주소, `//host`) → `null`(쿠키를 붙이지 않고 따로 처리)
 */
export function toBackendPath(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  const bases = [apiBaseUrl(), window.location.origin].filter(Boolean);
  for (const base of bases) {
    if (url.startsWith(`${base}/`)) return url.slice(base.length);
  }
  return null;
}
