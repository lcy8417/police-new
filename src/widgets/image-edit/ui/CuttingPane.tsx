import * as React from "react"

import type { ThresholdMode } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { AiProgress, AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Button, Field, Segmented } from "@/shared/ui/kit"

import type { ImageEditScreenProps, ImageEditTool } from "../model/types"
import { ScasButtonRow } from "./ScasButtonRow"

/** 덧붙인 도구 — SCAS 버튼 뒤, 이 순서(브리프 표) */
const TOOLS: { tool: ImageEditTool; label: string }[] = [
  { tool: "crop", label: "크롭" },
  { tool: "calibrate", label: "각도보정" },
  { tool: "measure", label: "길이측정" },
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

const num = (v: string, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

type CuttingPaneProps = Omit<
  ImageEditScreenProps,
  "status" | "errorAt" | "onRetry" | "isAdmin" | "features" | "aprthngNo" | "viewerImage" | "adjustments" | "onAdjustmentsChange" | "onClose"
> & {
  /** 편집 · 저장 권한 */
  canEdit: boolean
}

/** 도구별 설정 줄(지금 앱 EditToolbar 위줄 자리) */
function ToolOptions(p: CuttingPaneProps) {
  const { activeTool, canEdit, denoiseState } = p
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
    <div className="flex flex-col gap-[6px] rounded-[8px] border border-solid border-line-2 bg-panel-2 px-[10px] py-[6px]">
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

/** A — 1차 이미지 커팅(저장함). SCAS 이미지 커팅 창의 버튼 자리 그대로 + 도구 줄 덧붙임 */
export function CuttingPane(p: CuttingPaneProps) {
  const { canEdit } = p
  const fmt = (n: number) => n.toLocaleString("ko-KR")
  return (
    <section aria-label="이미지 커팅" className="flex min-w-0 flex-col gap-[8px]">
      {/* SCAS 위 버튼 줄: −[확대]+ 좌[각도]우 … 취소 · 확인 · 저장 */}
      <div className="flex flex-wrap items-center gap-[10px]">
        <span className="inline-flex items-center gap-[3px]">
          <Button size="sm" aria-label="축소" onClick={() => p.onZoomChange(Math.max(10, p.zoom - 10))}>
            −
          </Button>
          <Field
            type="number"
            variant="mono"
            aria-label="확대율"
            value={p.zoom}
            onChange={(e) => p.onZoomChange(num(e.target.value, p.zoom))}
            className="w-[56px] justify-center"
          />
          <Button size="sm" aria-label="확대" onClick={() => p.onZoomChange(p.zoom + 10)}>
            +
          </Button>
        </span>
        <span className="inline-flex items-center gap-[3px]">
          <Button size="sm" disabled={!canEdit} onClick={() => p.onRotate("left")}>
            좌
          </Button>
          <Field
            type="number"
            variant="mono"
            aria-label="회전 각도"
            value={p.rotateStep}
            readOnly={!canEdit}
            onChange={(e) => p.onRotateStepChange(num(e.target.value, p.rotateStep))}
            className="w-[56px] justify-center"
          />
          <Button size="sm" disabled={!canEdit} onClick={() => p.onRotate("right")}>
            우
          </Button>
        </span>
        <span className="ml-auto inline-flex gap-[4px]">
          <Button size="sm" onClick={p.onCancel}>
            취소
          </Button>
          <Button size="sm" disabled={!canEdit} onClick={p.onConfirm}>
            확인
          </Button>
          <Button size="sm" variant="pri" disabled={!canEdit} onClick={p.onSave}>
            저장
          </Button>
        </span>
      </div>

      {/* 덧붙인 도구 줄(SCAS 버튼 뒤) */}
      <div className="flex flex-wrap items-center gap-[4px] rounded-[8px] border border-dashed border-line-3 px-[6px] py-[4px]">
        <span className="mr-[2px] text-[11px] text-dim">도구(덧붙임)</span>
        {TOOLS.map(({ tool, label }) => {
          const on = p.activeTool === tool
          return (
            <Button
              key={tool}
              size="sm"
              aria-pressed={on}
              disabled={!canEdit}
              onClick={() => p.onToolChange(on ? null : tool)}
              className={cn(on && PRESSED)}
            >
              {label}
            </Button>
          )
        })}
        <span aria-hidden="true" className="mx-[4px] h-[18px] w-px bg-line-3" />
        <Button size="sm" onClick={p.onFit}>
          맞춤
        </Button>
        <Button size="sm" onClick={p.onActualSize}>
          100%
        </Button>
      </div>

      <ToolOptions {...p} />

      {/* 좌표 캔버스 자리(슬롯). 겹 장식은 모두 pointer-events-none */}
      <div className="relative h-[536px] min-w-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas">
        {p.canvasSlot}
        <ScanOverlay active={p.denoiseState === "running"} />
        <span className="pointer-events-none absolute top-[10px] left-[10px] rounded-[5px] bg-canvas/90 px-[7px] py-[2px] font-code text-[10.5px] text-fg-2">
          원본 {fmt(p.originalSize.width)} × {fmt(p.originalSize.height)} · {p.zoom}%
        </span>
      </div>

      <ScasButtonRow
        label="SCAS 아래 버튼 줄"
        locked={!canEdit}
        actions={{ 처음상태: p.onRestore }}
        trailing={
          <Button size="sm" disabled={!canEdit || !p.canUndo} onClick={p.onUndo}>
            되돌리기
          </Button>
        }
      />

      <p className="flex items-center gap-[8px] rounded-[8px] border border-solid border-ok-line bg-ok-bg px-[10px] py-[7px] text-[11.5px] text-ok-fg">
        <b>저장함</b> · 자르고 돌린 사진이 사건 이미지로 저장됩니다(받은 원본은 따로 보관).
      </p>
    </section>
  )
}
