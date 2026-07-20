import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Camera, Database, ImageOff, Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { MatchCorrespondence } from "@/entities/match"

import { matchTop10Color } from "../lib/match-colors"
import {
  applySceneCropTransform,
  normalizeShoeBoxSize,
  normalizeShoePoint,
} from "../lib/footprint-transform"
import {
  scaleBoxToDisplay,
  type DisplaySize,
  type NaturalSize,
} from "../lib/overlay-geometry"
import type { CenterBox } from "../lib/crop-image"
import { useSceneFootprint } from "../model/use-scene-footprint"
import { useMatchCrops } from "../model/use-match-crops"
import { useShoerinsicsNaturalSize } from "../model/use-shoerinsics-natural-size"
import { CorrespondenceList } from "./CorrespondenceList"

/** [CORRECTION 3a] 비교 모드 — 두 이미지(족적·신발)를 함께 전환하는 토글. 프로젝트
 * 관례상 모드 토글은 enum이 아니라 한국어 문자열 리터럴로 표현한다. */
export type FootprintViewMode = "실사" | "스케치이진"

/** 오버레이 박스 1건 — 화면(족적/신발) 기준 원본 픽셀 중심 좌표 + 박스 한 변(px). */
interface OverlayBox {
  /** matches 배열의 0-based index — 선택 상태의 정체성. */
  index: number
  /** 1-based 표시 순위(rank) — 번호 배지·색 팔레트 키. */
  rank: number
  /** 원본 픽셀 중심 좌표 `[x, y]`(그 이미지의 좌표계 기준). */
  center: [number, number]
  /** 박스 한 변(px, 원본 픽셀 기준) — 계약값 96(`box.size`). */
  size: number
}

/**
 * 이미지 1장 + 그 위의 번호 박스 오버레이(대응 지도 한 변). 표시 크기(getBoundingClientRect)와
 * 원본 크기(naturalWidth/Height)를 로드/리사이즈마다 재측정해 `scaleBoxToDisplay`로
 * 박스를 정확히 앉힌다. `h-fixed w-auto`(object-fit 미사용)로 렌더해 표시 요소의
 * bounding rect가 곧 렌더된 이미지 크기와 일치하게 한다(letterbox로 인한 오버레이
 * 어긋남 방지 — CorrespondenceMap과 동일 관례).
 *
 * ⚠ 박스의 offset parent는 반드시 **이미지를 shrink-wrap한 래퍼**여야 한다.
 * `scaleBoxToDisplay`가 돌려주는 left/top은 "이미지 좌상단 기준" 좌표인데, 예전에는
 * 박스를 `<figure>`(가운데 정렬 flex 컨테이너) 기준으로 절대배치했다. 신발 이미지는
 * 세로로 길어(비율 0.42~0.45) figure 폭보다 훨씬 좁게 렌더되므로, 좌우 여백의 절반
 * 만큼 박스가 통째로 밀려 검은 배경 위에 찍혔다. 래퍼(`relative h-full w-fit`)를 한 겹
 * 끼워 박스 기준을 이미지 자신으로 되돌린다.
 *
 * [CORRECTION 3b] `normalizeFrom`이 주어지면(신발측 RGB 모드) 박스 좌표(Shoerinsics
 * 좌표계)를 먼저 이 컴포넌트가 실측한 표시 이미지의 자연 크기로 정규화한 뒤 스케일한다
 * — source===target(스케치/이진 모드)이면 항등 변환이라 별도 분기 없이 같은 경로가
 * 통한다.
 */
function ImageWithBoxes({
  src,
  alt,
  boxes,
  activeIndex,
  onSelect,
  onHover,
  testId,
  normalizeFrom,
}: {
  src: string
  alt: string
  boxes: OverlayBox[]
  activeIndex: number | null
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
  testId: string
  /** 박스 좌표가 정의된 원본 좌표계(예: Shoerinsics) — 실제 표시 중인 이미지와 다를 때만
   * 지정한다. 미지정(undefined)이면 박스 좌표를 그대로 쓴다. */
  normalizeFrom?: NaturalSize | null
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState<NaturalSize | null>(null)
  const [display, setDisplay] = useState<DisplaySize | null>(null)
  const [errored, setErrored] = useState(false)

  const measure = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) return
    const rect = img.getBoundingClientRect()
    setNatural({ width: img.naturalWidth, height: img.naturalHeight })
    setDisplay({ width: rect.width, height: rect.height })
  }, [])

  useLayoutEffect(() => {
    setErrored(false)
    measure()
    const img = imgRef.current
    if (!img || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(img)
    return () => ro.disconnect()
  }, [measure, src])

  return (
    <figure
      data-testid={testId}
      className="relative mx-auto flex h-[340px] w-fit min-w-[120px] max-w-full items-center justify-center overflow-hidden rounded-lg border border-[#1E2A3C] bg-[#05080D] sm:h-[460px]"
    >
      {errored ? (
        <div className="flex flex-col items-center gap-1.5 text-[#5B6B85]">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="text-[11px] font-medium">이미지 없음</span>
        </div>
      ) : (
        /* 박스 오버레이의 offset parent — 이미지를 shrink-wrap해 좌우 여백을 배제한다. */
        <div className="relative h-full w-fit">
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={measure}
            onError={() => setErrored(true)}
            draggable={false}
            className="block h-full w-auto max-w-full select-none"
          />
          {natural &&
            display &&
            boxes.map((box) => {
              const center = normalizeFrom
                ? normalizeShoePoint(box.center, normalizeFrom, natural)
                : box.center
              const size = normalizeFrom
                ? normalizeShoeBoxSize(box.size, normalizeFrom, natural)
                : box.size
              const rect = scaleBoxToDisplay(center, size, natural, display)
              const color = matchTop10Color(box.rank)
              const selected = activeIndex === box.index
              const active = activeIndex === null || selected
              return (
                <button
                  key={box.index}
                  type="button"
                  onClick={() => onSelect(box.index)}
                  onMouseEnter={() => onHover(box.index)}
                  onMouseLeave={() => onHover(null)}
                  aria-label={`대응 ${box.rank}번 박스`}
                  aria-pressed={selected}
                  // 런타임 좌표(오버레이 스케일 결과)라 left/top/width/height·색은 인라인 style 예외.
                  className={cn(
                    "group absolute rounded-[3px] border-2 transition-all duration-200",
                    active ? "opacity-100" : "opacity-25",
                    selected ? "z-20" : "z-10"
                  )}
                  style={{
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    borderColor: active ? color : "#5B6B85",
                    backgroundColor: selected ? `${color}26` : "transparent",
                    boxShadow: selected ? `0 0 12px ${color}66` : "none",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -top-2.5 -left-2.5 flex size-[18px] items-center justify-center rounded-full border font-mono text-[9px] font-bold tabular-nums text-[#05080D] shadow-md transition-transform duration-200",
                      selected ? "scale-[1.15]" : "group-hover:scale-110"
                    )}
                    style={{ backgroundColor: active ? color : "#5B6B85", borderColor: "#05080D" }}
                  >
                    {box.rank}
                  </span>
                </button>
              )
            })}
        </div>
      )}
    </figure>
  )
}

/** 이미지가 아직 준비되지 않은 동안(정렬 조회·크롭 생성 중) 보이는 자리표시자. */
function ImagePaneLoading({ testId }: { testId: string }) {
  return (
    <figure
      data-testid={testId}
      className="relative mx-auto flex h-[340px] w-full min-w-[120px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[#1E2A3C] bg-[#05080D] text-[#5B6B85] sm:h-[460px]"
    >
      <Loader2 className="size-5 animate-spin text-[#4A9EFF]" aria-hidden="true" />
      <span className="text-[10px] font-medium">이미지 준비 중…</span>
    </figure>
  )
}

/** [CORRECTION 3a] RGB ↔ 스케치/이진 비교 모드 토글. */
function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: FootprintViewMode
  onChange: (mode: FootprintViewMode) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-[#1E2A3C] bg-[#0F1826] p-0.5">
      {(["실사", "스케치이진"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors",
            mode === option
              ? "bg-[#152238] text-[#4A9EFF] shadow-[0_0_8px_rgba(37,99,235,0.3)]"
              : "text-[#5B6B85] hover:text-[#8A93A6]"
          )}
        >
          {option === "실사" ? "RGB" : "스케치·이진"}
        </button>
      ))}
    </div>
  )
}

export interface MatchCorrespondenceViewerProps {
  crimeNumber: string
  modelNumber: string
  /** score 내림차순 top-10 대응 목록(1개 이상 — 빈 배열/로딩/에러는 호출부인
   * `MatchTop10Grid`가 이 컴포넌트에 도달하기 전에 별도 상태로 처리한다). */
  matches: MatchCorrespondence[]
}

/**
 * SPEC-MATCH-TOP10-001 top-10 대응 뷰어 — 레거시 `MatchViewer`("유사부위 대응")의
 * A(대응 지도) 레이아웃을 확장했다: 족적(현장)·신발(등록) 이미지를 나란히 두고 각
 * 대응마다 두 이미지 위에 번호 박스를 그리며(REQ 요구사항 2), 우측은 top-10
 * 전체를 짝(pair)으로 비교하는 목록이 선택된 대응을 함께 강조한다(CORRECTION 2).
 * 클릭=선택 고정, hover=임시 강조 — 두 이미지가 이 상태를 공유해 좌우 박스가
 * 양방향으로 함께 강조된다(MatchViewer의 locked/hovered 패턴과 동일).
 *
 * ⚠ 좌표 공간: `fx,fy`는 `static/crime_images/<crimeNumber>.png`(저장 현장 이미지
 * 좌표계), `sx,sy`는 `static/shoes_images/Shoerinsics/<modelNumber>.png`(신발 이진
 * 이미지 좌표계) 기준이다 — 매칭에 실제로 쓰인 이진 이미지다. 백엔드
 * `routes/crime_process.py`의 `match_top10` 핸들러가 `sx,sy`를 `shoe_transform`으로
 * 역변환하는 원본이 정확히 이 파일이므로, 다른 신발 이미지를 표시하면 박스가
 * 어긋난다(백엔드 미변경, 표시 소스만 확인 — spec.md 좌표 공간 검증 항목).
 *
 * [CORRECTION 3a] RGB(`crime_images`+`shoes_images/B`) ↔ 스케치/이진
 * (`crime_outlines`+`shoes_images/Shoerinsics`) 두 이미지를 함께 전환하는 토글을
 * 추가했다. [CORRECTION 3b] 족적 표시는 정렬 폴리곤의 경계상자로 크롭하고
 * `flipHorizontal`이면 좌우 반전한다 — 실제 매칭이 사용한 정합 상태를 그대로
 * 반영한다. 오버레이 박스도 동일한 변환(크롭 오프셋 차감 + 미러)을 거친다.
 */
export function MatchCorrespondenceViewer({
  crimeNumber,
  modelNumber,
  matches,
}: MatchCorrespondenceViewerProps) {
  const [locked, setLocked] = useState<number | null>(matches.length > 0 ? 0 : null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [mode, setMode] = useState<FootprintViewMode>("실사")

  // matches가 갱신되면(재시도 등) 선택을 최상위 대응으로 재설정한다.
  useEffect(() => {
    setLocked(matches.length > 0 ? 0 : null)
    setHovered(null)
  }, [matches])

  const activeIndex = hovered ?? locked
  const handleSelect = (index: number) => setLocked(index)

  const apiBase = import.meta.env.VITE_API_URL ?? ""
  const rawSceneImageSrc =
    mode === "실사"
      ? `${apiBase}/crime_images/${crimeNumber}.png`
      : `${apiBase}/crime_outlines/${crimeNumber}.png`
  const shoeImageSrc =
    mode === "실사"
      ? `${apiBase}/shoes_images/B/${modelNumber}.png`
      : `${apiBase}/shoes_images/Shoerinsics/${modelNumber}.png`

  // [CORRECTION 3b] 정렬 폴리곤 경계상자로 크롭 + flipHorizontal 반영. 폴리곤이
  // 없으면(예: 데이터 도착 경쟁) 원본 그대로 폴백한다(크롭 전 레거시 동작과 동일).
  const footprint = useSceneFootprint({ crimeNumber, modelNumber, sourceSrc: rawSceneImageSrc })

  // [CORRECTION 3a] RGB 모드에서만 Shoerinsics 원본 크기를 실측해 sx,sy를 정규화한다
  // (스케치/이진 모드는 표시 이미지 자체가 Shoerinsics라 정규화가 불필요).
  const shoerinsicsSize = useShoerinsicsNaturalSize({ modelNumber, enabled: mode === "실사" })

  // 우측 "세부 대응 목록"의 썸네일 — 좌측 큰 이미지와 **같은 비교 모드**의 이미지에서
  // 크롭한다(이전에는 족적이 항상 RGB, 신발이 항상 이진이라 모드 토글과 어긋났다).
  //
  // 족적: RGB 모드는 백엔드가 준 `box_image`(= `crime_images` 크롭)를 그대로 쓰고,
  // 스케치·이진 모드에서만 `crime_outlines`에서 다시 크롭한다. 백엔드 게이트 4가
  // 윤곽↔현장 이미지의 (H,W) 일치를 보장하므로 `box.cx,cy`를 정규화 없이 쓸 수 있다.
  const sceneCropBoxes: CenterBox[] = matches.map((m) => ({
    center: [m.box.cx, m.box.cy],
    size: m.box.size,
  }))
  const outlineCrops = useMatchCrops({
    src: `${apiBase}/crime_outlines/${crimeNumber}.png`,
    boxes: sceneCropBoxes,
    enabled: mode === "스케치이진",
  })
  const sceneCrops = mode === "실사" ? matches.map((m) => m.box_image) : outlineCrops

  // 신발: `sx,sy`는 Shoerinsics 좌표계이므로 이진 모드에서는 그대로, RGB(`B`) 모드에서는
  // 실측한 Shoerinsics 크기로 정규화해 크롭한다. 그 실측이 도착하기 전에 크롭하면
  // 정규화 없는 잘못된 영역이 한 번 그려지므로, 도착 전까지는 아예 비활성화한다.
  const shoeCropBoxes: CenterBox[] = matches.map((m) => ({
    center: [m.sx, m.sy],
    size: m.box.size,
  }))
  const shoeCrops = useMatchCrops({
    src: shoeImageSrc,
    boxes: shoeCropBoxes,
    normalizeFrom: mode === "실사" ? shoerinsicsSize : null,
    enabled: mode === "스케치이진" || Boolean(shoerinsicsSize),
  })

  const sceneBoxes: OverlayBox[] = matches.map((m, i) => ({
    index: i,
    rank: i + 1,
    center: footprint.crop
      ? applySceneCropTransform([m.fx, m.fy], footprint.crop, footprint.flipHorizontal)
      : [m.fx, m.fy],
    size: m.box.size,
  }))
  const shoeBoxes: OverlayBox[] = matches.map((m, i) => ({
    index: i,
    rank: i + 1,
    center: [m.sx, m.sy],
    size: m.box.size,
  }))

  return (
    <div className="@container">
      <div className="grid gap-3 @[760px]:grid-cols-[minmax(0,1fr)_280px]">
        {/* 좌측: 족적(현장) ↔ 신발(등록) 대응 쌍 — 요구사항 1·2. */}
        <div className="@container flex flex-col gap-2 rounded-xl border border-[#1E2A3C] bg-[#0D1420]/40 p-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-[#3B82F6]/50 bg-[#152238] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#4A9EFF]">
              대응
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#8A93A6] uppercase">
              족적 ↔ 신발
            </span>
            <span className="rounded border border-[#1E2A3C] bg-[#0F1826] px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-[#5B6B85]">
              {matches.length}
            </span>
            <span className="h-px flex-1 bg-[#1E2A3C]" aria-hidden="true" />
            <ViewModeToggle mode={mode} onChange={setMode} />
          </div>

          <div className="flex flex-col gap-3 @[420px]:flex-row @[420px]:items-stretch">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-1.5 px-0.5 font-mono text-[10px] tracking-[0.12em] text-[#8A93A6] uppercase">
                <Camera className="size-3 text-[#4A9EFF]" aria-hidden="true" />
                족적 (현장)
              </span>
              {footprint.src ? (
                <ImageWithBoxes
                  src={footprint.src}
                  alt="족적 현장 이미지"
                  boxes={sceneBoxes}
                  activeIndex={activeIndex}
                  onSelect={handleSelect}
                  onHover={setHovered}
                  testId="match-scene-image"
                />
              ) : (
                <ImagePaneLoading testId="match-scene-image" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-1.5 px-0.5 font-mono text-[10px] tracking-[0.12em] text-[#8A93A6] uppercase">
                신발 (등록)
                <Database className="size-3 text-[#2DD4BF]" aria-hidden="true" />
              </span>
              <ImageWithBoxes
                src={shoeImageSrc}
                alt={`신발 이미지 (등록 모델 ${modelNumber})`}
                boxes={shoeBoxes}
                activeIndex={activeIndex}
                onSelect={handleSelect}
                onHover={setHovered}
                testId="match-shoe-image"
                normalizeFrom={mode === "실사" ? shoerinsicsSize : null}
              />
            </div>
          </div>
        </div>

        {/* 우측: [CORRECTION 2] top-10 전체를 짝(pair)으로 비교하는 목록. */}
        <CorrespondenceList
          matches={matches}
          sceneCrops={sceneCrops}
          shoeCrops={shoeCrops}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onHover={setHovered}
        />
      </div>
    </div>
  )
}
