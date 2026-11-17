/**
 * 이미지를 좌우(horizontal) · 상하(vertical)로 뒤집어 PNG data URL 로 돌려준다(오프스크린 canvas).
 * 서버 이미지 주소면 먼저 data URL 로 바꿔 그린다(교차 출처 canvas 오염 방지 — `resolveImageToDataUrl`).
 */
import { resolveImageToDataUrl } from "@/shared/lib"

export type FlipAxis = "horizontal" | "vertical"

export async function flipImage(image: string, axis: FlipAxis): Promise<string> {
  const source = new Image()
  source.src = await resolveImageToDataUrl(image)
  await source.decode()
  const canvas = document.createElement("canvas")
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("이미지를 뒤집지 못했습니다")
  if (axis === "horizontal") {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
  }
  ctx.drawImage(source, 0, 0)
  return canvas.toDataURL("image/png")
}
