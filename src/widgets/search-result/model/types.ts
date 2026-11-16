import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * 신발 검색 결과 한 건.
 * 출처: services/api.js imageSearch 응답 — 서버 `result[]`의 `{ ftwr_id, similarity }`를
 * imageSearch 가 `{ ftwrId, image, similarity }`로 바꾼 항목 그대로(이미지 API 계층이라 camel 변환 없음).
 */
export interface ImageSearchResultItem {
  /** 신발 ID — 문자열(앞자리 0 보존, 예 "00758"). Number() 변환 금지 */
  ftwrId: string
  /** 신발 이미지 URL(`/shoes_images/{B|Shoerinsics}/<ftwrId>.png`) */
  image: string
  /** 유사도 — 퍼센트 0~100(예 69.99). 서버가 문자열로 줄 수도 있다 */
  similarity: number | string
}

/** 이진화/원본 보기 — 지금 앱의 한국어 리터럴 그대로(imageSearch 가 이 값으로 신발 이미지 폴더 B/Shoerinsics 를 고른다) */
export type ImageMode = "이진화보기" | "원본보기"

export interface SearchResultScreenProps {
  /** 검색 상태. error 는 조회 실패, empty 는 결과 0건(서로 다른 모양) */
  status: ScreenStatus
  /** 조회 실패 시각 「시:분」(error 일 때만 보임) */
  errorAt?: string
  /** error 일 때 「다시」 */
  onRetry: () => void
  /** 관리자 여부 */
  isAdmin: boolean
  /** 보는 사람의 기능 권한 */
  features: readonly FeatureCode[]
  /** 이미지번호(감정물 번호 aprthngNo, 예 00001-25-0646_1) */
  imageNo: string
  /** 왼쪽 현장 족적 이미지 URL */
  sceneImage: string
  /** 지금 쪽의 결과(서버 순위 순서 그대로) */
  results: readonly ImageSearchResultItem[]
  /** 전체 결과 건수 */
  totalCount: number
  /** 지금 쪽 번호(1부터) */
  page: number
  /** 쪽당 건수 — 순위 계산에 쓴다 */
  pageSize: number
  /** 쪽 이동(1부터) */
  onPageChange: (page: number) => void
  /** 이진화/원본 보기(검색 요청에 실려 가는 값이라 제어형) */
  imageMode: ImageMode
  /** 이진화/원본 보기 바꿈 */
  onImageModeChange: (mode: ImageMode) => void
  /** 결과 카드를 누름 — ranking 은 1부터 센 전체 순위 */
  onOpenResult: (item: ImageSearchResultItem, ranking: number) => void
}
