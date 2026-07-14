/**
 * 이미지를 self-contained base64 data URL로 통일한다.
 *
 * 왜 필요한가: canvas 조작(이진화 `bakeThreshold`)과 저장(base64 전송)은 이미지가 data URL이어야
 * 한다. 교차 출처(다른 origin) URL 이미지를 canvas에 그리면 canvas가 오염(taint)되어
 * `getImageData`/`toDataURL`이 SecurityError로 실패한다. 서버 이미지는 data URL · 접두어 없는
 * raw base64 · 서버 URL/경로 등 형태가 섞이므로, 편집 세션 경계에서 여기로 통일한다.
 *
 * URL/경로인 경우 `fetch` → blob → `FileReader.readAsDataURL`로 변환한다. 이 fetch는 백엔드가
 * 교차 출처를 허용(CORS)해야 성공한다(앱의 나머지 API도 교차 출처 fetch이므로 통상 허용됨).
 */

const BASE = import.meta.env.VITE_API_URL ?? "";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("이미지 인코딩 실패"));
    reader.readAsDataURL(blob);
  });
}

/** 이미지가 이미 data URL인지. */
export function isDataUrl(image: string): boolean {
  return image.startsWith("data:");
}

/**
 * `image`를 base64 data URL로 변환한다.
 * - data URL → 그대로(멱등).
 * - 접두어 없는 raw base64 → `data:image/png;base64,` 를 붙인다.
 * - 절대/상대 URL(경로) → `fetch` 후 data URL로 인코딩(교차 출처면 CORS 필요).
 * 실패 시 예외를 던진다(호출부에서 사용자에게 알리고 원본 URL을 표시용으로 유지할 수 있다).
 */
export async function resolveImageToDataUrl(image: string): Promise<string> {
  if (!image || isDataUrl(image)) return image;

  const isUrl = /^(https?:)?\/\//.test(image) || image.startsWith("/");
  if (!isUrl) return `data:image/png;base64,${image}`;

  // 상대 경로면 API 베이스를 붙인다(`//host` 형태의 프로토콜-상대 URL은 그대로).
  const url =
    image.startsWith("/") && !image.startsWith("//") ? `${BASE}${image}` : image;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 로드 실패: ${res.status}`);
  return blobToDataUrl(await res.blob());
}
