import { useCallback, useMemo, useRef, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { PatternZone } from "@/entities/pattern"
import { FEATURES } from "@/entities/session"
import {
  fetchShoeDetail,
  fetchShoesCount,
  fetchShoesList,
  registerShoe,
  fetchShoeStages,
  shoeKeys,
  SHOES_PAGE_SIZE,
  updateShoe,
  validateShoeForm,
  type Shoe,
} from "@/entities/shoe"
import { useCodes } from "@/entities/code"
import { hasFeature, isAdmin, useSessionStore } from "@/features/auth"
import {
  SHOE_PATTERN_LIBRARY,
  approveShoe,
  extractShoePatterns,
  readSoleFile,
  rotateSoleImage,
  saveShoePatterns,
  shoeExtractImage,
} from "@/features/shoe-repository"
import { ApiError } from "@/shared/api"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import {
  SHOE_STAGE_LABEL,
  ShoeDbPanel,
  toCardInfo,
  toShoeListFilters,
  toStageSummary,
  type ShoeAiMarks,
  type ShoeCardSize,
  type ShoeDbFilters,
  type ShoeDbView,
  type ShoeDialogState,
  type ShoeExtractState,
  type ShoeOfficeItem,
  type ShoeStageKey,
} from "@/widgets/shoe-db"

// 신발 DB 슬라이드 패널 본문(새 사건관리 위 막대 「신발 DB」 · `/cases?shoe=1`, 결정 기록 §4) — 승인 시안 `ShoeDbPanel` · `ShoeEditor`
// 그대로에 실제 값(B 단계 서버 J1~J8 · C3)만 꽂는다.
//   목록 · 개수 = J1 · J2(상세 거르기 「조회」 · 뚜껑 칩 작업 단계 · 승인 · 문양 입력은 서버가 거름), 칩 수 · 승인 진행 = J8, 카드 상태 = J1 `work_status`
//   편집 판 = J3 상세 → 「저장」(등록 J4 / 등록 담당 J5 / 문양 입력 담당 J6) · 「승인」(J7) · AI 문양 추출(C3 `type=shoes`)
//   분업: 등록 = SHOE_EDIT, 문양 입력 = SHOE_PATTERN(또는 SHOE_EDIT), 승인 = SHOE_APPROVE(관리자는 전부)
// 빠른 찾기(화류번호 · 모델명 · 상표 글자)는 서버에 모델명 거르기가 없어 **이 쪽(50개) 안에서만** 거른다.

const EMPTY_FILTERS: ShoeDbFilters = {
  ftwrId: "",
  makrCode: "",
  sex: "all",
  regFrom: "",
  regTo: "",
  brandCode: "",
  approval: "all",
  office: null,
  groupNm: "",
  patternInput: "all",
  shoeKind: "",
  remark: "",
}

const BLANK_SHOE: Shoe = {
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
}

const ZONES = ["top", "mid", "bottom", "outline"] as const
const META_KEYS = ["ftwrId", "modlNm", "brandCode", "makrCode", "colctPlace", "colctYear"] as const
const STAGE_KEYS: readonly ShoeStageKey[] = ["pattern", "group", "approve"]
// 뚜껑 칩(바로 걸림) — 승인(J1 `approval`) · 문양 입력(J1 `pattern_input`). 예전 상세 조건의 라디오(전체 · 승인 · 미승인 / 전체 · 입력 · 미입력)를 칩으로.
// 글자는 상태(「승인됨」) — 할 일 단추(「승인」)와 헷갈리지 않게
const APPROVAL_CHIPS = [
  { value: "yes", label: "승인됨" },
  { value: "no", label: "미승인" },
]
const PATTERN_CHIPS = [
  { value: "in", label: "문양 입력됨" },
  { value: "out", label: "문양 미입력" },
]

/** 칩 묶음은 하나만 켠다 — 새로 누른 값, 켜진 칩을 다시 누르면 풀림 */
const pickOne = (values: readonly string[], current: string | null): string | null => values.find((v) => v !== current) ?? null

const has = (value: string | null | undefined, needle: string) => (value ?? "").toLowerCase().includes(needle)

/** 이 쪽 안 빠른 찾기 — 화류번호 · 모델명 · 상표 */
function quickFilter(shoes: readonly Shoe[], query: string): Shoe[] {
  const q = query.trim().toLowerCase()
  if (q === "") return [...shoes]
  return shoes.filter((s) => has(s.ftwrId, q) || has(s.modlNm, q) || has(s.brandCode, q))
}

/** 조회 실패를 확인한 시각 「시:분」(KST) */
function kstClock(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(11, 16)
}

/** 편집 중인 판 — 처음 값(initial)과 비교해 바뀜 여부를 본다 */
interface ShoeDraft {
  /** 판 열쇠(새 등록 = "new", 수정 = 신발 ID@읽은 시각) — 늦게 온 AI 추출 결과가 다른 판에 섞이지 않게 */
  key: string
  initial: Shoe
  form: Shoe
  aiMarks?: ShoeAiMarks
  saveError?: string
  /** 그림을 새로 올렸거나 돌렸나(수정 저장 때 J5 `image`로 보낸다) */
  imageChanged: boolean
}

function isDirty(d: ShoeDraft): boolean {
  if (d.imageChanged) return true
  if (META_KEYS.some((k) => (d.form[k] ?? "") !== (d.initial[k] ?? ""))) return true
  return ZONES.some((z) => d.form[z].join("\n") !== d.initial[z].join("\n"))
}

/** 빠진 문양의 AI 표시는 지운다(빼고 손으로 다시 넣으면 수동) */
function pruneMarks(marks: ShoeAiMarks | undefined, form: Shoe): ShoeAiMarks | undefined {
  if (!marks) return marks
  const out: ShoeAiMarks = {}
  for (const z of ZONES) {
    const row = marks[z]
    if (row) out[z] = Object.fromEntries(Object.entries(row).filter(([n]) => form[z].includes(n)))
  }
  return out
}

/** 모든 AI 제안을 확인된 AI 문양으로(출처는 남긴다) */
function confirmMarks(marks: ShoeAiMarks | undefined): ShoeAiMarks | undefined {
  if (!marks) return marks
  return Object.fromEntries(
    Object.entries(marks).map(([z, row]) => [z, Object.fromEntries(Object.keys(row ?? {}).map((n) => [n, "ai" as const]))]),
  ) as ShoeAiMarks
}

const errorText = (error: unknown, fallback: string) => (error instanceof ApiError && error.detail ? error.detail : fallback)

export interface ShoeDbPanelContainerProps {
  /** 편집(보기)로 연 신발 ID(주소 `ftwr`, 앞자리 0 보존). 없으면 목록 */
  ftwrId: string | null
  /** 새 신발 등록 중(주소 `shoeNew=1`) */
  isNew: boolean
  onOpenShoe: (ftwrId: string) => void
  onNewShoe: () => void
  /** 편집 판 → 목록 */
  onBackToList: () => void
}

export function ShoeDbPanelContainer({ ftwrId, isNew, onOpenShoe, onNewShoe, onBackToList }: ShoeDbPanelContainerProps) {
  const user = useSessionStore((s) => s.user)
  // 등록관서 거르기 목록 = 관서 코드표(A7 `ORG` — 값 = org_id 문자열, J1 `regist_org`)
  const orgCodes = useCodes("ORG")
  const officeItems = useMemo<ShoeOfficeItem[]>(
    () => (orgCodes.data ?? []).map((o) => ({ value: o.code, label: o.codeNm })),
    [orgCodes.data]
  )
  const duty = useMemo(() => {
    const canRegister = hasFeature(user, FEATURES.SHOE_EDIT)
    return {
      canRegister,
      canPattern: canRegister || hasFeature(user, FEATURES.SHOE_PATTERN),
      canApprove: hasFeature(user, FEATURES.SHOE_APPROVE),
    }
  }, [user])
  const queryClient = useQueryClient()

  // ---- 목록 ----
  const [page, setPage] = useState(1) // 목록 쪽(1부터) — 서버 쪽은 0부터
  const [view, setView] = useState<ShoeDbView>("pattern")
  const [cardSize, setCardSize] = useState<ShoeCardSize>("보통")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<ShoeDbFilters>(EMPTY_FILTERS)
  // 「조회」로 건 상세 조건(펴 놓고 고치는 값과 따로) · 뚜껑 칩(작업 단계 · 승인 · 문양 입력 — 누르면 바로 걸림)
  const [applied, setApplied] = useState<ShoeDbFilters | null>(null)
  const [stage, setStage] = useState<ShoeStageKey | null>(null)
  const [approval, setApproval] = useState<string | null>(null)
  const [patternInput, setPatternInput] = useState<string | null>(null)
  const listFilters = useMemo(
    () =>
      toShoeListFilters(
        { ...(applied ?? EMPTY_FILTERS), approval: approval ?? "all", patternInput: patternInput ?? "all" },
        stage,
      ),
    [applied, stage, approval, patternInput],
  )

  const countQuery = useQuery({ queryKey: shoeKeys.count(listFilters), queryFn: () => fetchShoesCount(listFilters) })
  const shoesQuery = useQuery({
    queryKey: shoeKeys.list(page - 1, listFilters),
    queryFn: () => fetchShoesList(page - 1, listFilters),
    placeholderData: keepPreviousData,
  })
  const stagesQuery = useQuery({ queryKey: shoeKeys.stages(), queryFn: fetchShoeStages })
  const pageShoes = useMemo(() => shoesQuery.data ?? [], [shoesQuery.data])
  const shown = useMemo(() => quickFilter(pageShoes, query), [pageShoes, query])
  const cardInfo = useMemo(() => toCardInfo(pageShoes), [pageShoes])
  const stageSummary = useMemo(
    () => (stagesQuery.data ? toStageSummary(stagesQuery.data, stage) : undefined),
    [stagesQuery.data, stage],
  )

  // ---- 편집 판 ----
  const editing = isNew || ftwrId !== null
  const detailQuery = useQuery({
    queryKey: shoeKeys.detail(ftwrId ?? ""),
    queryFn: () => fetchShoeDetail(ftwrId ?? ""),
    enabled: !isNew && ftwrId !== null,
    // 창을 다시 보거나 할 때 몰래 다시 읽어 고치던 값을 덮지 않게(저장 · 승인 뒤에는 무효화로 다시 읽는다)
    refetchOnWindowFocus: false,
  })
  // 판 하나 = 새 등록이거나 (신발 ID + 읽은 시각). 바뀌면 서버 값으로 새로 시작(저장 · 승인 뒤 다시 읽으면 깨끗한 판)
  const sessionKey = isNew ? "new" : ftwrId !== null && detailQuery.data ? `${ftwrId}@${detailQuery.dataUpdatedAt}` : null
  const [draftKey, setDraftKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<ShoeDraft | null>(null)
  const [extractState, setExtractState] = useState<ShoeExtractState>("idle")
  if (sessionKey !== draftKey) {
    setDraftKey(sessionKey)
    const base = isNew ? BLANK_SHOE : (detailQuery.data ?? null)
    setDraft(sessionKey && base ? { key: sessionKey, initial: base, form: base, imageChanged: false } : null)
    setExtractState("idle")
  }
  const fileInputRef = useRef<HTMLInputElement>(null)

  const patchDraft = useCallback((patch: Partial<ShoeDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d)), [])
  const refreshShoes = useCallback(() => queryClient.invalidateQueries({ queryKey: ["shoes"] }), [queryClient])

  const saveMutation = useMutation({
    mutationFn: async (d: ShoeDraft): Promise<string> => {
      const form = d.form
      if (isNew) {
        await registerShoe(form)
        return form.ftwrId
      }
      const id = ftwrId ?? form.ftwrId
      if (duty.canRegister) {
        // 등록 담당: 메타 + 문양(승인된 신발은 문양이 같아야 서버가 통과 — 편집 판이 문양을 잠가 둔다) + 선택 그림
        await updateShoe({ ftwrId: id, body: form, replaceImage: d.imageChanged && form.image ? form.image : undefined })
      } else {
        // 문양 입력 담당: 문양만(J6)
        await saveShoePatterns(id, { top: form.top, mid: form.mid, bottom: form.bottom, outline: form.outline })
      }
      return id
    },
    meta: { inlineError: true },
    onSuccess: async (savedId) => {
      toast.success(`저장했습니다: ${savedId}`)
      await refreshShoes()
      if (isNew) onOpenShoe(savedId)
    },
    onError: (error) => patchDraft({ saveError: errorText(error, "저장하지 못했습니다") }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveShoe(id),
    meta: { inlineError: true },
    onSuccess: async (_result, id) => {
      toast.success(`승인했습니다: ${id}`)
      await refreshShoes()
    },
    onError: (error) => patchDraft({ saveError: errorText(error, "승인하지 못했습니다") }),
  })

  const handleSave = () => {
    if (!draft || saveMutation.isPending) return
    const mode = isNew ? "new" : "edit"
    const invalid = validateShoeForm(draft.form, mode)
    if (invalid) return patchDraft({ saveError: invalid })
    if (isNew && !draft.form.image) return patchDraft({ saveError: "바닥 그림을 등록하세요" })
    if (!isNew && !isDirty(draft)) return patchDraft({ saveError: "바뀐 내용이 없습니다" })
    saveMutation.mutate(draft)
  }

  const handleApprove = () => {
    if (!draft || isNew || ftwrId === null || approveMutation.isPending) return
    // 승인은 서버에 저장된 문양 기준 — 고치던 것이 있으면 먼저 저장(엇갈린 승인 방지)
    if (isDirty(draft)) return patchDraft({ saveError: "바뀐 내용을 저장한 뒤 승인하세요" })
    approveMutation.mutate(ftwrId)
  }

  const handleExtract = async () => {
    if (!draft || extractState === "running") return
    const startedFor = draft.key
    setExtractState("running")
    try {
      const result = await extractShoePatterns(shoeExtractImage(draft.form.image, draft.form.ftwrId || ftwrId || "shoes"))
      setDraft((d) => {
        if (!d || d.key !== startedFor) return d
        const form = { ...d.form }
        const marks: ShoeAiMarks = { ...d.aiMarks }
        // AI 는 상 · 중 · 하만 제안한다(윤곽은 AI 미지원 — 가중치 스펙 §8-7). 출처는 부위별로 남긴다
        for (const zone of ["top", "mid", "bottom"] as const) {
          const fresh = result[zone].filter((n) => !form[zone].includes(n))
          form[zone] = [...form[zone], ...fresh]
          marks[zone] = { ...marks[zone], ...Object.fromEntries(fresh.map((n) => [n, "suggested" as const])) }
        }
        return { ...d, form, aiMarks: marks, saveError: undefined }
      })
      setExtractState("done")
    } catch (error) {
      toast.error(errorText(error, "문양 추출에 실패했습니다"))
      setExtractState("idle")
    }
  }

  const handleFile = async (file: File) => {
    try {
      const image = await readSoleFile(file)
      setDraft((d) => (d ? { ...d, form: { ...d.form, image }, imageChanged: true, saveError: undefined } : d))
    } catch {
      toast.error("그림을 읽지 못했습니다")
    }
  }

  const handleRotate = async () => {
    const image = draft?.form.image
    if (!image) return
    try {
      const rotated = await rotateSoleImage(image)
      setDraft((d) => (d ? { ...d, form: { ...d.form, image: rotated }, imageChanged: true, saveError: undefined } : d))
    } catch {
      toast.error("그림을 돌리지 못했습니다")
    }
  }

  const editIndex = ftwrId !== null ? pageShoes.findIndex((s) => s.ftwrId === ftwrId) : -1
  const prevShoe = editIndex > 0 ? pageShoes[editIndex - 1] : undefined
  const nextShoe = editIndex >= 0 && editIndex < pageShoes.length - 1 ? pageShoes[editIndex + 1] : undefined

  const dialog: ShoeDialogState | null =
    editing && draft
      ? { mode: isNew ? "new" : "edit", form: draft.form, saveError: draft.saveError, aiMarks: draft.aiMarks, initialTab: "pattern" }
      : null

  // 목록 상태 — 편집 판을 열었는데 상세가 아직이면 불러오는 중 · 실패(목록 칸의 같은 상태 표시를 빌린다)
  let status: ScreenStatus
  let errorAt: string | undefined
  let onRetry = () => {
    void shoesQuery.refetch()
    void countQuery.refetch()
  }
  if (editing && !dialog) {
    status = detailQuery.isError ? "error" : "loading"
    errorAt = detailQuery.isError ? kstClock(detailQuery.errorUpdatedAt) : undefined
    onRetry = () => void detailQuery.refetch()
  } else if (shoesQuery.isPending || countQuery.isPending) {
    status = "loading"
  } else if (shoesQuery.isError || countQuery.isError) {
    status = "error"
    errorAt = kstClock(Math.max(shoesQuery.errorUpdatedAt, countQuery.errorUpdatedAt))
  } else {
    status = pageShoes.length === 0 ? "empty" : "ready"
  }

  const stageCount = (key: ShoeStageKey) => stagesQuery.data?.stages.find((s) => s.key === key)?.count
  const resetToFirstPage = () => setPage(1)

  return (
    <>
      <ShoeDbPanel
        showPlus={false}
        live
        duty={duty}
        status={status}
        errorAt={errorAt}
        onRetry={onRetry}
        isAdmin={user ? isAdmin(user) : false}
        features={user?.features ?? []}
        filters={filters}
        onFiltersChange={setFilters}
        filtersApplied={applied !== null}
        officeItems={officeItems}
        onSearch={() => {
          setApplied(filters)
          resetToFirstPage()
        }}
        onReset={() => {
          setFilters(EMPTY_FILTERS)
          setApplied(null)
          resetToFirstPage()
        }}
        view={view}
        onViewChange={setView}
        shoes={shown}
        total={countQuery.data ?? 0}
        page={page}
        pageSize={SHOES_PAGE_SIZE}
        onPageChange={setPage}
        selectedId={ftwrId ?? undefined}
        onOpenShoe={onOpenShoe}
        onRegister={onNewShoe}
        stageSummary={stageSummary}
        cardInfo={cardInfo}
        dialog={dialog}
        onFormChange={(form) =>
          setDraft((d) => (d ? { ...d, form, aiMarks: pruneMarks(d.aiMarks, form), saveError: undefined } : d))
        }
        onSave={handleSave}
        onCloseDialog={onBackToList}
        onReplaceImage={() => fileInputRef.current?.click()}
        onRotateImage={() => void handleRotate()}
        quick={{
          query,
          onQueryChange: setQuery,
          groups: [
            {
              key: "stage",
              label: "작업 단계",
              value: stage ? [stage] : [],
              options: STAGE_KEYS.map((key) => ({ value: key, label: SHOE_STAGE_LABEL[key], count: stageCount(key) })),
            },
            { key: "approval", label: "승인", value: approval ? [approval] : [], options: APPROVAL_CHIPS },
            { key: "patternInput", label: "문양 입력", value: patternInput ? [patternInput] : [], options: PATTERN_CHIPS },
          ],
          // 묶음마다 서버 거르기 하나(J1 `stage` · `approval` · `pattern_input`) — 칩은 묶음마다 하나만 켜진다(새로 누른 것)
          onGroupChange: (key, values) => {
            if (key === "stage") setStage(pickOne(values, stage) as ShoeStageKey | null)
            else if (key === "approval") setApproval(pickOne(values, approval))
            else if (key === "patternInput") setPatternInput(pickOne(values, patternInput))
            resetToFirstPage()
          },
          onClear: () => {
            setQuery("")
            setStage(null)
            setApproval(null)
            setPatternInput(null)
            resetToFirstPage()
          },
          resultCount: shown.length,
          total: pageShoes.length,
        }}
        cardSize={cardSize}
        onCardSizeChange={setCardSize}
        library={SHOE_PATTERN_LIBRARY}
        extractState={extractState}
        onExtract={() => void handleExtract()}
        onConfirmAi={() => setDraft((d) => (d ? { ...d, aiMarks: confirmMarks(d.aiMarks) } : d))}
        onConfirmAiOne={(zone: PatternZone, name: string) =>
          setDraft((d) =>
            d && d.aiMarks?.[zone]?.[name] ? { ...d, aiMarks: { ...d.aiMarks, [zone]: { ...d.aiMarks[zone], [name]: "ai" } } } : d,
          )
        }
        onPrevShoe={prevShoe ? () => onOpenShoe(prevShoe.ftwrId) : undefined}
        onNextShoe={nextShoe ? () => onOpenShoe(nextShoe.ftwrId) : undefined}
        onApprove={handleApprove}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = "" // 같은 파일을 다시 골라도 onChange 가 오게
        }}
      />
    </>
  )
}
