import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress, AiSuggestion, AiTag, CheckList, LiveDot, ScanOverlay, type CheckItem } from "@/shared/ui/ai"
import { Button, Chip, Segmented } from "@/shared/ui/kit"
import { EvidenceImage, type EvidenceLook } from "@/shared/ui/viewer"

import type { CaseDetailPlus } from "../model/types"

// S02 (+α) 조각들. 호출하는 쪽(CaseDetailScreen)이 showPlus · plus 가 있을 때만 그린다.

/** 접수 경로 칩 줄 + 필수 칸 원형 진행(시안 핀 9) */
export function SourceLine({ plus }: { plus: CaseDetailPlus }) {
  const { source, required } = plus
  const pct = required.total > 0 ? Math.round((required.done / required.total) * 100) : 0
  return (
    <div data-plus className="flex flex-wrap items-center gap-[6px] pr-[16px] text-[11.5px] text-muted-foreground">
      <Chip variant="blue-h20" partId="S02-08">
        {source.label}
      </Chip>
      <span>{source.note}</span>
      <span className="text-dim">·</span>
      <span>{source.analyst}</span>
      <span className="text-dim">·</span>
      <Chip variant="h20-warn" partId="S02-09">
        {source.assignment}
      </Chip>
      <span className="ml-auto inline-flex items-center gap-[8px]">
        <svg viewBox="0 0 36 36" width="30" height="30" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-line-3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${pct} 100`}
            transform="rotate(-90 18 18)"
            className="stroke-ai"
          />
        </svg>
        <span className="grid leading-[1.25]">
          <b className="font-code text-[12px] text-foreground">
            필수 {required.done} / {required.total}
          </b>
          <span className="text-[10.5px] text-dim">남은 칸: {required.remaining}</span>
        </span>
      </span>
    </div>
  )
}

type View = "raw" | "binary" | "ai"

/** 족윤적 이미지 + AI 족적 영역 · 자 · 스캔 선 · 「원본/이진화/AI 표시」 전환(시안 핀 11) */
export function EvidenceWithAi({
  src,
  alt,
  caption,
  plus,
  fill = false,
}: {
  src: string
  alt: string
  caption: string
  plus: CaseDetailPlus
  /** 높이를 부모에 맞춰 꽉 채움(사건 창 — 11/17) — 기본은 시안 높이 300 */
  fill?: boolean
}) {
  const [view, setView] = React.useState<View>("raw")
  const look: EvidenceLook = view === "binary" ? "binary" : "raw"
  return (
    // 시안: 왼쪽 칸 폭 전체 · 높이 300(2:3 틀 대신)
    <EvidenceImage src={src} alt={alt} caption={caption} ruler look={look} className={fill ? "aspect-auto h-full" : "aspect-auto h-[300px]"}>
      {view !== "binary" ? (
        <>
          <span
            data-plus
            aria-hidden="true"
            className="absolute inset-x-[31%] inset-y-[4%] rounded-[40%_40%_34%_34%] border-[1.5px] border-dashed border-ai opacity-85"
          />
          <span
            data-plus
            aria-hidden="true"
            className="absolute inset-y-[3%] right-[15.5%] w-[7%] rounded-[3px] border-[1.5px] border-solid border-warn"
          />
          <span
            data-plus
            className="absolute right-[6px] top-[8px] rounded-[4px] bg-warn-bg px-[5px] py-px font-code text-[9.5px] text-warn"
          >
            {plus.overlay.rulerText}
          </span>
          <span
            data-plus
            className="absolute left-[6px] top-[8px] rounded-[4px] bg-ai-bg px-[5px] py-px font-code text-[9.5px] text-ai"
          >
            족적 영역 {plus.overlay.areaPercent}%
          </span>
          <span data-plus>
            <ScanOverlay active />
          </span>
        </>
      ) : null}
      <span data-plus className="pointer-events-auto absolute bottom-[26px] left-[8px] flex gap-[4px]">
        <Segmented
          aria-label="보기 방식"
          value={view}
          onValueChange={(v) => setView(v as View)}
          items={[
            { value: "raw", label: "원본" },
            { value: "binary", label: "이진화" },
            { value: "ai", label: "AI 표시" },
          ]}
          className="p-[2px] [&_button]:px-[7px] [&_button]:py-px [&_button]:text-[10.5px]"
        />
      </span>
    </EvidenceImage>
  )
}

/** 이미지 목록 「중복? _4」 칩 */
export function DuplicateChip({ of }: { of: string }) {
  return (
    <Chip data-plus variant="amber-h18" partId="S02-04" className="ml-[4px]">
      중복? {of}
    </Chip>
  )
}

/** 끌어 놓기 칸 아래 한 줄 */
export function UploadHint() {
  return (
    <span data-plus className="text-[10.5px] text-dim">
      올리자마자 AI가 중복·전사판·화질·자를 점검합니다
    </span>
  )
}

/** AI 1차 작업 점검 카드(시안 핀 11) */
export function AiCheckCard({
  plus,
  onMockAction,
}: {
  plus: CaseDetailPlus
  onMockAction?: (label: string) => void
}) {
  const { aiCheck } = plus
  const items: CheckItem[] = aiCheck.items.map((it) => ({
    tone: it.tone,
    text: (
      <>
        {it.text}
        {it.refs ? (
          <>
            {" "}
            <b className="font-code">{it.refs}</b>
          </>
        ) : null}
      </>
    ),
    detail: it.detail,
    action:
      it.action?.kind === "button" ? (
        <Button size="sm" onClick={() => onMockAction?.(it.action!.label)}>
          {it.action.label}
        </Button>
      ) : it.action?.kind === "chip-warn" ? (
        <Chip variant="amber-h19" partId="S02-06">
          {it.action.label}
        </Chip>
      ) : it.action ? (
        <Chip variant="h19" partId="S02-07">
          {it.action.label}
        </Chip>
      ) : undefined,
  }))
  return (
    <div
      data-plus
      className={cn(
        "rounded-[10px] border border-solid border-ai-line px-[12px] py-[10px]",
        "bg-[linear-gradient(160deg,var(--t-ai-bg),var(--t-panel))]"
      )}
    >
      <div className="mb-[6px] flex items-center gap-[7px]">
        <LiveDot state="busy" label="AI 1차 작업 점검 중" hideLabel />
        <b className="text-[12px] text-ai">AI 1차 작업 점검</b>
        <span className="ml-auto font-code text-[10px] text-dim">
          {aiCheck.imageCount}장 · {aiCheck.seconds}초
        </span>
      </div>
      <AiProgress state="done" value={1} label="AI 1차 작업 점검" className="mb-[6px]" />
      <CheckList items={items} topLine />
    </div>
  )
}

/** 채취 방법 「기타」 옆 확인 필요 칩 + AI 제안(시안 핀 5) */
export function MethodSuggestion({
  suggestion,
  canApply,
  onApply,
}: {
  suggestion: CaseDetailPlus["methodSuggestion"]
  canApply: boolean
  onApply: () => void
}) {
  return (
    <div
      data-plus
      className="mt-[4px] flex items-start gap-[6px] rounded-[7px] border border-solid border-ai-line bg-ai-bg px-[7px] py-[5px]"
    >
      <AiTag partId="S02-21" className="mt-[1px]">
        AI 제안
      </AiTag>
      <AiSuggestion
        className="min-w-0 flex-1"
        title={suggestion.value}
        reason={`근거: ${suggestion.reason}`}
        onApply={canApply ? onApply : undefined}
      />
    </div>
  )
}
