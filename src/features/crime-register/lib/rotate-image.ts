/**
 * 증거 이미지에 대한 자유각 회전. `utils/get-input-change.js`의 `rotateImage`는
 * 90도 배수만 처리하지만, 이 함수는 임의의 각도로 일반화하여 어떤 모서리도
 * 잘리지 않도록 출력 캔버스를 회전된 바운딩 박스 크기로 키운다.
 */

/** `degrees`만큼 회전된 `w`×`h` 사각형의 바운딩 박스 크기(순수 함수). */
export function rotatedBounds(
  w: number,
  h: number,
  degrees: number
): { width: number; height: number } {
  const rad = (degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  return {
    width: Math.round(w * cos + h * sin),
    height: Math.round(w * sin + h * cos),
  }
}

/**
 * `base64`를 `degrees`만큼 회전시켜, 회전된 바운딩 박스 크기의 새 PNG data URL을
 * 반환한다. 360도의 정수배 회전일 때는 no-op(입력을 그대로 반환)이다.
 */
export async function rotateArbitrary(base64: string, degrees: number): Promise<string> {
  if (degrees % 360 === 0) return base64

  const img = new Image()
  img.src = base64
  await img.decode()

  const w = img.naturalWidth
  const h = img.naturalHeight
  const { width, height } = rotatedBounds(w, h, degrees)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return base64

  ctx.translate(width / 2, height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(img, -w / 2, -h / 2)

  return canvas.toDataURL("image/png")
}
