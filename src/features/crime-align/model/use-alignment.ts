/**
 * 정렬(폴리곤 ROI + 방향 화살표 + 좌우 반전) 상태 소유 훅.
 *
 * SPEC-ALIGN-SETUP-001: 캔버스 상태는 항상 `저장 현장 이미지 좌표계`(saved-scene)
 * 좌표로 보관한다 — 클릭/드래그 시점에 `alignment-geometry`의 `computeScale`/
 * `toSavedPoint`로 즉시 환산해 저장하므로("클릭 좌표는 scale로 환산하여 전송",
 * spec.md §A), 저장·복원·서버 전송 모두 추가 변환 없이 동일한 좌표를 공유한다.
 * 표시(display) 좌표는 렌더링 시점에 UI 컴포넌트가 `toDisplayFromSaved`로 그때그때
 * 역산한다(단일 진실 원천 유지).
 *
 * v0.6.0 CHANGE 3(REQ-ALIGN-017/018/019): 빈 캔버스에서 처음부터 클릭해 그리는 대신
 * 밑창 형상 템플릿을 기본 제공하고(`seedTemplate`), 드래그로 조정하며(`moveWholeShape`/
 * `moveVertexAt`), 앞굽(toe)/뒤꿈치(heel)를 명시적으로 선택한다(`pickArrowPoint`).
 * "처음부터 그리기" 경로(`startFromScratch` + 기존 `addPoint`)도 유지한다.
 *
 * v0.6.0 CHANGE 5(REQ-ALIGN-020): 좌우 반전은 별도 불리언 상태(`flipHorizontal`)로만
 * 관리된다 — `toggleFlip`은 polygon/arrow 좌표를 절대 건드리지 않는다(H2, 이중 반전
 * 방지). 실제 반전 변환은 SPEC-4 전처리가 수행한다.
 *
 * FSD: entities/alignment(읽기 쿼리 + 쓰기 뮤테이션)와 lib(순수 좌표 함수)만 소비한다.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { alignmentKeys, fetchAlignment, saveAlignment } from "@/entities/alignment";

import {
  computeScale,
  isPolygonClosable,
  moveVertex,
  serializePoints,
  toDisplayPoint,
  toSavedPoint,
  translatePolygon,
  type Point,
  type RectLike,
} from "../lib/alignment-geometry";
import { createSoleTemplatePolygon } from "../lib/sole-template";

/** 정렬 캡처 단계 — polygon(폴리곤 드로잉/조정) → arrow(앞굽·뒤꿈치 선택) → review(저장 대기/완료). */
export type AlignmentPhase = "polygon" | "arrow" | "review";

/** 방향 선택 진행 단계 — 다음에 무엇을 선택해야 하는지 UI가 명시적으로 라벨링하는 데 쓴다(REQ-ALIGN-019). */
export type ArrowStep = "toe" | "heel" | "complete";

/** 폴리곤 입력 모드 — template(기본 밑창 템플릿, 드래그로 조정) | scratch(처음부터 클릭으로 그리기). */
export type DrawMode = "template" | "scratch";

export interface UseAlignmentParams {
  /** 정렬 대상 사건 번호. */
  crimeNumber: string;
  /** 정렬 대상 신발 모델 번호(REQ-ALIGN-007b: `model_number`, `shoes_data.id` 아님). */
  modelNumber: string;
}

export interface UseAlignment {
  /** 현재 캡처 단계. */
  phase: AlignmentPhase;
  /** 현재 폴리곤 입력 모드. */
  drawMode: DrawMode;
  /** 폴리곤 정점(`저장 현장 이미지 좌표계`). */
  polygon: Point[];
  /** 앞굽(toe) 지점 — 미선택이면 null. */
  toe: Point | null;
  /** 뒤꿈치(heel) 지점 — 미선택이면 null. */
  heel: Point | null;
  /** [toe, heel] 파생 배열(toe만 있으면 [toe], 없으면 []) — 렌더링·저장 계약 호환용. */
  arrow: Point[];
  /** 다음에 선택해야 할 방향 단계 — UI 라벨링에 사용(REQ-ALIGN-019). */
  arrowStep: ArrowStep;
  /** 좌우 반전 상태(REQ-ALIGN-020). */
  flipHorizontal: boolean;
  /** 클릭 좌표를 즉시 `저장 현장 이미지 좌표계`로 환산해 폴리곤에 추가한다(scratch 모드 전용). */
  addPoint: (clientX: number, clientY: number, rect: RectLike, naturalWidth: number) => void;
  /** 폴리곤을 닫고(3점 이상일 때만) 방향 단계로 전환한다. */
  closePolygon: () => void;
  /** scratch 모드에서 마지막 정점을 제거한다. */
  removeLastPoint: () => void;
  /** 저장된 정렬이 없고 아직 아무것도 그리지 않았으면 밑창 템플릿을 시드한다(REQ-ALIGN-017, 복원 우선). */
  seedTemplate: (naturalWidth: number, naturalHeight: number) => void;
  /** 템플릿을 버리고 처음부터 그리기 시작(REQ-ALIGN-017 — 템플릿은 기본값이지 강제가 아니다). */
  startFromScratch: () => void;
  /** 폴리곤 전체를 표시 좌표 델타만큼 평행 이동한다(전체 이동 드래그, REQ-ALIGN-018 ①). */
  moveWholeShape: (
    dxDisplay: number,
    dyDisplay: number,
    naturalWidth: number,
    dispWidth: number
  ) => void;
  /** 지정한 정점만 새 클릭 좌표로 이동한다(정점별 조정 드래그, REQ-ALIGN-018 ②). */
  moveVertexAt: (
    index: number,
    clientX: number,
    clientY: number,
    rect: RectLike,
    naturalWidth: number
  ) => void;
  /** 앞굽/뒤꿈치 중 하나를 클릭 좌표로 지정한다(REQ-ALIGN-019). */
  pickArrowPoint: (
    kind: "toe" | "heel",
    clientX: number,
    clientY: number,
    rect: RectLike,
    naturalWidth: number
  ) => void;
  /** 앞굽 또는 뒤꿈치 중 하나만 개별 재선택을 시작한다(둘 다 다시 찍지 않아도 됨). */
  clearArrowPoint: (kind: "toe" | "heel") => void;
  /** 좌우 반전 토글 — polygon/arrow 좌표는 절대 변경하지 않는다(H2). */
  toggleFlip: () => void;
  /** 폴리곤·화살표·단계를 모두 초기화하고 재설정을 시작한다(REQ-ALIGN-009). */
  reset: () => void;
  /** 현재 폴리곤+화살표(+반전)를 서버에 UPSERT 저장한다(둘 다 갖춰졌을 때만 유효). */
  save: () => Promise<void>;
  /** 저장 요청 진행 중 여부. */
  isSaving: boolean;
  /** 서버 조회(GET) 진행 중 여부. */
  isLoading: boolean;
  /** "정렬 설정됨" — 서버 확인(polygon·arrow 둘 다 non-null) 또는 방금 저장 성공. */
  isAligned: boolean;
  /** 폴리곤을 지금 닫을 수 있는지(3점 이상). */
  canClosePolygon: boolean;
  /** 지금 저장을 시도할 수 있는지(폴리곤 3점 이상 AND 앞굽·뒤꿈치 모두 지정). */
  canSave: boolean;
}

export function useAlignment({ crimeNumber, modelNumber }: UseAlignmentParams): UseAlignment {
  const queryClient = useQueryClient();
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [toe, setToe] = useState<Point | null>(null);
  const [heel, setHeel] = useState<Point | null>(null);
  const [phase, setPhase] = useState<AlignmentPhase>("polygon");
  const [drawMode, setDrawMode] = useState<DrawMode>("template");
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [templateSeeded, setTemplateSeeded] = useState(false);

  const query = useQuery({
    queryKey: alignmentKeys.detail(crimeNumber, modelNumber),
    queryFn: () => fetchAlignment({ crimeNumber, modelNumber }),
    enabled: Boolean(crimeNumber) && Boolean(modelNumber),
  });

  // (사건, 신발) 쌍이 바뀌면 로컬 편집 상태를 전부 초기화한다(REQ-ALIGN-010 쌍 격리 —
  // 이전 쌍에서 그리던 템플릿/드래그 상태가 다음 쌍으로 새지 않도록 한다).
  useEffect(() => {
    setPolygon([]);
    setToe(null);
    setHeel(null);
    setPhase("polygon");
    setDrawMode("template");
    setFlipHorizontal(false);
    setJustSaved(false);
    setTemplateSeeded(false);
    // crimeNumber/modelNumber 변경에만 반응한다.
  }, [crimeNumber, modelNumber]);

  // 서버에 저장된 정렬을 캔버스에 복원한다(REQ-ALIGN-008/020b) — 템플릿보다 항상
  // 우선한다(REQ-ALIGN-017 "복원 우선" — 저장본이 있으면 템플릿을 씌우지 않는다).
  useEffect(() => {
    const loaded = query.data;
    if (!loaded?.polygon || !loaded?.arrow) return;
    setPolygon(loaded.polygon.map(([x, y]) => [x, y] as Point));
    setToe(loaded.arrow[0] ? ([loaded.arrow[0][0], loaded.arrow[0][1]] as Point) : null);
    setHeel(loaded.arrow[1] ? ([loaded.arrow[1][0], loaded.arrow[1][1]] as Point) : null);
    setFlipHorizontal(Boolean(loaded.flipHorizontal));
    setPhase("review");
    setTemplateSeeded(true); // 복원됐으므로 이후 템플릿 시드를 막는다.
    // query.data 변화에만 반응한다(사용자가 그리는 중간에 재실행되지 않도록).
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () =>
      saveAlignment({
        crimeNumber,
        modelNumber,
        polygon: serializePoints(polygon) as [number, number][],
        arrow: serializePoints(toe && heel ? [toe, heel] : []) as [number, number][],
        flipHorizontal,
      }),
    onSuccess: () => {
      setJustSaved(true);
      void queryClient.invalidateQueries({
        queryKey: alignmentKeys.detail(crimeNumber, modelNumber),
      });
      toast.success("정렬이 저장되었습니다.");
    },
    onError: () => {
      toast.error("정렬 저장에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  // ─── 폴리곤: 밑창 템플릿 기본 제공(REQ-ALIGN-017) ───
  const seedTemplate = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (templateSeeded) return;
      if (query.isLoading) return;
      if (query.data?.polygon && query.data?.arrow) return; // 복원 우선
      if (polygon.length > 0) return;
      if (naturalWidth <= 0 || naturalHeight <= 0) return;
      setPolygon(createSoleTemplatePolygon(naturalWidth, naturalHeight));
      setDrawMode("template");
      setTemplateSeeded(true);
    },
    [templateSeeded, query.isLoading, query.data, polygon.length]
  );

  // ─── 폴리곤: 템플릿을 버리고 처음부터 그리기(REQ-ALIGN-017 — 템플릿은 강제가 아니다) ───
  const startFromScratch = useCallback(() => {
    setPolygon([]);
    setDrawMode("scratch");
    setTemplateSeeded(true); // 자동 템플릿 재시드를 막는다.
    setPhase("polygon");
  }, []);

  // ─── 폴리곤: 처음부터 그리기(클릭 추가, scratch 모드에서만 동작) ───
  const addPoint = useCallback(
    (clientX: number, clientY: number, rect: RectLike, naturalWidth: number) => {
      if (phase !== "polygon" || drawMode !== "scratch") return;
      const scale = computeScale(naturalWidth, rect.width);
      const display = toDisplayPoint(clientX, clientY, rect);
      const saved = toSavedPoint(display, scale);
      setPolygon((prev) => [...prev, saved]);
    },
    [phase, drawMode]
  );

  const closePolygon = useCallback(() => {
    if (!isPolygonClosable(polygon)) return;
    setPhase("arrow");
  }, [polygon]);

  const removeLastPoint = useCallback(() => {
    if (phase === "polygon" && drawMode === "scratch") {
      setPolygon((prev) => prev.slice(0, -1));
    }
  }, [phase, drawMode]);

  // ─── 폴리곤: 드래그 미세 조정(REQ-ALIGN-018) ───
  const moveWholeShape = useCallback(
    (dxDisplay: number, dyDisplay: number, naturalWidth: number, dispWidth: number) => {
      if (phase !== "polygon") return;
      const scale = computeScale(naturalWidth, dispWidth);
      setPolygon((prev) => translatePolygon(prev, dxDisplay * scale, dyDisplay * scale));
    },
    [phase]
  );

  const moveVertexAt = useCallback(
    (index: number, clientX: number, clientY: number, rect: RectLike, naturalWidth: number) => {
      if (phase !== "polygon") return;
      const scale = computeScale(naturalWidth, rect.width);
      const display = toDisplayPoint(clientX, clientY, rect);
      const saved = toSavedPoint(display, scale);
      setPolygon((prev) => moveVertex(prev, index, saved));
    },
    [phase]
  );

  // ─── 방향: 앞굽/뒤꿈치 명시 2점 선택(REQ-ALIGN-019) ───
  const pickArrowPoint = useCallback(
    (
      kind: "toe" | "heel",
      clientX: number,
      clientY: number,
      rect: RectLike,
      naturalWidth: number
    ) => {
      if (phase !== "arrow") return;
      const scale = computeScale(naturalWidth, rect.width);
      const display = toDisplayPoint(clientX, clientY, rect);
      const saved = toSavedPoint(display, scale);
      if (kind === "toe") setToe(saved);
      else setHeel(saved);
    },
    [phase]
  );

  const clearArrowPoint = useCallback((kind: "toe" | "heel") => {
    if (kind === "toe") setToe(null);
    else setHeel(null);
    setPhase((prev) => (prev === "review" ? "arrow" : prev));
  }, []);

  // 앞굽·뒤꿈치가 모두 채워지면 review(저장 대기) 단계로 자동 전환한다.
  useEffect(() => {
    if (phase === "arrow" && toe && heel) {
      setPhase("review");
    }
  }, [phase, toe, heel]);

  // ─── 좌우 반전(REQ-ALIGN-020) — 좌표는 절대 건드리지 않는다(H2, 이중 반전 방지). ───
  const toggleFlip = useCallback(() => {
    setFlipHorizontal((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setPolygon([]);
    setToe(null);
    setHeel(null);
    setPhase("polygon");
    setDrawMode("template");
    setJustSaved(false);
    setTemplateSeeded(false);
    // flipHorizontal은 사용자의 명시적 반전 판단이므로 재설정으로 초기화하지 않는다.
  }, []);

  const arrow = useMemo<Point[]>(
    () => (toe && heel ? [toe, heel] : toe ? [toe] : []),
    [toe, heel]
  );

  const save = useCallback(async () => {
    if (!isPolygonClosable(polygon) || !(toe && heel)) return;
    await mutation.mutateAsync();
  }, [polygon, toe, heel, mutation]);

  const isAligned = useMemo(
    () => justSaved || (Boolean(query.data?.polygon) && Boolean(query.data?.arrow)),
    [justSaved, query.data]
  );

  const arrowStep: ArrowStep = toe && heel ? "complete" : toe ? "heel" : "toe";

  return {
    phase,
    drawMode,
    polygon,
    toe,
    heel,
    arrow,
    arrowStep,
    flipHorizontal,
    addPoint,
    closePolygon,
    removeLastPoint,
    seedTemplate,
    startFromScratch,
    moveWholeShape,
    moveVertexAt,
    pickArrowPoint,
    clearArrowPoint,
    toggleFlip,
    reset,
    save,
    isSaving: mutation.isPending,
    isLoading: query.isLoading,
    isAligned,
    canClosePolygon: isPolygonClosable(polygon),
    canSave: isPolygonClosable(polygon) && Boolean(toe && heel),
  };
}
