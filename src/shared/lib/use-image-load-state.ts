/**
 * 이미지 로드 상태 훅 — `src`가 바뀌면 loading으로 되돌아간다.
 *
 * 표시 컴포넌트(`ImageLoadingOverlay` / `LoadingImage`)와 파일을 분리한 이유는
 * Fast Refresh 때문이다(한 파일이 컴포넌트와 비컴포넌트를 함께 내보내면 HMR이 깨진다).
 *
 * 좌표가 걸린 이미지(정렬·문양추출 캔버스, 대응 박스 오버레이)는 DOM 구조를 바꾸는
 * 래퍼 대신 이 훅 + `ImageLoadingOverlay`를 조합해 쓴다 — `img` 요소의
 * `getBoundingClientRect()`가 클릭/스케일 기준이라 레이아웃을 건드리면 안 되기 때문이다.
 *
 * 주의: 캐시된 이미지는 React가 핸들러를 붙이기 전에 load가 끝나 있을 수 있다. 그 경우
 * onLoad가 오지 않아 스피너가 남으므로, 이미 ref가 있는 호출부는 `img.complete`를 보고
 * `markLoaded()`를 부르고, 단순 표시용은 `LoadingImage`를 쓴다(내부에서 처리).
 */
import { useCallback, useEffect, useState } from "react"

export type ImageLoadStatus = "loading" | "loaded" | "error"

export interface UseImageLoadState {
  status: ImageLoadStatus
  /** `<img>`에 그대로 스프레드한다. */
  handlers: {
    onLoad: () => void
    onError: () => void
  }
  /** 캐시 적중 등으로 이미 로드된 걸 호출부가 먼저 알았을 때 수동 통지. */
  markLoaded: () => void
}

export function useImageLoadState(src?: string | null): UseImageLoadState {
  const [status, setStatus] = useState<ImageLoadStatus>("loading")

  useEffect(() => {
    setStatus("loading")
  }, [src])

  const markLoaded = useCallback(() => setStatus("loaded"), [])
  const markError = useCallback(() => setStatus("error"), [])

  return {
    status,
    handlers: { onLoad: markLoaded, onError: markError },
    markLoaded,
  }
}
