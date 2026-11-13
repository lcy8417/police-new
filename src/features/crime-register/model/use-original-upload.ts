import { useCallback, useRef, useState } from "react"

import { uploadOriginal } from "@/entities/crime"
import { ApiError } from "@/shared/api"

/**
 * 원본 보관 상태 — 없음(파일 안 고름) / 올리는 중 / 보관됨(`fileId`) / 실패(서버 `detail`, 없으면 null).
 */
export type OriginalUploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; fileId: number }
  | { status: "failed"; detail: string | null }

export interface OriginalUpload {
  /** 지금 고른 파일의 원본 보관 상태. */
  state: OriginalUploadState
  /** 파일을 고른 순간 부른다 — 편집 전 바이트를 `POST /files/original`로 올린다. 앞 파일 결과는 버린다. */
  start: (file: File) => void
  /**
   * 등록 요청에 붙일 원본 번호. 올리는 중이면 끝날 때까지 기다린다. 실패 · 파일 없음 · 기다리는 사이
   * 다른 파일을 골랐으면 `null`(그 경우 원본 없이 등록 — 작업본만 저장).
   */
  resolveFileId: () => Promise<number | null>
  /** 등록이 이 원본 번호를 거절(400)했을 때 — 실패로 바꾸고, 다음 등록부터는 원본 없이 보낸다. */
  reject: (fileId: number, detail: string) => void
  /** 비우기(초기화 · 등록 성공 후) — 진행 중이던 올리기 결과도 버린다. */
  reset: () => void
}

/**
 * 등록(`POST /crime/register`)이 붙인 원본 번호를 거절할 때의 400 문구 — police-server
 * `db/file_repo.py` MSG_ORIGINAL_NOT_FOUND · MSG_NOT_ORIGINAL · MSG_ORIGINAL_LINKED 그대로.
 */
const ORIGINAL_REJECT_DETAILS: ReadonlySet<string> = new Set([
  "원본 파일을 찾을 수 없습니다",
  "원본 파일이 아닙니다",
  "이미 다른 감정물에 연결된 원본 파일입니다",
])

/** 등록 실패가 「원본 번호 거절(400)」이면 그 문구, 아니면 null. */
export function originalRejectDetail(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 400 || error.detail === null) return null
  return ORIGINAL_REJECT_DETAILS.has(error.detail) ? error.detail : null
}

/** 실패 문구 — 서버 `detail`(413 · 400 등) 그대로, 없으면 null(안내 문구만 보인다). */
function failureDetail(error: unknown): string | null {
  return error instanceof ApiError ? error.detail : null
}

/**
 * 등록 화면의 「원본 먼저 올리기」(실증 확장 설계서 §5-E). 파일을 고르자마자 원본을 보관하고,
 * 등록 요청에는 성공한 원본 번호만 붙인다. 실패해도 등록은 막지 않는다(§11-2 「실패는 그 자리에」 —
 * 화면이 「원본 보관 실패 — 작업본만 저장됩니다」를 남긴다).
 *
 * 경합: 파일을 다시 고르면 순번(`seqRef`)이 올라가, 늦게 끝난 앞 파일의 응답은 상태도 번호도 바꾸지 못한다.
 */
export function useOriginalUpload(): OriginalUpload {
  const [state, setState] = useState<OriginalUploadState>({ status: "idle" })
  const seqRef = useRef(0)
  /** 지금 순번의 올리기 결과(원본 번호 또는 null). */
  const pendingRef = useRef<Promise<number | null>>(Promise.resolve(null))
  /** 등록이 거절한 원본 번호 — 다시 보내지 않는다. */
  const rejectedRef = useRef(new Set<number>())

  const start = useCallback((file: File) => {
    const seq = ++seqRef.current
    setState({ status: "uploading" })
    pendingRef.current = uploadOriginal(file).then(
      ({ fileId }) => {
        if (seq !== seqRef.current) return null
        setState({ status: "done", fileId })
        return fileId
      },
      (error: unknown) => {
        if (seq === seqRef.current) setState({ status: "failed", detail: failureDetail(error) })
        return null
      }
    )
  }, [])

  const resolveFileId = useCallback(async () => {
    const seq = seqRef.current
    const fileId = await pendingRef.current
    if (seq !== seqRef.current || fileId === null || rejectedRef.current.has(fileId)) return null
    return fileId
  }, [])

  const reject = useCallback((fileId: number, detail: string) => {
    rejectedRef.current.add(fileId)
    setState((prev) =>
      prev.status === "done" && prev.fileId === fileId ? { status: "failed", detail } : prev
    )
  }, [])

  const reset = useCallback(() => {
    seqRef.current += 1
    pendingRef.current = Promise.resolve(null)
    setState({ status: "idle" })
  }, [])

  return { state, start, resolveFileId, reject, reset }
}
