import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  FilePlus2,
  ImagePlus,
  RotateCcw,
  RotateCw,
  type LucideIcon,
} from "lucide-react"

import {
  EMPTY_SHOE_FORM,
  registerShoe,
  updateShoe,
  type Shoe,
} from "@/entities/shoe"
import type { Crime } from "@/entities/crime"
import { stripPatternPath, type PatternZone } from "@/entities/pattern"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import { rotateArbitrary } from "@/features/crime-register"
import { cn } from "@/shared/lib/utils"
import { Slider } from "@/shared/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"
import { resizeImage } from "@/utils/get-input-change"

import { ShoeInfoPanel } from "./ShoeInfoPanel"

/** 부위 인덱스(0~3) → 데이터 키. PatternZones/팔레트 삽입 대상 판정에 쓴다. */
const ZONE_KEYS: PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 회전 슬라이더 눈금(EvidenceImagePanel과 동일). */
const ROTATION_TICKS = ["-180°", "-90°", "0°", "90°", "180°"]

/** 회전 툴바용 아이콘 버튼(EvidenceImagePanel ToolbarIconButton 준용). */
function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md text-[#6B7688] transition-colors hover:bg-white/5 hover:text-[#4A9EFF] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6B7688]"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

interface ShoeWorkbenchProps {
  /**
   * "new" = 신규 등록(POST), "edit" = 기존 신발 편집(PUT, 또는 목록 브라우즈).
   * 두 국면은 4번째 열 탭([새 신발]/[기존 신발 목록])으로 전환한다.
   */
  mode: "new" | "edit"
  /**
   * 편집 대상 신발(문양은 이미 경로로 hydrate된 상태여야 한다 — 페이지가 담당).
   * "new" 또는 미선택 브라우즈에서는 `EMPTY_SHOE_FORM`으로 시작한다.
   */
  initialShoe?: Shoe
  /** 저장(등록/수정) 성공 후 호출. 페이지가 목록 무효화·라우팅·Sheet 닫기를 담당한다. */
  onSaved?: (savedModelNumber: string) => void
  /** [새 신발] 탭 / 툴바 [신규 신발 등록] 버튼 — ?mode=new로 라우팅(전체 초기화). */
  onNewRegister?: () => void
  /** [기존 신발 목록] 탭 — 목록 브라우즈로 라우팅. */
  onBrowseList?: () => void
  /** 기존 신발(edit) 모드 4번째 열에 렌더할 신발 목록. */
  listPanel?: ReactNode
  /** 기본정보 Sheet 개폐(페이지 소유 — 선택된 행을 한 번 더 클릭하면 연다). */
  infoSheetOpen?: boolean
  onInfoSheetOpenChange?: (open: boolean) => void
}

/**
 * 신발 문양추출 워크벤치(4열). 레거시 `ShoesRegisterMain`/`Canvas.jsx` 스택을
 * 대체하며, 검색 커맨드센터(`/search/:crimeNumber`)와 동일 컴포넌트
 * (`PatternCanvas`·`PatternZones`·`PatternPalette` + `usePatternManager` 신발 모드)를
 * 재사용한다. 등록(POST)·편집(PUT)을 `formData` 하나로 겸용한다.
 *
 * 4번째 열은 탭으로 전환한다: [새 신발](신규 등록 정보 폼) / [기존 신발 목록](목록).
 * 기존 신발 기본정보 편집은 목록에서 선택된 행을 한 번 더 클릭하면 열리는 우측
 * Sheet에서 한다(문양+정보 함께 저장).
 *
 * 회전 모델: 원본 업로드/서버 이미지(uploadedRef)를 보존하고, 절대각(angle)을
 * 원본에 한 번만 적용해 굽는다(누적 방지). 편집 진입 시 서버 이미지를 신규 업로드와
 * 동일한 canvas 재그리기로 정규화해 회전 taint를 피한다.
 */
export function ShoeWorkbench({
  mode,
  initialShoe,
  onSaved,
  onNewRegister,
  onBrowseList,
  listPanel,
  infoSheetOpen = false,
  onInfoSheetOpenChange,
}: ShoeWorkbenchProps) {
  // 편집 = hydrate된 initialShoe, 신규/브라우즈 = 빈 폼. 페이지가 신발/모드 전환 시
  // key로 리마운트하므로 지연 초기화로 충분하다.
  const [formData, setFormData] = useState<Shoe>(
    () => initialShoe ?? EMPTY_SHOE_FORM
  )
  const [isExtracting, setIsExtracting] = useState(false)
  // 회전 상태: angle=formData.image에 구워진 각, previewAngle=슬라이더 라이브값.
  const [angle, setAngle] = useState(0)
  const [previewAngle, setPreviewAngle] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  // 회전 원본(누적 방지) — 편집 진입 시 서버 이미지로 시딩(회전 no-op 방지).
  const uploadedRef = useRef<string | null>(initialShoe?.image ?? null)
  // 이미지가 이미 있어 드롭존이 사라진 뒤에도 언제든 재업로드할 파일 입력.
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = mode === "edit"
  const isNew = mode === "new"

  // 문양·경계선·추출 상태는 features 훅이 소유한다(신발 모드: formData/setFormData).
  const pm = usePatternManager({ formData, setFormData, imgRef })

  // 기존(서버) 이미지 회전 버그 대응: 신규 업로드는 canvas 재그리기(resizeImage)로
  // 만든 깨끗한 same-origin data URL이라 rotateArbitrary가 잘 돌지만, 서버 이미지는
  // 회전(canvas.toDataURL) 시 taint되거나 포맷이 달라 회전이 조용히 실패할 수 있다.
  // 편집 진입 시(key 리마운트로 신발마다 1회) 동일 파이프라인으로 정규화한다.
  useEffect(() => {
    const src = initialShoe?.image
    if (!src) return
    let cancelled = false
    void resizeImage(src)
      .then((clean) => {
        if (cancelled || uploadedRef.current !== src) return
        uploadedRef.current = clean
        setFormData((prev) =>
          prev.image === src ? { ...prev, image: clean } : prev
        )
      })
      .catch(() => {
        // 실패(예: CORS 없는 교차출처 서버 이미지)면 원본 유지 — 이 경우 회전은
        // 백엔드 CORS 헤더 또는 data URL 응답이 필요하다(프론트 단독 해결 불가).
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFieldChange = useCallback((name: keyof Shoe, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      try {
        // 업로드 이미지는 최대 1000px로 다운스케일(레거시 resizeImage와 동일).
        const processed = await resizeImage(base64)
        uploadedRef.current = processed
        setAngle(0)
        setPreviewAngle(0)
        setFormData((prev) => ({ ...prev, image: processed }))
      } catch (error) {
        console.error("이미지 처리 중 오류 발생:", error)
        uploadedRef.current = base64
        setAngle(0)
        setPreviewAngle(0)
        setFormData((prev) => ({ ...prev, image: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  // "이미지 교체" 버튼 → 숨은 파일 입력 열기.
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFileSelect(file)
      // 같은 파일을 다시 선택해도 onChange가 발화하도록 값을 비운다.
      e.target.value = ""
    },
    [handleFileSelect]
  )

  // 절대각 회전 — 항상 원본(uploadedRef)에서 deg로 한 번만 굽는다(누적 방지).
  const applyRotation = useCallback(async (deg: number) => {
    const base = uploadedRef.current
    if (!base) return
    const normalized = ((((deg + 180) % 360) + 360) % 360) - 180
    const baked =
      normalized % 360 === 0 ? base : await rotateArbitrary(base, normalized)
    if (uploadedRef.current !== base) return // 초기화/재업로드가 끼어들었으면 폐기
    setFormData((prev) => ({ ...prev, image: baked }))
    setAngle(normalized)
    setPreviewAngle(normalized)
  }, [])

  const handleExtract = useCallback(async () => {
    if (!formData.image) {
      toast.error("먼저 신발 이미지를 등록하세요.")
      return
    }
    setIsExtracting(true)
    try {
      await pm.extractPattern()
    } catch (error) {
      console.error("문양 추출 중 오류 발생:", error)
      toast.error("문양 추출에 실패했습니다.")
    } finally {
      setIsExtracting(false)
    }
  }, [formData.image, pm])

  const saveMutation = useMutation({
    mutationFn: async (data: Shoe): Promise<string> => {
      if (isEdit) {
        // 모델번호는 URL 키다(잠겨 있어 편집 불가) — initialShoe에서 취한다.
        const modelNumber = initialShoe?.modelNumber ?? data.modelNumber ?? ""
        await updateShoe({ modelNumber, body: data })
        return modelNumber
      }
      await registerShoe(data)
      return data.modelNumber ?? ""
    },
    onSuccess: (savedModelNumber) => {
      toast.success(
        isEdit ? "신발 정보가 저장되었습니다." : "신발 정보가 등록되었습니다."
      )
      onSaved?.(savedModelNumber)
    },
    onError: () => {
      toast.error(isEdit ? "신발 저장에 실패했습니다." : "신발 등록에 실패했습니다.")
    },
  })

  const handleSubmit = useCallback(() => {
    // 신규는 이미지+모델번호 필수. 편집은 모델번호가 URL 키로 이미 고정.
    if (!isEdit && (!formData.image || !formData.modelNumber)) {
      toast.error("이미지와 모델번호는 필수 입력 사항입니다.")
      return
    }
    saveMutation.mutate(formData)
  }, [isEdit, formData, saveMutation])

  const handleReset = useCallback(() => {
    if (isEdit && initialShoe) {
      // 편집 되돌리기 = 서버 원본 스냅샷으로 복귀(신발을 지우지 않는다).
      uploadedRef.current = initialShoe.image ?? null
      setAngle(0)
      setPreviewAngle(0)
      setFormData(initialShoe)
      return
    }
    // 신규 초기화 = 빈 폼. 진행 중 회전 bake가 이미지를 되살리지 못하게 ref부터 비운다.
    uploadedRef.current = null
    setAngle(0)
    setPreviewAngle(0)
    setFormData(EMPTY_SHOE_FORM)
  }, [isEdit, initialShoe])

  // 현재 선택된 부위에 이미 삽입된 문양인지 이름 기준으로 판정한다(팔레트 비활성용).
  const isInserted = useCallback(
    (src: string) => {
      if (pm.selected === null) return false
      const key = ZONE_KEYS[pm.selected]
      const name = stripPatternPath(src)
      return (formData[key] ?? []).some(
        (entry) => stripPatternPath(entry) === name
      )
    },
    [pm.selected, formData]
  )

  const noop = useCallback(() => {}, [])

  // 실시간 회전값에 가장 가까운 눈금을 강조한다(표시 전용).
  const nearestTick = ROTATION_TICKS.reduce((closest, tick) => {
    const tickValue = Number.parseInt(tick, 10)
    return Math.abs(tickValue - previewAngle) <
      Math.abs(Number.parseInt(closest, 10) - previewAngle)
      ? tick
      : closest
  }, ROTATION_TICKS[2])

  // 캔버스 헤더 아래에 얹는 회전 툴바 밴드(EvidenceImagePanel 회전 툴바 언어).
  const rotationToolbar = (
    <div className="flex items-center gap-3 border-b border-[#141D2C] bg-[#0D1420]/60 px-4 py-2.5">
      {/* 신규 모드: 이미지 업로드/교체. 편집 모드: 이미지 교체 대신 [신규 신발 등록]로
          유도한다(기존 신발 이미지는 교체하지 않고 새 등록 — 전체 초기화). */}
      {isNew ? (
        <button
          type="button"
          onClick={handleUploadClick}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-3 text-xs font-medium text-[#C7CEDB] transition-colors hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
          {formData.image ? "이미지 교체" : "이미지 등록"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNewRegister}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#2DD4BF]/40 bg-[#0F2624] px-3 text-xs font-medium text-[#5FE0D0] transition-colors hover:border-[#2DD4BF]/60 hover:bg-[#123330] hover:text-[#2DD4BF]"
        >
          <FilePlus2 className="size-3.5" aria-hidden="true" />
          신규 신발 등록
        </button>
      )}

      <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5">
        <ToolbarIconButton
          icon={RotateCcw}
          label="왼쪽으로 90도 회전"
          onClick={() => void applyRotation(angle - 90)}
          disabled={!formData.image}
        />
        <ToolbarIconButton
          icon={RotateCw}
          label="오른쪽으로 90도 회전"
          onClick={() => void applyRotation(angle + 90)}
          disabled={!formData.image}
        />
      </div>

      <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-1">
        {/* 자유각 회전: 드래그 중에는 CSS transform으로 미리보기하고, 놓으면 원본에서
            해당 각도로 다시 굽는다(누적 없음). */}
        <Slider
          value={[previewAngle]}
          onValueChange={([v]) => setPreviewAngle(v)}
          onValueCommit={([v]) => void applyRotation(v)}
          min={-180}
          max={180}
          step={1}
          disabled={!formData.image}
        />
        <div className="flex justify-between font-mono text-[10px] tracking-wide tabular-nums">
          {ROTATION_TICKS.map((tick) => (
            <span
              key={tick}
              className={
                tick === nearestTick
                  ? "text-[#4A9EFF] drop-shadow-[0_0_4px_rgba(74,158,255,0.6)]"
                  : "text-[#5B6B85]"
              }
            >
              {tick}
            </span>
          ))}
        </div>
      </div>

      <div className="h-6 w-px shrink-0 bg-[#1E2A3C]" aria-hidden="true" />

      <span className="w-14 shrink-0 rounded-md border border-[#1E2A3C] bg-[#0F1826] px-2 py-1 text-center font-mono text-[11px] tabular-nums text-[#4A9EFF]">
        {previewAngle}°
      </span>
    </div>
  )

  const infoPanel = (
    <ShoeInfoPanel
      formData={formData}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      onReset={handleReset}
      isSubmitting={saveMutation.isPending}
      submitLabel={isEdit ? "저장" : "등록"}
      submitPendingLabel={isEdit ? "저장 중..." : "등록 중..."}
      resetLabel={isEdit ? "되돌리기" : "초기화"}
      modelNumberReadOnly={isEdit}
    />
  )

  // 4번째 열 탭([새 신발]/[기존 신발 목록]) — 신규/기존 전환.
  const tabButtonClass = (active: boolean) =>
    cn(
      "flex-1 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
      active
        ? "bg-[#152238] text-[#4A9EFF] shadow-[0_0_14px_rgba(37,99,235,0.25)]"
        : "text-[#8A93A6] hover:bg-white/5 hover:text-[#C7CEDB]"
    )

  const col4 = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#1E2A3C] bg-[#0D1420] p-1">
        <button
          type="button"
          onClick={onNewRegister}
          className={tabButtonClass(isNew)}
        >
          새 신발
        </button>
        <button
          type="button"
          onClick={onBrowseList}
          className={tabButtonClass(!isNew)}
        >
          기존 신발 목록
        </button>
      </div>
      <div className="min-h-0 flex-1">{isNew ? infoPanel : listPanel}</div>
    </div>
  )

  return (
    <>
      <div className="relative grid h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.85fr)]">
        {/* "이미지 교체" 버튼용 숨은 파일 입력(캔버스 드롭존과 별개 진입점). */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <PatternCanvas
          canvasRef={pm.canvasRef}
          imgRef={imgRef}
          image={formData.image ?? null}
          lineState={pm.lineState}
          setLineState={pm.setLineState}
          onExtract={handleExtract}
          onClear={pm.clearPattern}
          onShowOrigin={noop}
          onShowEdit={noop}
          isExtracting={isExtracting}
          // 신발 워크벤치 전용: 스와퍼 숨김 + 회전 툴바 + 회전 미리보기.
          // 업로드는 신규 모드에서만(편집은 이미지 교체 대신 신규 등록으로 유도).
          hideViewSwapper
          onUpload={isNew ? handleFileSelect : undefined}
          topToolbar={rotationToolbar}
          viewportStyle={{
            transform:
              previewAngle !== angle
                ? `rotate(${previewAngle - angle}deg)`
                : undefined,
          }}
        />
        <PatternZones
          selected={pm.selected}
          setSelected={pm.setSelected}
          deletePattern={pm.deletePattern}
          essentialCheck={pm.essentialCheck}
          // 신발 문양은 경로 문자열 배열이지만 PatternZones의 normalize가 문자열/튜플
          // 양쪽을 처리한다. prop 타입만 Crime을 요구하므로 캐스팅한다.
          currentData={formData as unknown as Crime}
          onDropToZone={pm.insertPatternToZone}
        />
        <PatternPalette
          patterns={pm.patterns}
          patternsKindSelect={pm.patternsKindSelect}
          insertPattern={pm.insertPattern}
          isInserted={isInserted}
        />
        {col4}
      </div>

      {/* 기존 신발 기본정보 편집 Sheet(우측 드로어) — 선택된 행 재클릭으로 페이지가 연다. */}
      {isEdit && (
        <Sheet open={infoSheetOpen} onOpenChange={onInfoSheetOpenChange}>
          <SheetContent
            side="right"
            className="w-full border-l border-[#1E2A3C] bg-[#0B121D] p-4 sm:max-w-md"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>신발 기본 정보</SheetTitle>
              <SheetDescription>
                모델번호·제조사 등 신발 메타 정보를 편집하고 저장합니다.
              </SheetDescription>
            </SheetHeader>
            <div className="h-full pt-2">{infoPanel}</div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
