import * as React from "react"

import { StatePill, type StatePillTone } from "@/shared/ui/kit"
import {
  CaseWindowFrame,
  TabMark,
  UnderlineTabs,
  WindowHead,
  WindowRail,
  WorkTabStrip,
  type WindowRailGroup,
} from "@/shared/ui/panel"

import type { CaseImageStatus, CaseWindowProps, CaseWindowTab } from "../model/types"

// 사건 창(r4 — 2026-11-16 사용자 결정 「사건 클릭하면 사건 상세 … 좌하단에 그 사건에 여러 리스트」 → 「응 해」).
// 로망 거래처 창(pc_drawer) 배치: 창 바로 위 작업 탭 줄(열린 사건들) · 어두운 머리(감정번호 · 사건명 · 요약 꼬리표 · ⋯ · ‹ › ✕ /
// 셋째 줄 흐름 「✓ 접수 › [② 1차 작업] › ③ 검색·판정 › ④ 교차 검증 › ⑤ 감정서」) ·
// 머리 아래 왼쪽 목록(현장 이미지 _1 … _n + 장별 상태 알약 + 맨 아래 사진 추가) | 오른쪽 본문(표시 붙은 밑줄 작업 탭 + 사건 단위 「결과 확인」).
// 11/16 사용자 「이 단계에서 할 일은 없애고 … 그냥 플로우가 이렇다 이정도만. 결재는 없어」 — 단계 띠 · 할 일 상자를 빼고 머리 안 흐름 한 줄만.
// 본문 내용은 부르는 쪽이 children 으로 넣는다(S02–S07 화면 위젯을 그대로). 값 · 콜백만 받고 상태는 들지 않는다 —
// 흐름 계산 · 탭 표시 판정도 부르는 쪽(진열 페이지의 mock 파생 함수)이 한다.

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

/** 접힌 목록 썸네일 귀퉁이 한 글자(알약 대신) — 등록은 표식 없음. 화면 읽기는 줄 이름 「_1 · 발견」이 말한다 */
const MARK: Partial<Record<CaseImageStatus, string>> = {
  발견: "✓",
  확인: "✓",
  검색됨: "검",
  불발견: "불",
  감정불능: "–",
}

/** 위 칸 요약 순서 */
const STATUS_ORDER: readonly CaseImageStatus[] = ["발견", "불발견", "감정불능", "확인", "검색됨", "등록"]

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
  tabMarks,
  menu,
  railFooter,
  children,
}: CaseWindowProps) {
  const baseId = React.useId()
  const tabIdPrefix = `${baseId}-tab`
  const current = images.find((i) => i.no === selectedImage) ?? null
  // 왼쪽 이미지 목록은 기본 접힘(11/17 사용자 「왼쪽 사이드바 기본적으로 접혀있을까??」) — 창 안 보기 상태라 위젯이 든다
  const [railCollapsed, setRailCollapsed] = React.useState(true)

  const groups: WindowRailGroup[] = (["신발", "타이어"] as const)
    .map((kind) => ({
      name: kind,
      items: images
        .filter((i) => i.kind === kind)
        // 이미지 감정번호(00001-25-0649_1)는 창 머리 감정번호 + 줄 번호와 같은 말이라 줄에 쓰지 않는다
        .map((i) => ({
          id: i.no,
          name: `_${i.no}`,
          ariaLabel: `_${i.no} · ${i.status}`,
          thumbSrc: i.thumbSrc,
          pill: <StatePill tone={PILL_TONE[i.status]}>{i.status}</StatePill>,
          mark: MARK[i.status],
        })),
    }))
    .filter((g) => g.items.length > 0)

  const counts = STATUS_ORDER.map((s) => [s, images.filter((i) => i.status === s).length] as const).filter(([, n]) => n > 0)

  // 흐름 줄이 있으면 머리 꼬리표의 단계 글자는 뺀다(같은 말이 셋째 줄에 있다)
  const tags = [
    summary.requestOffice,
    `${summary.registeredAt} 등록`,
    `${summary.imageCount}장`,
    ...(summary.stageLabel && !stages ? [summary.stageLabel] : []),
  ].filter(Boolean)

  const head = (
    <WindowHead
      mark={summary.caseName.charAt(0) || "사"}
      title={summary.aprthngNo}
      subtitle={summary.caseName}
      tags={tags}
      flow={stages?.map((s) => ({ label: s.name, state: s.state }))}
      flowLabel="사건 진행 흐름"
      menu={menu}
      onPrev={onPrev}
      onNext={onNext}
      prevOff={prevOff}
      nextOff={nextOff}
      onClose={onClose}
    />
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
          collapsed={railCollapsed}
          onToggle={() => setRailCollapsed((v) => !v)}
          footer={railFooter}
          footerCollapsed={
            railFooter ? (
              <button
                type="button"
                aria-label="사진 추가 — 목록 펼치기"
                title="사진 추가"
                onClick={() => setRailCollapsed(false)}
                className="m-0 grid size-8 cursor-pointer place-items-center rounded-[8px] border border-dashed border-line-3 bg-panel p-0 text-[16px] leading-none text-fg-2 hover:bg-strip focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-brand"
              >
                +
              </button>
            ) : undefined
          }
          top={
            <div className="flex flex-col gap-1.5">
              <b className="text-[13px] font-bold leading-7 text-foreground">
                이미지 <span className="font-code">{images.length}</span>
              </b>
              {counts.length > 0 ? (
                <span className="flex flex-wrap gap-1">
                  {counts.map(([s, n]) => (
                    <span key={s} className="whitespace-nowrap rounded-full bg-strip px-1.5 text-[10.5px] leading-[18px] text-muted-foreground">
                      {s} <b className="font-code font-bold text-fg-2">{n}</b>
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
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
