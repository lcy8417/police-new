import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import type { PatternZone } from "@/entities/pattern";
import { validateShoeForm, type Shoe } from "@/entities/shoe";
import { useAutoPlay } from "@/shared/lib/use-auto-play";
import type { FilterGroup } from "@/shared/ui/kit";
import {
  ShoeDbPanel,
  ShoeDbScreen,
  type ShoeExtractState,
  type ShoeAiMarks,
  type ShoeCardSize,
  type ShoeDbFilters,
  type ShoeDbScreenProps,
  type ShoeDbView,
  type ShoeDialogState,
} from "@/widgets/shoe-db";

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  isIntervalMs,
  isStringArray,
  oneOf,
  useDevCase,
  useDevPlus,
  useDevViewer,
  useRememberedState,
} from "../frame";
import { sampleSoleUrl } from "../mock-assets/sample-images";
import {
  makeS10AiDetails,
  makeS10AllShoes,
  makeS10CardInfo,
  S10_STAGE_SUMMARY,
  S10_DUPLICATE_MESSAGE,
  S10_AI_SUGGEST,
  S10_EMPTY_FILTERS,
  S10_EXTRACT_MS,
  S10_LIBRARY,
  S10_OFFICES,
  S10_PAGE_SIZE,
  type S10Case,
} from "./mock-cases";

const isCardSize = oneOf<ShoeCardSize>(["작게", "보통", "크게"]);

type QuickValues = { status: string[]; dup: string[] };
const EMPTY_QUICK: QuickValues = { status: [], dup: [] };

const info = devScreen("s10");

const BLANK: Shoe = {
  ftwrId: "",
  modlNm: "",
  brandCode: "",
  makrCode: "",
  colctPlace: "",
  colctYear: "",
  image: null,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
};

/** 모든 AI 제안을 확인된 AI 문양으로 */
function confirmMarks(marks: ShoeAiMarks | undefined): ShoeAiMarks | undefined {
  if (!marks) return marks;
  return Object.fromEntries(
    Object.entries(marks).map(([z, row]) => [z, Object.fromEntries(Object.keys(row ?? {}).map((n) => [n, "ai" as const]))]),
  ) as ShoeAiMarks;
}

/** 빠진 문양의 AI 표시는 지운다(빼고 손으로 다시 넣으면 수동) */
function pruneMarks(marks: ShoeAiMarks | undefined, form: Shoe): ShoeAiMarks | undefined {
  if (!marks) return marks;
  const out: ShoeAiMarks = {};
  for (const z of ["top", "mid", "bottom", "outline"] as const) {
    const row = marks[z];
    if (row) out[z] = Object.fromEntries(Object.entries(row).filter(([n]) => form[z].includes(n)));
  }
  return out;
}

/** 상세 필터(「조회」로 적용한 값) — 화류번호 · 상표 · 제조사(앞부분 맞춤) · 그룹명 · 문양 입력 · 승인. 가짜 신발에 없는 칸(성별 · 등록일자 · 관서)은 거르지 않는다 */
function matchesFilters(s: Shoe, f: ShoeDbFilters, status: string | undefined): boolean {
  const has = (v: string | null | undefined, q: string) => q.trim() === "" || (v ?? "").toLowerCase().includes(q.trim().toLowerCase());
  if (!has(s.ftwrId, f.ftwrId) || !has(s.brandCode, f.brandCode) || !has(s.makrCode, f.makrCode) || !has(s.ftwrGroupNm, f.groupNm)) return false;
  const patterned = s.top.length + s.mid.length + s.bottom.length + s.outline.length > 0;
  if (f.patternInput === "in" && !patterned) return false;
  if (f.patternInput === "out" && patterned) return false;
  // 승인 = 작업 단계가 남지 않은 신발(문양 대기 · 승인 대기 · 측면 없음 · AI 확인 필요는 모두 미승인 — 3회차 검수: 승인 대기만 미승인으로 쳐 뒤집히던 것)
  const approved = status === undefined;
  if (f.approval === "yes" && !approved) return false;
  if (f.approval === "no" && approved) return false;
  return true;
}

// S10 신발문양 관리 진열 페이지. 값은 가짜, 저장은 토스트로만 확인한다.
export function S10DevPage() {
  const caseName = useDevCase(SCREEN_CASES.s10, "ready");
  // 케이스를 바꾸면 안쪽 상태를 새로 시작한다(전환 막대는 다시 불러오지 않고 주소만 바꾸므로)
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S10Content key={caseName} caseName={caseName} />
    </DevScreenFrame>
  );
}

export interface S10ContentProps {
  caseName: S10Case;
  /** 사건관리 위 「신발 DB」 슬라이드 패널 갈래(11/17 갈래 D) — 컴팩트 거르기 · 큰 편집 판 · 자동 넘기기 없음 */
  inPanel?: boolean;
}

/** 틀 없는 신발 DB 내용 — 진열 페이지(S10)와 사건관리 위 「신발 DB」 슬라이드 패널(S01 `?shoe=1`)이 함께 쓴다 */
export function S10Content({ caseName, inPanel = false }: S10ContentProps) {
  const viewer = useDevViewer();
  const showPlus = useDevPlus();
  const [params] = useSearchParams();
  const [allShoes, setAllShoes] = React.useState(makeS10AllShoes);
  const cardInfo = React.useMemo(() => makeS10CardInfo(allShoes), [allShoes]);
  const [aiDetails] = React.useState(makeS10AiDetails);
  const [filters, setFilters] =
    React.useState<ShoeDbFilters>(S10_EMPTY_FILTERS);
  // 「조회」를 눌러야 걸리는 상세 필터(SCAS 처럼 — 입력 중에는 목록이 바뀌지 않음). 처음 · 「조건 지우기」 뒤에는 걸지 않는다
  // (기본 칸 값이 SCAS 기본 「미승인 · 미입력」이라 처음부터 걸면 목록이 비어 보인다). 2회차 검수 — 조회가 목록에 안 걸리던 것
  const [applied, setApplied] = React.useState<ShoeDbFilters | null>(null);
  // 시안 기본은 문양보기(카드). `?view=list` 로 표를 먼저 볼 수 있다
  const [view, setView] = React.useState<ShoeDbView>(
    params.get("view") === "list" ? "list" : "pattern",
  );
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const [dialog, setDialog] = React.useState<ShoeDialogState | null>(() =>
    caseName === "duplicate"
      ? {
          mode: "new",
          form: { ...BLANK, ftwrId: "00758", modlNm: "모델 100" },
          saveError: S10_DUPLICATE_MESSAGE,
        }
      : null,
  );

  const status =
    caseName === "loading"
      ? "loading"
      : caseName === "error"
        ? "error"
        : caseName === "empty"
          ? "empty"
          : "ready";

  // ---- r3: 빠른 찾기 · 카드 크기 · 열 · 자동 넘기기(모두 이 페이지가 들고 있다) ----
  const [query, setQuery] = React.useState("");
  const [quickValues, setQuickValues] = React.useState<QuickValues>(EMPTY_QUICK);
  const [cardSize, setCardSize] = useRememberedState<ShoeCardSize>("s10", "cardSize", "보통", isCardSize);
  const [hiddenColumns, setHiddenColumns] = useRememberedState<string[]>("s10", "hiddenColumns", [], isStringArray);
  const [intervalMs, setIntervalMs] = useRememberedState<number>("s10", "interval", 2000, isIntervalMs);
  const [autoMode, setAutoMode] = React.useState<"manual" | "auto">("manual");

  // 작업 상태 칩은 신규(+α) 값이라 신규를 끄면 칩도 거르기도 없다. 화류번호 · 모델명 · 상표 검색은 항상 있다.
  const needle = query.trim().toLowerCase();
  const filtered = allShoes.filter((s) => {
    if (needle !== "" && ![s.ftwrId, s.modlNm, s.brandCode].some((t) => (t ?? "").toLowerCase().includes(needle))) return false;
    if (applied && !matchesFilters(s, applied, cardInfo[s.ftwrId]?.status)) return false;
    if (!showPlus) return true;
    const info = cardInfo[s.ftwrId];
    if (quickValues.status.length > 0 && !(info && quickValues.status.includes(info.status))) return false;
    if (quickValues.dup.length > 0 && info?.mark !== "dup") return false;
    return true;
  });
  const pageRows = filtered.slice((page - 1) * S10_PAGE_SIZE, page * S10_PAGE_SIZE);
  const pageOf = (index: number) => Math.floor(index / S10_PAGE_SIZE) + 1;

  const autoEnabled = !inPanel && autoMode === "auto" && view === "pattern" && status === "ready" && dialog === null;
  const player = useAutoPlay({
    count: filtered.length,
    intervalMs,
    enabled: autoEnabled,
    onStep: (i) => setPage(pageOf(i)),
  });
  const hoverPaused = React.useRef(false);

  // 조건을 바꾸면 쪽 · 강조 위치 모두 처음으로(goTo = 바로 옮기기 + 주기 다시)
  const afterFilterChange = () => {
    setPage(1);
    player.goTo(0);
  };
  // 자동 모드에서 쪽을 직접 넘기면 그 쪽 첫 카드부터 이어 간다
  const handlePageChange = (next: number) => {
    setPage(next);
    if (autoMode === "auto") player.goTo((next - 1) * S10_PAGE_SIZE);
  };

  // 패널 뚜껑 칩은 수를 단다(전체 신발 기준)
  const countOf = (pred: (i: (typeof cardInfo)[string] | undefined) => boolean) =>
    inPanel ? allShoes.filter((s) => pred(cardInfo[s.ftwrId])).length : undefined;
  const groups: FilterGroup[] = showPlus
    ? [
        {
          key: "status",
          label: "상태",
          value: quickValues.status,
          options: ["문양 대기", "승인 대기", "측면 없음", "AI 확인 필요"].map((v) => ({
            value: v,
            label: v,
            count: countOf((i) => i?.status === v),
          })),
        },
        {
          key: "dup",
          label: "표시",
          value: quickValues.dup,
          options: [{ value: "dup", label: "중복 의심", count: countOf((i) => i?.mark === "dup") }],
        },
      ]
    : [];
  const runSearch = () => {
    setApplied(filters);
    afterFilterChange();
  };
  const resetFilters = () => {
    setFilters(S10_EMPTY_FILTERS);
    setApplied(null);
    afterFilterChange();
  };
  const clearQuick = () => {
    setQuery("");
    setQuickValues(EMPTY_QUICK);
    afterFilterChange();
  };

  const open = (ftwrId: string) => {
    const shoe = allShoes.find((s) => s.ftwrId === ftwrId);
    if (!shoe) return;
    setSelectedId(ftwrId);
    setDialog({
      mode: "edit",
      form: shoe,
      // 패널 편집 판은 문양정보부터(문양 입력이 주 업무)
      initialTab: inPanel || params.get("tab") === "pattern" ? "pattern" : "basic",
    });
  };

  // 저장: 화면 검사(validateShoeForm — 신발ID 1~8자 · 예약어 count · 수집연도 4자리)를 서버보다 먼저 하고,
  // 저장한 값은 목록에 남긴다(3회차 검수 — 검사 없이 저장되고 다시 열면 고친 값이 사라지던 것)
  const save = () => {
    if (!dialog) return;
    const id = dialog.form.ftwrId;
    if (dialog.mode === "new" && id.trim() === "") return setDialog({ ...dialog, saveError: "신발ID를 입력하세요" });
    if (dialog.mode === "new" && allShoes.some((s) => s.ftwrId === id))
      return setDialog({ ...dialog, saveError: S10_DUPLICATE_MESSAGE });
    const invalid = validateShoeForm(dialog.form, dialog.mode);
    if (invalid) return setDialog({ ...dialog, saveError: invalid });
    const saved = dialog.form;
    setAllShoes((prev) => (dialog.mode === "new" ? [saved, ...prev] : prev.map((s) => (s.ftwrId === saved.ftwrId ? saved : s))));
    toast.success(`저장했습니다 (시안): ${id}`);
    setDialog(null);
  };

  // ---- 패널 편집 판(11/17 갈래 D): AI 문양 추출 흉내 · 이전/다음 · 승인 ----
  const [extractState, setExtractState] = React.useState<ShoeExtractState>("idle");
  const extractTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(extractTimer.current), []);
  const editingId = dialog?.mode === "edit" ? dialog.form.ftwrId : undefined;
  // 다른 신발로 넘어가면 추출 상태를 처음으로
  React.useEffect(() => {
    window.clearTimeout(extractTimer.current);
    setExtractState("idle");
  }, [editingId]);
  const extract = () => {
    setExtractState("running");
    window.clearTimeout(extractTimer.current);
    extractTimer.current = window.setTimeout(() => {
      setDialog((d) => {
        if (!d) return d;
        const form = { ...d.form };
        const marks: ShoeAiMarks = { ...d.aiMarks };
        // AI 는 상 · 중 · 하만 제안한다(윤곽은 AI 미지원 — 가중치 스펙 §8-7). 출처는 부위별로 남긴다(2회차 검수)
        for (const zone of ["top", "mid", "bottom"] as const) {
          const fresh = S10_AI_SUGGEST[zone].filter((n) => !form[zone].includes(n));
          form[zone] = [...form[zone], ...fresh];
          marks[zone] = { ...marks[zone], ...Object.fromEntries(fresh.map((n) => [n, "suggested" as const])) };
        }
        return { ...d, form, aiMarks: marks };
      });
      setExtractState("done");
    }, S10_EXTRACT_MS);
  };
  const editIndex = editingId ? filtered.findIndex((s) => s.ftwrId === editingId) : -1;
  const openAt = (i: number) => {
    const target = filtered[i];
    if (!target) return;
    setPage(pageOf(i));
    open(target.ftwrId);
  };
  const panelExtra = {
    library: S10_LIBRARY,
    extractState,
    onExtract: extract,
    // 확인해도 AI 출처는 남긴다(점선 제안 → 확인된 AI 문양 — 수동으로 바뀌지 않음, 2회차 검수)
    onConfirmAi: () => setDialog((d) => (d ? { ...d, aiMarks: confirmMarks(d.aiMarks) } : d)),
    onConfirmAiOne: (zone: PatternZone, name: string) =>
      setDialog((d) => (d && d.aiMarks?.[zone]?.[name] ? { ...d, aiMarks: { ...d.aiMarks, [zone]: { ...d.aiMarks[zone], [name]: "ai" } } } : d)),
    onPrevShoe: editIndex > 0 ? () => openAt(editIndex - 1) : undefined,
    onNextShoe: editIndex >= 0 && editIndex < filtered.length - 1 ? () => openAt(editIndex + 1) : undefined,
    onApprove: () => toast.success(`승인했습니다 (시안): ${dialog?.form.ftwrId ?? ""}`),
  };

  const common: Omit<ShoeDbScreenProps, "auto"> = {
    showPlus,
    onPlusAction: () => toast("시안 — 기능 준비 중"),
    stageSummary: S10_STAGE_SUMMARY,
    cardInfo,
    aiDetails,
    status,
    errorAt: "14:32",
    onRetry: () => toast("다시 조회합니다 (시안)"),
    isAdmin: viewer.isAdmin,
    features: viewer.features,
    filters,
    onFiltersChange: setFilters,
    officeItems: S10_OFFICES,
    onSearch: runSearch,
    onReset: resetFilters,
    view,
    onViewChange: setView,
    shoes: pageRows,
    total: filtered.length,
    page,
    pageSize: S10_PAGE_SIZE,
    onPageChange: handlePageChange,
    selectedId,
    onOpenShoe: open,
    onRegister: () => setDialog({ mode: "new", form: BLANK }),
    dialog,
    onFormChange: (form: Shoe) => setDialog((d) => (d ? { ...d, form, aiMarks: pruneMarks(d.aiMarks, form), saveError: undefined } : d)),
    onSave: save,
    onCloseDialog: () => setDialog(null),
    // 진열용: 이미지가 없는 새 등록은 표본 밑창 그림을 넣어 회전 · AI 문양 추출을 이어서 볼 수 있게(3회차 검수 — 영구 잠기던 것)
    onReplaceImage: () => {
      toast("이미지를 고릅니다 (시안)");
      setDialog((d) => (d && !d.form.image ? { ...d, form: { ...d.form, image: sampleSoleUrl("00758", { kind: "shoe" }) } } : d));
    },
    onRotateImage: () => toast("이미지를 90도 돌립니다 (시안)"),
    quick: {
      query,
      onQueryChange: (q: string) => {
        setQuery(q);
        afterFilterChange();
      },
      groups,
      onGroupChange: (key: string, values: string[]) => {
        setQuickValues((prev) => ({ ...prev, [key]: values }));
        afterFilterChange();
      },
      onClear: clearQuick,
      resultCount: filtered.length,
      total: allShoes.length,
    },
    cardSize,
    onCardSizeChange: setCardSize,
  };

  if (inPanel) return <ShoeDbPanel {...common} {...panelExtra} filtersApplied={applied !== null} />;

  return (
    <ShoeDbScreen
      showPlus={showPlus}
      onPlusAction={() => toast("시안 — 기능 준비 중")}
      stageSummary={S10_STAGE_SUMMARY}
      cardInfo={cardInfo}
      aiDetails={aiDetails}
      status={status}
      errorAt="14:32"
      onRetry={() => toast("다시 조회합니다 (시안)")}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      filters={filters}
      onFiltersChange={setFilters}
      officeItems={S10_OFFICES}
      onSearch={runSearch}
      onReset={resetFilters}
      view={view}
      onViewChange={setView}
      shoes={pageRows}
      total={filtered.length}
      page={page}
      pageSize={S10_PAGE_SIZE}
      onPageChange={handlePageChange}
      selectedId={selectedId}
      onOpenShoe={open}
      onRegister={() => setDialog({ mode: "new", form: BLANK })}
      dialog={dialog}
      onFormChange={(form) =>
        setDialog((d) => (d ? { ...d, form, saveError: undefined } : d))
      }
      onSave={save}
      onCloseDialog={() => setDialog(null)}
      onReplaceImage={() => toast("이미지를 고릅니다 (시안)")}
      onRotateImage={() => toast("이미지를 90도 돌립니다 (시안)")}
      quick={{
        query,
        onQueryChange: (q) => {
          setQuery(q);
          afterFilterChange();
        },
        groups,
        onGroupChange: (key, values) => {
          setQuickValues((prev) => ({ ...prev, [key]: values }));
          afterFilterChange();
        },
        onClear: clearQuick,
        resultCount: filtered.length,
        total: allShoes.length,
      }}
      cardSize={cardSize}
      onCardSizeChange={setCardSize}
      hiddenColumns={hiddenColumns}
      onHiddenColumnsChange={setHiddenColumns}
      auto={{
        mode: autoMode,
        onModeChange: (m) => {
          // 자동으로 바꾸면 강조된 카드가 있는 쪽으로
          if (m === "auto") setPage(pageOf(player.index));
          setAutoMode(m);
        },
        intervalMs,
        onIntervalChange: setIntervalMs,
        playing: player.playing,
        onPlayPause: () => (player.playing ? player.pause() : player.play()),
        position: { index: player.index, total: filtered.length },
        remainingRatio: intervalMs > 0 ? player.remainingMs / intervalMs : 0,
        highlightId: filtered[player.index]?.ftwrId,
        onStep: (delta) => (delta > 0 ? player.next() : player.prev()),
        onHoverChange: (hovering) => {
          if (hovering && player.playing) {
            hoverPaused.current = true;
            player.pause();
          } else if (!hovering && hoverPaused.current) {
            hoverPaused.current = false;
            player.play();
          }
        },
      }}
    />
  );
}
