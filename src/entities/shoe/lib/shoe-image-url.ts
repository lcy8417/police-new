/**
 * 신발 정적 이미지 폴더 — 백엔드 `static/shoes_images/<kind>/` 하위.
 *  - `B`: 바닥(밑창) 이미지
 *  - `S`: 측면 이미지
 *  - `Shoerinsics`: 밑창 이진(스케치) 이미지
 */
export type ShoeImageKind = "B" | "S" | "Shoerinsics"

/**
 * 신발 정적 이미지 URL `${VITE_API_URL}/shoes_images/<kind>/<ftwrId>.png`.
 *
 * `ftwrId`는 앞자리 0을 보존해야 하는 **문자열**(예 `"00758"`)이라 숫자 변환 없이 쓰고,
 * 허용 문자만 쓰는 ID지만 방어용으로 `encodeURIComponent`로 감싼다.
 */
export function shoeImageUrl(ftwrId: string, kind: ShoeImageKind): string {
  const base = import.meta.env.VITE_API_URL ?? ""
  return `${base}/shoes_images/${kind}/${encodeURIComponent(ftwrId)}.png`
}
