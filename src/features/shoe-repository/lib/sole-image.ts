import { resolveImageToDataUrl } from "@/shared/lib"
import { resizeImage, rotateImage } from "@/utils/get-input-change"

/**
 * 신발 바닥 그림 손질(편집 판 「이미지 등록 · 교체」 · 「90° 회전」). 결과는 늘 data URL 이라
 * 등록(J4) · 수정(J5 선택 `image`) 본문과 AI 문양 추출(C3)에 그대로 쓴다.
 */

/** 파일 → data URL(최대 1000px 로 줄임 — 옛 신발 화면과 같은 `resizeImage`). 줄이기에 실패하면 원본 그대로 */
export async function readSoleFile(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("그림을 읽지 못했습니다"))
    reader.readAsDataURL(file)
  })
  try {
    return (await resizeImage(raw)) as string
  } catch {
    return raw
  }
}

/**
 * 그림을 시계 방향 90° 돌린 data URL. 서버 그림(보호된 주소)은 먼저 쿠키로 내려받아 data URL 로 바꾼다
 * (교차 출처 그림을 canvas 에 그리면 오염돼 `toDataURL` 이 실패 — `resolveImageToDataUrl`).
 */
export async function rotateSoleImage(image: string): Promise<string> {
  const dataUrl = await resolveImageToDataUrl(image)
  return (await rotateImage(dataUrl, 90)) as string
}
