import { TechCorners } from "@/shared/ui/tech-corners"

interface CrimeScenePanelProps {
  /** 표시할 현장 이미지(정적 URL 또는 base64). null이면 안내 문구를 보인다. */
  image: string | null
}

/**
 * 검색결과 화면 좌측 "현장 이미지" 패널(프레젠테이셔널). 크롭·회전 등 편집
 * 기능은 crime-register 전용이며, 여기서는 검색 대상 현장 이미지를 다크 뷰포트에
 * 표시만 한다.
 */
export function CrimeScenePanel({ image }: CrimeScenePanelProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-[15px] font-semibold text-[#E5E9F0]">현장 이미지</span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A9EFF] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#4A9EFF] shadow-[0_0_8px_2px_rgba(74,158,255,0.8)]" />
        </span>
      </div>

      <div className="relative m-6 mt-4 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#141D2C] bg-[#05080D]">
        {image ? (
          <img
            src={image}
            alt="현장 증거 이미지"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-sm text-[#5B6B85]">현장 이미지를 불러오는 중...</span>
        )}
        <span className="absolute bottom-3 left-4 font-mono text-[10px] tracking-wider text-[#5B6B85]">
          KCSI / Forensic Imaging
        </span>
      </div>
    </section>
  )
}
