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
 * ⚠ src 변경 시 리셋은 반드시 **렌더 중**에 한다(effect 금지). `useEffect`로 미루면
 * 즉시 로드되는 이미지(정렬 폴리곤 크롭 결과 같은 data URL)의 `onLoad`가 effect보다
 * 먼저 발생해, effect가 그 "loaded"를 "loading"으로 덮어쓰고 스피너가 영구히 남는다.
 * 실제로 그 증상이 나왔다 — 족적(data URL)만 스피너가 안 꺼지고 신발(원격 URL)은
 * 정상이던 비대칭이 이 경합의 흔적이었다. 아래는 React 공식 "props 변경 시 렌더 중
 * state 조정" 패턴이다.
 *
 * 캐시 적중으로 핸들러 부착 전에 load가 끝난 경우는 여전히 onLoad가 오지 않으므로,
 * 이미 ref가 있는 호출부는 `img.complete`를 보고 `markLoaded()`를 부르고, 단순
 * 표시용은 `LoadingImage`를 쓴다(내부에서 콜백 ref로 처리).
 */
import { useCallback, useState } from "react"

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

interface State {
  src: string | null | undefined
  status: ImageLoadStatus
}

export function useImageLoadState(src?: string | null): UseImageLoadState {
  const [state, setState] = useState<State>({ src, status: "loading" })

  // 렌더 중 조정 — 조건부라 무한 루프가 아니며, 새 src의 onLoad보다 항상 앞선다.
  if (state.src !== src) setState({ src, status: "loading" })

  // 함수형 업데이트로 src를 보존한다(늦게 도착한 이전 src의 이벤트가 덮어쓰지 않도록).
  const markLoaded = useCallback(
    () => setState((prev) => (prev.status === "loaded" ? prev : { ...prev, status: "loaded" })),
    []
  )
  const markError = useCallback(
    () => setState((prev) => (prev.status === "error" ? prev : { ...prev, status: "error" })),
    []
  )

  return {
    // src가 방금 바뀐 렌더에서는 state가 아직 갱신 전이므로 loading으로 읽는다.
    status: state.src !== src ? "loading" : state.status,
    handlers: { onLoad: markLoaded, onError: markError },
    markLoaded,
  }
}
