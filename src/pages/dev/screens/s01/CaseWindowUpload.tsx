import { toast } from "sonner"

import { CaseImageDrop } from "@/widgets/case-detail"

import { useFakeUpload } from "../s02"

// 사건 창 왼쪽 목록 맨 아래 「+ 사진 추가」 · 끌어 놓기(11/16 — 창 안 S02 이미지 목록 표를 숨기고 옮김).
// 끌어 놓기 칸은 S02 와 같은 CaseImageDrop, 올리기 흉내는 같은 useFakeUpload. (+α) 켜고 `busy`(1차 작업 중인 사건)면
// 다음 번호(_장수+1)가 68% 올라가는 중인 모양으로 시작한다 — 다 끝난 사건에 「올리는 중」이 보이지 않게.
// 가짜라 다 올라가도 목록 줄은 늘지 않는다(알림만) — 목록은 사건 행의 장수에서 만든다.

export function CaseWindowUpload({
  aprthngNo,
  imageCount,
  plus,
  busy = false,
}: {
  aprthngNo: string
  imageCount: number
  plus: boolean
  /** 올리는 중 모양으로 시작(1차 작업 중인 사건) */
  busy?: boolean
}) {
  const next = imageCount + 1
  const { uploading, start } = useFakeUpload(plus && busy ? { fileName: `_${next}`, percent: 68 } : undefined)
  return (
    <CaseImageDrop
      compact
      plus={plus}
      uploading={uploading}
      onFilesAdded={(files) =>
        start(`${aprthngNo}_${next}.jpg`, () => toast(`${files.length}장을 추가했습니다(가짜 이미지 — 목록은 그대로)`))
      }
    />
  )
}
