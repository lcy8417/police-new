import { useCallback, useMemo, useState } from "react"

import { registerCrime, useCrimeStore } from "@/entities/crime"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"
import { rotateImage, resizeImage } from "@/utils/get-input-change"

import { EMPTY_FORM, type CrimeFormData } from "../model/form"
import { HeaderActions, HeaderTitle } from "./HeaderContent"
import { EvidenceImagePanel } from "./EvidenceImagePanel"
import { CaseInfoPanel } from "./CaseInfoPanel"

// Title is static — build the element once so the header effect never refires
// on its account.
const HEADER_TITLE = <HeaderTitle />

/**
 * Command-center `/crimeRegister`. Owns the register `formData`, wires upload
 * / ±90 rotation / save / reset against the crime entity layer, and publishes
 * the title + action-card row into `TopNav`. Crop + 4-point calibration remain
 * deferred to Slice 2 (see the inert header cards).
 */
export function CrimeRegisterRedesign() {
  const [formData, setFormData] = useState<CrimeFormData>(EMPTY_FORM)

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
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.image || !formData.crimeNumber) {
      // TODO(toast-slice): replace alert with unified toast
      alert("이미지와 사건 번호는 필수 입력 사항입니다.")
      return
    }
    try {
      await registerCrime({
        image: formData.image,
        crimeNumber: formData.crimeNumber,
        imageNumber: formData.imageNumber,
        crimeName: formData.crimeName,
        findTime: formData.findTime,
        requestOffice: formData.requestOffice,
        findMethod: formData.findMethod,
      })
      // TODO(toast-slice): replace alert with unified toast
      alert("사건이 등록되었습니다.")
      setFormData(EMPTY_FORM)
      useCrimeStore.getState().setRegisterFlag([])
    } catch (error) {
      console.error("사건 등록 중 오류 발생:", error)
      // TODO(toast-slice): replace alert with unified toast
      alert("사건 등록에 실패했습니다. 다시 시도해주세요.")
    }
  }, [formData])

  // Memoize the actions element so the page-header effect only refires when the
  // handlers or the image-present flag actually change (not every render).
  const headerActions = useMemo(
    () => <HeaderActions onRotate={handleRotate} onReset={handleReset} disabled={!formData.image} />,
    [handleRotate, handleReset, formData.image]
  )

  usePageHeader({ title: HEADER_TITLE, actions: headerActions })

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
        />
        <CaseInfoPanel
          formData={formData}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}
