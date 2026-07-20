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

/**
 * CORS 모드(`crossOrigin="anonymous"`)로 이미지를 로드한다 — 표시용 `<img>`와
 * **같은 요청 모드**라서 브라우저 캐시 항목을 공유한다(같은 이미지를 두 번
 * 내려받지 않는다).
 *
 * ⚠ 모드 일치가 핵심이다. 같은 URL을 `<img>`(no-cors)와 `fetch`(cors)로 각각
 * 요청하면, 브라우저가 먼저 캐시된 no-cors 응답을 cors 요청에 재사용하면서
 * CORS 컨텍스트 부재로 실패한다(전형적인 "이미지는 보이는데 fetch만 CORS 오류").
 * 이 경로와 표시용 `<img crossOrigin="anonymous">`는 반드시 짝을 이뤄야 한다.
 */
/**
 * CORS 모드 전용 캐시 파티션 URL을 만든다(쿼리 파라미터 1개 추가).
 *
 * 왜 필요한가: 브라우저 HTTP 캐시는 같은 URL의 응답을 요청 모드와 무관하게 재사용한다.
 * 앱의 다른 화면(`ShoeDetailContent`의 어텐션 타일, `crime-align`의 현장 이미지 등)이
 * 같은 이미지를 **일반 `<img>`(no-cors)**로 먼저 그리면 그 응답이 캐시에 남고, 이후
 * 이 기능의 **CORS 요청**이 그 응답을 재사용하면서 CORS 컨텍스트 부재로 차단된다
 * (`Access to image at ... has been blocked` + 이어지는 fetch 폴백까지 실패).
 *
 * 모든 컴포넌트에 `crossOrigin`을 붙여 모드를 통일하는 방법도 있으나, 한 곳만 놓쳐도
 * 조용히 재발하고 정렬 게이트 같은 필수 화면을 깨뜨릴 위험이 있다. 대신 이 기능이
 * 쓰는 URL에 마커를 붙여 **캐시 항목 자체를 분리**하면, 다른 화면이 무엇을 하든
 * 영향을 받지 않는다. 표시용 `<img>`와 크롭이 **같은 파티션 URL**을 쓰므로 이미지는
 * 여전히 한 번만 내려받는다.
 */
export function corsPartitionedUrl(src: string): string {
  if (!src || src.startsWith("data:")) return src
  return `${src}${src.includes("?") ? "&" : "?"}cors=1`
}

async function loadCorsImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = src
  // onload/onerror 대신 decode()를 쓴다 — 로드 실패든 디코드 실패든 반드시 reject되어
  // 아래 폴백으로 넘어간다(onerror가 오지 않는 환경에서 영원히 대기하지 않는다).
  await img.decode()
  return img
}

/**
 * 캔버스 가공용 이미지 로더. 원격 URL은 CORS 모드를 우선 시도하고(캐시 공유 →
 * 중복 다운로드 없음), 실패하면 기존 `fetch → data URL` 경로로 폴백한다 —
 * CORS 헤더를 주지 않는 서버에서도 동작이 깨지지 않도록 하는 안전장치다.
 */
async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
  const isRemoteUrl = /^(https?:)?\/\//.test(src) || src.startsWith("/")
  if (!isRemoteUrl) return loadSameOriginImage(src)
  try {
    return await loadCorsImage(src)
  } catch {
    return loadSameOriginImage(src)
  }
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
  const img = await loadImageForCanvas(src)
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
  const img = await loadImageForCanvas(src)
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
  const img = await loadImageForCanvas(src)
  const target: NaturalSize = { width: img.naturalWidth, height: img.naturalHeight }
  const from = options?.normalizeFrom
  return boxes.map(({ center, size }) => {
    const c = from ? normalizeShoePoint(center, from, target) : center
    const s = from ? normalizeShoeBoxSize(size, from, target) : size
    return drawCrop(img, centerToCropRegion(c, s), options)
  })
}
