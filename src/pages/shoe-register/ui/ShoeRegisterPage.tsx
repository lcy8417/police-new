import { useCallback, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { RotateCcw, RotateCw, type LucideIcon } from "lucide-react"

import { registerShoe, type Shoe } from "@/entities/shoe"
import type { Crime } from "@/entities/crime"
import { stripPatternPath, type PatternZone } from "@/entities/pattern"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import { rotateArbitrary } from "@/features/crime-register"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { Slider } from "@/shared/ui/slider"
import { resizeImage } from "@/utils/get-input-change"

import { EMPTY_SHOE_FORM } from "../model/form"
import { HeaderTitle } from "./HeaderContent"
import { ShoeInfoPanel } from "./ShoeInfoPanel"

// 제목은 정적이다 — 헤더 effect가 이 값 때문에 재실행되지 않도록 엘리먼트를 한 번만 만든다.
const HEADER_TITLE = <HeaderTitle />

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

/**
 * 커맨드센터 `/shoesRegister`. 레거시 `ShoesRegister.jsx` + `ShoesRegisterMain`을
 * 대체하는 FSD 진입 페이지다. 신발 `formData`(엔티티 `Shoe` 형태)를 소유하고,
 * 문양추출 워크벤치는 검색 커맨드센터(`/search/:crimeNumber`)와 **동일 컴포넌트**
 * (`PatternCanvas`·`PatternZones`·`PatternPalette` + `usePatternManager` 신발 모드)를
 * 재사용한다. 이미지 업로드는 캔버스 빈 상태의 드롭존, 회전은 캔버스 상단 툴바로
 * (crime-register `EvidenceImagePanel`과 같은 언어), 현장/편집 스와퍼는 숨긴다.
 * 저장은 `registerShoe`(POST /shoes/register)로 승격했다.
 *
 * 회전 모델: 원본 업로드 이미지(uploadedRef)는 보존하고, 슬라이더/버튼이 정하는
 * **절대각(angle)**을 원본에 한 번만 적용해 `formData.image`로 굽는다(누적 패딩 방지).
 * 드래그 중에는 커밋각(angle) 대비 미리보기각(previewAngle)의 차이만큼 뷰포트 래퍼를
 * CSS로 돌려 미리보기하고(이미지+경계선 canvas 동시 회전 → 정합 유지), 손을 떼면
 * 원본에서 previewAngle로 다시 구워 정합된 축정렬 이미지를 만든다. 비동기 bake는
 * uploadedRef 가드로 초기화/재업로드가 항상 이기게 한다.
 */
export function ShoeRegisterPage() {
  const [formData, setFormData] = useState<Shoe>(EMPTY_SHOE_FORM)
  const [isExtracting, setIsExtracting] = useState(false)
  // 회전 상태: angle=formData.image에 실제로 구워진 각도, previewAngle=슬라이더 라이브값.
  const [angle, setAngle] = useState(0)
  const [previewAngle, setPreviewAngle] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  // 회전 원본(누적 방지) — 항상 여기서 절대각으로 굽는다. null이면 이미지 없음.
  const uploadedRef = useRef<string | null>(null)

  // 문양·경계선·추출 상태는 features 훅이 소유한다(신발 모드: formData/setFormData).
  const pm = usePatternManager({ formData, setFormData, imgRef })

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

  // 절대각 회전 적용 — 항상 원본(uploadedRef)에서 deg로 한 번만 굽는다(누적 방지).
  // await 중 초기화/재업로드로 원본이 바뀌면 가드로 결과를 버린다(초기화가 이긴다).
  const applyRotation = useCallback(async (deg: number) => {
    const base = uploadedRef.current
    if (!base) return
    // -180~180 범위로 정규화(슬라이더 표시 일관성).
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

  const registerMutation = useMutation({
    mutationFn: registerShoe,
    onSuccess: () => {
      uploadedRef.current = null
      setAngle(0)
      setPreviewAngle(0)
      setFormData(EMPTY_SHOE_FORM)
      toast.success("신발 정보가 등록되었습니다.")
    },
    onError: () => {
      toast.error("신발 등록에 실패했습니다.")
    },
  })

  const handleSubmit = useCallback(() => {
    if (!formData.image || !formData.modelNumber) {
      toast.error("이미지와 모델번호는 필수 입력 사항입니다.")
      return
    }
    registerMutation.mutate(formData)
  }, [formData, registerMutation])

  const handleReset = useCallback(() => {
    // 원본 ref를 먼저 비워, 진행 중인 회전 bake가 이미지를 되살리지 못하게 한다.
    uploadedRef.current = null
    setAngle(0)
    setPreviewAngle(0)
    setFormData(EMPTY_SHOE_FORM)
  }, [])

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

  usePageHeader({ title: HEADER_TITLE })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.7fr)]">
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
          // 등록 화면 전용: 스와퍼 숨김 + 캔버스 드롭존 업로드 + 회전 툴바 + 회전 미리보기.
          hideViewSwapper
          onUpload={handleFileSelect}
          topToolbar={rotationToolbar}
          viewportStyle={{
            // 커밋각(angle) 대비 미리보기각의 차이만큼만 CSS로 돌려 미리보기한다.
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
        <ShoeInfoPanel
          formData={formData}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={registerMutation.isPending}
        />
      </div>
    </div>
  )
}
