import { useCallback, useRef, useState } from "react"

import { uploadOriginal } from "@/entities/crime"
import { ApiError } from "@/shared/api"

/**
 * 원본 보관 상태(마지막으로 고른 파일 기준) — 없음(파일 안 고름) / 올리는 중 / 보관됨(`fileId`) /
 * 실패(서버 `detail`, 없으면 null).
 */
export type OriginalUploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; fileId: number }
  | { status: "failed"; detail: string | null }

export interface OriginalUpload {
  /** 마지막으로 고른 파일의 원본 보관 상태. */
  state: OriginalUploadState
  /**
   * 파일을 고른 순간 부른다 — 편집 전 바이트를 `POST /files/original`로 올린다. 이 고르기의 번호
   * (`pick`, 1씩 늘어남)를 돌려준다. 화면은 이 번호를 그 파일의 이미지와 함께 들고 있다가 등록 때 넘긴다.
   */
  start: (file: File) => number
  /**
   * 등록 요청에 붙일 원본 번호. `pick`을 주면 **그 고르기**의 결과만(뒤에 다른 파일을 골랐어도 그 이미지에는
   * 그 원본이 맞다), 안 주면 마지막 고르기. 올리는 중이면 끝날 때까지 기다린다. 실패 · 모르는 번호 ·
   * 초기화된 번호 · 등록이 거절한 번호면 `null`(원본 없이 등록 — 작업본만 저장).
   */
  resolveFileId: (pick?: number) => Promise<number | null>
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
 * 경합: 고르기마다 번호(`pick`)를 매긴다. 화면 상태는 마지막 고르기만 바꾸고(늦게 끝난 앞 업로드는
 * 상태를 못 바꿈), 원본 번호는 고르기 번호별로 따로 보관해 「화면에 있는 그 이미지를 고른 것」의 번호만
 * 꺼내 쓰게 한다.
 */
export function useOriginalUpload(): OriginalUpload {
  const [state, setState] = useState<OriginalUploadState>({ status: "idle" })
  const seqRef = useRef(0)
  /** 고르기 번호 → 그 고르기의 올리기 결과(원본 번호 또는 null). reset이면 비운다. */
  const resultsRef = useRef(new Map<number, Promise<number | null>>())
  /** 등록이 거절한 원본 번호 — 다시 보내지 않는다. */
  const rejectedRef = useRef(new Set<number>())

  const start = useCallback((file: File) => {
    const pick = ++seqRef.current
    setState({ status: "uploading" })
    resultsRef.current.set(
      pick,
      uploadOriginal(file).then(
        ({ fileId }) => {
          if (pick === seqRef.current) setState({ status: "done", fileId })
          return fileId
        },
        (error: unknown) => {
          if (pick === seqRef.current) setState({ status: "failed", detail: failureDetail(error) })
          return null
        }
      )
    )
    return pick
  }, [])

  const resolveFileId = useCallback(async (pick?: number) => {
    const wanted = pick ?? seqRef.current
    const result = resultsRef.current.get(wanted)
    if (!result) return null
    const fileId = await result
    // 기다리는 사이 초기화됐으면 버린다(그 고르기의 결과가 지워짐).
    if (resultsRef.current.get(wanted) !== result) return null
    if (fileId === null || rejectedRef.current.has(fileId)) return null
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
    resultsRef.current.clear()
    setState({ status: "idle" })
  }, [])

  return { state, start, resolveFileId, reject, reset }
}
