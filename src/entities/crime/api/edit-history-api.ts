import { useQuery } from "@tanstack/react-query"

import { apiGet, backendMediaUrl } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 현장 이미지 편집 이력 — 서버 B3 `GET /crime/{aprthng_no}/edits`(B 단계 설계서 §3-7 · §4-2).
 * CRUD 계층이라 응답 snake_case → camelCase. 단계 그림 · 원본은 증거 파일 `GET /files/{file_id}`(로그인 쿠키 — 범위 밖 404).
 */

/** 받은 그대로의 원본(ORIGINAL) — 해시 · 크기. 옛 자료는 없음(null = 「원본 없음」) */
export interface EditOriginal {
  fileId: number
  /** SHA-256 소문자 16진수 64자 */
  sha256: string
  /** 가로(px, 서버가 읽지 못했으면 null) */
  width: number | null
  /** 세로(px, 서버가 읽지 못했으면 null) */
  height: number | null
}

/** 편집 한 단계에 적힌 작업(서버 `ops_cn` 항목 — `op` 이름 + 세부 값) */
export interface EditOp {
  /** crop · rotate · calibrate · background · inpaint · threshold · denoise · flip · revert */
  op: string
  [key: string]: unknown
}

/** 편집 이력 한 줄(추가만 — 되돌리기도 새 줄) */
export interface EditHistoryItem {
  editId: number
  /** 그 단계에 한 일 */
  ops: EditOp[]
  /** 편집 전 파일 */
  srcFileId: number
  /** 그 단계 결과 파일(단계 그림 = `editFileUrl(resultFileId)`) */
  resultFileId: number
  /** 결과 파일 SHA-256 */
  sha256: string
  width: number | null
  height: number | null
  /** 한 사람 ID(시스템이면 null) */
  actorId: string | null
  /** 한 사람 이름(계정이 없으면 null) */
  actorNm: string | null
  /** 한 시각 KST ISO(`2026-11-17T14:03:00+09:00`) */
  occurredDt: string
  /** 되돌림 줄이면 대상 편집 번호(0 = 작업본까지), 아니면 null */
  revertOf: number | null
}

/** B3 응답 */
export interface EditHistory {
  /** 받은 그대로의 원본(null = 「원본 없음」) */
  original: EditOriginal | null
  /** 작업본(1000px 작업 사본) 파일 — 없으면 null(옛 감정물) */
  workingFileId: number | null
  /** 지금 편집본 = 마지막 줄 결과, 줄이 없으면 작업본, 그것도 없으면 null. B4 · B5 의 `srcFileId` 로 보낸다 */
  currentFileId: number | null
  /** 작업본도 이력도 없는 옛 감정물 — 첫 B4 를 `srcFileId: null` 로 보내면 서버가 작업본을 소급 등록한다 */
  legacy: boolean
  /** 시간순 */
  items: EditHistoryItem[]
}

const editsPath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}/edits`

/** 편집 이력 쿼리 키 — 감정물 상세 키(`crimeKeys.detail`) 아래에 둔다(감정물 단위로 함께 무효화되게) */
export const editHistoryKeys = {
  list: (aprthngNo: string) => ["crime", aprthngNo, "edits"] as const,
}

/** 증거 파일(원본 · 작업본 · 단계 그림)을 화면에서 쓸 주소 — 로그인 쿠키로 보호(`<img>` 는 같은 출처 중계로 쿠키가 붙는다) */
export function editFileUrl(fileId: number): string {
  return backendMediaUrl(`/files/${encodeURIComponent(fileId)}`)
}

/** GET /crime/{aprthng_no}/edits */
export async function fetchEditHistory(aprthngNo: string): Promise<EditHistory> {
  return convertKeysToCamelCase<EditHistory>(await apiGet<unknown>(editsPath(aprthngNo)))
}

/** 편집 이력 조회(B3). 감정물 번호가 비면 부르지 않는다 */
export function useEditHistory(aprthngNo: string) {
  return useQuery({
    queryKey: editHistoryKeys.list(aprthngNo),
    queryFn: () => fetchEditHistory(aprthngNo),
    enabled: aprthngNo !== "",
    refetchOnMount: "always",
  })
}
