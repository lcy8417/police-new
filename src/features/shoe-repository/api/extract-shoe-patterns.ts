import { apiSend } from "@/shared/api"

/**
 * 신발 AI 문양 추출(C3 `type=shoes` — 이미지 처리 계층, 무변환). 권한은 `SHOE_EDIT` 또는 `SHOE_PATTERN`(분업, 서버 §3-8).
 *
 * 경로는 옛 신발 화면과 같은 `/crime/shoes/patterns_extract`(경로 번호는 감정물이 아니라 자리표시 — 서버가 범위 검사를 하지 않는다).
 * `image` = 새로 올리거나 돌린 그림이면 data URL, 서버에 있는 그림이면 **원본 신발 ID 문자열**(서버가 `shoes_images/B/<ID>.png`를 찾는다).
 *
 * 좌표(docs/api-communication.md §4): 편집 판의 상 · 중 · 하 경계는 그림 높이의 34% · 67% 고정 장식이다(`SoleZoneLines`).
 * 서버는 `line_ys`를 `render_size` 높이 비율로 원본에 맞춰 자르므로, 기준 크기 1000×1000 에서 정수 340 · 670 을 보낸다
 * (정수 · `[1, renderH-1]` 안 · 오름차순 · 세 영역 모두 1행 이상 — 계약 그대로).
 */
export const SHOE_EXTRACT_RENDER_SIZE: [number, number] = [1000, 1000]
export const SHOE_EXTRACT_LINE_YS: [number, number] = [340, 670]

export type ShoeExtractZone = "top" | "mid" | "bottom" | "outline"
export type ShoeExtractResult = Record<ShoeExtractZone, string[]>

/** 서버 응답 한 칸 → 문양 이름. 모델은 이름 문자열을, 무GPU 스텁은 `[이름, 점수]`를 준다 — 둘 다 이름만 */
function nameOf(entry: unknown): string | null {
  if (typeof entry === "string") return entry
  if (Array.isArray(entry) && typeof entry[0] === "string") return entry[0]
  return null
}

/** 응답 `{ top, mid, bottom, outline }` → 부위별 이름 배열(같은 부위 중복 제거, 순서 유지) */
export function normalizeShoeExtract(data: unknown): ShoeExtractResult {
  const out: ShoeExtractResult = { top: [], mid: [], bottom: [], outline: [] }
  if (!data || typeof data !== "object") return out
  for (const zone of Object.keys(out) as ShoeExtractZone[]) {
    const raw = (data as Record<string, unknown>)[zone]
    if (!Array.isArray(raw)) continue
    const names = raw.map(nameOf).filter((n): n is string => n !== null && n !== "")
    out[zone] = [...new Set(names)]
  }
  return out
}

/** 추출 요청 본문의 `image` — data URL 이면 그대로, 아니면(서버 그림) 신발 ID 문자열 */
export function shoeExtractImage(image: string | null | undefined, ftwrId: string): string {
  return image?.startsWith("data:image") ? image : ftwrId
}

export async function extractShoePatterns(image: string): Promise<ShoeExtractResult> {
  const res = await apiSend("/crime/shoes/patterns_extract", "POST", {
    image,
    type: "shoes",
    line_ys: SHOE_EXTRACT_LINE_YS,
    render_size: SHOE_EXTRACT_RENDER_SIZE,
  })
  return normalizeShoeExtract(await res.json())
}
