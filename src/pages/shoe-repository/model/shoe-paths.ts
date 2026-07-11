/**
 * 신발 조회 화면 경로 빌더 모음. `crime-search/model/search-paths.ts` 규약을
 * 준용한 순수 함수들이다(부수효과 없음, 문자열 경로만 반환).
 *   - `/shoesRepository`                    → 신발 조회(무선택)
 *   - `/shoesRepository/:modelNumber`       → 신발 조회(선택 신발 상세)
 *   - `/shoesEdit/:modelNumber`             → 신발 편집
 */

/** 신발 조회: `modelNumber`가 있으면 상세, 없으면 목록 루트. */
export function shoeRepositoryPath(modelNumber?: string | number): string {
  return modelNumber === undefined || modelNumber === null || modelNumber === ""
    ? "/shoesRepository"
    : `/shoesRepository/${modelNumber}`
}

/** 신발 편집: `/shoesEdit/:modelNumber` */
export function shoeEditPath(modelNumber: string | number): string {
  return `/shoesEdit/${modelNumber}`
}
