import { afterEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useCrimeStore, type Crime } from "@/entities/crime"
import { usePatternManager } from "./use-pattern-manager"
import * as api from "@/services/api"

/** 현장(crime) 모드로 훅을 구동하는 테스트 하네스 — currentData/index 경로. */
function renderCrimeManager(crime: Crime) {
  useCrimeStore.setState({ crimeData: [crime] })
  const index = 0
  const view = renderHook(() =>
    usePatternManager({ index, currentData: crime, imgRef: null })
  )
  const getCurrent = () => useCrimeStore.getState().crimeData[0]
  return { view, getCurrent }
}

const BASE_CRIME: Crime = {
  crimeNumber: "2024-100",
  image: "data:image/png;base64,AAAA",
  top: [],
  mid: [],
  bottom: [],
  outline: [],
}

describe("usePatternManager 현장(crime) 모드 extractPattern", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    useCrimeStore.setState({ crimeData: [] })
  })

  it("통합 {code,score} 결과를 extractedRaw에만 저장하고 top/mid/bottom/outline은 자동 배치하지 않는다 (REQ-SCENE-006/D2)", async () => {
    vi.spyOn(api, "patternsExtract").mockResolvedValue({
      extracted: [
        { code: "s21b", score: 0.91 },
        { code: "s21c", score: 0.55 },
      ],
    })

    // canvasRef가 없으면 extractPattern이 getBoundingClientRect에서 죽으므로
    // 최소한의 DOM 요소를 심어준다(실제 렌더는 PatternCanvas 담당, 여기선 좌표만 필요).
    const { view, getCurrent } = renderCrimeManager(BASE_CRIME)
    Object.defineProperty(view.result.current.canvasRef, "current", {
      value: { getBoundingClientRect: () => ({ width: 200, height: 300 }) },
      writable: true,
    })

    await act(async () => {
      await view.result.current.extractPattern()
    })

    expect(getCurrent().extractedRaw).toEqual([
      { code: "s21b", score: 0.91 },
      { code: "s21c", score: 0.55 },
    ])
    expect(getCurrent().top).toEqual([])
    expect(getCurrent().mid).toEqual([])
    expect(getCurrent().bottom).toEqual([])
    expect(getCurrent().outline).toEqual([])
  })

  it("patternsExtract 요청 body의 type이 crime으로 전송된다", async () => {
    const spy = vi
      .spyOn(api, "patternsExtract")
      .mockResolvedValue({ extracted: [] })

    const { view } = renderCrimeManager(BASE_CRIME)
    Object.defineProperty(view.result.current.canvasRef, "current", {
      value: { getBoundingClientRect: () => ({ width: 200, height: 300 }) },
      writable: true,
    })

    await act(async () => {
      await view.result.current.extractPattern()
    })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ type: "crime" }),
      })
    )
  })

  it("요청 본문에 line_ys 키 자체가 없고, canvasRef를 전혀 설정하지 않아도 추출이 즉시 수행된다 (AC-SCENE-014)", async () => {
    const spy = vi
      .spyOn(api, "patternsExtract")
      .mockResolvedValue({ extracted: [] })

    // AC-SCENE-014: 현장 경로는 경계선/영역 선택 없이 즉시 추출되어야 한다 —
    // canvasRef.current를 전혀 세팅하지 않은(경계선 UI를 한 번도 그리지 않은)
    // 상태에서도 추출이 예외 없이 성공해야 한다(제로 사전 단계 증명).
    const { view } = renderCrimeManager(BASE_CRIME)

    await act(async () => {
      await view.result.current.extractPattern()
    })

    const body = (spy.mock.calls[0][0] as { body: Record<string, unknown> }).body
    expect("line_ys" in body).toBe(false)
    expect("render_size" in body).toBe(false)
  })

  it("경계선 상태가 기본값(초깃값)으로 남아 있어도 현장 요청에 유입되지 않는다 (AC-SCENE-014 엣지)", async () => {
    const spy = vi
      .spyOn(api, "patternsExtract")
      .mockResolvedValue({ extracted: [] })

    const { view } = renderCrimeManager(BASE_CRIME)
    // lineYs 기본값([100, 200])이 남아 있는 상태 그대로 두고, canvasRef만
    // 세팅한다(신발 경로였다면 이 값이 clamp되어 전송됐을 상황).
    Object.defineProperty(view.result.current.canvasRef, "current", {
      value: { getBoundingClientRect: () => ({ width: 200, height: 300 }) },
      writable: true,
    })
    expect(view.result.current.lineState.lineYs).toEqual([100, 200])

    await act(async () => {
      await view.result.current.extractPattern()
    })

    const body = (spy.mock.calls[0][0] as { body: Record<string, unknown> }).body
    expect("line_ys" in body).toBe(false)
  })
})
