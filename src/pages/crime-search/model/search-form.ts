/**
 * `/search` 필터 폼의 작업용 상태 모델. 기존
 * `features/crime-search/ui/SearchForm.tsx`의 `SearchFormState`와
 * `pages/crime-search/ui/CrimeSearchPage.tsx`의 `initialSearchForm`을 근거로
 * 동일한 필드 집합을 단일 출처로 모은 것이다. 모든 필드는 controlled string이며,
 * 빈 문자열은 "해당 필터 미적용"을 뜻한다(SearchForm의 `handleSearch` 규약).
 */
export interface SearchFormState {
  crimeNumber: string
  imageNumber: string
  crimeName: string
  findTime: string
  requestOffice: string
  findMethod: string
}

/** 필터 초기값 — 모든 조건이 비어 있는(전체 조회) 상태. */
export const EMPTY_SEARCH_FORM: SearchFormState = {
  crimeNumber: "",
  imageNumber: "",
  crimeName: "",
  findTime: "",
  requestOffice: "",
  findMethod: "",
}
