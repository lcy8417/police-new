import * as React from "react"
import { Bandage, Check, Contrast, Crop, Eraser, Eye, RotateCw, Ruler, Save, Scan, Sparkles, Undo2, X, type LucideIcon } from "lucide-react"

import type { ThresholdMode } from "@/shared/lib"
import { cn } from "@/shared/lib/utils"
import { AiProgress, AiTag, ScanOverlay } from "@/shared/ui/ai"
import { Button, Field, Segmented, WorkbenchButton } from "@/shared/ui/kit"
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

/**
 * 도구별 설정 줄(지금 앱 EditToolbar 위줄 자리). `bare` = 사건 창 안 — 테두리 상자 없이 한 줄,
 * `quiet` = 쓰임새 문장을 지금 도구 막대가 이미 말하므로 안내 문장은 빼고 조작만
 */
function ToolOptions(p: CuttingPaneProps & { bare?: boolean; quiet?: boolean }) {
  const { activeTool, denoiseState } = p
  const { canEdit } = p.access
  const showDenoise = activeTool === "denoise" || denoiseState !== "idle"
  const say = (text: string) => (p.quiet ? null : <span className={HINT}>{text}</span>)
  let body: React.ReactNode = null
  switch (activeTool) {
    case "crop":
      body = say("자르기 틀을 맞춘 뒤 「확인」을 누르면 잘립니다.")
      break
    case "calibrate":
      body = (
        <>
          {say("비스듬한 사진의 네 모서리 점을 찍은 뒤 「적용」을 누르면 반듯하게 폅니다.")}
          <span className="ml-auto inline-flex">
            <BarButton compact={!!p.bare} disabled={!canEdit} onClick={p.onApplyCalibration}>
              적용
            </BarButton>
          </span>
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
          {say(
            tool === "background"
              ? "다각형으로 남길 족적 영역을 고른 뒤 「적용」 — 바깥 배경을 지웁니다."
              : "다각형으로 이어 붙은 장애물을 고른 뒤 「적용」 — 그 자리를 메웁니다."
          )}
          <span className="ml-auto inline-flex">
            <BarButton compact={!!p.bare} disabled={!canEdit} onClick={() => p.onApplyPolygon(tool)}>
              적용
            </BarButton>
          </span>
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
          <span className="ml-auto inline-flex">
            <BarButton compact={!!p.bare} disabled={!canEdit} onClick={p.onApplyThreshold}>
              적용
            </BarButton>
          </span>
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
          {say("노이즈제거 — 서버 AI가 잡음을 지웁니다(가장 오래 걸림).")}
          {denoiseState !== "idle" ? (
            <AiProgress state={denoiseState === "running" ? "running" : denoiseState === "done" ? "done" : "failed"} label="노이즈제거" className="min-w-[140px] flex-1" />
          ) : null}
          {p.bare ? (
            <WorkbenchButton
              size="sm"
              variant="soft"
              icon={Sparkles}
              className="ml-auto"
              disabled={!canEdit || denoiseState === "running"}
              onClick={p.onRunDenoise}
            >
              {denoiseState === "failed" ? "다시 실행" : "실행"}
            </WorkbenchButton>
          ) : (
            <Button
              size="sm"
              variant="ai"
              className="ml-auto"
              disabled={!canEdit || denoiseState === "running"}
              onClick={p.onRunDenoise}
            >
              {denoiseState === "failed" ? "다시 실행" : "실행"}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString("ko-KR")

/** 좌표 캔버스 칸(슬롯) + 위 꼬리표. 겹 장식은 모두 pointer-events-none. 크기는 부르는 쪽이 `className` 으로 */
function CanvasBox({ p, className, inWindow = false }: { p: CuttingPaneProps; className: string; inWindow?: boolean }) {
  // 사건 창(11/17 「1차 편집만 · AI 제안 빼」): AI 가 실제로 일할 때(노이즈제거)만 훑기 — 늘 도는 훑기 · AI 족적 축 꼬리표는 그리지 않는다(1회차 검수)
  const tags = p.plus && !inWindow ? p.canvasTags : undefined
  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-[10px] border border-solid border-border bg-canvas", className)}>
      {p.canvasSlot}
      <ScanOverlay active={p.denoiseState === "running"} />
      {p.plus && !inWindow ? (
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

interface BarButtonProps {
  /** 사건 창(R6) = 작업판 단추 soft sm, 아니면 SCAS 단추 그대로 */
  compact: boolean
  label?: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function BarButton({ compact, label, disabled, onClick, children }: BarButtonProps) {
  return compact ? (
    <WorkbenchButton size="sm" variant="soft" aria-label={label} disabled={disabled} onClick={onClick} className="min-w-[24px] justify-center px-[6px]">
      {children}
    </WorkbenchButton>
  ) : (
    <Button size="sm" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  )
}

/** SCAS −[확대]+ · 좌[각도]우 두 묶음. `compact` = 사건 창 한 줄 도구 막대(칸 높이를 단추 sm 24 에 맞춤 · 앞 흐린 이름) */
function ZoomRotate({ p, compact = false }: { p: CuttingPaneProps; compact?: boolean }) {
  const { canEdit } = p.access
  const field = compact ? "h-[24px] w-[54px] px-[4px] text-center" : "w-[56px] justify-center"
  const variant = compact ? "mono-sm" : "mono"
  return (
    <>
      <span className="inline-flex items-center gap-[3px]">
        {compact ? <span className={cn(BAR_LABEL, "mr-[3px]")}>확대</span> : null}
        <BarButton compact={compact} label="축소" onClick={() => p.onZoomChange(Math.max(10, p.zoom - 10))}>
          −
        </BarButton>
        <Field
          type="number"
          variant={variant}
          aria-label="확대율"
          value={p.zoom}
          onChange={(e) => p.onZoomChange(num(e.target.value, p.zoom))}
          className={field}
        />
        <BarButton compact={compact} label="확대" onClick={() => p.onZoomChange(p.zoom + 10)}>
          +
        </BarButton>
      </span>
      <span className="inline-flex items-center gap-[3px]">
        {compact ? <span className={cn(BAR_LABEL, "mr-[3px]")}>회전</span> : null}
        <BarButton compact={compact} disabled={!canEdit} onClick={() => p.onRotate("left")}>
          좌
        </BarButton>
        <Field
          type="number"
          variant={variant}
          aria-label="회전 각도"
          value={p.rotateStep}
          readOnly={!canEdit}
          onChange={(e) => p.onRotateStepChange(num(e.target.value, p.rotateStep))}
          className={field}
        />
        <BarButton compact={compact} disabled={!canEdit} onClick={() => p.onRotate("right")}>
          우
        </BarButton>
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
function BottomRow({ p, className, workbench = false }: { p: CuttingPaneProps; className?: string; workbench?: boolean }) {
  const { canEdit } = p.access
  const undoInHistory = p.plus && p.editHistory !== undefined
  return (
    <ScasButtonRow
      label="SCAS 아래 버튼 줄"
      locked={!canEdit}
      actions={{ 처음상태: p.onRestore }}
      highlight={p.plus && p.recommendFlip ? "좌우반전" : undefined}
      workbench={workbench}
      className={className}
      trailing={
        undoInHistory ? undefined : workbench ? (
          <WorkbenchButton size="sm" variant="ghost" icon={Undo2} disabled={!canEdit || !p.canUndo} onClick={p.onUndo}>
            되돌리기
          </WorkbenchButton>
        ) : (
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
 * 사건 창 도구(11/17 사용자 「각각 기능들 좀더 잘 드러나게」 → 「옆에 클릭 선 말고 좀더 고급지고 전문적 느낌으로. 지금 너무 아카데믹한」):
 * 도구 칸은 아이콘 타일(아이콘 + 짧은 이름)만, 쓰임새는 지금 도구 막대와 마우스 설명으로. 이름(접근성)은 원래 이름 그대로.
 */
const WINDOW_TOOLS: Record<ImageEditTool | "handle", { icon: LucideIcon; short: string; desc: string }> = {
  crop: { icon: Crop, short: "자르기", desc: "틀을 맞춘 뒤 「확인」으로 잘라냅니다" },
  handle: { icon: RotateCw, short: "손잡이", desc: "자르기 틀 위 손잡이로 돌립니다" },
  calibrate: { icon: Scan, short: "4점 보정", desc: "비스듬한 사진을 네 점으로 반듯하게" },
  measure: { icon: Ruler, short: "길이 측정", desc: "1 cm 기준으로 실제 길이를 잽니다" },
  background: { icon: Eraser, short: "배경 제거", desc: "족적 밖 배경을 지웁니다" },
  inpaint: { icon: Bandage, short: "장애물 제거", desc: "이어 붙은 장애물 자리를 메웁니다" },
  threshold: { icon: Contrast, short: "이진화", desc: "흑백 두 값으로 나눕니다" },
  denoise: { icon: Sparkles, short: "노이즈", desc: "AI 가 잡음을 지웁니다" },
}
const TOOL_GROUPS: { name: string; tools: ImageEditTool[] }[] = [
  { name: "다듬기", tools: ["crop", "calibrate", "measure"] },
  { name: "정리", tools: ["background", "inpaint", "threshold", "denoise"] },
]
const TOOL_LABEL = Object.fromEntries(TOOLS.map((t) => [t.tool, t.label])) as Record<ImageEditTool, string>

/** 사건 창 도구 타일(아이콘 19 + 짧은 이름 10.5). 고른 것 = 옅은 brand 판 + 1px brand 테 + 아이콘 brand(옆 줄 없음) */
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
  const { icon: Icon, short, desc } = WINDOW_TOOLS[kind]
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={`${label} — ${desc}`}
      disabled={disabled}
      onClick={onClick}
      {...(plusMark ? { "data-plus": "" } : {})}
      className={cn(
        "relative m-0 flex w-full cursor-pointer flex-col items-center gap-[5px] rounded-[9px] border-0 bg-transparent px-[2px] pt-[9px] pb-[7px] transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-brand",
        "disabled:cursor-default disabled:opacity-40",
        on
          ? "bg-brand-bg text-foreground [box-shadow:inset_0_0_0_1px_var(--t-brand-line)]"
          : "text-muted-foreground hover:bg-panel-3 hover:text-foreground"
      )}
    >
      <Icon aria-hidden="true" className={cn("size-[19px]", on && "text-brand")} strokeWidth={1.7} />
      <span aria-hidden="true" className="whitespace-nowrap text-[11px] font-semibold leading-none">
        {short}
      </span>
      {kind === "denoise" ? (
        <span aria-hidden="true" className="absolute top-[4px] right-[5px] font-code text-[10px] font-bold text-ai">
          AI
        </span>
      ) : null}
    </button>
  )
}

/** 사건 창 왼쪽 도구 칸(작업판 안 한 단 밝은 판) — 타일 세로 줄, 묶음 사이 가는 선 */
function ToolRail({ p }: { p: CuttingPaneProps }) {
  const { canEdit } = p.access
  return (
    <div
      role="group"
      aria-label="도구"
      className="flex min-h-0 flex-col gap-[8px] overflow-y-auto border-0 border-r border-solid border-border bg-panel-2 px-[6px] py-[8px]"
    >
      {TOOL_GROUPS.map((g, gi) => (
        <div key={g.name} role="group" aria-label={g.name} className="flex flex-col gap-[3px]">
          {gi > 0 ? <span aria-hidden="true" className="mx-[8px] mb-[5px] h-px bg-border" /> : null}
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

/** 작업판 위 · 아래 막대(한 단 밝은 판 + 가는 선) */
const STAGE_BAR = "flex shrink-0 flex-wrap items-center gap-x-[10px] gap-y-[4px] bg-panel px-[12px] py-[6px]"

/**
 * SCAS 취소 · 확인 · 저장(11/17 사용자 「취소 확인 저장 이런 버튼이 너무 아카데믹함」) — 작업판 위 막대 오른쪽 끝에
 * 편집 도구식 단추(kit WorkbenchButton)로: 취소(글자) · 확인(자르기 · 회전 확정, 옅은 판) · 저장(채움). 이름은 SCAS 말 그대로.
 */
function WorkbenchActions({ p }: { p: CuttingPaneProps }) {
  return (
    <span role="group" aria-label="편집 마무리" className="ml-auto inline-flex items-center gap-[6px]">
      <WorkbenchButton variant="ghost" icon={X} onClick={p.onCancel}>
        취소
      </WorkbenchButton>
      <WorkbenchButton variant="soft" icon={Check} disabled={!p.access.canEdit} onClick={p.onConfirm} title="자르기 · 회전을 확정합니다">
        확인
      </WorkbenchButton>
      <span aria-hidden="true" className="mx-[2px] h-[18px] w-px bg-line-3" />
      <WorkbenchButton variant="primary" icon={Save} disabled={!p.access.canSave} onClick={p.onSave}>
        저장
      </WorkbenchButton>
    </span>
  )
}

/** 편집 이력 한 단계 미리보기(작업대 위에 겹쳐 그림) */
export interface CuttingPreview {
  /** 0 = 받은 원본 */
  no: number
  label: string
  src: string
  /** 그 단계 모습 클래스(EditHistoryPane `stepLook`) */
  look: string
  /** 마지막 단계(= 지금)인가 — 그러면 「여기까지 되돌리기」 없음 */
  isNow: boolean
}

/** 작업대 위 미리보기 판 — 그 단계 그림 + 위 띠(이름 · 여기까지 되돌리기 · 닫기). 캔버스 좌표 판정에 끼지 않게 판 전체가 덮는다 */
function PreviewOverlay({ preview, canEdit, onClose, onRevert }: { preview: CuttingPreview; canEdit: boolean; onClose: () => void; onRevert?: () => void }) {
  // Esc = 미리보기만 닫는다(바깥 사건 창은 data-esc-layer 를 보고 그대로 — 2회차 검수)
  const closeRef = React.useRef(onClose)
  React.useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      e.preventDefault()
      closeRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])
  return (
    <div role="region" data-esc-layer="" aria-label="편집 이력 미리보기" className="absolute inset-0 z-[2] flex flex-col overflow-hidden rounded-[10px] bg-canvas">
      <div className="flex shrink-0 items-center gap-[8px] border-0 border-b border-solid border-border bg-panel px-[12px] py-[7px]">
        <Eye aria-hidden="true" className="size-[15px] text-brand" strokeWidth={1.9} />
        <b className="text-[12.5px] font-bold text-foreground">
          미리보기 · {preview.no === 0 ? "받은 원본" : `${preview.no}단계 ${preview.label}`}
        </b>
        <span className="text-[11px] text-muted-foreground">지금 사진은 바뀌지 않습니다</span>
        <span className="ml-auto inline-flex gap-[6px]">
          {!preview.isNow && onRevert ? (
            <WorkbenchButton variant="soft" icon={Undo2} disabled={!canEdit} onClick={onRevert}>
              여기까지 되돌리기
            </WorkbenchButton>
          ) : null}
          <WorkbenchButton variant="ghost" icon={X} iconOnly onClick={onClose} aria-label="미리보기 닫기" />
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={preview.src}
          alt={`${preview.label} 미리보기`}
          className={cn("absolute top-[16px] left-[16px] h-[calc(100%-32px)] w-[calc(100%-32px)] object-contain", preview.look)}
        />
      </div>
    </div>
  )
}

/**
 * 사건 창 안 이미지 커팅(11/17 사용자 「컴팩트하면서 고급지게」 → 「좌 중앙 우 느낌이 다르면 구분선이나 좀 차이를 줘 … 알록달록은 싫고」
 * → 「시인성 높여 … 옆에 클릭 선 말고 좀더 고급지고 전문적 느낌으로. 지금 너무 아카데믹한」) — 같은 상태 · 핸들러, 배치만 다르다.
 * 머리(PaneHead, 밝은 바탕) 오른쪽 끝 = 취소 · 확인 · 저장. 그 아래 작업판은 사진 편집 도구처럼 어두운 판(`data-theme="dark"` —
 * 경찰 다크 팔레트 토큰 그대로, 새 색 없음)으로 사진이 도드라지게:
 *   왼쪽 도구 칸(폭 76 · 아이콘 타일, 묶음 사이 가는 선)
 *   가운데: 위 막대(보기 · 회전) · 지금 도구 막대(아이콘 · 이름 · 쓰임새 · 설정) · 사진(가장 어두운 바탕, 높이 꽉) · 아래 막대(빠른 보정)
 * 오른쪽 보조 칸(밝은 바탕 · 왼쪽 선)은 부르는 쪽(ImageEditScreen)이 둔다.
 */
export function CuttingWindow(
  p: CuttingPaneProps & {
    /** 편집 이력 한 단계 미리보기(없으면 그리지 않음) */
    preview?: CuttingPreview | null
    onClosePreview?: () => void
    /** 미리 보는 단계까지 되돌리기 */
    onRevertToPreview?: () => void
  }
) {
  const tool = p.activeTool
  const ToolIcon = tool ? WINDOW_TOOLS[tool].icon : null
  return (
    <section aria-label="이미지 커팅" className="flex min-h-0 min-w-0 flex-1 flex-col gap-[8px]">
      <PaneHead
        title="이미지 커팅"
        tip={`저장함 — ${saveNote(p)}`}
        sub={p.access.canEdit ? `원본 ${fmt(p.originalSize.width)} × ${fmt(p.originalSize.height)}` : "보기 전용 — 편집 · 저장은 사건 조회 또는 사건 등록 권한"}
      />
      <div
        data-theme="dark"
        data-slot="image-edit-workbench"
        className="grid min-h-0 flex-1 grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-solid border-border bg-panel text-foreground [box-shadow:0_6px_18px_var(--t-panel-drop)]"
      >
        <ToolRail p={p} />
        <div className="flex min-h-0 min-w-0 flex-col bg-canvas">
          <div className={cn(STAGE_BAR, "border-0 border-b border-solid border-border")}>
            <div role="group" aria-label="보기 · 회전" className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
              <ZoomRotate p={p} compact />
              <span aria-hidden="true" className="h-[16px] w-px bg-line-3" />
              <span className="inline-flex gap-[2px]">
                <WorkbenchButton size="sm" variant="ghost" onClick={p.onFit}>
                  맞춤
                </WorkbenchButton>
                <WorkbenchButton size="sm" variant="ghost" onClick={p.onActualSize}>
                  100%
                </WorkbenchButton>
              </span>
            </div>
          </div>
          {/* 지금 도구 + 그 설정(고른 도구가 없으면 한 줄 안내) */}
          <div className={cn(STAGE_BAR, "min-h-[36px] border-0 border-b border-solid border-border")}>
            {tool && ToolIcon ? (
              <>
                <b className="inline-flex shrink-0 items-center gap-[7px] text-[12.5px] font-bold text-foreground">
                  <span aria-hidden="true" className="grid size-[24px] place-items-center rounded-[7px] bg-brand-bg text-brand [box-shadow:inset_0_0_0_1px_var(--t-brand-line)]">
                    <ToolIcon className="size-[14px]" strokeWidth={1.9} />
                  </span>
                  {TOOL_LABEL[tool]}
                </b>
                <span className="shrink-0 text-[11px] text-muted-foreground">{WINDOW_TOOLS[tool].desc}</span>
                <div className="min-w-0 flex-1">
                  <ToolOptions {...p} bare quiet />
                </div>
              </>
            ) : (
              <span className={cn(HINT, "flex-1")}>왼쪽 도구를 고르면 여기에서 설정합니다.</span>
            )}
            <WorkbenchActions p={p} />
          </div>
          <div className="relative min-h-0 flex-1 p-[14px]">
            <CanvasBox p={p} inWindow className="h-full border-line-3 [box-shadow:0_8px_24px_var(--t-panel-drop)]" />
            {p.preview ? (
              <div className="absolute inset-[14px]">
                <PreviewOverlay
                  preview={p.preview}
                  canEdit={p.access.canEdit}
                  onClose={() => p.onClosePreview?.()}
                  onRevert={p.onRevertToPreview}
                />
              </div>
            ) : null}
          </div>
          <div className={cn(STAGE_BAR, "border-0 border-t border-solid border-border")}>
            <span className="shrink-0 text-[11px] font-bold tracking-[0.04em] text-muted-foreground">빠른 보정</span>
            <BottomRow p={p} className="justify-start" workbench />
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
