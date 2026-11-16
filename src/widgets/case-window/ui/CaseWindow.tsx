import * as React from "react"

import { AiTag } from "@/shared/ui/ai"
import { StatePill, type StatePillTone } from "@/shared/ui/kit"
import {
  CaseWindowFrame,
  StageStrip,
  TabMark,
  TaskBoxes,
  UnderlineTabs,
  WindowHead,
  WindowRail,
  WorkTabStrip,
  type StageStripItem,
  type TaskBoxItem,
  type WindowHeadNow,
  type WindowRailGroup,
} from "@/shared/ui/panel"

import type { CaseImageStatus, CaseWindowProps, CaseWindowTab, CaseWindowTarget } from "../model/types"

// 사건 창(r4 — 2026-11-16 사용자 결정 「사건 클릭하면 사건 상세 … 좌하단에 그 사건에 여러 리스트」 → 「응 해」).
// 로망 거래처 창(pc_drawer) 배치: 창 바로 위 작업 탭 줄(열린 사건들) · 어두운 머리(감정번호 · 사건명 · 요약 꼬리표 · ⋯ · ‹ › ✕ /
// 셋째 줄 「⑥ 결재 › 결재 올리기 [지금 할 차례]」) · 단계 띠 6칸 · 「↳ 이 단계 할 일」 상자 줄(11/16 사용자 「어디까지 왔나 · 지금 할 일」 → 「응」) ·
// 머리 아래 왼쪽 목록(현장 이미지 _1 … _n + 장별 상태 알약 + 맨 아래 사진 추가) | 오른쪽 본문(표시 붙은 밑줄 작업 탭 + 사건 단위 「결과 확인」).
// 본문 내용은 부르는 쪽이 children 으로 넣는다(S02–S07 화면 위젯을 그대로). 값 · 콜백만 받고 상태는 들지 않는다 —
// 단계 계산 · 할 일 만들기 · 탭 표시 판정도 부르는 쪽(진열 페이지의 mock 파생 함수)이 한다.

/** 이미지 단위 작업 탭(SCAS 흐름 순서) */
const IMAGE_TABS: readonly { key: CaseWindowTab; label: string }[] = [
  { key: "info", label: "사건 정보" },
  { key: "edit", label: "이미지 편집" },
  { key: "pattern", label: "문양 코드" },
  { key: "search", label: "검색 결과" },
  { key: "compare", label: "정밀 대조" },
]
const TAB_LABEL: Record<CaseWindowTab, string> = {
  info: "사건 정보",
  edit: "이미지 편집",
  pattern: "문양 코드",
  search: "검색 결과",
  compare: "정밀 대조",
  confirm: "결과 확인",
}

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

/** 자리 설명(title) — 「검색 결과 · _4」 */
const where = (t: CaseWindowTarget) => `${TAB_LABEL[t.tab]}${t.img ? ` · _${t.img}` : ""}`

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
  stages,
  currentStage,
  tasks,
  savedAt,
  tabMarks,
  menu,
  railFooter,
  onGo,
  children,
}: CaseWindowProps) {
  const baseId = React.useId()
  const tabIdPrefix = `${baseId}-tab`
  const current = images.find((i) => i.no === selectedImage) ?? null

  const go = (target: CaseWindowTarget) => {
    if (onGo) {
      onGo(target)
      return
    }
    if (target.img) onSelectImage(target.img)
    if (target.tab === "confirm") onConfirmResult()
    else onSelectTab(target.tab)
  }

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

  // 단계 띠가 있으면 머리 꼬리표의 단계 글자는 뺀다(같은 말이 띠 · 셋째 줄에 있다)
  const tags = [
    summary.requestOffice,
    `${summary.registeredAt} 등록`,
    `${summary.imageCount}장`,
    ...(summary.stageLabel && !stages ? [summary.stageLabel] : []),
  ].filter(Boolean)

  // ── 단계 띠 · 할 일 ──
  const nowStage = stages && currentStage !== undefined ? stages[currentStage] : undefined
  const left = (tasks ?? []).filter((t) => t.state !== "done")
  const now: WindowHeadNow | undefined =
    nowStage && currentStage !== undefined
      ? {
          num: currentStage + 1,
          stage: nowStage.name,
          task: left[0]?.label,
          badge: left.length > 0 ? "지금 할 차례" : "다 끝남 ✓",
        }
      : undefined
  const stripItems: StageStripItem[] = (stages ?? []).map((s, i) => ({
    key: i,
    state: s.state,
    label: s.name,
    note: s.note,
    dot: s.dot,
    final: i === (stages?.length ?? 0) - 1,
    now: i === currentStage && s.state !== "done",
    hint: `${s.name} — ${where(s.target)} 탭으로`,
  }))
  // 보고 있는 할 일(테 2px) = 지금 탭 · 이미지가 가리키는 상자, 없으면 지금 할 상자
  const viewing = (tasks ?? []).find((t) => t.target.tab === tab && (!t.target.img || t.target.img === selectedImage))
  const taskItems: TaskBoxItem[] = (tasks ?? []).map((t) => ({
    key: t.id,
    state: t.state,
    label: t.label,
    note: t.note,
    hint: `${t.hint} — ${where(t.target)}`,
    now: t.now,
    current: viewing ? t === viewing : t.now,
    mark: t.ai ? <AiTag>AI</AiTag> : undefined,
  }))

  const head = (
    <>
      <WindowHead
        mark={summary.caseName.charAt(0) || "사"}
        title={summary.aprthngNo}
        subtitle={summary.caseName}
        tags={tags}
        now={now}
        menu={menu}
        onPrev={onPrev}
        onNext={onNext}
        prevOff={prevOff}
        nextOff={nextOff}
        onClose={onClose}
      />
      {stages ? (
        <div data-slot="case-window-flow" className="shrink-0 border-0 border-b border-solid border-border bg-panel">
          <StageStrip label="사건 진행 단계" items={stripItems} onPick={(i) => go(stages[i].target)} />
          {taskItems.length > 0 || savedAt ? (
            <TaskBoxes
              label="이 단계 할 일"
              items={taskItems}
              onPress={(id) => {
                const t = tasks?.find((x) => x.id === id)
                if (t) go(t.target)
              }}
              right={
                savedAt ? (
                  <span
                    data-slot="case-window-saved"
                    className="ml-auto inline-flex h-[26px] shrink-0 items-center gap-1 self-center whitespace-nowrap rounded-full bg-ok-bg px-2.5 text-[11px] font-bold text-ok-fg"
                  >
                    ✓ 저장됨 <span className="font-code font-normal">{savedAt}</span>
                  </span>
                ) : undefined
              }
            />
          ) : null}
        </div>
      ) : null}
    </>
  )

  const markOf = (key: CaseWindowTab) => {
    const m = tabMarks?.[key]
    return m ? <TabMark kind={m.kind} count={m.count} /> : null
  }
  const tabList: [CaseWindowTab, React.ReactNode][] = [
    ...IMAGE_TABS.map((t): [CaseWindowTab, React.ReactNode] => [
      t.key,
      <>
        {t.label}
        {markOf(t.key)}
      </>,
    ]),
    // 사건 단위 판정 — 이미지 탭과 떨어진 끝 자리에 「사건 전체」 꼬리글로 구분한다
    [
      "confirm",
      <>
        결과 확인
        {markOf("confirm")}
        <small className="ml-1.5 text-[10.5px] font-normal text-muted-foreground">사건 전체</small>
      </>,
    ],
  ]

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
      head={head}
      rail={
        <WindowRail
          label={`${summary.aprthngNo} 현장 이미지`}
          groups={groups}
          selectedId={selectedImage}
          onSelect={onSelectImage}
          footer={railFooter}
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
        <UnderlineTabs
          label="작업"
          tabs={tabList}
          value={tab}
          onChange={(key) => (key === "confirm" ? onConfirmResult() : onSelectTab(key))}
          endKey="confirm"
          idPrefix={tabIdPrefix}
          lead={
            current ? (
              <span className="mr-1 inline-flex shrink-0 items-center font-code text-[12px] font-bold text-fg-2">_{current.no}</span>
            ) : undefined
          }
        />
        <div
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-${tab}`}
          data-slot="case-window-panel"
          className="min-h-0 min-w-0 flex-1 overflow-auto"
        >
          {children}
        </div>
      </div>
    </CaseWindowFrame>
  )
}
