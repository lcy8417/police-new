import { Crop, Crosshair, RefreshCw, RotateCcw, type LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/** Title + subtitle published into `TopNav` via `usePageHeader({ title: <HeaderTitle /> })`. */
export function HeaderTitle() {
  return (
    <div className="flex flex-col justify-center gap-1">
      <span className="text-[28px] leading-none font-bold text-white">
        신규 사건 등록
      </span>
      <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
        사건 정보를 입력하고 현장 이미지를 관리하세요.
      </span>
    </div>
  )
}

interface ActionCardProps {
  icon: LucideIcon
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function ActionCard({ icon: Icon, label, active = false, disabled = false, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex h-14 min-w-[76px] flex-col items-center justify-center gap-1 rounded-lg border px-3 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-[#4A9EFF]/60 bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_20px_rgba(37,99,235,0.55)]"
          : "border-[#1E2A3C] bg-[#0F1826] text-[#8A93A6] hover:border-[#2A3B54] hover:bg-[#141F30] hover:text-[#C7CEDB]"
      )}
    >
      <Icon
        className={cn("size-[18px]", active ? "text-white" : "text-[#5B6B85] group-hover:text-[#4A9EFF]")}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  )
}

interface HeaderActionsProps {
  onRotate: (deg: number) => void
  onReset: () => void
  disabled?: boolean
}

/**
 * The 4 toolbar action cards published into `TopNav` via
 * `usePageHeader({ actions: <HeaderActions /> })`. 회전/초기화 are wired;
 * 크롭 and 각도 보정 stay present but deferred to Slice 2.
 */
export function HeaderActions({ onRotate, onReset, disabled = false }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <ActionCard icon={RotateCcw} label="회전" disabled={disabled} onClick={() => onRotate(90)} />
      {/* TODO(slice2): wire crop canvas — button intentionally inert for now. */}
      <ActionCard icon={Crop} label="크롭" disabled={disabled} />
      {/* TODO(slice2): wire 4-point calibration canvas — button intentionally inert for now. */}
      <ActionCard icon={Crosshair} label="각도 보정" active disabled={disabled} />
      <ActionCard icon={RefreshCw} label="초기화" onClick={onReset} />
    </div>
  )
}
