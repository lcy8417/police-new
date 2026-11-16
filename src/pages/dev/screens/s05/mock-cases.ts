import type { ImageSearchResultItem } from "@/widgets/search-result"

// S05 검색 결과 진열용 가짜 값. 숫자는 시안 예시(857건 · 이미지번호 00001-25-0646_1)에 맞춘다.
// 유사도는 imageSearch 응답처럼 퍼센트(0~100), 한 건은 문자열로 온다(서버가 문자열로 줄 수도 있음).

export const S05_IMAGE_NO = "00001-25-0646_1"
export const S05_TOTAL = 857
export const S05_PAGE_SIZE = 20
export const S05_ERROR_AT = "17:41"

/** 1쪽 고정 결과: 1위 00758(앞자리 0) · 2위 69.99(→ 70%) · 8자 신발 ID(긴 값) · 문자열 유사도 */
const FIRST_PAGE: readonly { ftwrId: string; similarity: number | string }[] = [
  { ftwrId: "00758", similarity: 84.12 },
  { ftwrId: "305659", similarity: 69.99 },
  { ftwrId: "281904", similarity: 66.4 },
  { ftwrId: "274466", similarity: 64.0 },
  { ftwrId: "SH-20251", similarity: 61.2 },
  { ftwrId: "301122", similarity: 61.0 },
  { ftwrId: "290318", similarity: 60.8 },
  { ftwrId: "288741", similarity: 60.7 },
  { ftwrId: "299310", similarity: 60.1 },
  { ftwrId: "306012", similarity: 59.9 },
  { ftwrId: "283377", similarity: 59.6 },
  { ftwrId: "00412", similarity: 59.0 },
  { ftwrId: "305102", similarity: 58.4 },
  { ftwrId: "288410", similarity: "58.1" },
  { ftwrId: "301877", similarity: 57.9 },
  { ftwrId: "02219", similarity: 57.6 },
  { ftwrId: "296450", similarity: 57.2 },
  { ftwrId: "303318", similarity: 57.0 },
  { ftwrId: "284905", similarity: 56.8 },
  { ftwrId: "300761", similarity: 56.5 },
]

/** 쪽(1부터)의 결과. 이미지 URL 은 rank 로 고른 그림을 받는 함수가 정한다 */
export function makeResults(page: number, imageFor: (rank: number) => string): ImageSearchResultItem[] {
  const first = (page - 1) * S05_PAGE_SIZE + 1
  const last = Math.min(S05_TOTAL, first + S05_PAGE_SIZE - 1)
  const out: ImageSearchResultItem[] = []
  for (let rank = first; rank <= last; rank++) {
    const fixed = FIRST_PAGE[rank - 1]
    const ftwrId = fixed ? fixed.ftwrId : String((rank * 37) % 100000).padStart(5, "0")
    const similarity = fixed ? fixed.similarity : Math.round((56.5 - (rank - 20) * 0.018) * 100) / 100
    out.push({ ftwrId, similarity, image: imageFor(rank) })
  }
  return out
}
