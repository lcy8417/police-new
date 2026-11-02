/**
 * 이미지를 self-contained base64 data URL로 통일한다.
 *
 * 왜 필요한가: canvas 조작(이진화 `bakeThreshold`)과 저장(base64 전송)은 이미지가 data URL이어야
 * 한다. 교차 출처(다른 origin) URL 이미지를 canvas에 그리면 canvas가 오염(taint)되어
 * `getImageData`/`toDataURL`이 SecurityError로 실패한다. 서버 이미지는 data URL · 접두어 없는
 * raw base64 · 서버 URL/경로 등 형태가 섞이므로, 편집 세션 경계에서 여기로 통일한다.
 *
 * 서버 이미지(루트 기준 경로, 또는 `VITE_API_URL`·현재 주소로 시작하는 절대 주소)는 로그인
 * 쿠키로 보호되므로 공용 `backendFetch`로 내려받는다(401이면 세션 종료 처리까지 그쪽이 한다).
 * 그 외 외부 주소만 쿠키 없이 일반 `fetch`로 받는다.
 */
import { backendFetch, toBackendPath } from "@/shared/api";

/** blob → data URL. `FileReader` 대신 바이트를 직접 base64로 바꾼다(테스트 환경 Blob 호환). */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000; // String.fromCharCode 인자 수 한도를 넘지 않게 나눠 처리
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${blob.type || "image/png"};base64,${btoa(binary)}`;
}

/** 이미지가 이미 data URL인지. */
export function isDataUrl(image: string): boolean {
  return image.startsWith("data:");
}

/**
 * `image`를 base64 data URL로 변환한다.
 * - data URL → 그대로(멱등).
 * - 접두어 없는 raw base64 → `data:image/png;base64,` 를 붙인다.
 * - 서버 이미지 주소/경로 → `backendFetch`(쿠키 포함) 후 data URL로 인코딩.
 * - 외부 절대 주소 → 일반 `fetch` 후 data URL로 인코딩(교차 출처면 CORS 필요).
 * 실패 시 예외를 던진다(호출부에서 사용자에게 알리고 원본 URL을 표시용으로 유지할 수 있다).
 */
export async function resolveImageToDataUrl(image: string): Promise<string> {
  if (!image || isDataUrl(image)) return image;

  const isUrl = /^(https?:)?\/\//.test(image) || image.startsWith("/");
  if (!isUrl) return `data:image/png;base64,${image}`;

  const backendPath = toBackendPath(image);
  const res = backendPath ? await backendFetch(backendPath) : await fetch(image);
  if (!res.ok) throw new Error(`이미지 로드 실패: ${res.status}`);
  return blobToDataUrl(await res.blob());
}
