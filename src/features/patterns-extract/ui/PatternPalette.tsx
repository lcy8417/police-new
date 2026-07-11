import { useState, type DragEvent, type MouseEvent } from "react";
import { Check, Database } from "lucide-react";

import { cn } from "@/shared/lib/utils";
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
  /**
   * 현재 선택된 부위에 이미 삽입된 문양인지 이름 기준으로 판정한다. 삽입된
   * 문양은 비활성화(클릭 불가·흐림·체크 뱃지)된다. 기본값은 항상 false.
   */
  isInserted?: (src: string) => boolean;
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
  isInserted = () => false,
}: PatternPaletteProps) {
  // 표시 전용 — 어느 종류 버튼이 활성인지 로컬로 추적한다(usePatternManager는
  // 이 상태를 소유하지 않으므로 계약을 바꾸지 않는다). 마운트 시 훅이 "무늬"를
  // 기본 로드하므로 초깃값을 맞춘다.
  const [activeKind, setActiveKind] = useState<string>(KINDS[0]);

  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex shrink-0 items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Database className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          문양 리스트
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Library
        </span>
      </div>

      {/* 종류 선택 버튼(텍스트 전용 — textContent 규약 유지) */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[#141D2C] bg-[#0D1420]/40 px-4 py-2.5">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={(e) => {
              setActiveKind(kind);
              patternsKindSelect(e);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              activeKind === kind
                ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF]"
                : "border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#152238] hover:text-[#4A9EFF]"
            )}
          >
            {kind}
          </button>
        ))}
      </div>

      {/* 삽입 안내 — 문양 정보 패널에서 선택한 부위가 삽입 대상이 된다. */}
      <div className="shrink-0 border-b border-[#141D2C] px-4 py-1.5">
        <span className="font-mono text-[10px] tracking-wide text-[#5B6B85]">
          썸네일 클릭·드래그 시 문양 정보에서 선택한 부위에 삽입됩니다
        </span>
      </div>

      {/* 문양 썸네일 그리드 */}
      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-4 gap-2.5 overflow-y-auto p-4 sm:grid-cols-5 lg:grid-cols-6">
        {patterns.map((src, index) => {
          const inserted = isInserted(src);
          return (
            <button
              key={index}
              type="button"
              disabled={inserted}
              // 드래그 시작 시 문양 경로를 dataTransfer에 실어 문양 정보 존이
              // 드롭으로 받을 수 있게 한다. 이미 삽입된 문양은 드래그 불가.
              draggable={!inserted}
              onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                e.dataTransfer.setData("text/plain", src);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-[#05080D] transition-colors",
                inserted
                  ? "cursor-not-allowed border-[#22C55E]/40 opacity-40"
                  : "cursor-grab border-[#1E2A3C] hover:border-[#3B82F6]/60"
              )}
            >
              <img
                src={src}
                alt={`문양 ${index + 1}`}
                onClick={inserted ? undefined : insertPattern}
                className={cn(
                  "absolute inset-0 size-full object-contain p-1.5 transition-transform",
                  inserted
                    ? "pointer-events-none"
                    : "cursor-pointer group-hover:scale-105"
                )}
              />
              {inserted && (
                <span
                  aria-label="삽입됨"
                  className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full border border-[#22C55E]/50 bg-[#0B121D]/80 text-[#4ADE80] shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                >
                  <Check className="size-2.5" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
