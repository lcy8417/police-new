import type * as React from "react"

import { Segmented } from "@/shared/ui/kit"
import { InspectFrame, type LensSettings, type ViewTune } from "@/shared/ui/viewer"

import type { SearchImageSource } from "../model/types"
import { PatternLibrary, type PatternLibraryProps } from "./PatternLibrary"

const SOURCES = [
  { value: "original", label: "원본" },
  { value: "edited", label: "편집본" },
]

export interface InspectOverlayProps {
  /** 감정물 번호 */
  aprthngNo: string
  searchImage: SearchImageSource
  onSearchImageChange: (next: SearchImageSource) => void
  /** 크게 볼 그림(누를 수 없는 복사본) */
  source?: React.ReactNode
  tune: ViewTune
  onTuneChange: (next: ViewTune) => void
  lens: LensSettings
  onLensChange: (next: LensSettings) => void
  /** 오른쪽 문양 목록(바로 부위에 넣기) */
  library: Omit<PatternLibraryProps, "roomy" | "className">
  onClose: () => void
}

/**
 * 문양 코드 탭의 크게 살펴보기 — 공용 `InspectFrame` 에 원본/편집본 고르기와 오른쪽 문양 목록(바로 부위에 넣기)을 얹는다.
 */
export function InspectOverlay({ aprthngNo, searchImage, onSearchImageChange, source, tune, onTuneChange, lens, onLensChange, library, onClose }: InspectOverlayProps) {
  return (
    <InspectFrame
      slot="pattern-inspect"
      lensSlot="pattern-lens"
      meta={
        <>
          <span className="font-code text-[11px] text-muted-foreground">{aprthngNo}</span>
          <Segmented
            aria-label="살펴볼 이미지"
            items={SOURCES}
            value={searchImage}
            onValueChange={(v) => onSearchImageChange(v as SearchImageSource)}
            className="p-[2px] [&_button]:px-[8px] [&_button]:py-[1px] [&_button]:text-[11.5px]"
          />
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">보기 조정은 저장하지 않습니다 — 편집 저장은 「이미지 편집」 탭</span>
        </>
      }
      source={source}
      sourceLabel={searchImage === "edited" ? "편집본" : "원본"}
      tune={tune}
      onTuneChange={onTuneChange}
      lens={lens}
      onLensChange={onLensChange}
      aside={<PatternLibrary {...library} roomy className="flex-1" />}
      onClose={onClose}
    />
  )
}
