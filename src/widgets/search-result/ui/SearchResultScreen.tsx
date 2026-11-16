import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiProgress } from "@/shared/ui/ai"
import { Button, Chip, InlineError, Pagination, Segmented } from "@/shared/ui/kit"
import { Panel } from "@/shared/ui/panel"
import { EvidenceImage } from "@/shared/ui/viewer"

import { viewerRoles } from "../model/roles"
import { parseSimilarity } from "../model/similarity"
import type { ImageMode, SearchResultScreenProps, SearchTarget } from "../model/types"
import { AiTopRail } from "./AiTopRail"
import { LeftPlus } from "./LeftPlus"
import { AI_MARK, CHIP_TEAL } from "./plus-style"
import { QuickPeekWindow } from "./QuickPeekWindow"
import { ResultCard } from "./ResultCard"
import { ResultDetail } from "./ResultDetail"

// S05 검색 결과(F23 · F24) — SCAS 「문양검색결과」 배치: 위 이미지번호 · 결과형태, 왼쪽 현장 족적(고정), 오른쪽 결과 그리드.
// 값은 모두 props(서버 호출 0줄). 결과형태 · 보기 거르기 · 상세조회 칸 열림은 저장하지 않는 보기 방식이라 위젯 안 상태다.
// r2: 시안 r3 +α(AI가 먼저 보라는 10건 · 유사도 분포 · 본 위치 · 빠른 비교 · 보기 거르기 · 촘촘 8열 · 카드 ★ · 상세조회 칸)를
// `showPlus` 하나로 감싸 얹는다(감싼 요소마다 `data-plus`). 확인대상(★)은 저장되는 값이라 targets + onToggleTarget(제어형).

const COLUMN_ITEMS = [
  { value: "1", label: "1열" },
  { value: "2", label: "2열" },
  { value: "3", label: "3열" },
  { value: "4", label: "4열" },
]

// 열 수 → 정적 클래스(Tailwind 가 읽을 수 있게 전부 적는다). 8 = 시안 「촘촘 8열」(+α)
const GRID_COLS: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
  "8": "grid-cols-8",
}

// 시안 순서: 원본 · 이진화. 글자는 지금 앱 리터럴 그대로
const MODE_ITEMS: { value: ImageMode; label: ImageMode }[] = [
  { value: "원본보기", label: "원본보기" },
  { value: "이진화보기", label: "이진화보기" },
]

// 시안 r3 보기 거르기 칩(핀 15). 「이미 본 것 흐리게」만 지금 가짜 값으로 동작하고, 나머지는 눌림 모양 + 준비 중 알림
const FILTERS = ["이미 본 것 흐리게", "같은 그룹 묶기", "하 부위 다른 것 뒤로", "제조사별"] as const
type Filter = (typeof FILTERS)[number]

const NOT_READY = "준비 중"

export function SearchResultScreen({
  status,
  errorAt,
  onRetry,
  isAdmin,
  features,
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
  showPlus = true,
  insight,
  targets = [],
  onToggleTarget,
  onResume,
  onPlusAction,
}: SearchResultScreenProps) {
  const plus = showPlus && insight ? insight : null
  // 결과형태: 시안 SCAS 기본 4열, +α 를 켜면 시안 r3 의 「촘촘 8열」
  const [columns, setColumns] = React.useState(plus ? "8" : "4")
  const [filters, setFilters] = React.useState<ReadonlySet<Filter>>(() => new Set<Filter>(["이미 본 것 흐리게"]))
  const [detailOpen, setDetailOpen] = React.useState(true)
  const roles = viewerRoles(isAdmin, features)
  const firstRank = (page - 1) * pageSize + 1
  const hasNext = page * pageSize < totalCount
  const action = (label: string) => onPlusAction?.(label)
  const isTarget = (rank: number) => targets.some((t) => t.rank === rank)
  const toggleTarget = (target: SearchTarget) => onToggleTarget?.(target)
  const colCount = Number(columns)

  const toggleFilter = (f: Filter) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
    if (f !== "이미 본 것 흐리게") action(f)
  }

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
    const cards: React.ReactNode[] = []
    results.forEach((item, i) => {
      const ranking = firstRank + i
      const value = parseSimilarity(item.similarity)
      const focus = plus?.focusRank === ranking
      const side = i % colCount < colCount / 2 ? "right" : "left"
      cards.push(
        <ResultCard
          key={`${item.ftwrId}-${ranking}`}
          item={item}
          ranking={ranking}
          compact={columns === "8"}
          onOpen={() => onOpenResult(item, ranking)}
          plus={
            plus
              ? {
                  dim: filters.has("이미 본 것 흐리게") && ranking <= plus.seenUpTo,
                  focus,
                  starred: isTarget(ranking),
                  rerankUp: plus.rerankUp[ranking] ?? 0,
                  canStar: roles.analyst,
                  onStar: () => toggleTarget({ rank: ranking, ftwrId: item.ftwrId }),
                  peek:
                    focus && plus.peek ? (
                      <QuickPeekWindow
                        peek={plus.peek}
                        rank={ranking}
                        ftwrId={item.ftwrId}
                        similarity={value === null ? "—" : `${value.toFixed(1)}%`}
                        shoeImage={item.image}
                        side={side}
                      />
                    ) : undefined,
                }
              : undefined
          }
        />,
      )
      // 시안 「여기까지 봤음」 선: 본 위치 카드 바로 뒤에 한 줄 전체
      if (plus && ranking === plus.seenUpTo && i < results.length - 1) {
        cards.push(
          <li
            key="seen-line"
            data-plus
            data-seen-line
            className="col-span-full flex items-center gap-[8px] text-[11px] text-brand"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-brand-2" />
            {`여기까지 봤음 · ${plus.seenUpTo}위 · ${plus.seenAt}`}
            <span aria-hidden="true" className="h-px flex-1 bg-brand-2" />
          </li>,
        )
      }
    })

    body = (
      <div className="grid min-w-0 gap-[8px]">
        {plus ? (
          <>
            <AiTopRail items={plus.aiTop} targets={targets} />
            <div data-plus data-filters className="flex flex-wrap items-center gap-[6px] text-[11px]">
              <span className="text-dim">보기</span>
              {FILTERS.map((f) => {
                const on = filters.has(f)
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFilter(f)}
                    className="cursor-pointer border-none bg-transparent p-0"
                  >
                    <Chip variant={on ? "blue" : "default"} on={on} className="h-[21px]">
                      {f}
                    </Chip>
                  </button>
                )
              })}
              <span className="ml-auto text-dim">끝까지 보기는 그대로 — 거르는 건 보기만 바꿉니다</span>
            </div>
          </>
        ) : null}
        <ol data-result-grid data-columns={columns} className={cn("grid min-w-0 gap-[6px]", GRID_COLS[columns])}>
          {cards}
        </ol>
        <div className="flex flex-wrap items-center gap-[10px]">
          <Pagination
            total={totalCount}
            page={page}
            pageSize={pageSize}
            hasNext={hasNext}
            onPageChange={onPageChange}
            className="px-0"
          />
          {plus ? (
            <span data-plus className="ml-auto text-[11px] text-dim">
              카드 ☆ = 확인대상 지름길(상세조회 버튼과 같음)
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  const detail = plus?.detail ?? null

  return (
    <Panel
      title="문양검색결과"
      className="min-w-0"
      actions={
        showPlus ? (
          <span data-plus className="inline-flex gap-[6px]">
            {roles.verifier ? <Chip>기술책임자 · 보기만</Chip> : null}
            {roles.investigator ? <Chip>수사관 · 볼 수 없음</Chip> : null}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-[10px] border-b border-solid border-line-2 px-[14px] py-[8px]">
        <span className="text-[12px] text-muted-foreground">
          이미지번호 <b className="font-code text-foreground">{imageNo}</b>
        </span>
        {status === "ready" ? (
          plus ? (
            <span data-plus className="font-code text-[12px] tabular-nums text-fg-2">{`${firstRank}위 / ${totalCount}건`}</span>
          ) : (
            <span className="font-code text-[12px] tabular-nums text-fg-2">{`전체 ${totalCount}건`}</span>
          )
        ) : null}
        <span className="ml-auto inline-flex items-center gap-[6px]">
          <span className="text-[12px] text-muted-foreground">결과형태</span>
          <Segmented items={COLUMN_ITEMS} value={columns} onValueChange={setColumns} aria-label="결과형태" />
          {/* SCAS 버튼 — 확인대상 보기 기능이 지금 앱에 없어 비활성(준비 중) */}
          <span title={NOT_READY} className="inline-flex">
            <Button size="sm" disabled>
              확인대상보기
            </Button>
          </span>
        </span>
        {plus ? (
          <>
            <span data-plus aria-hidden="true" className="h-[20px] w-px bg-line-3" />
            <Button
              data-plus
              size="sm"
              aria-pressed={columns === "8"}
              onClick={() => setColumns("8")}
              className={cn(columns === "8" && "text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]")}
            >
              촘촘 8열
            </Button>
            <Chip data-plus className={cn(CHIP_TEAL, "mr-[6px]")}>
              <span className={AI_MARK}>AI</span> 순위 다시 매김
            </Chip>
          </>
        ) : null}
      </div>

      <div className="p-[12px_14px_14px]">
        <div className="grid min-w-0 grid-cols-[240px_minmax(0,1fr)] gap-[12px]">
          <div className="grid content-start gap-[8px]">
            <div className="flex min-h-[30px] items-center gap-[8px] border-l-[3px] border-solid border-brand-2 bg-panel-3 px-[10px] text-[12.5px] font-semibold">
              현장 족적
              <Segmented
                items={MODE_ITEMS}
                value={imageMode}
                onValueChange={(v) => onImageModeChange(v as ImageMode)}
                aria-label="결과 이미지 보기"
                className="ml-auto p-[2px] font-normal [&_button]:px-[8px] [&_button]:py-[2px] [&_button]:text-[11.5px]"
              />
            </div>
            <EvidenceImage
              src={sceneImage}
              alt="현장 족적"
              caption={plus ? "고정 · 두 번 누르면 뷰어" : undefined}
              className={cn(plus && "aspect-auto h-[330px]")}
            />
            {plus && status === "ready" ? (
              <LeftPlus
                insight={plus}
                total={totalCount}
                targets={targets}
                canEditTargets={roles.analyst}
                onResume={() => onResume?.(plus.seenUpTo + 1)}
                onRemoveTarget={toggleTarget}
              />
            ) : (
              <span className="text-[11px] leading-[1.5] text-dim">결과 신발 이미지를 이진화 / 원본으로 바꿔 봅니다</span>
            )}
          </div>
          <div className="min-w-0">{body}</div>
        </div>
        {detail && detailOpen && status === "ready" ? (
          <ResultDetail
            detail={detail}
            canWrite={roles.analyst}
            onRegister={() => {
              if (!isTarget(detail.rank)) toggleTarget({ rank: detail.rank, ftwrId: detail.ftwrId })
            }}
            onAction={action}
            onClose={() => setDetailOpen(false)}
          />
        ) : null}
      </div>
    </Panel>
  )
}
