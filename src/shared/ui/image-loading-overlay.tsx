/**
 * 이미지 로딩/실패 상태를 화면에 알리는 공용 오버레이 + 상태 훅.
 *
 * 왜 래퍼가 아니라 오버레이인가: 이 앱에는 좌표가 걸린 이미지가 많다
 * (정렬 캔버스·문양추출 캔버스·대응 박스 오버레이). 이들은 `img` 요소의
 * `getBoundingClientRect()`를 클릭/스케일 기준으로 삼으므로, 이미지를 감싸는
 * 래퍼를 새로 끼우면 레이아웃이 바뀌어 좌표가 어긋날 수 있다. 그래서 DOM 구조를
 * 전혀 바꾸지 않고, 기존 `relative` 컨테이너 안에 형제로 얹는 오버레이로 만든다.
 *
 * 사용법:
 *   const img = useImageLoadState(src)
 *   <div className="relative ...">
 *     <img src={src} {...img.handlers} />
 *     <ImageLoadingOverlay status={img.status} />
 *   </div>
 */
import { useCallback, useEffect, useState } from "react"
import { ImageOff, Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { ImageLoadStatus } from "@/shared/lib/use-image-load-state"

export interface ImageLoadingOverlayProps {
  status: ImageLoadStatus
  /** 로딩 중 문구(기본 "불러오는 중"). 좁은 썸네일에서는 `compact`로 숨긴다. */
  label?: string
  /** 실패 문구(기본 "이미지 없음"). */
  errorLabel?: string
  /** 아이콘만 표시(작은 썸네일용). */
  compact?: boolean
  className?: string
}

/**
 * 로딩/실패 오버레이. `loaded`면 아무것도 렌더하지 않는다.
 * 항상 `pointer-events-none` — 캔버스 좌표 판정을 절대 막지 않는다(프로젝트 규약).
 */
export function ImageLoadingOverlay({
  status,
  label = "불러오는 중",
  errorLabel = "이미지 없음",
  compact = false,
  className,
}: ImageLoadingOverlayProps) {
  if (status === "loaded") return null

  const failed = status === "error"
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-[#05080D]/70 text-[#5B6B85]",
        className
      )}
    >
      {failed ? (
        <ImageOff className={compact ? "size-4" : "size-6"} />
      ) : (
        <Loader2
          className={cn("animate-spin text-[#4A9EFF]", compact ? "size-4" : "size-6")}
        />
      )}
      {!compact && (
        <span className="text-[11px] font-medium">{failed ? errorLabel : label}</span>
      )}
    </div>
  )
}

export interface LoadingImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  /** 오버레이 기준이 되는 래퍼의 클래스. 이미지가 `absolute inset-0`인 자리에 넣을 때는
   * 래퍼에 `absolute inset-0`을 주면 기존 레이아웃이 그대로 유지된다. */
  containerClassName?: string
  overlayLabel?: string
  /** 작은 썸네일: 아이콘만 표시한다. */
  compactOverlay?: boolean
}

/**
 * 로딩/실패 오버레이가 내장된 `<img>` — **좌표와 무관한 표시용 이미지** 전용이다.
 * 래퍼 `div`를 한 겹 만들므로, `img` rect를 좌표 기준으로 쓰는 캔버스류에는 쓰지 말고
 * 그쪽은 `useImageLoadState` + `ImageLoadingOverlay`를 직접 조합한다.
 *
 * 캐시 적중 시 React가 핸들러를 붙이기 전에 load가 끝나 스피너가 남는 문제를
 * 콜백 ref에서 `complete`를 확인해 방지한다.
 */
export function LoadingImage({
  containerClassName,
  overlayLabel,
  compactOverlay,
  className,
  src,
  ...imgProps
}: LoadingImageProps) {
  const [status, setStatus] = useState<ImageLoadStatus>("loading")

  useEffect(() => {
    setStatus("loading")
  }, [src])

  const attachRef = useCallback((node: HTMLImageElement | null) => {
    // 캐시된 이미지는 onLoad가 오지 않을 수 있다 — 마운트 시점에 직접 확인한다.
    if (node?.complete && node.naturalWidth > 0) setStatus("loaded")
  }, [])

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <img
        ref={attachRef}
        src={src}
        className={className}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        {...imgProps}
      />
      <ImageLoadingOverlay status={status} label={overlayLabel} compact={compactOverlay} />
    </div>
  )
}
