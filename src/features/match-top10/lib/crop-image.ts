/**
 * [CORRECTION 2 / 3b] 정적 이미지에서 클라이언트 사이드로 크롭(+선택적 좌우 미러)된
 * PNG data URL을 만든다 — 추가 API 호출 없이(REQ: "zero additional API calls")
 * 이미 로드 가능한 정적 이미지(`box_image` 짝인 신발측 크롭, 정렬 폴리곤으로 크롭된
 * 족적 표시)를 캔버스로 가공한다.
 *
 * `shared/lib/image/resolve-image.ts`의 `resolveImageToDataUrl`로 먼저 동일 출처
 * data URL로 통일한 뒤 캔버스에 그린다 — 교차 출처 이미지를 바로 캔버스에 그리면
 * 오염(taint)되어 `toDataURL`이 SecurityError로 실패하기 때문(그 파일의 주석과 동일
 * 함정, `bake.ts`의 `new Image → 캔버스 → toDataURL` 템플릿을 따른다).
 *
 * DOM(canvas)·`Image.decode()`에 의존하므로 vitest 단위테스트 대상이 아니다(jsdom에는
 * canvas·decode 미지원 — `bake.ts`/`pixel-filters.ts`와 동일 관례). 순수 좌표 수학은
 * `footprint-transform.ts`/`overlay-geometry.ts`가 커버한다.
 */
import { resolveImageToDataUrl } from "@/shared/lib/image/resolve-image"

import {
  centerToCropRegion,
  normalizeShoeBoxSize,
  normalizeShoePoint,
  type PixelRect,
} from "./footprint-transform"
import type { NaturalSize } from "./overlay-geometry"

export interface CropOptions {
  /** true면 크롭 폭 기준으로 좌우 반전해서 그린다(REQ-ALIGN-020 flipHorizontal). */
  flipHorizontal?: boolean
}

async function loadSameOriginImage(src: string): Promise<HTMLImageElement> {
  const dataUrl = await resolveImageToDataUrl(src)
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  return img
}

function drawCrop(img: HTMLImageElement, region: PixelRect, options?: CropOptions): string {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(region.width))
  canvas.height = Math.max(1, Math.round(region.height))
  const ctx = canvas.getContext("2d")
  if (!ctx) return img.src

  if (options?.flipHorizontal) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(
    img,
    region.left,
    region.top,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas.toDataURL("image/png")
}

/** `src` 이미지에서 `region` 한 곳만 크롭(+선택적 미러)해 PNG data URL로 반환한다. */
export async function cropImageToDataUrl(
  src: string,
  region: PixelRect,
  options?: CropOptions
): Promise<string> {
  const img = await loadSameOriginImage(src)
  return drawCrop(img, region, options)
}

/**
 * `src` 이미지 하나를 한 번만 로드해 여러 `regions`를 각각 크롭한다(top-10 리스트처럼
 * 같은 신발 이미지에서 대응별 크롭을 여러 장 뽑을 때 디코드를 N번 반복하지 않기 위함).
 */
export async function cropImageRegionsToDataUrls(
  src: string,
  regions: readonly PixelRect[],
  options?: CropOptions
): Promise<string[]> {
  const img = await loadSameOriginImage(src)
  return regions.map((region) => drawCrop(img, region, options))
}

/** 대응 1건의 크롭 기준 — 중심점 + 정사각 한 변(둘 다 `normalizeFrom` 좌표계 기준). */
export interface CenterBox {
  center: readonly [number, number]
  size: number
}

export interface CenterCropOptions extends CropOptions {
  /**
   * 중심 좌표가 정의된 원본 좌표계(예: `sx,sy`의 Shoerinsics). 크롭 대상 이미지와
   * 좌표계가 다를 때만 지정한다 — 지정하면 대상 이미지의 실측 자연 크기로 먼저
   * 정규화한 뒤 크롭한다(`normalizeShoePoint`/`normalizeShoeBoxSize`).
   */
  normalizeFrom?: NaturalSize | null
}

/**
 * 이미지 하나를 한 번만 로드해 여러 "중심점 + 정사각 크기"를 각각 크롭한다.
 * `cropImageRegionsToDataUrls`와 달리 **대상 이미지의 자연 크기를 로드 후에 알 수
 * 있으므로**, 좌표계가 다른 이미지(RGB `shoes_images/B` 등)에서 크롭할 때 필요한
 * 정규화를 호출부가 아니라 여기서 처리한다 — 호출부는 자연 크기를 미리 알 수 없다.
 */
export async function cropImageCenterBoxesToDataUrls(
  src: string,
  boxes: readonly CenterBox[],
  options?: CenterCropOptions
): Promise<string[]> {
  const img = await loadSameOriginImage(src)
  const target: NaturalSize = { width: img.naturalWidth, height: img.naturalHeight }
  const from = options?.normalizeFrom
  return boxes.map(({ center, size }) => {
    const c = from ? normalizeShoePoint(center, from, target) : center
    const s = from ? normalizeShoeBoxSize(size, from, target) : size
    return drawCrop(img, centerToCropRegion(c, s), options)
  })
}
