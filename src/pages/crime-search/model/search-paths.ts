// @MX:ANCHOR: [AUTO] search-paths 경로 빌더 모음 - CrimeDetailPage/PatternExtractPage/ResultDetailPage/ShoesResultPage 등 6개 파일이 공유하는 유일한 /search 하위 라우트 경로 생성 지점
// @MX:REASON: fan_in 6 — 하드코딩된 문자열 경로를 대체하는 정본, App.jsx 라우트 정의와 시그니처가 어긋나면 전 화면 네비게이션이 깨짐
/**
 * `/search/:aprthngNo/...` 하위 라우트 경로 빌더 모음.
 *
 * 현재 `RetrievalResults.jsx` / `ShoesResult.jsx` / `ResultDetail.jsx` /
 * `DetailMain.jsx`가 하드코딩한 경로들을 대체하기 위한 순수 함수들이다.
 * 각 시그니처는 `App.jsx`의 라우트 정의와 실제 컴포넌트가 읽는 쿼리
 * 파라미터를 근거로 맞췄다(추측 없음):
 *   - `/search/:aprthngNo`                                  → CrimeDetail
 *   - `/search/:aprthngNo/patternExtract`                   → PatternExtract
 *   - `/search/:aprthngNo/shoesResult`          (?edit&page) → ShoesResult
 *   - `/search/:aprthngNo/shoesResult/detail/:ftwrId` (?ranking) → ResultDetail
 *   - `/search/:aprthngNo/crimeHistory/:searchNo`     (?ranking) → CrimeHistory
 *
 * `aprthngNo`(감정물 번호)·`ftwrId`(신발 ID)는 허용 문자(영문·숫자·`-`·`_`)만 쓰지만
 * 방어용으로 모두 `encodeURIComponent`로 감싼다. `useParams`가 디코딩한 값을 돌려주므로
 * 화면 쪽에서는 원래 문자열 그대로 받는다.
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

/** 경로 조각 하나를 안전하게 인코딩한다(`/`·`#`·공백 등이 경로를 깨지 않게). */
const seg = encodeURIComponent

/** 사건 상세: `/search/:aprthngNo` */
export function searchDetailPath(aprthngNo: string): string {
  return `/search/${seg(aprthngNo)}`
}

/** 패턴 추출: `/search/:aprthngNo/patternExtract` */
export function patternExtractPath(aprthngNo: string): string {
  return `/search/${seg(aprthngNo)}/patternExtract`
}

/** shoesResultPath의 선택 쿼리 옵션(`ShoesResultMain.jsx`가 읽는 `edit`/`page`). */
export interface ShoesResultPathOptions {
  /** 편집 모드 여부. `edit=true`로 직렬화된다. */
  edit?: boolean
  /** 0-based 페이지 인덱스. */
  page?: number
}

/**
 * 신발 검색 결과: `/search/:aprthngNo/shoesResult` (?edit&page)
 *
 * 검색 결과가 `CrimeDetailPage`의 검색모드로 인라인화되면서 이 경로로의
 * 페이지 이동은 더 이상 필요하지 않다(`/shoesResult` 라우트는 `App.jsx`에서
 * detail로 즉시 리다이렉트된다). 다만 `CrimeDetailPage`의 `handleSearch`가
 * 아직 이 함수로 navigate하고 있어 지금은 제거하지 않는다 — 그 호출이
 * `setSearchActive(true)`로 대체되면 `@deprecated` 처리 후 제거를 검토할 것.
 */
export function shoesResultPath(
  aprthngNo: string,
  { edit, page }: ShoesResultPathOptions = {}
): string {
  return `/search/${seg(aprthngNo)}/shoesResult${buildQuery({ edit, page })}`
}

/** resultDetailPath의 선택 쿼리 옵션(`ResultDetailMain.jsx`가 읽는 `ranking`). */
export interface ResultDetailPathOptions {
  /** 유사도 순위(1-based). */
  ranking?: number | string
}

/**
 * 검색 결과 상세: `/search/:aprthngNo/shoesResult/detail/:ftwrId` (?ranking)
 * (`RetrievalResults.jsx`의 상대 경로 `detail/:ftwrId`가 이 절대 경로로 해석됨)
 * `ftwrId`는 앞자리 0을 보존하는 문자열이다(예 `"00758"`).
 */
export function resultDetailPath(
  aprthngNo: string,
  ftwrId: string,
  { ranking }: ResultDetailPathOptions = {}
): string {
  return `/search/${seg(aprthngNo)}/shoesResult/detail/${seg(ftwrId)}${buildQuery({
    ranking,
  })}`
}

/** crimeHistoryPath의 선택 쿼리 옵션(`ranking`). */
export interface CrimeHistoryPathOptions {
  /** 이력 저장 당시의 유사도 순위. */
  ranking?: number | string
}

/**
 * 사건 이력 상세: `/search/:aprthngNo/crimeHistory/:searchNo` (?ranking)
 * (`DetailMain.jsx`가 쓰는 경로 규약). `searchNo`는 서버가 주는 정수 이력 번호.
 */
export function crimeHistoryPath(
  aprthngNo: string,
  searchNo: number,
  { ranking }: CrimeHistoryPathOptions = {}
): string {
  return `/search/${seg(aprthngNo)}/crimeHistory/${searchNo}${buildQuery({
    ranking,
  })}`
}
