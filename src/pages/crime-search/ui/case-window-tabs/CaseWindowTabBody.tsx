import * as React from "react"

import { useCrimeStore } from "@/entities/crime"

import { CompareTab } from "./CompareTab"
import { ConfirmTab } from "./ConfirmTab"
import { EditTab } from "./EditTab"
import { InfoTab } from "./InfoTab"
import { caseImagesOf, pickImage } from "./model/resolve-image"
import { useViewer } from "./model/use-viewer"
import { PatternTab } from "./PatternTab"
import { SearchTab } from "./SearchTab"

/** 사건 창 작업 탭(`widgets/case-window` `CaseWindowTab` 과 같은 값) */
export type CaseWindowTabKey = "info" | "edit" | "pattern" | "search" | "compare" | "confirm"

export interface CaseWindowTabBodyProps {
  /** 사건 감정번호 = 감정의뢰번호(`apprslReqestNo`, 예 `05019-24-0017`). 감정물 번호 하나를 줘도 그 의뢰로 푼다 */
  aprthngNo: string
  /** 고른 이미지 — 감정물 번호 전체(`05019-24-0017_5`) 또는 뒤 순번(`5`). null 이면 첫 장 */
  imageNo: string | null
  tab: CaseWindowTabKey
  onSelectTab: (tab: CaseWindowTabKey) => void
  /** 이미지 바꾸기 — 감정물 번호 전체를 넘긴다 */
  onSelectImage: (no: string) => void
}

/** 탭 본문 자리 안내(불러오는 중 · 없음 · 준비 중) */
function Note({ children }: { children: React.ReactNode }) {
  return <p className="m-0 grid h-full place-items-center p-[24px] text-center text-[12.5px] text-muted-foreground">{children}</p>
}

/**
 * 사건 창 탭 본문(갈래 ④) — 고른 탭의 시안 위젯(창 모드 `inWindow`)에 실제 데이터를 넣는다.
 * 사건 · 이미지 값은 지금 앱의 감정물 목록(`GET /crime/` → `useCrimeStore`)에서 찾는다(사건 하나 = 같은 감정의뢰번호의 감정물들).
 * 새 API 가 필요한 것(판정 · 교차 검증 · 감정서 · 검색 이력 저장 · 가중치 반영 · 본 위치 · 확인대상 · 편집 이력)은 숨기거나 「준비 중」.
 */
export function CaseWindowTabBody({ aprthngNo, imageNo, tab, onSelectTab, onSelectImage }: CaseWindowTabBodyProps) {
  const crimeData = useCrimeStore((s) => s.crimeData)
  const viewer = useViewer()
  const images = React.useMemo(() => caseImagesOf(crimeData, aprthngNo), [crimeData, aprthngNo])
  const image = pickImage(images, aprthngNo, imageNo)

  if (tab === "confirm") {
    // 결과 확인 탭 자리(0단계) — 묶음 ②가 G1 · G2 · H1 · H2 · H5로 채운다(ConfirmTab.tsx)
    return <ConfirmTab aprthngNo={aprthngNo} />
  }
  if (!image) {
    return <Note>{crimeData.length === 0 ? "사건을 불러오는 중…" : "이 사건의 이미지를 찾지 못했습니다."}</Note>
  }
  const key = image.aprthngNo ?? ""
  const openEdit = (no: string) => {
    if (no !== key) onSelectImage(no)
    onSelectTab("edit")
  }

  // 이미지가 바뀌면 탭 본문 상태(편집 스택 · 고른 부위 등)를 새로 시작한다
  switch (tab) {
    case "info":
      return (
        <InfoTab
          key={key}
          viewer={viewer}
          images={images}
          image={image}
          onSelectImage={onSelectImage}
          onOpenImageEdit={openEdit}
          onOpenPattern={() => onSelectTab("pattern")}
        />
      )
    case "edit":
      return <EditTab key={key} viewer={viewer} image={image} onCancel={() => onSelectTab("info")} />
    case "pattern":
      return <PatternTab key={key} viewer={viewer} image={image} onOpenSearch={() => onSelectTab("search")} />
    case "search":
      return <SearchTab key={key} viewer={viewer} image={image} onOpenCompare={() => onSelectTab("compare")} />
    case "compare":
      return (
        <CompareTab
          key={key}
          viewer={viewer}
          image={image}
          onConfirmTarget={() => onSelectTab("confirm")}
          onBackToSearch={() => onSelectTab("search")}
        />
      )
    default:
      return null
  }
}
