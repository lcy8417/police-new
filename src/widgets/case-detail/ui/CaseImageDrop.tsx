import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Button } from "@/shared/ui/kit"

import { UploadHint } from "./PlusParts"

// S02 사진 끌어 놓기 칸(+ 올리는 중 막대). S02 왼쪽 「이미지 목록」 아래와 사건 창 왼쪽 목록 맨 아래(11/16 — 창 안에서는 이미지 목록 표를 숨기고 여기로 옮김)가 같이 쓴다.
// 파일을 고르면 onFilesAdded — 올리기 흉내 · 목록 붙이기는 부르는 쪽 몫.

export interface CaseImageDropProps {
  /** 끌어 놓기 · 고르기로 받은 파일 */
  onFilesAdded: (files: File[]) => void
  /** 올리는 중인 파일(없으면 막대 없음) */
  uploading?: { fileName: string; percent: number }
  /** (+α) 신규 — 막대를 AI 진행 막대로 · 아래 점검 안내 한 줄 */
  plus?: boolean
  /**
   * 좁은 자리(사건 창 왼쪽 목록 맨 아래 232) — 칸 맨 위 「+ 사진 추가」 단추(「추가」 단추가 따로 없으므로) ·
   * 안내 글자를 한 줄로 줄이고 (+α) 점검 안내 줄은 뺀다(목록을 덜 가리게)
   */
  compact?: boolean
  /** 숨은 파일 고르기 칸 — 다른 자리의 「추가」 단추가 이 칸을 연다 */
  inputRef?: React.RefObject<HTMLInputElement | null>
  className?: string
}

export function CaseImageDrop({ onFilesAdded, uploading, plus = false, compact = false, inputRef, className }: CaseImageDropProps) {
  const ownRef = React.useRef<HTMLInputElement>(null)
  const fileInput = inputRef ?? ownRef
  const [dragging, setDragging] = React.useState(false)
  // 0~100 밖의 값은 막대가 틀 밖으로 나가지 않게 줄인다
  const percent = uploading ? Math.min(100, Math.max(0, Math.round(uploading.percent))) : 0
  const handleFiles = (list: FileList | null) => {
    if (list && list.length > 0) onFilesAdded(Array.from(list))
  }

  return (
    <div
      data-slot="case-image-drop"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "grid gap-[5px] rounded-[8px] border border-dashed border-brand-line bg-brand-bg px-[10px] py-[8px] text-[11.5px] text-fg-2",
        dragging && "border-brand",
        className
      )}
    >
      {compact ? (
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          + 사진 추가
        </Button>
      ) : null}
      <span>{compact ? "⤓ 끌어 놓아도 여러 장 추가" : "⤓ 사진을 끌어 놓으면 여러 장 추가"}</span>
      {uploading ? (
        <span className="grid gap-[3px]">
          <span className="flex justify-between font-code text-[10.5px] text-dim">
            <span className="truncate">{uploading.fileName} 업로드 중</span>
            <span>{percent}%</span>
          </span>
          {plus ? (
            <AiProgress state="running" value={percent / 100} label="업로드" />
          ) : (
            <span
              role="progressbar"
              aria-label="업로드"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-[4px] overflow-hidden rounded-[2px] bg-line-3"
            >
              <i className="block h-full bg-brand-2" style={{ width: `${percent}%` }} />
            </span>
          )}
        </span>
      ) : null}
      {plus && !compact ? <UploadHint /> : null}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label="이미지 파일 고르기"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
