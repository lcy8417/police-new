import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import {
  Camera,
  Crosshair,
  GripHorizontal,
  ImageOff,
  ImagePlus,
  Radar,
  RotateCcw,
  ScanSearch,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { TechCorners } from "@/shared/ui/tech-corners";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

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

/** 이미지 스와퍼 세그먼트의 한국어 라벨(레거시 규약 유지). */
const VIEW_LABELS = ["현장이미지", "편집이미지"] as const;
type ViewLabel = (typeof VIEW_LABELS)[number];

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
  disabled = false,
  pending = false,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
  variant?: "default" | "accent";
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "accent"
          ? "border-[#3B82F6]/50 bg-[#152238] text-[#4A9EFF] hover:bg-[#182b45]"
          : "border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
      )}
    >
      <Icon className={cn("size-3.5", pending && "animate-spin")} aria-hidden="true" />
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
 *
 * 디자인 마감: 상/중/하 부위 라벨, 경계선 핸들 태그, 안내 배지, 체커보드
 * 눈금/모서리 십자선/하단 상태표시줄(crime-register `EvidenceImagePanel` · 검색결과
 * `CrimeScenePanel`과 같은 뷰포트 언어)은 모두 이 파일의 순수 프레젠테이션 레이어다 —
 * canvas 비트맵 정렬, `toCanvasY`/`pickDraggableLine`/`moveLine` 좌표 수학,
 * `extractPattern`이 읽는 `lineState.lineYs`/`render_size` 값은 손대지 않았다.
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
  // 표시 전용 상태 — 어느 스와퍼 세그먼트가 활성인지, 원본 픽셀 치수는 얼마인지.
  // 캔버스 좌표 로직에는 관여하지 않는다.
  const [activeView, setActiveView] = useState<ViewLabel>("현장이미지");
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
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

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const el = e.currentTarget;
      setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
      recompute();
    },
    [recompute]
  );

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

  // 상/중/하 경계선을 그린다. 레거시의 반투명 빨강 점선 가이드를 유지하되,
  // 드래그 중인 선만 살짝 굵고 발광하도록 표시해 조작 대상을 명확히 한다
  // (좌표·색상 값 자체는 변경하지 않음).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lineState.lineYs.forEach((y, idx) => {
      const isDragging = lineState.draggingLine === idx;
      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // 의미색 레드(경계 가이드) — 고정
      ctx.lineWidth = isDragging ? 8 : 7;
      ctx.setLineDash([5, 3]);
      if (isDragging) {
        ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.restore();
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

  const handleShowOrigin = useCallback(() => {
    setActiveView("현장이미지");
    onShowOrigin();
  }, [onShowOrigin]);

  const handleShowEdit = useCallback(() => {
    setActiveView("편집이미지");
    onShowEdit();
  }, [onShowEdit]);

  // 두 경계선을 화면 순서(작은 y → 큰 y)로 정렬한 값 — 부위 라벨 배치 전용
  // 파생값이며, `lineState.lineYs`(서버로 나가는 원본 순서)는 건드리지 않는다.
  const [minY, maxY] = useMemo(() => {
    const [a, b] = lineState.lineYs;
    return a <= b ? ([a, b] as const) : ([b, a] as const);
  }, [lineState.lineYs]);

  const zoneBands = useMemo(
    () => [
      { label: "상", center: minY / 2 },
      { label: "중", center: (minY + maxY) / 2 },
      { label: "하", center: (maxY + canvasSize.h) / 2 },
    ],
    [minY, maxY, canvasSize.h]
  );

  const showOverlayChrome = Boolean(image) && canvasSize.h > 0;

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1E2A3C] bg-[#0B121D] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_40px_rgba(0,0,0,0.35)]">
      <TechCorners size={22} active={isExtracting} />

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

      {/* 툴바: 이미지 스와퍼(세그먼트 토글) + 문양추출/초기화 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#141D2C] bg-[#0D1420]/40 px-6 py-3">
        <ToggleGroup
          type="single"
          value={activeView}
          onValueChange={(v) => {
            if (v === "현장이미지") handleShowOrigin();
            else if (v === "편집이미지") handleShowEdit();
          }}
          className="gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5"
        >
          <ToggleGroupItem
            value="현장이미지"
            className="h-7 gap-1.5 rounded-[5px] px-2.5 text-xs font-medium text-[#8A93A6] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            현장이미지
          </ToggleGroupItem>
          <ToggleGroupItem
            value="편집이미지"
            className="h-7 gap-1.5 rounded-[5px] px-2.5 text-xs font-medium text-[#8A93A6] hover:text-[#C7CEDB] data-[state=on]:border data-[state=on]:border-[#3B82F6]/50 data-[state=on]:bg-[#152238] data-[state=on]:text-[#4A9EFF]"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            편집이미지
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="mx-1 h-6 w-px bg-[#1E2A3C]" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <ToolButton
            icon={Radar}
            label={isExtracting ? "추출 중..." : "문양추출"}
            onClick={onExtract}
            variant="accent"
            disabled={isExtracting}
            pending={isExtracting}
          />
          <ToolButton
            icon={RotateCcw}
            label="문양초기화"
            onClick={onClear}
            disabled={isExtracting}
          />
        </div>
      </div>

      {/* 뷰포트: 이미지 + 경계선 오버레이 canvas.
          체커보드 눈금 바 / 모서리 십자선 / 하단 상태표시줄은 crime-register
          `EvidenceImagePanel` · 검색결과 `CrimeScenePanel`과 같은 뷰포트 언어로,
          4개 화면이 하나의 시스템처럼 읽히게 한다. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#05080D] p-4">
        {image && (
          <>
            <div
              className="absolute inset-x-2 top-2 h-[8px] rounded-sm opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />
            <div
              className="absolute inset-y-2 left-2 w-[8px] rounded-sm opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, #E5E9F0 0 8px, #0B121D 8px 16px)",
              }}
            />
            <Crosshair className="absolute top-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute top-4 right-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute bottom-4 left-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
            <Crosshair className="absolute right-4 bottom-4 size-5 text-[#4A9EFF]/70 drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]" aria-hidden="true" />
          </>
        )}

        {image ? (
          <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
            <img
              ref={imgRef}
              src={image}
              alt="현장 신발 이미지"
              draggable={false}
              onLoad={handleImageLoad}
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

            {/* 상/중/하 부위 라벨 — 두 경계선이 만드는 세 구간의 중심에 배치한다.
                순수 표시용 파생값(minY/maxY)만 사용하며 lineState는 읽기만 한다. */}
            {showOverlayChrome &&
              zoneBands.map((band) => (
                <span
                  key={band.label}
                  className="pointer-events-none absolute left-1.5 z-10 -translate-y-1/2 rounded border border-[#1E2A3C] bg-[#0B121D]/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#8A93A6]"
                  style={{ top: band.center }}
                >
                  {band.label}
                </span>
              ))}

            {/* 경계선 핸들 태그 — 드래그 가능함을 알리고, 드래그 중인 선을 강조한다. */}
            {showOverlayChrome &&
              lineState.lineYs.map((y, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "pointer-events-none absolute right-1.5 z-10 flex -translate-y-1/2 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums transition-colors",
                    lineState.draggingLine === idx
                      ? "border-[#EF4444]/60 bg-[#2a1214]/90 text-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                      : "border-[#1E2A3C] bg-[#0B121D]/85 text-[#8A93A6]"
                  )}
                  style={{ top: y }}
                >
                  <GripHorizontal className="size-3" aria-hidden="true" />
                  {Math.round(y)}
                </div>
              ))}

            {/* 조작 안내 배지(레거시에 없던 힌트 — crime-register 모드 배지와 같은 톤). */}
            {showOverlayChrome && (
              <span className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-md border border-[#1E2A3C] bg-[#0B121D]/90 px-3 py-1 font-mono text-[11px] text-[#8A93A6]">
                경계선을 드래그해 상·중·하를 나누세요
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#5B6B85]">
            <ImageOff className="size-9" aria-hidden="true" />
            <span className="text-sm font-medium">표시할 이미지가 없습니다</span>
          </div>
        )}

        {/* 중앙 하단 배치 — 좌측 상/중/하 부위 라벨, 우측 경계선 핸들 태그와 겹치지 않도록
            EvidenceImagePanel/CrimeScenePanel의 좌하단 배치 대신 중앙을 쓴다. */}
        {image && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-wider text-[#5B6B85]">
            KCSI / Forensic Imaging
          </span>
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

      {/* 하단 상태표시줄 — EvidenceImagePanel/CrimeScenePanel과 같은 톤으로
          치수·현재 뷰·경계선 개수를 요약한다(표시 전용, 파생값만 사용). */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#141D2C] px-6 py-3">
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#8A93A6]">
          {naturalSize.w} x {naturalSize.h} px
        </span>
        <span className="rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8A93A6] uppercase">
          {activeView}
        </span>
        <span className="ml-auto font-mono text-[11px] tracking-wide text-[#6B7688] uppercase">
          Line Edit · {lineState.lineYs.length} Boundaries
        </span>
      </div>
    </section>
  );
}
