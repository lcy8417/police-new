import { useCallback, useMemo, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ImagePlus, RotateCcw, RotateCw } from "lucide-react"

import { registerShoe, type Shoe } from "@/entities/shoe"
import type { Crime } from "@/entities/crime"
import { stripPatternPath, type PatternZone } from "@/entities/pattern"
import {
  PatternCanvas,
  PatternPalette,
  PatternZones,
  usePatternManager,
} from "@/features/patterns-extract"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { cn } from "@/shared/lib/utils"
import { rotateImage, resizeImage } from "@/utils/get-input-change"

import { EMPTY_SHOE_FORM } from "../model/form"
import { HeaderTitle } from "./HeaderContent"
import { ShoeInfoPanel } from "./ShoeInfoPanel"

// 제목은 정적이다 — 헤더 effect가 이 값 때문에 재실행되지 않도록 엘리먼트를 한 번만 만든다.
const HEADER_TITLE = <HeaderTitle />

/** 부위 인덱스(0~3) → 데이터 키. PatternZones/팔레트 삽입 대상 판정에 쓴다. */
const ZONE_KEYS: PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 헤더(TopNav)에 얹는 이미지 도구 버튼 — crime-register 도크 톤을 준용한다. */
function HeaderToolButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: typeof ImagePlus
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "border-[#1E2A3C] bg-[#0F1826] text-[#C7CEDB] hover:border-[#3B82F6]/50 hover:bg-[#141F30] hover:text-white"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

/**
 * 커맨드센터 `/shoesRegister`. 레거시 `ShoesRegister.jsx` + `ShoesRegisterMain`을
 * 대체하는 FSD 진입 페이지다. 신발 `formData`(엔티티 `Shoe` 형태)를 소유하고,
 * 문양추출 워크벤치는 검색 커맨드센터(`/search/:crimeNumber`)와 **동일 컴포넌트**
 * (`PatternCanvas`·`PatternZones`·`PatternPalette` + `usePatternManager` 신발 모드)를
 * 그대로 재사용한다. 이미지 업로드/회전은 TopNav 헤더 액션으로 얹고, 저장은
 * `registerShoe`(POST /shoes/register)로 승격했다.
 *
 * 재사용 트레이드오프: `PatternCanvas`의 현장/편집 스와퍼는 서버 이미지 전환용이라
 * 단일 업로드 이미지를 쓰는 등록 화면에서는 동작이 없다(no-op). 공유 컴포넌트의
 * 좌표 계약은 "절대 변경 금지"라 스와퍼를 제거하지 않고 그대로 둔다.
 */
export function ShoeRegisterPage() {
  const [formData, setFormData] = useState<Shoe>(EMPTY_SHOE_FORM)
  const [isExtracting, setIsExtracting] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setFormData((prev) => ({ ...prev, image: processed }))
      } catch (error) {
        console.error("이미지 처리 중 오류 발생:", error)
        setFormData((prev) => ({ ...prev, image: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

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

  const handleRotate = useCallback(async (deg: number) => {
    // 현재 표시 중인 이미지(imgRef.src = formData.image)를 회전해 다시 저장한다.
    const current = imgRef.current?.src
    if (!current) return
    const rotated = await rotateImage(current, deg)
    setFormData((prev) => ({ ...prev, image: rotated }))
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

  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <HeaderToolButton
          icon={ImagePlus}
          label="이미지 등록"
          onClick={handleUploadClick}
        />
        <HeaderToolButton
          icon={RotateCcw}
          label="회전"
          onClick={() => void handleRotate(-90)}
          disabled={!formData.image}
        />
        <HeaderToolButton
          icon={RotateCw}
          label="회전"
          onClick={() => void handleRotate(90)}
          disabled={!formData.image}
        />
      </div>
    ),
    [formData.image, handleUploadClick, handleRotate]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      {/* 업로드용 숨은 파일 입력 — 헤더의 "이미지 등록" 버튼이 click()으로 연다. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

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
