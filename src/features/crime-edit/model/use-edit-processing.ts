/**
 * 이미지 편집 서버 처리(배경제거 segmentation · 접합장애물제거 inpainting · 노이즈제거 denoising)와
 * 편집 이미지 저장을 감싸는 TanStack `useMutation` 래퍼 모음.
 *
 * 규약(docs/api-communication.md §2B): 이미지 처리 엔드포인트(`services/api.js`)는 **camelCase 변환을
 * 하지 않는다** — 반환 image는 서버 원형(data URL 문자열) 그대로다. 컴포넌트에서 raw fetch를 직접
 * 호출하지 않고 이 훅을 통해 서버 상태(로딩/에러)를 관리한다.
 *
 * 레거시 대응: `hooks/useImageProcessing.js` + `components/EditMain.jsx`의 각 기능별 body/params 계약.
 * - segmentation/inpainting: body `{ polygon, image }`, params `render_size=W&render_size=H`(URLSearchParams).
 * - denoising: body가 **raw image 문자열**(객체 아님) — 레거시 `useImageProcessing.js:16-18` 특수처리.
 */

import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { saveCrimeEditImage } from "@/entities/crime";
import { imageProcessing as imageProcessingRaw } from "@/services/api";

// 레거시 `services/api.js`는 무타입 JS라 기본값(null) 매개변수가 `null` 타입으로 추론된다.
// 실제 계약(body는 객체 또는 raw 문자열, params는 URLSearchParams)에 맞춰 시그니처를 부여한다.
const imageProcessing = imageProcessingRaw as (
  crimeNumber: string,
  endPoint: string,
  body?: unknown,
  params?: URLSearchParams | null
) => Promise<string>;

/**
 * 서버 이미지 처리 결과를 표시·저장 양쪽이 가정하는 형태로 정규화한다.
 * canvas(`toDataURL`)는 `data:image/...` data URL을 주지만 서버는 접두어 없는 raw base64로 줄 수 있다.
 * `<img>` 표시와 저장(`stripDataUrl` prefix 제거)이 모두 data URL을 가정하므로 API 경계에서 감싼다.
 * 이미 data URL이거나 서버 URL/경로면 그대로 둔다(멱등 — bare base64만 data URL로 변환).
 */
function ensureImageDataUrl(image: string): string {
  if (!image) return image;
  if (image.startsWith("data:") || /^(https?:)?\/\//.test(image) || image.startsWith("/")) {
    return image;
  }
  return `data:image/png;base64,${image}`;
}

/** 폴리곤 기반 서버 처리(segmentation/inpainting) 뮤테이션 입력. */
export interface PolygonProcessInput {
  /** 서버 전송용으로 직렬화된 폴리곤(`serializePolygon` 결과 `[[x, y], ...]`). */
  polygon: number[][];
  /** 서버로 보낼 image(데이터 URL 또는 crimeNumber — `prepareImage` 규약). */
  image: string;
  /** 표시 이미지 rect의 `[width, height]`(`computeRenderSize` 결과). */
  renderSize: [number, number];
}

/** 노이즈제거 뮤테이션 입력. */
export interface DenoiseInput {
  /** 서버로 보낼 image(데이터 URL 또는 crimeNumber — `prepareImage` 규약). */
  image: string;
}

/** 편집 이미지 저장 뮤테이션 입력. */
export interface SaveEditImageInput {
  /** 저장할 최종 편집 이미지(data URL). base64 prefix 제거는 `saveCrimeEditImage`가 처리. */
  image: string | null;
}

/**
 * `render_size`를 URLSearchParams로 만든다. 레거시 `handleRightClick`처럼 같은 키(`render_size`)를
 * width·height 순서로 두 번 append한다.
 */
function buildRenderSizeParams([width, height]: [number, number]): URLSearchParams {
  return new URLSearchParams([
    ["render_size", String(width)],
    ["render_size", String(height)],
  ]);
}

/** 배경제거(segmentation): 폴리곤+이미지 → 배경이 분리된 image 문자열. */
export function useSegmentation(
  crimeNumber: string
): UseMutationResult<string, Error, PolygonProcessInput> {
  return useMutation<string, Error, PolygonProcessInput>({
    mutationFn: ({ polygon, image, renderSize }) =>
      imageProcessing(
        crimeNumber,
        "segmentation",
        { polygon, image },
        buildRenderSizeParams(renderSize)
      ).then(ensureImageDataUrl),
  });
}

/** 접합장애물제거(inpainting): 폴리곤+이미지 → 장애물이 복원된 image 문자열. */
export function useInpainting(
  crimeNumber: string
): UseMutationResult<string, Error, PolygonProcessInput> {
  return useMutation<string, Error, PolygonProcessInput>({
    mutationFn: ({ polygon, image, renderSize }) =>
      imageProcessing(
        crimeNumber,
        "inpainting",
        { polygon, image },
        buildRenderSizeParams(renderSize)
      ).then(ensureImageDataUrl),
  });
}

/**
 * 노이즈제거(denoising): image → 노이즈가 제거된 image 문자열.
 * ⚠ body가 객체가 아니라 **raw image 문자열**이다(레거시 특수처리 재현).
 */
export function useDenoising(
  crimeNumber: string
): UseMutationResult<string, Error, DenoiseInput> {
  return useMutation<string, Error, DenoiseInput>({
    mutationFn: ({ image }) =>
      imageProcessing(crimeNumber, "denoising", image).then(ensureImageDataUrl),
  });
}

/**
 * 편집 이미지 저장: `saveCrimeEditImage`(entities/crime)에 위임한다. 이 래퍼가 data URL의
 * base64 prefix를 `stripDataUrl`로 제거해 `PUT /crime/edit_image/{n}`로 보낸다.
 */
export function useSaveEditImage(
  crimeNumber: string
): UseMutationResult<Response, Error, SaveEditImageInput> {
  return useMutation<Response, Error, SaveEditImageInput>({
    mutationFn: ({ image }) => saveCrimeEditImage({ crimeNumber, scrollState: { image } }),
  });
}
