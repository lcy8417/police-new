/**
 * 신발 조회/등록/편집 통합 커맨드센터 경로 빌더. `crime-search/model/search-paths.ts`
 * 규약을 준용한 순수 함수들이다(부수효과 없음, 문자열 경로만 반환).
 *
 * 조회·등록·편집이 `/shoesRepository` 한 라우트로 통합됐다(범죄 `/search/:crimeNumber`
 * 커맨드센터와 동형). 국면은 `modelNumber`(선택 신발)와 `?mode` 쿼리로 파생한다:
 *   - `/shoesRepository`                     → 조회 목록(무선택, idle)
 *   - `/shoesRepository/:modelNumber`        → 선택 신발 read-only 조회
 *   - `/shoesRepository/:modelNumber?mode=edit` → 선택 신발 편집 워크벤치(PUT)
 *   - `/shoesRepository?mode=new`            → 신규 등록 워크벤치(POST)
 *
 * 레거시 `/shoesRegister`·`/shoesEdit/:modelNumber`는 위 URL로 리다이렉트된다(App.jsx).
 */

/** 신발 조회: `modelNumber`가 있으면 read-only 상세, 없으면 목록 루트. */
export function shoeRepositoryPath(modelNumber?: string | number): string {
  return modelNumber === undefined || modelNumber === null || modelNumber === ""
    ? "/shoesRepository"
    : `/shoesRepository/${modelNumber}`
}

/** 신규 등록 워크벤치: `/shoesRepository?mode=new` */
export function shoeRegisterNewPath(): string {
  return "/shoesRepository?mode=new"
}

/** 선택 신발 편집 워크벤치: `/shoesRepository/:modelNumber?mode=edit` */
export function shoeEditModePath(modelNumber: string | number): string {
  return `/shoesRepository/${modelNumber}?mode=edit`
}

/** 레거시 편집 경로: `/shoesEdit/:modelNumber`(리다이렉트 스텁의 출처 — 하위호환). */
export function shoeEditPath(modelNumber: string | number): string {
  return `/shoesEdit/${modelNumber}`
}
