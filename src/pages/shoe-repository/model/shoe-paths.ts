/**
 * 신발 조회/등록/편집 통합 커맨드센터 경로 빌더. `crime-search/model/search-paths.ts`
 * 규약을 준용한 순수 함수들이다(부수효과 없음, 문자열 경로만 반환).
 *
 * 조회·등록·편집이 `/shoesRepository` 한 라우트로 통합됐다(범죄 `/search/:aprthngNo`
 * 커맨드센터와 동형). 국면은 `ftwrId`(선택 신발 ID)와 `?mode` 쿼리로 파생한다:
 *   - `/shoesRepository`                     → 조회 목록(무선택, idle)
 *   - `/shoesRepository/:ftwrId`             → 선택 신발 read-only 조회
 *   - `/shoesRepository/:ftwrId?mode=edit`   → 선택 신발 편집 워크벤치(PUT)
 *   - `/shoesRepository?mode=new`            → 신규 등록 워크벤치(POST)
 *
 * 레거시 `/shoesRegister`·`/shoesEdit/:ftwrId`는 위 URL로 리다이렉트된다(App.jsx).
 *
 * `ftwrId`는 앞자리 0을 보존해야 하는 **문자열**(예 `"00758"`)이다 — 숫자로 바꾸지 않고
 * 방어용으로 `encodeURIComponent`만 적용한다.
 */

/** 신발 조회: `ftwrId`가 있으면 read-only 상세, 없으면 목록 루트. */
export function shoeRepositoryPath(ftwrId?: string): string {
  return ftwrId === undefined || ftwrId === null || ftwrId === ""
    ? "/shoesRepository"
    : `/shoesRepository/${encodeURIComponent(ftwrId)}`
}

/** 신규 등록 워크벤치: `/shoesRepository?mode=new` */
export function shoeRegisterNewPath(): string {
  return "/shoesRepository?mode=new"
}

/** 선택 신발 편집 워크벤치: `/shoesRepository/:ftwrId?mode=edit` */
export function shoeEditModePath(ftwrId: string): string {
  return `/shoesRepository/${encodeURIComponent(ftwrId)}?mode=edit`
}

/** 레거시 편집 경로: `/shoesEdit/:ftwrId`(리다이렉트 스텁의 출처 — 하위호환). */
export function shoeEditPath(ftwrId: string): string {
  return `/shoesEdit/${encodeURIComponent(ftwrId)}`
}
