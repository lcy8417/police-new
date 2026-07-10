import { useCallback, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { registerCrime, useCrimeStore } from "@/entities/crime"
import { rotateArbitrary, useImageAdjustments, useImageEditor } from "@/features/crime-register"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { rotateImage, resizeImage } from "@/utils/get-input-change"

import { EMPTY_FORM, type CrimeFormData } from "../model/form"
import { HeaderTitle } from "./HeaderContent"
import { EvidenceImagePanel } from "./EvidenceImagePanel"
import { CaseInfoPanel } from "./CaseInfoPanel"

// 제목은 정적이다 — 이 값 때문에 헤더 effect가 다시 실행되지 않도록 엘리먼트를
// 한 번만 생성한다.
const HEADER_TITLE = <HeaderTitle />

/**
 * 커맨드 센터 `/crimeRegister`. 등록 `formData`를 소유하고, 업로드 / ±90도·자유각
 * 회전 / 크롭 / 4점 각도보정 / 가시성 보정(밝기·대비·감마·임계값·반전·흑백) / 저장 /
 * 초기화를 crime 엔티티 계층과 연결한다. `TopNav`에는 제목만 게시하고, 편집
 * 도구(크롭·각도보정·초기화)는 이미지 옆 도크로 내렸다.
 * 회전·가시성 보정은 비파괴로 미리보기하다가 저장 시점에만 픽셀로 굽는다.
 */
export function CrimeRegisterRedesign() {
  const [formData, setFormData] = useState<CrimeFormData>(EMPTY_FORM)
  const adjust = useImageAdjustments(formData.image)
  // 안정적인 콜백(아래 메모이즈된 핸들러에서 참조됨).
  const { bake: bakeAdjustments, resetAdjustments } = adjust

  // 자유각 회전(슬라이더). 회전 드래그 중에도 crop/calibration 래퍼가 참조적으로
  // 안정적으로 유지되도록 ref에도 미러링한다.
  const [rotation, setRotationState] = useState(0)
  const rotationRef = useRef(0)
  const setRotation = useCallback((deg: number) => {
    rotationRef.current = deg
    setRotationState(deg)
  }, [])
  const imageRef = useRef(formData.image)
  imageRef.current = formData.image

  const handleFieldChange = useCallback((name: keyof CrimeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      try {
        const processed = await resizeImage(base64)
        setFormData((prev) => ({ ...prev, image: processed }))
      } catch (error) {
        console.error("이미지 처리 중 오류 발생:", error)
        setFormData((prev) => ({ ...prev, image: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRotate = useCallback(
    async (deg: number) => {
      if (!formData.image) return
      const rotated = await rotateImage(formData.image, deg)
      setFormData((prev) => ({ ...prev, image: rotated }))
    },
    [formData.image]
  )

  const handleReset = useCallback(() => {
    setFormData(EMPTY_FORM)
    resetAdjustments()
    setRotation(0)
  }, [resetAdjustments, setRotation])

  const handleImageChange = useCallback((next: string) => {
    setFormData((prev) => ({ ...prev, image: next }))
  }, [])

  const editor = useImageEditor(formData.image, handleImageChange)
  const { toggleCrop, toggleCalibration, toggleMeasure } = editor

  // 자유각 회전은 CSS transform으로 미리보기되며, 저장 시점에만 — 또는
  // crop/calibration에 진입할 때 즉시 — 픽셀에 구워져서, 오버레이는 항상
  // 회전되지 않은 픽셀을 기준으로 매핑된다.
  const commitRotation = useCallback(async () => {
    const deg = rotationRef.current
    const img = imageRef.current
    if (deg === 0 || !img) return
    const rotated = await rotateArbitrary(img, deg)
    setFormData((prev) => ({ ...prev, image: rotated }))
    setRotation(0)
  }, [setRotation])

  const handleCrop = useCallback(async () => {
    await commitRotation()
    toggleCrop()
  }, [commitRotation, toggleCrop])

  const handleCalibrate = useCallback(async () => {
    await commitRotation()
    toggleCalibration()
  }, [commitRotation, toggleCalibration])

  const handleMeasure = useCallback(async () => {
    await commitRotation()
    toggleMeasure()
  }, [commitRotation, toggleMeasure])

  const registerMutation = useMutation({
    mutationFn: registerCrime,
    meta: { success: "사건이 등록되었습니다." },
    onSuccess: () => {
      setFormData(EMPTY_FORM)
      resetAdjustments()
      setRotation(0)
      useCrimeStore.getState().setRegisterFlag([])
    },
  })

  const handleSubmit = useCallback(async () => {
    if (!formData.image || !formData.crimeNumber) {
      toast.error("이미지와 사건 번호는 필수 입력 사항입니다.")
      return
    }
    // 분석관의 보정이 미리보기에만 그치지 않고 서버 측에도 유지되도록, 자유각
    // 회전을 먼저 굽고 이어서 비파괴 가시성 조정값을 이미지에 굽는다.
    const rotated =
      rotationRef.current !== 0
        ? await rotateArbitrary(formData.image, rotationRef.current)
        : formData.image
    const image = await bakeAdjustments(rotated)
    registerMutation.mutate({
      image,
      crimeNumber: formData.crimeNumber,
      imageNumber: formData.imageNumber,
      crimeName: formData.crimeName,
      findTime: formData.findTime,
      requestOffice: formData.requestOffice,
      findMethod: formData.findMethod,
    })
  }, [formData, registerMutation, bakeAdjustments])

  // 편집 도구(크롭·각도보정·초기화)는 앱셸 헤더가 아니라 이미지 옆 도크로
  // 내렸으므로, 헤더에는 제목만 게시한다.
  usePageHeader({ title: HEADER_TITLE })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <div className="relative grid h-full grid-cols-1 gap-6 lg:grid-cols-[1.82fr_1fr]">
        <EvidenceImagePanel
          image={formData.image}
          onFileSelect={handleFileSelect}
          onRotate={handleRotate}
          editor={editor}
          adjust={adjust}
          rotation={rotation}
          onRotationChange={setRotation}
          onCrop={handleCrop}
          onCalibrate={handleCalibrate}
          onMeasure={handleMeasure}
          onReset={handleReset}
        />
        <CaseInfoPanel
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
