import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { StatePill, type StatePillTone } from "@/shared/ui/kit"
import { CaseWindowFrame, WindowHead, WindowRail, WorkTabStrip, type WindowRailGroup } from "@/shared/ui/panel"

import type { CaseImageStatus, CaseWindowProps, CaseWindowTab } from "../model/types"

// 사건 창(r4 — 2026-11-16 사용자 결정 「사건 클릭하면 사건 상세 … 좌하단에 그 사건에 여러 리스트」 → 「응 해」).
// 로망 거래처 창(pc_drawer) 배치: 창 바로 위 작업 탭 줄(열린 사건들) · 어두운 머리(감정번호 · 사건명 · 요약 꼬리표 · ‹ › ✕) ·
// 머리 아래 왼쪽 목록(현장 이미지 _1 … _n + 장별 상태 알약) | 오른쪽 본문(고른 이미지의 작업 탭 + 사건 단위 「결과 확인」).
// 본문 내용은 부르는 쪽이 children 으로 넣는다(S02–S07 화면 위젯을 그대로). 값 · 콜백만 받고 상태는 들지 않는다.

/** 이미지 단위 작업 탭(SCAS 흐름 순서) */
const IMAGE_TABS: readonly { key: CaseWindowTab; label: string }[] = [
  { key: "info", label: "사건 정보" },
  { key: "edit", label: "이미지 편집" },
  { key: "pattern", label: "문양 코드" },
  { key: "search", label: "검색 결과" },
  { key: "compare", label: "정밀 대조" },
]

/** 장별 상태 → 알약 모양(로망 StatePill: 끝난 것 ✓ · 사실 회색 · 아직 회색). 색만으로 구분하지 않고 글자가 상태를 말한다 */
const PILL_TONE: Record<CaseImageStatus, StatePillTone> = {
  등록: "pending",
  검색됨: "fact",
  확인: "done",
  발견: "done",
  불발견: "fact",
  감정불능: "fact",
}

/** 위 칸 요약 순서 */
const STATUS_ORDER: readonly CaseImageStatus[] = ["발견", "불발견", "감정불능", "확인", "검색됨", "등록"]

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand"
// 본문 탭 — 로망 창 오른쪽 칸 탭(굵은 글자 + 고른 탭 아래 2px 강조선) 생김새, 색만 brand-3
const TAB =
  "m-0 inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 text-[12.5px] font-bold transition-colors duration-150 motion-reduce:transition-none"
const TAB_ON = "text-brand-3 [box-shadow:inset_0_-2px_0_var(--t-brand-3)]"
const TAB_OFF = "text-muted-foreground hover:text-foreground"

export function CaseWindow({
  summary,
  images,
  selectedImage,
  tab,
  openCases,
  openCasesFull,
  prevOff,
  nextOff,
  onClose,
  onPrev,
  onNext,
  onSelectImage,
  onSelectTab,
  onSelectOpenCase,
  onCloseOpenCase,
  onConfirmResult,
  children,
}: CaseWindowProps) {
  const baseId = React.useId()
  const tabId = (key: CaseWindowTab) => `${baseId}-tab-${key}`
  const current = images.find((i) => i.no === selectedImage) ?? null

  const groups: WindowRailGroup[] = (["신발", "타이어"] as const)
    .map((kind) => ({
      name: kind,
      items: images
        .filter((i) => i.kind === kind)
        .map((i) => ({
          id: i.no,
          name: `_${i.no}`,
          sub: i.imageNo,
          thumbSrc: i.thumbSrc,
          pill: <StatePill tone={PILL_TONE[i.status]}>{i.status}</StatePill>,
        })),
    }))
    .filter((g) => g.items.length > 0)

  const counts = STATUS_ORDER.map((s) => [s, images.filter((i) => i.status === s).length] as const).filter(([, n]) => n > 0)

  const tags = [
    summary.requestOffice,
    `${summary.registeredAt} 등록`,
    `${summary.imageCount}장`,
    ...(summary.stageLabel ? [summary.stageLabel] : []),
  ].filter(Boolean)

  const tabButton = (key: CaseWindowTab, label: React.ReactNode, onClick: () => void, className?: string) => (
    <button
      key={key}
      type="button"
      role="tab"
      id={tabId(key)}
      aria-selected={tab === key}
      onClick={onClick}
      className={cn(TAB, tab === key ? TAB_ON : TAB_OFF, FOCUS, className)}
    >
      {label}
    </button>
  )

  return (
    <CaseWindowFrame
      label={`${summary.aprthngNo} ${summary.caseName} 사건 창`}
      onClose={onClose}
      tabs={
        <WorkTabStrip
          tabs={openCases.map((c) => ({ id: c.aprthngNo, label: `${c.aprthngNo} · ${c.caseName}` }))}
          activeId={summary.aprthngNo}
          onSelect={onSelectOpenCase}
          onClose={onCloseOpenCase}
          full={openCasesFull}
        />
      }
      head={
        <WindowHead
          mark={summary.caseName.charAt(0) || "사"}
          title={summary.aprthngNo}
          subtitle={summary.caseName}
          tags={tags}
          onPrev={onPrev}
          onNext={onNext}
          prevOff={prevOff}
          nextOff={nextOff}
          onClose={onClose}
        />
      }
      rail={
        <WindowRail
          label={`${summary.aprthngNo} 현장 이미지`}
          groups={groups}
          selectedId={selectedImage}
          onSelect={onSelectImage}
          top={
            <p className="m-0 text-[11px] leading-[1.5] text-muted-foreground">
              <b className="text-[12px] font-bold text-foreground">현장 이미지 {images.length}장</b>
              {counts.length > 0 ? <span className="block">{counts.map(([s, n]) => `${s} ${n}`).join(" · ")}</span> : null}
            </p>
          }
        />
      }
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col">
        <div
          role="tablist"
          aria-label="작업"
          className="flex shrink-0 items-stretch gap-0.5 overflow-x-auto border-b border-solid border-border bg-panel px-2 [scrollbar-width:none]"
        >
          {current ? (
            <span className="mr-1 inline-flex shrink-0 items-center font-code text-[11.5px] font-bold text-fg-2">_{current.no}</span>
          ) : null}
          {IMAGE_TABS.map((t) => tabButton(t.key, t.label, () => onSelectTab(t.key)))}
          {/* 사건 단위 판정 — 이미지 탭과 떨어진 끝 자리에 「사건 전체」 꼬리글로 구분한다 */}
          {tabButton(
            "confirm",
            <>
              결과 확인
              <small className="text-[10.5px] font-normal text-muted-foreground">사건 전체</small>
            </>,
            onConfirmResult,
            "ml-auto border-l border-solid border-border pl-3.5"
          )}
        </div>
        <div
          role="tabpanel"
          aria-labelledby={tabId(tab)}
          data-slot="case-window-panel"
          className="min-h-0 min-w-0 flex-1 overflow-auto"
        >
          {children}
        </div>
      </div>
    </CaseWindowFrame>
  )
}
