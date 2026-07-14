/**
 * 현장 이미지 편집 상태 소유 훅 — 레거시 `components/EditMain.jsx`의 scrollState/returnMemo/points를
 * 대체한다. 이진화는 **완전 클라이언트(canvas 재베이크)**, 폴리곤(배경제거/인페인팅)·노이즈는 **서버**.
 *
 * 상태 소유 관례는 `features/patterns-extract/model/use-pattern-manager.ts`를, 2단계 라이브 프리뷰
 * (CSS 즉시 / 감마·이진화는 디바운스 canvas 재베이크 + 스테일 취소)는
 * `features/crime-register/model/use-image-adjustments.ts`를 모방한다.
 *
 * FSD: 이 슬라이스는 entities·shared·(레거시 이미지 서비스)만 소비한다. 다른 feature import 금지.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  bakeThreshold,
  isDataUrl,
  resolveImageToDataUrl,
  type ThresholdMode,
} from "@/shared/lib";

import {
  type Point,
  type RectLike,
  clampPolygon,
  computeRenderSize,
  isPolygonSubmittable,
  removeLastPoint,
  serializePolygon,
  toCanvasPoint,
} from "../lib/polygon-geometry";
import {
  useDenoising,
  useInpainting,
  useSaveEditImage,
  useSegmentation,
} from "./use-edit-processing";

/** 편집 툴. null = 도구 미선택(관찰 모드). */
export type EditTool = "background" | "threshold" | "denoise" | "inpaint";

/** 이진화 초기 임계값(레거시 `resetScrollState.binarization`). */
const DEFAULT_THRESHOLD = 127;
/** 이진화 초기 모드. */
const DEFAULT_THRESHOLD_MODE: ThresholdMode = "standard";
/** 드래그 중 이진화 미리보기를 다시 굽기 전 대기하는 디바운스 시간(ms). */
const PREVIEW_DEBOUNCE = 120;

/** 툴별 처리 중 오버레이 문구. */
const PROCESSING_LABELS: Record<Exclude<EditTool, "threshold">, string> = {
  background: "배경 분리 중…",
  denoise: "노이즈 제거 중… (AI 처리)",
  inpaint: "장애물 복원 중… (AI 인페인팅)",
};

/** 저장 진행 중 오버레이 문구. */
const SAVING_LABEL = "저장 중…";

/** 툴별 서버 처리 실패 시 사용자 안내(toast) 문구. */
const PROCESSING_ERROR_LABELS: Record<Exclude<EditTool, "threshold">, string> = {
  background: "배경 분리에 실패했습니다. 다시 시도해 주세요.",
  denoise: "노이즈 제거에 실패했습니다. 다시 시도해 주세요.",
  inpaint: "장애물 복원에 실패했습니다. 다시 시도해 주세요.",
};

export interface UseImageEditParams {
  /** 편집 대상 사건 번호(서버 처리·저장 엔드포인트 식별자). */
  crimeNumber: string;
  /** 편집 시작 원본(currentCrimeData.editImage ?? image). */
  seedImage: string | null | undefined;
}

/**
 * 서버로 보낼 image를 결정한다(레거시 `EditMain.jsx#prepareImage` 재현).
 * 이미 편집된 data URL이면 그대로, 아니면 bare crimeNumber(서버가 원본을 로드)를 보낸다.
 * 순수 함수라 단위테스트 가능.
 */
export function prepareImage(workingImage: string, crimeNumber: string): string {
  return workingImage.startsWith("data:image") ? workingImage : crimeNumber;
}

export interface UseImageEdit {
  /** 현재 편집 결과(data URL). 초기 = seedImage. */
  workingImage: string;
  /** 프리뷰 이미지: 이진화 라이브 중엔 workingImage에 bakeThreshold를 적용한 디바운스 결과, 아니면 workingImage. */
  displayImage: string;
  /** undo 스택에 항목이 있는지. */
  canUndo: boolean;
  /** 직전 workingImage로 되돌린다(레거시 returnMemo 되돌리기). */
  undo: () => void;
  /** 현재 선택된 편집 툴(null = 미선택). */
  activeTool: EditTool | null;
  /** 툴을 전환한다; 폴리곤 points를 초기화한다. */
  setActiveTool: (tool: EditTool | null) => void;
  /** 수집된 폴리곤 정점(정수, canvas-local). */
  points: Point[];
  /** 클릭 좌표를 canvas-local 정수 정점으로 추가한다. */
  addPoint: (clientX: number, clientY: number, rect: Pick<RectLike, "left" | "top">) => void;
  /** 마지막 정점을 제거한다. */
  removeLastPoint: () => void;
  /** 폴리곤 정점을 모두 비운다. */
  clearPoints: () => void;
  /**
   * 현재 activeTool(background/inpaint)에 맞는 서버 처리를 실행한다. rect는 render_size 산정용
   * 표시 이미지 rect. 3점 미만이거나 폴리곤 툴이 아니면 no-op. 성공 시 workingImage 갱신 + history push +
   * points clear + activeTool 해제.
   */
  submitPolygon: (rect: Pick<RectLike, "width" | "height">) => Promise<void>;
  /** 이진화 임계값(0..255, 기본 127). */
  threshold: number;
  /** 이진화 임계값 설정. */
  setThreshold: (value: number) => void;
  /** 이진화 모드(기본 "standard"). */
  thresholdMode: ThresholdMode;
  /** 이진화 모드 설정. */
  setThresholdMode: (mode: ThresholdMode) => void;
  /** 현재 이진화 프리뷰를 workingImage로 커밋한다(history push + 임계값 리셋 + 툴 해제). */
  applyThreshold: () => Promise<void>;
  /** 노이즈제거 서버 처리를 실행한다(history push + 툴 해제). */
  runDenoise: () => Promise<void>;
  /** 서버 처리 진행 중 여부(로딩 오버레이용). */
  isProcessing: boolean;
  /** 처리 중 오버레이 문구(툴별). */
  processingLabel: string;
  /**
   * 최종 workingImage를 서버에 저장한다. store 갱신·refetch·Sheet 닫기는 호출자(워크벤치) 몫 —
   * 저장된 최종 이미지를 반환하고, 선택적으로 onSaved 콜백에 넘긴다(관심사 분리).
   */
  save: (onSaved?: (finalImage: string) => void) => Promise<string>;
}

export function useImageEdit({ crimeNumber, seedImage }: UseImageEditParams): UseImageEdit {
  const [workingImage, setWorkingImage] = useState<string>(seedImage ?? "");
  const [displayImage, setDisplayImage] = useState<string>(seedImage ?? "");
  const [history, setHistory] = useState<string[]>([]);
  const [activeTool, setActiveToolState] = useState<EditTool | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [thresholdMode, setThresholdMode] = useState<ThresholdMode>(DEFAULT_THRESHOLD_MODE);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingLabel, setProcessingLabel] = useState<string>("");

  const segmentation = useSegmentation(crimeNumber);
  const inpainting = useInpainting(crimeNumber);
  const denoising = useDenoising(crimeNumber);
  const saveMutation = useSaveEditImage(crimeNumber);

  // 비동기 핸들러의 클로저 스테일을 피하려고 최신값을 ref로 유지한다(매 렌더 동기화).
  const workingImageRef = useRef(workingImage);
  workingImageRef.current = workingImage;
  const historyRef = useRef(history);
  historyRef.current = history;

  // 세션 초기화 트리거는 둘뿐이다: (1) 최초/비동기 로드로 seedImage가 빈 값→실제 값이
  // 되거나, (2) 편집 대상 사건(crimeNumber)이 바뀔 때. 저장 후 낙관적 editImage 갱신처럼
  // 세션 진행 중 seedImage가 값→값으로 바뀌는 경우엔 편집 스택(undo 히스토리)을 보존한다
  // — 그렇지 않으면 저장 직후 진행 중이던 편집·되돌리기 스택이 통째로 날아간다.
  const lastSeedRef = useRef(seedImage);
  const sessionCrimeRef = useRef(crimeNumber);
  useEffect(() => {
    const seedChanged = seedImage !== lastSeedRef.current;
    const crimeChanged = crimeNumber !== sessionCrimeRef.current;
    if (!seedChanged && !crimeChanged) return;
    const wasEmpty = !lastSeedRef.current;
    lastSeedRef.current = seedImage;
    sessionCrimeRef.current = crimeNumber;
    // 같은 사건에서 이미 seed가 있던 상태의 값→값 변경(낙관적 갱신)은 초기화하지 않는다.
    if (!crimeChanged && !wasEmpty) return;
    setWorkingImage(seedImage ?? "");
    setDisplayImage(seedImage ?? "");
    setHistory([]);
    setPoints([]);
    setActiveToolState(null);
    setThreshold(DEFAULT_THRESHOLD);
    setThresholdMode(DEFAULT_THRESHOLD_MODE);
  }, [seedImage, crimeNumber]);

  // workingImage가 data URL이 아니면(서버가 URL/경로로 준 이미지) canvas 이진화·저장을 위해
  // data URL로 변환해 교체한다. 교차 출처 URL을 canvas에 그리면 taint되어 getImageData(이진화)가
  // 실패하기 때문. 표시는 URL로도 되므로 변환 완료 전에는 그대로 보이고, 완료되면 self-contained
  // data URL로 바뀐다. seed(원본)·서버 결과(배경제거 등) URL을 여기 한 곳에서 통일 처리한다.
  useEffect(() => {
    if (!workingImage || isDataUrl(workingImage)) return;
    let cancelled = false;
    resolveImageToDataUrl(workingImage)
      .then((dataUrl) => {
        if (!cancelled) setWorkingImage(dataUrl);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("이미지를 편집용으로 불러오지 못했습니다. 서버 CORS 설정을 확인해 주세요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workingImage]);

  // 새 workingImage 커밋 + 직전값 history push(undo용).
  const commit = useCallback((next: string) => {
    setHistory((h) => [...h, workingImageRef.current]);
    setWorkingImage(next);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.length === 0) return;
    const prev = h[h.length - 1];
    setHistory(h.slice(0, -1));
    setWorkingImage(prev);
  }, []);

  const setActiveTool = useCallback((tool: EditTool | null) => {
    setPoints([]);
    setActiveToolState(tool);
  }, []);

  const addPoint = useCallback(
    (clientX: number, clientY: number, rect: Pick<RectLike, "left" | "top">) => {
      setPoints((prev) => [...prev, toCanvasPoint(clientX, clientY, rect)]);
    },
    []
  );

  const removeLastPointHandler = useCallback(() => {
    setPoints((prev) => removeLastPoint(prev));
  }, []);

  const clearPoints = useCallback(() => setPoints([]), []);

  // 이진화 라이브 프리뷰: threshold 툴일 때만 workingImage에 bakeThreshold를 디바운스로 적용.
  // 스테일 bake는 cleanup으로 취소(use-image-adjustments 패턴).
  useEffect(() => {
    if (activeTool !== "threshold") {
      setDisplayImage(workingImage);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      bakeThreshold(workingImage, { threshold, mode: thresholdMode })
        .then((img) => !cancelled && setDisplayImage(img))
        .catch(() => !cancelled && setDisplayImage(workingImage));
    }, PREVIEW_DEBOUNCE);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTool, workingImage, threshold, thresholdMode]);

  const submitPolygon = useCallback(
    async (rect: Pick<RectLike, "width" | "height">) => {
      if (activeTool !== "background" && activeTool !== "inpaint") return;
      if (!isPolygonSubmittable(points)) return; // 3점 미만 no-op(레거시 alert 대체)

      const [renderW, renderH] = computeRenderSize(rect);
      const polygon = serializePolygon(clampPolygon(points, renderW, renderH));
      const image = prepareImage(workingImageRef.current, crimeNumber);
      const mutation = activeTool === "background" ? segmentation : inpainting;

      setProcessingLabel(PROCESSING_LABELS[activeTool]);
      setIsProcessing(true);
      try {
        const next = await mutation.mutateAsync({ polygon, image, renderSize: [renderW, renderH] });
        commit(next);
        setPoints([]);
        setActiveToolState(null);
      } catch {
        // 실패 시 points·activeTool을 보존해 재시도 가능하게 두고(workingImage 미변경) 사용자에게 알린다.
        toast.error(PROCESSING_ERROR_LABELS[activeTool]);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeTool, points, crimeNumber, segmentation, inpainting, commit]
  );

  // 현재 threshold/mode로 workingImage를 즉석 이진화해 반환한다(부수효과 없는 순수 bake).
  // applyThreshold(편집 상태 리셋 포함)와 save(리셋 없이 저장물=표시물 커밋)가 공유한다.
  const bakeCurrentThreshold = useCallback(
    () => bakeThreshold(workingImageRef.current, { threshold, mode: thresholdMode }),
    [threshold, thresholdMode]
  );

  const applyThreshold = useCallback(async () => {
    const baked = await bakeCurrentThreshold();
    commit(baked);
    setThreshold(DEFAULT_THRESHOLD);
    setActiveToolState(null);
  }, [bakeCurrentThreshold, commit]);

  const runDenoise = useCallback(async () => {
    const image = prepareImage(workingImageRef.current, crimeNumber);
    setProcessingLabel(PROCESSING_LABELS.denoise);
    setIsProcessing(true);
    try {
      const next = await denoising.mutateAsync({ image });
      commit(next);
      setActiveToolState(null);
    } catch {
      // 실패 시 workingImage·activeTool 미변경(재시도 가능)하고 사용자에게 알린다.
      toast.error(PROCESSING_ERROR_LABELS.denoise);
    } finally {
      setIsProcessing(false);
    }
  }, [crimeNumber, denoising, commit]);

  const save = useCallback(
    async (onSaved?: (finalImage: string) => void) => {
      setProcessingLabel(SAVING_LABEL);
      setIsProcessing(true);
      try {
        // 이진화 툴 활성 중이면 화면(displayImage)은 미커밋 프리뷰다. 저장물=표시물을 보장하려고
        // 디바운스 결과에 의존하지 않고 현재 threshold/mode로 fresh bake해 커밋한 뒤 그 결과를 저장한다.
        // (편집 상태 리셋은 하지 않는다 — save는 저장이 목적.)
        let finalImage = workingImageRef.current;
        if (activeTool === "threshold") {
          finalImage = await bakeCurrentThreshold();
          commit(finalImage);
        }
        await saveMutation.mutateAsync({ image: finalImage });
        onSaved?.(finalImage);
        return finalImage;
      } catch (error) {
        toast.error("이미지 저장에 실패했습니다. 다시 시도해 주세요.");
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [activeTool, bakeCurrentThreshold, commit, saveMutation]
  );

  const canUndo = useMemo(() => history.length > 0, [history.length]);

  return {
    workingImage,
    displayImage,
    canUndo,
    undo,
    activeTool,
    setActiveTool,
    points,
    addPoint,
    removeLastPoint: removeLastPointHandler,
    clearPoints,
    submitPolygon,
    threshold,
    setThreshold,
    thresholdMode,
    setThresholdMode,
    applyThreshold,
    runDenoise,
    isProcessing,
    processingLabel,
    save,
  };
}
