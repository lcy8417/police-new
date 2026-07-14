import { Radar } from "lucide-react";

import { GlowOrb } from "@/shared/ui/glow-fx";
import { TechCorners } from "@/shared/ui/tech-corners";

/**
 * 서버 처리(배경분리·노이즈제거·인페인팅) 공용 로딩 오버레이. 처리 중 뷰포트 전체를
 * 덮어 인터랙션을 흡수하고(폴리곤 재클릭·중복 제출 방지), forensic 시그니처(TechCorners·
 * GlowOrb)로 커맨드센터 톤을 유지한다. 노이즈제거가 가장 오래 걸리므로 반드시 확실히 덮는다.
 *
 * `absolute inset-0`라 부모(뷰포트)가 relative여야 한다. 순수 표시 컴포넌트 — 상태 없음.
 */
export interface EditLoadingOverlayProps {
  /** 표시 여부(useImageEdit.isProcessing). */
  show: boolean;
  /** 처리 문구(useImageEdit.processingLabel — 툴별 한국어). */
  label: string;
}

export function EditLoadingOverlay({ show, label }: EditLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-[#05080D]/82 backdrop-blur-sm animate-in fade-in-0 duration-300"
      role="status"
      aria-live="polite"
    >
      <TechCorners size={24} active />
      {/* 앰비언트 글로우 — 중앙 스피너 뒤로 은은한 광원. */}
      <GlowOrb className="top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 bg-[#4A9EFF]/12" />

      {/* 스피너 — 회전 레이더 + 동심 정지 링으로 스캔 중 느낌. */}
      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[#1E2A3C]" aria-hidden="true" />
        <span
          className="absolute inset-2 rounded-full border border-[#3B82F6]/30"
          aria-hidden="true"
        />
        <Radar className="size-8 animate-spin text-[#4A9EFF] drop-shadow-[0_0_8px_rgba(74,158,255,0.7)]" aria-hidden="true" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="font-mono text-[13px] tracking-wide text-[#E5E9F0]">
          {label || "처리 중…"}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-[#5B6B85] uppercase">
          <span className="size-1 animate-pulse rounded-full bg-[#4A9EFF]" aria-hidden="true" />
          KCSI · Forensic Processing
        </span>
      </div>
    </div>
  );
}
