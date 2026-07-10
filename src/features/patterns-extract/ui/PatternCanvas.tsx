import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { Camera, ImageOff, ImagePlus, Radar, RotateCcw, ScanSearch } from "lucide-react";

import { TechCorners } from "@/shared/ui/tech-corners";

import type { usePatternManager } from "../model/use-pattern-manager";
import {
  isNearAnyLine,
  moveLine,
  pickDraggableLine,
} from "../lib/line-geometry";

// usePatternManager의 반환 타입에서 계약을 그대로 파생한다(훅 무수정 재사용).
type PatternManager = ReturnType<typeof usePatternManager>;
type LineState = PatternManager["lineState"];
type SetLineState = PatternManager["setLineState"];

interface PatternCanvasProps {
  /** usePatternManager가 소유한 canvasRef — extractPattern이 여기서 render_size를 읽는다. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 표시 이미지 element ref — 스와퍼가 src를 직접 바꾸고, extractPattern이 src를 읽는다. */
  imgRef: RefObject<HTMLImageElement | null>;
  /** 현장(원본) 이미지 경로. 참조가 안정적이어야 스와퍼의 명령형 src 변경이 유지된다. */
  image: string | null;
  /** 상/중/하 경계선 상태(usePatternManager 소유). */
  lineState: LineState;
  setLineState: SetLineState;
  onExtract: () => void;
  onClear: () => void;
  onShowOrigin: () => void;
  onShowEdit: () => void;
  isExtracting?: boolean;
}

/** 도크 툴바용 소형 버튼(crime-register EvidenceImagePanel 톤 준용). */
function ToolButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
  variant?: "default" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "accent"
          ? "flex h-8 items-center gap-1.5 rounded-md border border-[#3B82F6]/50 bg-[#152238] px-3 text-xs font-medium text-[#4A9EFF] transition-colors hover:bg-[#182b45]"
          : "flex h-8 items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 text-xs text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * 패턴추출 전용 신규 FSD 캔버스. 레거시 `Canvas.jsx`(507줄) 중 패턴추출이 실제로
 * 쓰던 부분집합만 재현한다: (1) 현장/편집 이미지 표시, (2) 상/중/하 경계선(line) 편집
 * 상호작용, (3) 문양추출/초기화 트리거. 크롭·회전·줌·각도보정점·선택박스는 패턴추출이
 * 쓰지 않으므로 재현하지 않는다.
 *
 * 동작 보존: 오버레이 canvas의 비트맵 크기를 표시된 이미지 크기에 맞추고(정렬은
 * crime-register `useImageEditor`의 오버레이 전략과 동일), 선 좌표(lineYs)를 canvas
 * 픽셀 공간에 둔다. extractPattern은 `canvasRef.getBoundingClientRect()`를 render_size로,
 * `lineState.lineYs`를 line_ys로 보내므로 두 값의 좌표계가 일치해 서버로 가는 결과가
 * 레거시와 동일하다.
 */
export function PatternCanvas({
  canvasRef,
  imgRef,
  image,
  lineState,
  setLineState,
  onExtract,
  onClear,
  onShowOrigin,
  onShowEdit,
  isExtracting = false,
}: PatternCanvasProps) {
  // canvas 리사이즈 시 선을 다시 그리기 위한 트리거.
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // 표시된 이미지에 맞춰 canvas 비트맵 크기를 재측정한다. 마우스/canvas 좌표가
  // 1:1로 대응하도록 비트맵 크기를 표시 크기에 맞춘다(useImageEditor.recomputeOverlay 준용).
  const recompute = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    canvas.width = w;
    canvas.height = h;
    setCanvasSize({ w, h });
  }, [imgRef, canvasRef]);

  // 반응형 리사이즈 동안 정렬을 유지한다.
  useEffect(() => {
    recompute();
    const img = imgRef.current;
    const ro = new ResizeObserver(() => recompute());
    if (img) ro.observe(img);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute, imgRef, image]);

  // 상/중/하 경계선을 그린다. 레거시의 반투명 빨강 점선 가이드를 유지한다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // 의미색 레드(경계 가이드)
    ctx.lineWidth = 7;
    ctx.setLineDash([5, 3]);
    lineState.lineYs.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
  }, [canvasRef, lineState, canvasSize]);

  // 마우스 clientY를 canvas 비트맵 y 좌표로 변환한다.
  const toCanvasY = useCallback(
    (clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.height === 0) return null;
      return (clientY - rect.top) * (canvas.height / rect.height);
    },
    [canvasRef]
  );

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const y = toCanvasY(e.clientY);
    if (y === null) return;
    const idx = pickDraggableLine(lineState.lineYs, y);
    if (idx === null) return;
    // 잡은 지점의 오프셋을 저장해 드래그 중 상대 위치를 유지한다.
    setLineState((prev) => ({
      ...prev,
      draggingLine: idx,
      offsetY: prev.lineYs[idx] - y,
    }));
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const y = toCanvasY(e.clientY);
    if (y === null) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isNearAnyLine(lineState.lineYs, y)
        ? "pointer"
        : "default";
    }
    if (lineState.draggingLine !== null) {
      setLineState((prev) => {
        const moved = moveLine(prev.lineYs, prev.draggingLine, y, prev.offsetY);
        return { ...prev, lineYs: [moved[0], moved[1]] as [number, number] };
      });
    }
  };

  const stopDragging = () => {
    setLineState((prev) => ({ ...prev, draggingLine: null }));
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} />

      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-[#141D2C] bg-[#0D1420]/60 px-6 py-3.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#E5E9F0]">
          <ScanSearch className="size-4 text-[#4A9EFF]" aria-hidden="true" />
          신발 이미지
        </span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6B85] uppercase">
          Pattern · Extract
        </span>
      </div>

      {/* 툴바: 이미지 스와퍼 + 문양추출/초기화 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/40 px-6 py-3">
        <div className="flex items-center gap-2">
          <ToolButton icon={Camera} label="현장이미지" onClick={onShowOrigin} />
          <ToolButton icon={ImagePlus} label="편집이미지" onClick={onShowEdit} />
        </div>
        <div className="mx-1 h-6 w-px bg-[#1E2A3C]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <ToolButton
            icon={Radar}
            label="문양추출"
            onClick={onExtract}
            variant="accent"
          />
          <ToolButton icon={RotateCcw} label="문양초기화" onClick={onClear} />
        </div>
      </div>

      {/* 뷰포트: 이미지 + 경계선 오버레이 canvas */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D] p-4">
        {image ? (
          <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
            <img
              ref={imgRef}
              src={image}
              alt="현장 신발 이미지"
              draggable={false}
              onLoad={recompute}
              className="max-h-full max-w-full object-contain select-none"
            />
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              className="absolute inset-0 size-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
            <ImageOff className="size-9" aria-hidden="true" />
            <span className="text-sm font-medium">표시할 이미지가 없습니다</span>
          </div>
        )}

        {/* 추출 진행 오버레이(레거시 LoadingModal 대체) */}
        {isExtracting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#05080D]/80 backdrop-blur-sm">
            <Radar
              className="size-8 animate-spin text-[#4A9EFF]"
              aria-hidden="true"
            />
            <span className="font-mono text-[13px] tracking-wide text-[#C7CEDB]">
              패턴 추출 중...
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
