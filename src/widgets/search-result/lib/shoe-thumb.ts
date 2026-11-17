/**
 * 신발 원본 그림 주소 → 썸네일 주소(검색 결과 카드 · 빠른 비교 · AI 띠처럼 작은 칸 전용).
 *
 * 서버 `scripts/make_shoe_thumbs.py` 가 B(원본) 폴더에서 224px WebP 를 만들고 `/shoes_thumbs/<신발ID>.webp` 로 내보낸다
 * (원본 평균 ~509KB → ~8KB, 분석 보고서 `police-server/docs/operations/search-latency-analysis.md` B1).
 *   - `…/shoes_images/B/<ID>.png` 만 바꾼다(앞의 `VITE_API_URL` 은 그대로). 이진(Shoerinsics) · 그 밖의 주소는 null = 원본 그대로.
 *   - 썸네일이 없거나 못 읽으면 그 `<img>` 의 onError 에서 원본으로 바꾼다(`useThumbFallback`) — 화면은 예전과 같다.
 */
const B_IMAGE = /\/shoes_images\/B\/([^/?#]+)\.png$/

export function shoeThumbUrl(src: string): string | null {
  const m = B_IMAGE.exec(src)
  if (!m) return null
  return `${src.slice(0, m.index)}/shoes_thumbs/${m[1]}.webp`
}
