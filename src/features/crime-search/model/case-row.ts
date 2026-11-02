/**
 * 사건(감정물) 목록 카드/행에 투영되는 행 형태(`Crime`의 표시 컬럼 부분집합, 설계서 §4-1).
 * 모든 필드는 서버 응답에 따라 비어 있을 수 있어 optional로 둔다. 소비 측(페이지)이
 * `Crime` → `CrimeSearchRow`로 투영(`toRow`)해 목록 컴포넌트에 넘긴다.
 */
export interface CrimeSearchRow {
  /** 감정물 번호 `의뢰번호_순번`(예 `05019-24-0017_5`) — 카드 식별자·URL 키. */
  aprthngNo?: string
  /** 감정의뢰번호(예 `05019-24-0017`). */
  apprslReqestNo?: string
  /** 사건명. */
  crimeNm?: string | null
  /** 채취 일시 `YYYY-MM-DDTHH:MM:SS` 또는 null. */
  pickDt?: string | null
  /** 채취 장소. */
  pickPlace?: string | null
  /** 의뢰관서명. */
  rqestGrfcNm?: string | null
  /** 채취 방법 코드(최대 8자). */
  pickMthCode?: string | null
  /** 처리 상태(정수 — 값 그대로 표시). */
  processSttus?: number
}

/**
 * 채취 일시 필터 비교. 서버는 `pickDt`를 항상 `YYYY-MM-DDTHH:MM:SS`로 주지만(설계서 §5),
 * 사용자는 등록 폼과 같은 `YYYY-MM-DD HH:mm`(공백 구분)로 입력한다. 입력 앞뒤 공백을 지우고
 * 가운데 공백을 `T`로 바꾼 뒤 **앞부분 일치**로 비교한다 — 날짜만 넣으면 그 날짜 전체, 분까지
 * 넣으면 그 분, 초까지 넣으면 그 초에 일치한다. 입력이 비면 필터 미적용(항상 일치)이고,
 * 입력이 있는데 `pickDt`가 없으면(null) 불일치다.
 */
export function matchesPickDt(pickDt: string | null | undefined, input: string): boolean {
  const normalized = input.trim().replace(/\s+/, "T")
  if (normalized === "") return true
  if (!pickDt) return false
  return pickDt.startsWith(normalized)
}
