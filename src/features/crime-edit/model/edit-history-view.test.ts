import { describe, expect, it } from "vitest"

import type { EditHistory, EditHistoryItem } from "@/entities/crime/api/edit-history-api"

import { clockOf, opLabel, revertTargetOf, shortHash, toHistoryRows, undoTargetNo } from "./edit-history-view"

const item = (editId: number, resultFileId: number, ops: EditHistoryItem["ops"], revertOf: number | null = null): EditHistoryItem => ({
  editId,
  ops,
  srcFileId: 0,
  resultFileId,
  sha256: `${editId}`.padStart(64, "a"),
  width: 10,
  height: 10,
  actorId: "u1",
  actorNm: "감정관",
  occurredDt: "2026-11-17T14:03:05+09:00",
  revertOf,
})

const history = (items: EditHistoryItem[], current: number | null, working: number | null = 1): EditHistory => ({
  original: null,
  workingFileId: working,
  currentFileId: current,
  legacy: working === null && items.length === 0,
  items,
})

const url = (id: number) => `/files/${id}`

describe("opLabel", () => {
  it("작업 이름을 한국어로", () => {
    expect(opLabel({ op: "crop" })).toBe("자르기")
    expect(opLabel({ op: "rotate", deg: -4 })).toBe("좌로 4° 회전")
    expect(opLabel({ op: "rotate", deg: 2.5 })).toBe("우로 2.5° 회전")
    expect(opLabel({ op: "flip", axis: "vertical" })).toBe("상하반전")
    expect(opLabel({ op: "flip", axis: "horizontal" })).toBe("좌우반전")
    expect(opLabel({ op: "threshold", value: 127 })).toBe("이진화")
    expect(opLabel({ op: "unknown" })).toBe("unknown")
  })
})

describe("clockOf · shortHash", () => {
  it("KST 시:분:초 · 해시 앞뒤 8자", () => {
    expect(clockOf("2026-11-17T09:08:07+09:00")).toBe("09:08:07")
    expect(shortHash("9f3a71c0" + "0".repeat(48) + "4be2c21e")).toBe("9f3a 71c0 … 4be2 c21e")
  })
})

describe("toHistoryRows", () => {
  it("줄마다 그 단계 결과 그림 · 되돌림 줄은 대상 단계 이름", () => {
    const h = history(
      [item(10, 2, [{ op: "threshold" }]), item(11, 3, [{ op: "crop" }, { op: "rotate", deg: -1 }]), item(12, 2, [{ op: "revert", toEditId: 10 }], 10), item(13, 1, [{ op: "revert", toEditId: 0 }], 0)],
      1
    )
    const rows = toHistoryRows(h, url)
    expect(rows.map((r) => r.label)).toEqual(["이진화", "자르기 · 좌로 1° 회전", "1단계로 되돌림", "원본으로 되돌림"])
    expect(rows.map((r) => r.no)).toEqual([1, 2, 3, 4])
    expect(rows[2]).toMatchObject({ fileId: 2, src: "/files/2", revertOf: 10, at: "14:03:05" })
    expect(rows[0].revertOf).toBeUndefined()
  })
})

describe("되돌릴 곳", () => {
  it("줄 번호 → 편집 번호(0 = 작업본)", () => {
    const h = history([item(10, 2, [{ op: "crop" }])], 2)
    expect(revertTargetOf(h, 0)).toEqual({ toEditId: 0, fileId: 1 })
    expect(revertTargetOf(h, 1)).toEqual({ toEditId: 10, fileId: 2 })
    expect(revertTargetOf(h, 5)).toBeNull()
  })

  it("한 단계 되돌리기 = 지금과 다른 모습인 바로 앞 줄", () => {
    expect(undoTargetNo(history([], 1))).toBeNull()
    expect(undoTargetNo(history([item(10, 2, [{ op: "crop" }])], 2))).toBe(0)
    // 3번째 줄(되돌림)이 1단계 파일과 같으면 2단계로
    const h = history([item(10, 2, [{ op: "crop" }]), item(11, 3, [{ op: "flip" }]), item(12, 2, [{ op: "revert" }], 10)], 2)
    expect(undoTargetNo(h)).toBe(2)
    // 앞 줄이 전부 지금과 같은 파일이면 없음
    const same = history([item(10, 1, [{ op: "revert" }], 0)], 1)
    expect(undoTargetNo(same)).toBeNull()
  })
})
