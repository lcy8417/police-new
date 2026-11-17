import type { ReactNode } from "react"

import type { CaseWindowTab } from "@/widgets/case-window"

/** 갈래 ④ `case-window-tabs/index.ts` 의 `CaseWindowTabBody` 와 같은 계약 */
export interface CaseWindowTabBodyProps {
  /** 사건 번호 = 감정의뢰번호(없으면 감정물 번호) */
  aprthngNo: string
  /** 고른 이미지의 감정물 번호 전체(`05019-24-0017_5`) — 없으면 null */
  imageNo: string | null
  tab: CaseWindowTab
  onSelectTab: (tab: CaseWindowTab) => void
  /** 감정물 번호 전체 또는 순번 */
  onSelectImage: (no: string) => void
}

/**
 * 사건 창 탭 본문 임시 자리 — 갈래 ④ 의 실제 탭 본문이 들어오기 전까지 「준비 중」만 보인다(같은 계약이라 import 만 바꿔 끼운다).
 */
export function CaseWindowTabBodyPlaceholder({ aprthngNo, imageNo }: CaseWindowTabBodyProps): ReactNode {
  return (
    <p role="status" className="m-0 px-[18px] py-[24px] text-[12.5px] text-muted-foreground">
      준비 중 — {imageNo ?? aprthngNo}
    </p>
  )
}
