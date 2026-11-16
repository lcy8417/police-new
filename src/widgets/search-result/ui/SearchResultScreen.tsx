import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Button, Chip, InlineError, Pagination, Segmented, StatusDot } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { formatSimilarity, GRADE_DOT, parseSimilarity, similarityGrade } from "../model/similarity"
import type { ImageMode, ImageSearchResultItem, SearchResultScreenProps } from "../model/types"

// S05 검색 결과(F23 · F24) — SCAS 「문양검색결과」 배치: 위 이미지번호 · 결과형태, 왼쪽 현장 족적(고정), 오른쪽 결과 그리드.
// 값은 모두 props(서버 호출 0줄). 결과형태(1–4열)는 저장하지 않는 보기 방식이라 위젯 안 상태다.
// 시안의 +α(AI가 먼저 보라는 10건 · 유사도 분포 · 빠른 비교 · 거르기 칩 · 본 위치)와 카드 ★은 담지 않는다(노트 screens-result.md).

const COLUMN_ITEMS = [
  { value: "1", label: "1열" },
  { value: "2", label: "2열" },
  { value: "3", label: "3열" },
  { value: "4", label: "4열" },
]

// 열 수 → 정적 클래스(Tailwind 가 읽을 수 있게 전부 적는다)
const GRID_COLS: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
}

// 시안 순서: 원본 · 이진화. 글자는 지금 앱 리터럴 그대로
const MODE_ITEMS: { value: ImageMode; label: ImageMode }[] = [
  { value: "원본보기", label: "원본보기" },
  { value: "이진화보기", label: "이진화보기" },
]

const NOT_READY = "준비 중"

function ResultCard({
  item,
  ranking,
  onOpen,
}: {
  item: ImageSearchResultItem
  ranking: number
  onOpen: () => void
}) {
  const value = parseSimilarity(item.similarity)
  const grade = similarityGrade(value)
  const dot = GRADE_DOT[grade]
  const pct = formatSimilarity(value)
  return (
    <li className="min-w-0">
      <button
        type="button"
        data-result-card
        onClick={onOpen}
        className="grid w-full min-w-0 cursor-pointer gap-[4px] rounded-[9px] border border-solid border-border bg-panel-2 p-[4px] text-left hover:border-brand-line focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="relative block h-[150px] overflow-hidden rounded-[6px] bg-foreground">
          <img src={item.image} alt={`신발 ${item.ftwrId} 밑창`} className="block size-full object-contain" />
          {ranking <= 3 ? (
            <Chip variant="blue-h20" className="absolute top-[4px] left-[4px] font-code">
              {`TOP ${ranking}`}
            </Chip>
          ) : null}
        </span>
        <span className="flex min-w-0 items-center gap-[6px] text-[11px] leading-[1.2] whitespace-nowrap">
          <b className="font-code tabular-nums text-foreground">{`#${ranking}`}</b>
          <span className="min-w-0 truncate font-code text-fg-2">{`No. ${item.ftwrId}`}</span>
          <span data-grade={grade} title={`유사도 ${dot.text}`} className="ml-auto inline-flex items-center">
            <StatusDot tone={dot.tone} label={pct} className="font-code text-[11px] tabular-nums" />
            <span className="sr-only">{` 유사도 ${dot.text}`}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

export function SearchResultScreen({
  status,
  errorAt,
  onRetry,
  imageNo,
  sceneImage,
  results,
  totalCount,
  page,
  pageSize,
  onPageChange,
  imageMode,
  onImageModeChange,
  onOpenResult,
}: SearchResultScreenProps) {
  // 결과형태: 시안 SCAS 기본 4열
  const [columns, setColumns] = React.useState("4")
  const firstRank = (page - 1) * pageSize + 1
  const hasNext = page * pageSize < totalCount

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="grid min-h-[320px] place-content-center justify-items-center gap-[10px] text-[12px] text-muted-foreground">
        <AiProgress state="running" label="신발 검색 중" className="w-[220px]" />
        <span>신발 검색 중 — 신발 DB 와 비교하고 있습니다</span>
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="grid min-h-[320px] place-content-center">
        <InlineError message="검색 결과를 확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else if (status === "empty") {
    body = (
      <div className="grid min-h-[320px] place-content-center justify-items-center gap-[4px] text-[12.5px] text-muted-foreground">
        <span className="font-semibold text-fg-2">결과 없음</span>
        <span className="text-[11.5px] text-dim">필수 문양을 조정해 다시 검색해 보세요</span>
      </div>
    )
  } else {
    body = (
      <div className="grid min-w-0 gap-[8px]">
        <ol data-result-grid data-columns={columns} className={cn("grid min-w-0 gap-[6px]", GRID_COLS[columns])}>
          {results.map((item, i) => {
            const ranking = firstRank + i
            return (
              <ResultCard
                key={`${item.ftwrId}-${ranking}`}
                item={item}
                ranking={ranking}
                onOpen={() => onOpenResult(item, ranking)}
              />
            )
          })}
        </ol>
        <Pagination
          total={totalCount}
          page={page}
          pageSize={pageSize}
          hasNext={hasNext}
          onPageChange={onPageChange}
          className="px-0"
        />
      </div>
    )
  }

  return (
    <Panel title="문양검색결과" className="min-w-0">
      <div className="flex flex-wrap items-center gap-[10px] border-b border-solid border-line-2 px-[14px] py-[8px]">
        <span className="text-[12px] text-muted-foreground">
          이미지번호 <b className="font-code text-foreground">{imageNo}</b>
        </span>
        {status === "ready" ? (
          <span className="font-code text-[12px] tabular-nums text-fg-2">{`전체 ${totalCount}건`}</span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-[6px]">
          <span className="text-[12px] text-muted-foreground">결과형태</span>
          <Segmented items={COLUMN_ITEMS} value={columns} onValueChange={setColumns} aria-label="결과형태" />
          {/* SCAS 버튼 — 확인대상 기능이 지금 앱에 없어 비활성(준비 중) */}
          <Button size="sm" disabled title={NOT_READY}>
            확인대상보기
          </Button>
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-[240px_minmax(0,1fr)] gap-[12px] p-[12px_14px_14px]">
        <div className="grid content-start gap-[8px]">
          <div className="flex min-h-[30px] items-center gap-[8px] border-l-[3px] border-solid border-brand-2 bg-panel-3 px-[10px] text-[12.5px] font-semibold">
            현장 족적
          </div>
          <EvidenceImage src={sceneImage} alt="현장 족적" />
          <Segmented
            items={MODE_ITEMS}
            value={imageMode}
            onValueChange={(v) => onImageModeChange(v as ImageMode)}
            aria-label="결과 이미지 보기"
            className="justify-self-start"
          />
          <span className="text-[11px] leading-[1.5] text-dim">결과 신발 이미지를 이진화 / 원본으로 바꿔 봅니다</span>
        </div>
        <div className="min-w-0">{body}</div>
      </div>
    </Panel>
  )
}
