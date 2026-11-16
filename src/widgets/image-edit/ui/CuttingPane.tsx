import * as React from "react"

import type { ThresholdMode } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { AiProgress, AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Button, Field, Segmented } from "@/shared/ui/kit"
import { PaneHead } from "@/shared/ui/panel"

import type { ImageEditAccess } from "../model/access"
import { hasCuttingSide } from "../model/layout"
import type { ImageEditScreenProps, ImageEditTool } from "../model/types"
import { AiSidePanel } from "./AiSidePanel"
import { ScasButtonRow } from "./ScasButtonRow"

/**
 * 덧붙인 도구 — SCAS 버튼 뒤, 이 순서. 앞 셋은 시안 r2 도구 줄 이름(⬚ 자르기 · ⌖ 4점 각도 보정 · 📏 길이 측정),
 * 뒤 넷은 시안에 없는 지금 기능이라 1차 자리 그대로(spec §13-2). 그림 글자는 읽지 않는다(aria-hidden).
 */
const TOOLS: { tool: ImageEditTool; label: string; icon?: string }[] = [
  { tool: "crop", label: "자르기", icon: "⬚" },
  { tool: "calibrate", label: "4점 각도 보정", icon: "⌖" },
  { tool: "measure", label: "길이 측정", icon: "📏" },
  { tool: "background", label: "배경제거" },
  { tool: "inpaint", label: "접합장애물제거" },
  { tool: "threshold", label: "이진화" },
  { tool: "denoise", label: "노이즈제거" },
]

/** 이진화 5모드 — 지금 앱 `ThresholdControls` 라벨 그대로 */
const THRESHOLD_MODES: { value: ThresholdMode; label: string }[] = [
  { value: "standard", label: "이진(표준)" },
  { value: "standard_inv", label: "이진(반전)" },
  { value: "trunc", label: "절단" },
  { value: "tozero", label: "제로화" },
  { value: "tozero_inv", label: "제로화(반전)" },
]

const PRESSED = "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand)]"
const HINT = "text-[11.5px] text-muted-foreground"
/** 캔버스 위 꼬리표(시안 mono 10.5px 꼬리표) */
const TAG = "pointer-events-none absolute rounded-[5px] px-[7px] py-[2px] font-code text-[10.5px]"

const num = (v: string, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export type CuttingPaneProps = Omit<
  ImageEditScreenProps,
  "status" | "errorAt" | "onRetry" | "isAdmin" | "features" | "aprthngNo" | "viewerImage" | "adjustments" | "onAdjustmentsChange" | "onClose"
> & {
  /** 보는 사람이 할 수 있는 일 */
  access: ImageEditAccess
  /** 시안 r2 신규 요소를 보일까 */
  plus: boolean
}

/** 도구별 설정 줄(지금 앱 EditToolbar 위줄 자리). `bare` = 사건 창 안 — 테두리 상자 없이 한 줄 */
function ToolOptions(p: CuttingPaneProps & { bare?: boolean }) {
  const { activeTool, denoiseState } = p
  const { canEdit } = p.access
  const showDenoise = activeTool === "denoise" || denoiseState !== "idle"
  let body: React.ReactNode = null
  switch (activeTool) {
    case "crop":
      body = <span className={HINT}>자르기 틀을 맞춘 뒤 「확인」을 누르면 잘립니다.</span>
      break
    case "calibrate":
      body = (
        <>
          <span className={HINT}>비스듬한 사진의 네 모서리 점을 찍은 뒤 「적용」을 누르면 반듯하게 폅니다.</span>
          <Button size="sm" className="ml-auto" disabled={!canEdit} onClick={p.onApplyCalibration}>
            적용
          </Button>
        </>
      )
      break
    case "measure":
      body = (
        <>
          <span className={HINT}>P1 · P2 = 1 cm 기준, P3 · P4 = 잴 길이</span>
          <span className="ml-auto font-code text-[12px] text-fg-2">
            {p.measureCm == null ? "P3 · P4를 찍으면 길이가 나옵니다" : `실측 ${p.measureCm.toFixed(1)} cm`}
          </span>
        </>
      )
      break
    case "background":
    case "inpaint": {
      const tool = activeTool
      body = (
        <>
          <span className={HINT}>
            {tool === "background"
              ? "다각형으로 남길 족적 영역을 고른 뒤 「적용」 — 바깥 배경을 지웁니다."
              : "다각형으로 이어 붙은 장애물을 고른 뒤 「적용」 — 그 자리를 메웁니다."}
          </span>
          <Button size="sm" className="ml-auto" disabled={!canEdit} onClick={() => p.onApplyPolygon(tool)}>
            적용
          </Button>
        </>
      )
      break
    }
    case "threshold":
      body = (
        <>
          <Segmented
            aria-label="이진화 모드"
            items={THRESHOLD_MODES}
            value={p.thresholdMode}
            onValueChange={(v) => p.onThresholdModeChange(v as ThresholdMode)}
            className="[&_button]:px-[9px] [&_button]:py-[3px] [&_button]:text-[11.5px]"
          />
          <span className={HINT}>임계값</span>
          <Field
            type="number"
            variant="mono"
            min={0}
            max={255}
            aria-label="이진화 임계값"
            value={p.threshold}
            readOnly={!canEdit}
            onChange={(e) => p.onThresholdChange(Math.min(255, Math.max(0, num(e.target.value, p.threshold))))}
            className="w-[64px]"
          />
          <Button size="sm" className="ml-auto" disabled={!canEdit} onClick={p.onApplyThreshold}>
            적용
          </Button>
        </>
      )
      break
    default:
      body = null
  }
  if (!body && !showDenoise) return null
  return (
    <div
      role="group"
      aria-label="도구 설정"
      className={cn(
        "flex flex-col gap-[6px]",
        p.bare ? "shrink-0 px-[2px]" : "rounded-[8px] border border-solid border-line-2 bg-panel-2 px-[10px] py-[6px]"
      )}
    >
      {body && activeTool !== "denoise" ? <div className="flex flex-wrap items-center gap-[8px]">{body}</div> : null}
      {showDenoise ? (
        <div className="flex flex-wrap items-center gap-[8px]">
          <AiTag />
          <span className={HINT}>노이즈제거 — 서버 AI가 잡음을 지웁니다(가장 오래 걸림).</span>
          {denoiseState !== "idle" ? (
            <AiProgress state={denoiseState === "running" ? "running" : denoiseState === "done" ? "done" : "failed"} label="노이즈제거" className="min-w-[140px] flex-1" />
          ) : null}
          <Button
            size="sm"
            variant="ai"
            className="ml-auto"
            disabled={!canEdit || denoiseState === "running"}
            onClick={p.onRunDenoise}
          >
            {denoiseState === "failed" ? "다시 실행" : "실행"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString("ko-KR")

/** 좌표 캔버스 칸(슬롯) + 위 꼬리표. 겹 장식은 모두 pointer-events-none. 크기는 부르는 쪽이 `className` 으로 */
function CanvasBox({ p, className }: { p: CuttingPaneProps; className: string }) {
  const tags = p.plus ? p.canvasTags : undefined
  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas", className)}>
      {p.canvasSlot}
      <ScanOverlay active={p.denoiseState === "running"} />
      {p.plus ? (
        // 시안: A 캔버스는 AI가 족적 축을 읽는 동안 4.5초 주기로 훑는다
        <ScanOverlay active data-plus="" className="motion-safe:[animation-duration:4.5s]" />
      ) : null}
      {tags ? (
        <>
          <span data-plus="" className={cn(TAG, "top-[10px] left-[10px] bg-warn-bg/90 text-warn")}>
            📏 자 인식 · {tags.ruler}
          </span>
          <span data-plus="" className={cn(TAG, "top-[10px] right-[10px] bg-ai-bg/90 text-ai")}>
            AI · 족적 축 {tags.axis}
          </span>
        </>
      ) : null}
      <span className={cn(TAG, "left-[10px] bg-canvas/90 text-fg-2", tags ? "top-[36px]" : "top-[10px]")}>
        원본 {fmt(p.originalSize.width)} × {fmt(p.originalSize.height)} · {p.zoom}%
      </span>
    </div>
  )
}

/** 사건 창 도구 막대 앞 흐린 이름(「확대」 · 「회전」) */
const BAR_LABEL = "text-[11px] text-muted-foreground"

/** SCAS −[확대]+ · 좌[각도]우 두 묶음. `compact` = 사건 창 한 줄 도구 막대(칸 높이를 단추 sm 24 에 맞춤 · 앞 흐린 이름) */
function ZoomRotate({ p, compact = false }: { p: CuttingPaneProps; compact?: boolean }) {
  const { canEdit } = p.access
  const field = compact ? "h-[24px] w-[54px] px-[4px] text-center" : "w-[56px] justify-center"
  const variant = compact ? "mono-sm" : "mono"
  return (
    <>
      <span className="inline-flex items-center gap-[3px]">
        {compact ? <span className={cn(BAR_LABEL, "mr-[3px]")}>확대</span> : null}
        <Button size="sm" aria-label="축소" onClick={() => p.onZoomChange(Math.max(10, p.zoom - 10))}>
          −
        </Button>
        <Field
          type="number"
          variant={variant}
          aria-label="확대율"
          value={p.zoom}
          onChange={(e) => p.onZoomChange(num(e.target.value, p.zoom))}
          className={field}
        />
        <Button size="sm" aria-label="확대" onClick={() => p.onZoomChange(p.zoom + 10)}>
          +
        </Button>
      </span>
      <span className="inline-flex items-center gap-[3px]">
        {compact ? <span className={cn(BAR_LABEL, "mr-[3px]")}>회전</span> : null}
        <Button size="sm" disabled={!canEdit} onClick={() => p.onRotate("left")}>
          좌
        </Button>
        <Field
          type="number"
          variant={variant}
          aria-label="회전 각도"
          value={p.rotateStep}
          readOnly={!canEdit}
          onChange={(e) => p.onRotateStepChange(num(e.target.value, p.rotateStep))}
          className={field}
        />
        <Button size="sm" disabled={!canEdit} onClick={() => p.onRotate("right")}>
          우
        </Button>
      </span>
    </>
  )
}

/** SCAS 취소 · 확인 · 저장(저장만 채움) */
function SaveButtons({ p }: { p: CuttingPaneProps }) {
  return (
    <>
      <Button size="sm" onClick={p.onCancel}>
        취소
      </Button>
      <Button size="sm" disabled={!p.access.canEdit} onClick={p.onConfirm}>
        확인
      </Button>
      <Button size="sm" variant="pri" disabled={!p.access.canSave} onClick={p.onSave}>
        저장
      </Button>
    </>
  )
}

/** 덧붙인 도구 단추들(SCAS 버튼 뒤, 표 순서). `block` = 세로 칸에서 폭 꽉 · 왼쪽 맞춤 */
function ToolButtons({ p, block = false }: { p: CuttingPaneProps; block?: boolean }) {
  const { canEdit } = p.access
  const wide = block ? "w-full justify-start" : undefined
  return (
    <>
      {TOOLS.map(({ tool, label, icon }) => {
        const on = p.activeTool === tool
        return (
          <React.Fragment key={tool}>
            <Button
              size="sm"
              aria-pressed={on}
              disabled={!canEdit}
              onClick={() => p.onToolChange(on ? null : tool)}
              className={cn(wide, on && PRESSED)}
            >
              {icon ? <span aria-hidden="true">{icon}</span> : null}
              {label}
            </Button>
            {tool === "crop" && p.plus ? (
              // 시안 「↻ 회전 손잡이」 — 자르기 틀 위 손잡이를 따로 켜는 신규 버튼(동작 없음)
              <Button size="sm" data-plus="" disabled={!canEdit} onClick={() => p.onPlusAction?.("회전 손잡이")} className={wide}>
                <span aria-hidden="true">↻</span>회전 손잡이
              </Button>
            ) : null}
          </React.Fragment>
        )
      })}
    </>
  )
}

/** SCAS 아래 버튼 줄(처음상태 … 상하반전). 이력 칸이 있으면 되돌리기는 이력 머리로 간다(시안) */
function BottomRow({ p, className }: { p: CuttingPaneProps; className?: string }) {
  const { canEdit } = p.access
  const undoInHistory = p.plus && p.editHistory !== undefined
  return (
    <ScasButtonRow
      label="SCAS 아래 버튼 줄"
      locked={!canEdit}
      actions={{ 처음상태: p.onRestore }}
      highlight={p.plus && p.recommendFlip ? "좌우반전" : undefined}
      className={className}
      trailing={
        undoInHistory ? undefined : (
          <Button size="sm" disabled={!canEdit || !p.canUndo} onClick={p.onUndo}>
            되돌리기
          </Button>
        )
      }
    />
  )
}

/** 「저장함」 안내 글(무엇이 저장되나) */
const saveNote = (p: CuttingPaneProps) =>
  p.plus && p.originalHash
    ? "잘린 사진이 사건 이미지가 되고, 받은 원본은 해시와 함께 따로 보관됩니다(되돌리기 가능)."
    : "자르고 돌린 사진이 사건 이미지로 저장됩니다(받은 원본은 따로 보관)."

/**
 * 사건 창 안 이미지 커팅(11/17 사용자 「컴팩트하면서 고급지게」) — 같은 상태 · 핸들러, 배치만 다르다.
 * 머리(PaneHead) 오른쪽 끝 = 취소 · 확인 · 저장, 그 아래 한 줄 = −[확대]+ · 좌[각도]우 · 맞춤 · 100%,
 * 본문 = 왼쪽 세로 도구 칸 | 캔버스(남은 높이 꽉), 바닥 = SCAS 아래 버튼 줄. 점선 상자 · 색 띠 설명은 없애고 안내는 ⓘ · 회색 한 줄.
 */
export function CuttingWindow(p: CuttingPaneProps) {
  return (
    <section aria-label="이미지 커팅" className="flex min-h-0 min-w-0 flex-col gap-[8px]">
      <PaneHead
        title="이미지 커팅"
        tip={`저장함 — ${saveNote(p)}`}
        sub={p.access.canEdit ? `원본 ${fmt(p.originalSize.width)} × ${fmt(p.originalSize.height)}` : "보기 전용 — 편집 · 저장은 사건 조회 또는 사건 등록 권한"}
        end={<SaveButtons p={p} />}
      />
      <div role="group" aria-label="보기 · 회전" className="flex shrink-0 flex-wrap items-center gap-x-[10px] gap-y-[4px]">
        <ZoomRotate p={p} compact />
        <span aria-hidden="true" className="h-[16px] w-px bg-line-3" />
        <span className="inline-flex gap-[4px]">
          <Button size="sm" onClick={p.onFit}>
            맞춤
          </Button>
          <Button size="sm" onClick={p.onActualSize}>
            100%
          </Button>
        </span>
      </div>
      <ToolOptions {...p} bare />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,116px)_minmax(0,1fr)] gap-[8px]">
        <div role="group" aria-label="도구" className="flex min-h-0 flex-col gap-[4px] overflow-y-auto">
          <ToolButtons p={p} block />
        </div>
        <CanvasBox p={p} className="h-full" />
      </div>
      <BottomRow p={p} className="shrink-0 justify-start" />
    </section>
  )
}

/** A — 1차 이미지 커팅(저장함). SCAS 이미지 커팅 창의 버튼 자리 그대로 + 도구 줄 덧붙임 + (r2) 오른쪽 칸 */
export function CuttingPane(p: CuttingPaneProps) {
  const { canEdit } = p.access
  const hasSide = hasCuttingSide(p)
  const canvas = <CanvasBox p={p} className="h-[536px]" />

  return (
    <section aria-label="이미지 커팅" className="flex min-w-0 flex-col gap-[8px]">
      {/* SCAS 위 버튼 줄: −[확대]+ 좌[각도]우 … 취소 · 확인 · 저장 */}
      <div className="flex flex-wrap items-center gap-[10px]">
        <ZoomRotate p={p} />
        <span className="ml-auto inline-flex gap-[4px]">
          <SaveButtons p={p} />
        </span>
      </div>

      {/* 덧붙인 도구 줄(SCAS 버튼 뒤) */}
      <div className="flex flex-wrap items-center gap-[4px] rounded-[8px] border border-dashed border-line-3 px-[6px] py-[4px]">
        <span className="mr-[2px] text-[11px] text-dim">도구(덧붙임)</span>
        <ToolButtons p={p} />
        <span aria-hidden="true" className="mx-[4px] h-[18px] w-px bg-line-3" />
        <Button size="sm" onClick={p.onFit}>
          맞춤
        </Button>
        <Button size="sm" onClick={p.onActualSize}>
          100%
        </Button>
      </div>

      <ToolOptions {...p} />

      {hasSide ? (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_186px] gap-[10px]">
          {canvas}
          <AiSidePanel
            suggestions={p.aiSuggestions}
            onApplySuggestion={p.onApplyAiSuggestion}
            beforeAfter={p.beforeAfter}
            history={p.editHistory}
            originalHash={p.originalHash}
            canUndo={p.canUndo}
            onUndo={p.onUndo}
            canEdit={canEdit}
          />
        </div>
      ) : (
        canvas
      )}

      <BottomRow p={p} />

      <p className="flex items-center gap-[8px] rounded-[8px] border border-solid border-ok-line bg-ok-bg px-[10px] py-[7px] text-[11.5px] text-ok-fg">
        <span>
          <b>저장함</b> · {saveNote(p)}
        </span>
      </p>
    </section>
  )
}
