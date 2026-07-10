import { ImageOff, Target } from "lucide-react";

import type { Crime } from "@/entities/crime";
import type { PatternEntry, PatternZone } from "@/entities/pattern";
import { TechCorners } from "@/shared/ui/tech-corners";
import { cn } from "@/shared/lib/utils";

/** 한국어 부위 라벨 ↔ 데이터 키. 레거시 PatternInfo/PatternItem의 매핑을 유지한다. */
const ZONES: { label: string; key: PatternZone }[] = [
  { label: "상", key: "top" },
  { label: "중", key: "mid" },
  { label: "하", key: "bottom" },
  { label: "윤곽", key: "outline" },
];

interface PatternZonesProps {
  /** 선택된 부위 인덱스(0~3). 팔레트에서 삽입 시 대상 부위를 정한다. */
  selected: number | null;
  setSelected: (index: number) => void;
  deletePattern: (kind: PatternZone, src: string) => void;
  essentialCheck: (kind: PatternZone, src: string) => void;
  /** 현재 사건 데이터(store 파생). 각 부위의 문양 튜플 배열을 읽는다. */
  currentData: Crime | null | undefined;
}

/** 범죄 패턴 튜플 `[경로, 필수플래그]` / 신발 문자열 어느 표현이든 [경로, 필수]로 정규화. */
function normalize(item: PatternEntry): [string, boolean] {
  return typeof item === "string" ? [item, false] : [item[0], Boolean(item[1])];
}

/**
 * 문양 정보 패널(다크 커맨드센터 톤). 레거시 `PatternInfo`+`PatternItem`을 대체하는
 * 패턴추출 전용 신규 컴포넌트다(레거시 3종은 ShoesRegisterMain이 여전히 쓰므로 존치).
 * 상/중/하/윤곽 4개 부위를 표시하며, 부위 헤더를 클릭하면 삽입 대상으로 선택되고,
 * 썸네일 클릭은 삭제, 우클릭은 "필수" 토글이다(레거시 상호작용 규약 보존).
 */
export function PatternZones({
  selected,
  setSelected,
  deletePattern,
  essentialCheck,
  currentData,
}: PatternZonesProps) {
  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={20} />

      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-5 py-3">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <Target className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          문양 정보
        </span>
        <span className="hidden items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase sm:flex">
          <span
            className="size-1.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_rgba(239,68,68,0.7)]"
            aria-hidden="true"
          />
          필수
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
        {ZONES.map(({ label, key }, index) => {
          const isSelected = selected === index;
          const patterns = currentData?.[key] ?? [];
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-[#0F1826] transition-colors",
                isSelected
                  ? "border-[#3B82F6]/60 shadow-[0_0_16px_rgba(37,99,235,0.2)]"
                  : "border-[#1E2A3C]"
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(index)}
                className={cn(
                  "flex items-center justify-between border-b px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  isSelected
                    ? "border-[#141D2C] bg-[#152238] text-[#4A9EFF]"
                    : "border-[#141D2C] bg-[#0D1420]/60 text-[#C7CEDB] hover:text-white"
                )}
              >
                <span>{label}</span>
                <span className="font-mono text-[10px] tabular-nums text-[#5B6B85]">
                  {patterns.length}
                </span>
              </button>

              {patterns.length > 0 ? (
                <div className="grid auto-rows-max grid-cols-3 gap-2 overflow-y-auto p-3">
                  {patterns.map((item, i) => {
                    const [path, essential] = normalize(item);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-lg border bg-[#05080D]",
                          essential ? "border-[#EF4444]/40" : "border-[#1E2A3C]"
                        )}
                      >
                        <img
                          src={path}
                          alt={`${label} 문양 ${i + 1}`}
                          title="클릭: 삭제 · 우클릭: 필수 토글"
                          onClick={() => deletePattern(key, path)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            essentialCheck(key, path);
                          }}
                          className="absolute inset-0 size-full cursor-pointer object-contain p-1.5"
                        />
                        {essential && (
                          <span
                            aria-hidden="true"
                            className="absolute top-1 right-1 size-1.5 rounded-full bg-[#EF4444] shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-[#5B6B85]">
                  <ImageOff className="size-5" aria-hidden="true" />
                  <span className="text-[11px] font-medium">문양 없음</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
