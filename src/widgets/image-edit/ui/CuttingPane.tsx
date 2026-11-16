import * as React from "react"
import { Bandage, Contrast, Crop, Eraser, RotateCw, Ruler, Scan, Sparkles, type LucideIcon } from "lucide-react"

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
 * 사건 창 도구 칸 한 줄의 생김새(11/17 사용자 「각각 기능들 좀더 잘 드러나게 … 장황하고 정렬도 뭘 해야할지 모르겟고」):
 * 선 아이콘 + 이름 + 한 줄 쓰임새, 묶음 둘(다듬기 · 정리). 이름은 접근성 이름 그대로(쓰임새는 설명으로만).
 */
const WINDOW_TOOLS: Record<ImageEditTool | "handle", { icon: LucideIcon; desc: string }> = {
  crop: { icon: Crop, desc: "틀 맞춰 잘라내기" },
  handle: { icon: RotateCw, desc: "틀 위 손잡이로 돌리기" },
  calibrate: { icon: Scan, desc: "비스듬한 사진 반듯하게" },
  measure: { icon: Ruler, desc: "1 cm 기준으로 실측" },
  background: { icon: Eraser, desc: "족적 밖 배경 지우기" },
  inpaint: { icon: Bandage, desc: "붙은 장애물 메우기" },
  threshold: { icon: Contrast, desc: "흑백 두 값으로" },
  denoise: { icon: Sparkles, desc: "AI 가 잡음 지우기" },
}
const TOOL_GROUPS: { name: string; tools: ImageEditTool[] }[] = [
  { name: "다듬기", tools: ["crop", "calibrate", "measure"] },
  { name: "정리", tools: ["background", "inpaint", "threshold", "denoise"] },
]
const TOOL_LABEL = Object.fromEntries(TOOLS.map((t) => [t.tool, t.label])) as Record<ImageEditTool, string>

/** 사건 창 도구 칸 한 줄(아이콘 칸 · 이름 · 쓰임새). 고른 것 = 흰 바탕 + 왼쪽 brand 2px + 아이콘 칸 brand */
function RailTool({
  kind,
  label,
  on,
  disabled,
  onClick,
  plusMark,
}: {
  kind: ImageEditTool | "handle"
  label: string
  on: boolean
  disabled: boolean
  onClick: () => void
  plusMark?: boolean
}) {
  const { icon: Icon, desc } = WINDOW_TOOLS[kind]
  const descId = React.useId()
  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={descId}
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      {...(plusMark ? { "data-plus": "" } : {})}
      className={cn(
        "m-0 flex w-full cursor-pointer items-center gap-[9px] rounded-[8px] border-0 bg-transparent px-[7px] py-[6px] text-left transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand",
        "disabled:cursor-default disabled:opacity-45",
        on ? "bg-panel [box-shadow:inset_2px_0_0_var(--t-brand),0_1px_2px_var(--t-panel-drop)]" : "hover:bg-panel/70"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[28px] flex-none place-items-center rounded-[7px] border border-solid",
          on ? "border-brand-line bg-brand-bg text-brand-3" : "border-border bg-panel text-fg-2"
        )}
      >
        <Icon className="size-[15px]" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-col">
        <b className={cn("flex items-center gap-[5px] text-[12px] font-bold", on ? "text-brand-3" : "text-foreground")}>
          {label}
          {kind === "denoise" ? <AiTag /> : null}
        </b>
        <small id={descId} className="truncate text-[10.5px] text-muted-foreground">
          {desc}
        </small>
      </span>
    </button>
  )
}

/** 사건 창 왼쪽 도구 칸(옅은 회색 판) — 묶음 이름 + 줄들 */
function ToolRail({ p }: { p: CuttingPaneProps }) {
  const { canEdit } = p.access
  return (
    <div
      role="group"
      aria-label="도구"
      className="flex min-h-0 flex-col gap-[12px] overflow-y-auto border-0 border-r border-solid border-border bg-panel-2 px-[8px] py-[10px]"
    >
      {TOOL_GROUPS.map((g) => (
        <div key={g.name} className="flex flex-col gap-[2px]">
          <p className="m-0 px-[7px] pb-[3px] text-[10.5px] font-bold tracking-[0.04em] text-muted-foreground">{g.name}</p>
          {g.tools.map((tool) => {
            const on = p.activeTool === tool
            return (
              <React.Fragment key={tool}>
                <RailTool kind={tool} label={TOOL_LABEL[tool]} on={on} disabled={!canEdit} onClick={() => p.onToolChange(on ? null : tool)} />
                {tool === "crop" && p.plus ? (
                  // 시안 「↻ 회전 손잡이」 — 자르기 틀 위 손잡이를 따로 켜는 신규 버튼(동작 없음)
                  <RailTool kind="handle" label="회전 손잡이" on={false} disabled={!canEdit} onClick={() => p.onPlusAction?.("회전 손잡이")} plusMark />
                ) : null}
              </React.Fragment>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** 작업대 위 · 아래 막대(흰 띠 + 가는 선) */
const STAGE_BAR = "flex shrink-0 flex-wrap items-center gap-x-[10px] gap-y-[4px] bg-panel px-[12px] py-[6px]"

/**
 * 사건 창 안 이미지 커팅(11/17 사용자 「컴팩트하면서 고급지게」 → 「각각 기능들 좀더 잘 드러나게 … 좌 중앙 우 느낌이 다르면 구분선이나
 * 좀 차이를 줘. 너무 다 하얀 배경이니 하나 더 암보여. 그렇다고 알록달록은 싫고」) — 같은 상태 · 핸들러, 배치만 다르다.
 * 머리(PaneHead) 오른쪽 끝 = 취소 · 확인 · 저장. 아래 한 판을 세 결로 나눈다:
 *   왼쪽 도구 칸(옅은 회색 panel-2 · 오른쪽 선) — 묶음(다듬기 · 정리) + 아이콘 · 이름 · 쓰임새 한 줄
 *   가운데 작업대(한 단 짙은 회색 panel-3) — 위 흰 막대(보기 · 회전 | 지금 도구 + 그 설정) · 캔버스(남은 높이 꽉) · 아래 흰 막대(빠른 보정 = SCAS 아래 버튼 줄)
 *   오른쪽 보조 칸(흰 바탕 · 왼쪽 선)은 부르는 쪽(ImageEditScreen)이 둔다.
 */
export function CuttingWindow(p: CuttingPaneProps) {
  const tool = p.activeTool
  const ToolIcon = tool ? WINDOW_TOOLS[tool].icon : null
  return (
    <section aria-label="이미지 커팅" className="flex min-h-0 min-w-0 flex-1 flex-col gap-[8px]">
      <PaneHead
        title="이미지 커팅"
        tip={`저장함 — ${saveNote(p)}`}
        sub={p.access.canEdit ? `원본 ${fmt(p.originalSize.width)} × ${fmt(p.originalSize.height)}` : "보기 전용 — 편집 · 저장은 사건 조회 또는 사건 등록 권한"}
        end={<SaveButtons p={p} />}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[164px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-solid border-border min-[1400px]:grid-cols-[184px_minmax(0,1fr)]">
        <ToolRail p={p} />
        <div className="flex min-h-0 min-w-0 flex-col bg-panel-3">
          <div className={cn(STAGE_BAR, "border-0 border-b border-solid border-border")}>
            <div role="group" aria-label="보기 · 회전" className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
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
          </div>
          {/* 지금 도구 + 그 설정(고른 도구가 없으면 한 줄 안내) */}
          <div className={cn(STAGE_BAR, "min-h-[36px] border-0 border-b border-solid border-border")}>
            {tool && ToolIcon ? (
              <>
                <b className="inline-flex shrink-0 items-center gap-[6px] text-[12px] font-bold text-brand-3">
                  <ToolIcon aria-hidden="true" className="size-[14px]" strokeWidth={2} />
                  {TOOL_LABEL[tool]}
                </b>
                <span aria-hidden="true" className="h-[14px] w-px bg-line-3" />
                <div className="min-w-0 flex-1">
                  <ToolOptions {...p} bare />
                </div>
              </>
            ) : (
              <span className={HINT}>왼쪽에서 도구를 고르면 여기에서 설정합니다.</span>
            )}
          </div>
          <div className="min-h-0 flex-1 p-[12px]">
            <CanvasBox p={p} className="h-full [box-shadow:0_1px_3px_var(--t-panel-drop)]" />
          </div>
          <div className={cn(STAGE_BAR, "border-0 border-t border-solid border-border")}>
            <span className="shrink-0 text-[10.5px] font-bold tracking-[0.04em] text-muted-foreground">빠른 보정</span>
            <BottomRow p={p} className="justify-start" />
          </div>
        </div>
      </div>
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
