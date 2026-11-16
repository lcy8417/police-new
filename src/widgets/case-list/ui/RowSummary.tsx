import { cn } from "@/shared/lib/utils"
import { Button, Chip } from "@/shared/ui/kit"
import { HeatOverlay } from "@/shared/ui/viewer"

import type { CaseListImageSummary, CaseListRowSummary } from "../model/types"

// (+α) 행 펼침 요약(시안 S01 0646 펼침): 이미지마다 현장 → 이진화 → 1위 후보(히트맵) 썸네일 3단 + 발견/불발견 칩,
// 오른쪽에 확인 시각 · 교차 검증자 · 「사건 열기」 「검색결과 확인」. 호출하는 쪽이 showPlus 로 감싼다.

function Thumb({ src, className, children }: { src: string; className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "relative block h-[44px] w-[30px] flex-none overflow-hidden rounded-[5px] border border-solid border-border bg-canvas",
        className
      )}
    >
      <img src={src} alt="" className="block size-full object-contain" />
      {children}
    </span>
  )
}

function Arrow() {
  return (
    <span aria-hidden="true" className="font-code text-[10px] font-semibold text-dim">
      ›
    </span>
  )
}

function ImageCard({ image, onOpen }: { image: CaseListImageSummary; onOpen?: () => void }) {
  const found = image.result === "발견"
  const unable = image.result === "감정불능"
  // onOpen 이 있으면 블록 전체가 그 이미지로 가는 단추(같은 모양 + 올리면 테 강조 · 키보드 초점)
  const Box = onOpen ? "button" : "div"
  return (
    <Box
      {...(onOpen ? { type: "button" as const, onClick: onOpen, "aria-label": `${image.seq} ${image.result} 이미지 열기` } : {})}
      className={cn(
        "grid gap-[7px] rounded-[10px] border border-solid px-[9px] py-[8px]",
        "bg-[linear-gradient(160deg,var(--t-panel),var(--t-panel-2))]",
        found ? "border-ok-line" : "border-border",
        onOpen &&
          "m-0 w-full cursor-pointer text-left font-[inherit] text-inherit hover:border-brand-line focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-brand"
      )}
    >
      <div className="flex items-center gap-[6px] text-[11.5px]">
        <b className="font-code">{image.seq}</b>
        <Chip variant={found ? "green-h18" : "h18"}>{image.result}</Chip>
        <span className="ml-auto font-code text-[10px] text-dim">검색 {image.searchNo}</span>
      </div>
      <div className="flex items-center gap-[5px]">
        <Thumb src={image.sceneSrc} />
        <Arrow />
        <Thumb src={image.binSrc} className="bg-white" />
        <Arrow />
        {found && image.shoeSrc ? (
          <>
            <Thumb src={image.shoeSrc} className="border-ai-line">
              <span className="pointer-events-none absolute inset-0">
                <HeatOverlay variant="spots" />
              </span>
            </Thumb>
            <span className="grid min-w-0 text-[10.5px] leading-[1.3]">
              <b className="font-code text-ai">{image.topCandidate}</b>
              <span className="font-code text-muted-foreground">{image.similarity}</span>
              <span className="text-dim">확인대상 {image.target}</span>
            </span>
          </>
        ) : (
          <>
            <span className="grid h-[44px] w-[30px] flex-none place-items-center rounded-[5px] border border-dashed border-line-3 text-[10px] text-faint">
              —
            </span>
            <span className="grid text-[10.5px] leading-[1.3]">
              <span className="text-muted-foreground">{image.note}</span>
              <span className="text-dim">{unable ? image.target : `확인대상 ${image.target}`}</span>
            </span>
          </>
        )}
      </div>
    </Box>
  )
}

interface RowSummaryProps {
  summary: CaseListRowSummary
  canAct: boolean
  onOpenCase: () => void
  onConfirmCase: () => void
  /** 이미지 블록을 눌러 그 이미지로(`_1`). 없으면 블록은 누를 수 없다 */
  onOpenImage?: (seq: string) => void
}

export function RowSummary({ summary, canAct, onOpenCase, onConfirmCase, onOpenImage }: RowSummaryProps) {
  return (
    <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_260px] gap-[10px] whitespace-normal py-[10px] pl-[48px] pr-[12px] pb-[12px]">
      {summary.images.map((img) => (
        <ImageCard key={img.seq} image={img} onOpen={onOpenImage ? () => onOpenImage(img.seq) : undefined} />
      ))}
      <div className="grid content-start gap-[4px] text-[11.5px] leading-[1.4] text-muted-foreground">
        <span>
          {summary.confirmedAt} 결과확인완료 → <b className="text-fg-2">검증요청</b>
        </span>
        {summary.crossReviewer ? (
          <span>
            교차 검증: <b className="text-warn">{summary.crossReviewer}</b> (다른 감정관, 대기)
          </span>
        ) : null}
        <span className="mt-[2px] flex gap-[6px]">
          <Button size="sm" onClick={onOpenCase}>
            사건 열기 (S02)
          </Button>
          {canAct ? (
            <Button size="sm" onClick={onConfirmCase}>
              검색결과 확인
            </Button>
          ) : null}
        </span>
      </div>
    </div>
  )
}
