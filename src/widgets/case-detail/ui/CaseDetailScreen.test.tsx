import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FEATURES } from "@/entities/session"

import type { CaseDetailScreenProps } from "../model/types"
import { CaseDetailScreen } from "./CaseDetailScreen"

function props(over: Partial<CaseDetailScreenProps> = {}): CaseDetailScreenProps {
  const fn = vi.fn()
  return {
    status: "ready", onRetry: fn, isAdmin: false, features: [FEATURES.CRIME_REGISTER], mode: "register",
    form: { apprslReqestNo: "", aprthngSn: "1", rqestGrfcNm: "", crimeNm: "", pickDt: "", pickPlace: "", pickMthCode: "" },
    onFieldChange: fn, officeItems: [], images: [], selectedImageId: null, onSelectImage: fn,
    checkedImageIds: [], onCheckedImageIdsChange: fn, onFilesAdded: fn, onDeleteChecked: fn, continuous: false,
    onContinuousChange: fn, onSave: fn, onReset: fn, onClose: fn, onCopy: fn, onOpenImageEdit: fn, onOpenSearch: fn,
    ...over,
  }
}

describe("CaseDetailScreen 올리는 중 막대", () => {
  it("올리는 중 값을 막대로 보인다", () => {
    render(<CaseDetailScreen {...props({ uploading: { fileName: "a_13.jpg", percent: 68 } })} />)
    const bar = screen.getByRole("progressbar", { name: "업로드" })
    expect(bar).toHaveAttribute("aria-valuenow", "68")
    expect(screen.getByText("a_13.jpg 업로드 중")).toBeInTheDocument()
  })

  it("0~100 밖의 값은 줄여서 보인다", () => {
    render(<CaseDetailScreen {...props({ uploading: { fileName: "a.jpg", percent: 180 } })} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })
})
