// 확인대상 ★ 바인딩 자리(0단계 — 잠금 파일 §2-4 · §3-2). 검색 결과(S05) · 정밀 대조(S06) 탭(묶음 ①)은 이 훅만 부르고,
// 실제 읽기 · 쓰기(E2 `GET` · E3 `POST` · E4 `DELETE /crime/{aprthng_no}/targets…`)는 묶음 ②가 이 파일을 채워 넣는다
// (`features/targets/api/use-toggle-target.ts`). 그때까지는 「준비 전」 — 빈 목록, 누르면 아무것도 하지 않는다.

/** 확인대상 하나의 키 — 검색번호 + 신발 ID(잠금 §2-1: 후보 식별 = 검색번호 + 신발 ID) */
export function targetKey(searchNo: number, ftwrId: string): string {
  return `${searchNo}:${ftwrId}`
}

export interface TargetsBinding {
  /** 어느 감정물의 확인대상인가(감정물 번호 전체) */
  aprthngNo: string
  /** 서버 연결이 준비됐나 — false면 ★ 단추를 잠그거나 숨긴다 */
  ready: boolean
  /** 지금 확인대상(빼지 않은 것) 키 집합(`targetKey`) */
  targets: ReadonlySet<string>
  /** ★ 누름 — 있으면 빼고(E4) 없으면 더한다(E3). `from` = 검색 결과 ★ · 정밀 대조 */
  toggleTarget: (searchNo: number, ftwrId: string, from: "search" | "compare") => void
}

const EMPTY: ReadonlySet<string> = new Set()

/** 확인대상 ★ 상태와 누름 처리(자리 — 묶음 ②가 TanStack 쿼리 · 뮤테이션으로 채움) */
export function useTargetsBinding(aprthngNo: string): TargetsBinding {
  return { aprthngNo, ready: false, targets: EMPTY, toggleTarget: () => undefined }
}
