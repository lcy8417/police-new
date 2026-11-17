/**
 * 서버 편집 이력(B3) → 이미지 편집 위젯 값(편집 이력 줄 · 원본 해시 · 되돌릴 곳) 순수 변환.
 * 위젯의 줄 번호 `no` 는 이력 순서(1부터), 0 = 받은 원본(작업본)이다. 서버 되돌리기 대상 `toEditId` 는 편집 번호(0 = 작업본).
 */
import type { EditHistory, EditHistoryItem, EditOp } from "@/entities/crime"

/** 위젯 편집 이력 한 줄(`widgets/image-edit` `ImageEditHistoryEntry` 와 같은 모양 — features 가 widgets 를 가져오지 않게 따로 둔다) */
export interface EditHistoryRow {
  no: number
  label: string
  at: string
  fileId: number
  sha256: string
  revertOf?: number
  src: string
}

const OP_LABEL: Record<string, string> = {
  crop: "자르기",
  calibrate: "4점 각도 보정",
  background: "배경 제거",
  inpaint: "장애물 제거",
  threshold: "이진화",
  denoise: "노이즈 제거",
}

/** 한 작업의 한국어 이름(회전은 방향 · 각도, 뒤집기는 축) */
export function opLabel(op: EditOp): string {
  if (op.op === "rotate") {
    const deg = typeof op.deg === "number" ? op.deg : 0
    return deg < 0 ? `좌로 ${Math.abs(deg)}° 회전` : `우로 ${deg}° 회전`
  }
  if (op.op === "flip") return op.axis === "vertical" ? "상하반전" : "좌우반전"
  return OP_LABEL[op.op] ?? op.op
}

/** KST ISO(`2026-11-17T14:03:05+09:00`) → 「14:03:05」(서버가 이미 KST 로 준다) */
export function clockOf(kstIso: string): string {
  const m = /T(\d{2}:\d{2}:\d{2})/.exec(kstIso)
  return m ? m[1] : kstIso
}

/** SHA-256 을 줄여 보이는 글자 — 「9f3a 71c0 … 4be2 c21e」 */
export function shortHash(sha256: string): string {
  if (sha256.length < 16) return sha256
  const g = (s: string) => `${s.slice(0, 4)} ${s.slice(4, 8)}`
  return `${g(sha256.slice(0, 8))} … ${g(sha256.slice(-8))}`
}

function rowLabel(item: EditHistoryItem, items: readonly EditHistoryItem[]): string {
  if (item.revertOf !== null) {
    if (item.revertOf === 0) return "원본으로 되돌림"
    const idx = items.findIndex((i) => i.editId === item.revertOf)
    return idx >= 0 ? `${idx + 1}단계로 되돌림` : "되돌림"
  }
  return item.ops.map(opLabel).join(" · ") || "편집"
}

/** 편집 이력 줄들(시간순). `fileUrl` = 파일 번호 → 그림 주소 */
export function toHistoryRows(history: EditHistory, fileUrl: (fileId: number) => string): EditHistoryRow[] {
  return history.items.map((item, i) => ({
    no: i + 1,
    label: rowLabel(item, history.items),
    at: clockOf(item.occurredDt),
    fileId: item.resultFileId,
    sha256: item.sha256,
    ...(item.revertOf !== null && { revertOf: item.revertOf }),
    src: fileUrl(item.resultFileId),
  }))
}

/** 줄 번호(0 = 받은 원본) → 서버 되돌리기 대상(`toEditId`)과 그 결과 파일. 없는 줄이면 null */
export function revertTargetOf(history: EditHistory, no: number): { toEditId: number; fileId: number | null } | null {
  if (no === 0) return { toEditId: 0, fileId: history.workingFileId }
  const item = history.items[no - 1]
  return item ? { toEditId: item.editId, fileId: item.resultFileId } : null
}

/**
 * 「되돌리기」(한 단계) 대상 줄 번호 — 마지막 줄 바로 앞부터 거슬러 올라가 지금 파일과 다른 모습인 첫 줄(0 = 받은 원본).
 * 되돌릴 곳이 없으면(줄 없음 · 전부 지금과 같은 파일) null.
 */
export function undoTargetNo(history: EditHistory): number | null {
  const current = history.currentFileId
  for (let no = history.items.length - 1; no >= 0; no--) {
    const target = revertTargetOf(history, no)
    if (target && target.fileId !== null && target.fileId !== current) return no
  }
  return null
}
