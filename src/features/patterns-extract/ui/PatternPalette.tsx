import type { MouseEvent } from "react";
import { Database } from "lucide-react";

import { TechCorners } from "@/shared/ui/tech-corners";

/**
 * 문양 종류 버튼 라벨. `patternsKindSelect`가 `e.target.textContent`로 종류를 읽어
 * `getPatternsPath[kind]`를 조회하므로, 이 라벨은 레거시 `PatternList`와 정확히
 * 일치해야 하고 버튼은 텍스트만 담아야 한다(아이콘을 넣으면 target이 svg가 되어
 * textContent가 비게 됨).
 */
const KINDS = ["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"];

interface PatternPaletteProps {
  /** 현재 선택된 종류의 문양 경로 목록(usePatternManager.patterns). */
  patterns: string[];
  patternsKindSelect: (e: MouseEvent<HTMLButtonElement>) => void;
  insertPattern: (e: MouseEvent<HTMLImageElement>) => void;
}

/**
 * 문양 리스트/팔레트(다크 커맨드센터 톤). 레거시 `PatternList`를 대체하는 패턴추출
 * 전용 신규 컴포넌트다(레거시 `PatternList`는 ShoesRegisterMain이 여전히 쓰므로 존치).
 * 종류 버튼으로 도형 폴더를 전환하고, 썸네일 클릭 시 `insertPattern`이 현재 선택된
 * 부위에 문양을 추가한다(`e.target.src`를 읽음).
 */
export function PatternPalette({
  patterns,
  patternsKindSelect,
  insertPattern,
}: PatternPaletteProps) {
  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-5 py-3">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Database className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          문양 리스트
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Library
        </span>
      </div>

      {/* 종류 선택 버튼(텍스트 전용 — textContent 규약 유지) */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#141D2C] bg-[#0D1420]/40 px-4 py-3">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={patternsKindSelect}
            className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 text-xs font-medium text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#152238] hover:text-[#4A9EFF]"
          >
            {kind}
          </button>
        ))}
      </div>

      {/* 문양 썸네일 그리드 */}
      <div className="grid auto-rows-max grid-cols-4 gap-2.5 overflow-y-auto p-4 sm:grid-cols-5">
        {patterns.map((src, index) => (
          <button
            key={index}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-lg border border-[#1E2A3C] bg-[#05080D] transition-colors hover:border-[#3B82F6]/60"
          >
            <img
              src={src}
              alt={`문양 ${index + 1}`}
              onClick={insertPattern}
              className="absolute inset-0 size-full cursor-pointer object-contain p-1.5 transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
