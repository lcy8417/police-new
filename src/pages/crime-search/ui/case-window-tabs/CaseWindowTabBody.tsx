import * as React from "react"

import { useRequestDetail, useRequestIdByNo, type RequestDetail, type RequestImage } from "@/entities/request"

import { CompareTab } from "./CompareTab"
import { ConfirmTab } from "./ConfirmTab"
import { EditTab } from "./EditTab"
import { InfoTab } from "./InfoTab"
import { toTabImage, useEditImage } from "./model/tab-image"
import { useViewer } from "./model/use-viewer"
import { PatternTab } from "./PatternTab"
import { SearchTab } from "./SearchTab"

/** 사건 창 작업 탭(`widgets/case-window` `CaseWindowTab` 과 같은 값) */
export type CaseWindowTabKey = "info" | "edit" | "pattern" | "search" | "compare" | "confirm"

export interface CaseWindowTabBodyProps {
  /** 사건 감정번호 = 감정의뢰번호(`apprslReqestNo`, 예 `05019-24-0017`) */
  aprthngNo: string
  /** 고른 이미지 — 감정물 번호 전체(`05019-24-0017_5`) 또는 이미지 번호(`5`). null 이면 첫 장 */
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

/** 감정물 번호 전체 · 이미지 번호 → A2 감정물(없으면 첫 장) */
function pickImage(detail: RequestDetail, imageNo: string | null): RequestImage | null {
  if (imageNo) {
    const hit = detail.images.find((i) => i.aprthngNo === imageNo || String(i.no) === imageNo)
    if (hit) return hit
  }
  return detail.images[0] ?? null
}

/**
 * 사건 창 탭 본문 — 고른 탭의 시안 위젯(창 모드 `inWindow`)에 실제 데이터를 넣는다.
 * 사건 · 이미지 값은 의뢰 상세(A2 — 감정번호 → A1 `no=` 로 의뢰 번호)에서 찾는다. 옛 전역 store(`useCrimeStore`)는 읽지 않는다
 * (이식 계획 §5 R1 — `/cases` 는 `GET /crime/` 전체를 부르지 않는다). 탭마다 자기 서버 값(B3 · C1 · D2~D4 · E2 · F2 · G1)을 따로 읽는다.
 */
export function CaseWindowTabBody({ aprthngNo, imageNo, tab, onSelectTab, onSelectImage }: CaseWindowTabBodyProps) {
  const viewer = useViewer()
  const idQuery = useRequestIdByNo(aprthngNo)
  const detailQuery = useRequestDetail(idQuery.data ?? null)
  const detail = detailQuery.data
  const image = detail ? pickImage(detail, imageNo) : null
  const key = image?.aprthngNo ?? ""
  // 편집본(B3)은 이미지를 다루는 탭에서만 — 사건 정보 · 결과 확인은 부르지 않는다(수사관은 편집 이력을 볼 수 없다)
  const { editImage } = useEditImage(key, tab !== "info" && tab !== "confirm" && key !== "")
  const tabImage = React.useMemo(() => (detail && image ? toTabImage(detail, image, editImage) : null), [detail, image, editImage])

  if (tab === "confirm") {
    return (
      <ConfirmTab
        aprthngNo={aprthngNo}
        // 줄 끝 「열기」 — 그 이미지의 검색 결과(판정 전) · 정밀 대조(발견) 탭으로
        onOpenImage={(no, next) => {
          onSelectImage(no)
          onSelectTab(next)
        }}
      />
    )
  }
  if (idQuery.isError || detailQuery.isError || (idQuery.isSuccess && idQuery.data === null)) {
    return <Note>사건을 찾을 수 없습니다.</Note>
  }
  if (!detail) return <Note>사건을 불러오는 중…</Note>
  if (!image || !tabImage) return <Note>이 사건의 이미지를 찾지 못했습니다.</Note>

  const judged = image.aprthngSttus === "CONFIRMED"
  const openEdit = (no: string) => {
    if (no !== key) onSelectImage(no)
    onSelectTab("edit")
  }

  // 이미지가 바뀌면 탭 본문 상태(편집 스택 · 고른 부위 등)를 새로 시작한다
  switch (tab) {
    case "info":
      return (
        <InfoTab
          // 저장 · 남의 저장(409 뒤 다시 읽기)으로 판 번호가 바뀌면 서버 값으로 새로 그린다
          key={`${key}|${detail.rowVersion}|${image.rowVersion}`}
          viewer={viewer}
          detail={detail}
          image={image}
          onSelectImage={onSelectImage}
          onOpenImageEdit={openEdit}
          onOpenPattern={() => onSelectTab("pattern")}
        />
      )
    case "edit":
      return <EditTab key={key} viewer={viewer} image={tabImage} judged={judged} onCancel={() => onSelectTab("info")} />
    case "pattern":
      return <PatternTab key={key} viewer={viewer} image={tabImage} judged={judged} onOpenSearch={() => onSelectTab("search")} />
    case "search":
      return <SearchTab key={key} viewer={viewer} image={tabImage} onOpenCompare={() => onSelectTab("compare")} />
    case "compare":
      return (
        <CompareTab
          key={key}
          viewer={viewer}
          image={tabImage}
          onConfirmTarget={() => onSelectTab("confirm")}
          onBackToSearch={() => onSelectTab("search")}
        />
      )
    default:
      return null
  }
}
