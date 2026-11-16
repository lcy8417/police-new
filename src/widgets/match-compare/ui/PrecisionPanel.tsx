import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AiTag, ConfidenceBar, LiveDot, ScanOverlay } from "@/shared/ui/ai"
import { Chip, Segmented } from "@/shared/ui/kit"
import { HeatOverlay } from "@/shared/ui/viewer"

import type { ViewerRoles } from "../model/roles"
import type { CropView, MatchInsight } from "../model/types"

// 시안 S06 오른쪽 「+α 정밀 대조」 칸(핀 8 · 10 · 11 · 13 · 14): AI 미리 대조 · 대응점/겹쳐 보기/히트맵 · 종합 신뢰도 + 지표 4개 ·
// AI 의견(참고) · 부위별 근거(잘라 낸 그림 + 점수) · 보는 사람별 안내. 접기 · 보기 방식은 저장하지 않는 위젯 안 상태.

type OverlayMode = "pairs" | "overlay" | "heat"

const MODE_ITEMS = [
  { value: "pairs", label: "대응점" },
  { value: "overlay", label: "겹쳐 보기" },
  { value: "heat", label: "히트맵" },
]

const AI_MARK = "font-code text-[10px] font-semibold tracking-[0.12em] text-ai"

// 반원 계기판 길이(반지름 50 의 반원)
const ARC = 157.08

function Gauge({ value }: { value: number }) {
  return (
    <div className="relative h-[59px] w-[104px] drop-shadow-[0_0_8px_var(--t-stat-glow-ai)]">
      <svg viewBox="0 0 120 68" width={104} height={59} role="img" aria-label={`종합 신뢰도 ${value}%`}>
        <path d="M10 62A50 50 0 0 1 110 62" fill="none" className="stroke-line-3" strokeWidth={10} strokeLinecap="round" />
        <path
          d="M10 62A50 50 0 0 1 110 62"
          fill="none"
          className="stroke-ai"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${((ARC * value) / 100).toFixed(1)} ${ARC}`}
        />
      </svg>
      <b className="absolute inset-x-0 bottom-0 text-center font-code text-[18px]">{`${value}%`}</b>
    </div>
  )
}

function Crop({ view, light }: { view: CropView; light?: boolean }) {
  return (
    <span
      className={cn(
        "relative block h-[34px] w-[38px] overflow-hidden rounded-[5px] border border-solid border-line-3",
        light && "bg-foreground",
      )}
    >
      <img
        src={view.src}
        alt=""
        // 잘라 보기 자리 — 그림 좌표에서 나온 위치값
        style={{ left: view.left, top: view.top, width: view.width, height: view.height }}
        className="absolute block max-w-none object-cover"
      />
    </span>
  )
}

export function PrecisionPanel({ insight, roles }: { insight: MatchInsight; roles: ViewerRoles }) {
  const [open, setOpen] = React.useState(true)
  const [mode, setMode] = React.useState<OverlayMode>("overlay")
  const showShoe = mode !== "heat"
  const showHeat = mode !== "pairs"
  return (
    <aside
      data-plus
      data-precision
      aria-label="+α 정밀 대조"
      // 넓으면(상자 1120 이상) 시안처럼 오른쪽 칸 + 왼쪽 점선, 좁으면 SCAS 영역 아래로 내려 윗 점선 · 폭 720 까지
      className={cn(
        "grid max-w-[720px] content-start gap-[9px] border-t border-dashed border-ai-line pt-[10px]",
        "@min-[1120px]:max-w-none @min-[1120px]:border-t-0 @min-[1120px]:border-l @min-[1120px]:pt-0 @min-[1120px]:pl-[14px]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={AI_MARK}>● +α 정밀 대조</span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer border-none bg-transparent p-0"
        >
          <Chip variant="h19" className="text-[10.5px]">
            {open ? "덧붙임 · 접기 ▴" : "덧붙임 · 펼치기 ▾"}
          </Chip>
        </button>
      </div>
      {open ? (
        <>
          <div className="rounded-[8px] bg-panel-2 px-[9px] py-[7px] text-[11.5px] leading-[1.45] text-muted-foreground">
            1:1 정밀 대조는 <b className="text-fg-2">「대조」</b>(용의자 신발과 비교) 사건의 주 기능. 이 사건은 「{insight.processType}」이라{" "}
            <b className="text-fg-2">참고용</b>입니다.
          </div>

          <div className="grid gap-[6px] rounded-[8px] border border-solid border-ai-line bg-[linear-gradient(160deg,var(--t-ai-bg),transparent)] px-[9px] py-[7px]">
            <div className="flex items-center gap-[6px] text-[11.5px]">
              <LiveDot state="busy" label="AI 미리 대조" hideLabel />
              <b className="text-ai">AI가 미리 대조해 둠</b>
              <span className="ml-auto font-code text-[10px] text-dim">{insight.preparedAt}</span>
            </div>
            <div className="grid grid-cols-4 gap-[4px]">
              {insight.preStats.map(([k, v]) => (
                <span key={k} className="grid gap-[1px] rounded-[6px] bg-canvas/45 px-[6px] py-[4px]">
                  <span className="text-[9.5px] text-muted-foreground">{k}</span>
                  <b className="font-code text-[12.5px] text-foreground">{v}</b>
                </span>
              ))}
            </div>
          </div>

          <div>
            <Segmented
              items={MODE_ITEMS}
              value={mode}
              onValueChange={(v) => setMode(v as OverlayMode)}
              aria-label="정밀 대조 보기"
              className="flex w-full [&_button]:flex-1"
            />
            <div className="mt-[7px] grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[9px]">
              <span
                data-overlay-preview={mode}
                className="relative block h-[144px] w-[96px] overflow-hidden rounded-[10px] border border-solid border-border bg-canvas"
              >
                <img src={insight.overlayCrime} alt="현장 사진" className="absolute inset-0 block size-full object-cover" />
                {showShoe ? (
                  <img
                    src={insight.overlayShoe}
                    alt="신발 밑창 겹침"
                    // 투명도는 값(투명도 %)에서 나온 런타임 값
                    style={{ opacity: insight.overlayOpacity / 100 }}
                    className="absolute top-[5.33%] left-1/4 block h-[88%] w-1/2"
                  />
                ) : null}
                {showHeat ? (
                  <span className="pointer-events-none absolute top-[5.33%] left-1/4 h-[88%] w-1/2">
                    <HeatOverlay variant="match" />
                  </span>
                ) : null}
                <ScanOverlay active className="motion-safe:[animation-duration:3s]" />
              </span>
              <div className="grid gap-[6px] text-[11px] text-muted-foreground">
                <span>
                  투명도 <b className="font-code text-fg-2">{`${insight.overlayOpacity}%`}</b>
                </span>
                <span aria-hidden="true" className="relative h-[4px] rounded-[2px] bg-line-3">
                  <span className="absolute top-0 left-0 h-[4px] rounded-[2px] bg-ai" style={{ width: `${insight.overlayOpacity}%` }} />
                  <span
                    className="absolute top-[-5px] ml-[-6px] size-[13px] rounded-[50%] bg-foreground"
                    style={{ left: `${insight.overlayOpacity}%` }}
                  />
                </span>
                <span className="leading-[1.4]">Homography(각도·크기 맞춤) 뒤 겹침 · 붉을수록 근거가 몰린 곳</span>
                <span className="grid gap-[2px]">
                  <span className="h-[6px] rounded-[3px] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--t-heat-yellow)_25%,transparent),var(--t-warn),var(--t-danger))]" />
                  <span className="flex justify-between text-[9.5px] text-dim">
                    <span>약함</span>
                    <span>강함</span>
                  </span>
                </span>
                <span className="flex items-center gap-[5px] text-[10.5px]">
                  <i className="inline-block size-[12px] rounded-[50%] border-[1.5px] border-dashed border-danger-fg" />
                  현장 소실(비교 제외)
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-[6px] border-t border-solid border-line-2 pt-[6px]">
            <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-[8px]">
              <Gauge value={insight.confidence} />
              <div className="grid gap-[2px] text-[11px]">
                {insight.metrics.map(([k, v]) => (
                  <span key={k} className="flex justify-between gap-[6px]">
                    <span className="text-muted-foreground">{k}</span>
                    <b className="font-code text-ai">{v}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-[6px] text-[10.5px] text-muted-foreground">
              <AiTag>AI 의견 · 참고</AiTag>
              <span>{insight.opinion}</span>
            </div>
          </div>

          <div data-basis>
            <div className="mb-[2px] flex items-center gap-[5px] font-code text-[10px] font-semibold tracking-[0.16em] text-dim">
              근거 — 칸 수 · 도형 개수 · 각도
            </div>
            {insight.basis.map((r) => (
              <div
                key={r.zone}
                data-basis-zone={r.zone}
                className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-[7px] border-t border-solid border-line-2 py-[5px] text-[11.5px]"
              >
                <span className="flex items-center gap-[2px]">
                  <Crop view={r.crimeCrop} />
                  <span className={cn("text-[10px]", r.ok ? "text-ai" : "text-danger-fg")}>{r.ok ? "↔" : "≠"}</span>
                  <Crop view={r.shoeCrop} light />
                </span>
                <span className="grid min-w-0 gap-[2px]">
                  <span className="flex items-center gap-[6px]">
                    <b className="text-foreground">{r.zone}</b>
                    <span className="font-code text-[10px] text-dim">{`대응 ${r.pairs}`}</span>
                    <ConfidenceBar
                      value={r.score}
                      scale="unit"
                      threshold={0.5}
                      label={`${r.zone} 부위 점수`}
                      className={cn("flex-1 [&>span]:text-[10.5px] [&>span]:font-semibold", r.ok && "[&>span]:text-ai")}
                    />
                    <Chip variant={r.ok ? "green-h18" : "amber-h18"} className="h-[17px] px-[5px] text-[10px]">
                      {r.ok ? "일치" : "불일치"}
                    </Chip>
                  </span>
                  <span className="text-[10.5px] leading-[1.35] tracking-[-0.01em] text-fg-2">{r.why}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div data-role-notes className="grid gap-[4px] text-[11px] text-muted-foreground">
        {roles.analyst ? <span>감정관: 확인대상·그룹등록·감정서 첨부</span> : null}
        {roles.verifier ? <span>기술책임자: 읽기 전용(결재 참고)</span> : null}
        {roles.investigator ? <span>수사관: 이 팝업 없음 — 결재완료 감정서로만</span> : null}
      </div>
    </aside>
  )
}
