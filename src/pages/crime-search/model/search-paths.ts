/**
 * `/search/:crimeNumber/...` 하위 라우트 경로 빌더 모음.
 *
 * 현재 `RetrievalResults.jsx` / `ShoesResult.jsx` / `ResultDetail.jsx` /
 * `DetailMain.jsx`가 하드코딩한 경로들을 대체하기 위한 순수 함수들이다.
 * 각 시그니처는 `App.jsx`의 라우트 정의와 실제 컴포넌트가 읽는 쿼리
 * 파라미터를 근거로 맞췄다(추측 없음):
 *   - `/search/:crimeNumber`                              → CrimeDetail
 *   - `/search/:crimeNumber/patternExtract`               → PatternExtract
 *   - `/search/:crimeNumber/shoesResult`      (?edit&page) → ShoesResult
 *   - `/search/:crimeNumber/shoesResult/detail/:modelNumber` (?ranking) → ResultDetail
 *   - `/search/:crimeNumber/crimeHistory/:historyId`         (?ranking) → CrimeHistory
 *
 * 모두 부수효과 없는 순수 함수이며, 문자열 경로만 반환한다.
 */

/** `?a=b` 형태의 쿼리스트링 조립. 값이 undefined/null인 항목은 생략한다. */
function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}

/** 사건 상세: `/search/:crimeNumber` */
export function searchDetailPath(crimeNumber: string): string {
  return `/search/${crimeNumber}`
}

/** 패턴 추출: `/search/:crimeNumber/patternExtract` */
export function patternExtractPath(crimeNumber: string): string {
  return `/search/${crimeNumber}/patternExtract`
}

/** shoesResultPath의 선택 쿼리 옵션(`ShoesResultMain.jsx`가 읽는 `edit`/`page`). */
export interface ShoesResultPathOptions {
  /** 편집 모드 여부. `edit=true`로 직렬화된다. */
  edit?: boolean
  /** 0-based 페이지 인덱스. */
  page?: number
}

/** 신발 검색 결과: `/search/:crimeNumber/shoesResult` (?edit&page) */
export function shoesResultPath(
  crimeNumber: string,
  { edit, page }: ShoesResultPathOptions = {}
): string {
  return `/search/${crimeNumber}/shoesResult${buildQuery({ edit, page })}`
}

/** resultDetailPath의 선택 쿼리 옵션(`ResultDetailMain.jsx`가 읽는 `ranking`). */
export interface ResultDetailPathOptions {
  /** 유사도 순위(1-based). */
  ranking?: number | string
}

/**
 * 검색 결과 상세: `/search/:crimeNumber/shoesResult/detail/:modelNumber` (?ranking)
 * (`RetrievalResults.jsx`의 상대 경로 `detail/:modelNumber`가 이 절대 경로로 해석됨)
 */
export function resultDetailPath(
  crimeNumber: string,
  modelNumber: string,
  { ranking }: ResultDetailPathOptions = {}
): string {
  return `/search/${crimeNumber}/shoesResult/detail/${modelNumber}${buildQuery({
    ranking,
  })}`
}

/** crimeHistoryPath의 선택 쿼리 옵션(`ranking`). */
export interface CrimeHistoryPathOptions {
  /** 이력 저장 당시의 유사도 순위. */
  ranking?: number | string
}

/**
 * 사건 이력 상세: `/search/:crimeNumber/crimeHistory/:historyId` (?ranking)
 * (`DetailMain.jsx`가 쓰는 경로 규약)
 */
export function crimeHistoryPath(
  crimeNumber: string,
  historyId: string | number,
  { ranking }: CrimeHistoryPathOptions = {}
): string {
  return `/search/${crimeNumber}/crimeHistory/${historyId}${buildQuery({
    ranking,
  })}`
}
