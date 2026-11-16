import * as React from "react"

import { FEATURES } from "@/entities/session"
import { Chip, InlineError, Segmented } from "@/shared/ui/kit"
import { ButtonBar, Panel } from "@/shared/ui/panel"

import type { ImageEditScreenProps } from "../model/types"
import { CuttingPane } from "./CuttingPane"
import { ViewerPane } from "./ViewerPane"

type Pane = "cut" | "view"

const PANES = [
  { value: "cut", label: "A · 이미지 커팅" },
  { value: "view", label: "B · 이미지 뷰어" },
]

/**
 * S03 이미지 편집 — SCAS 「이미지 커팅」(A, 저장함)과 「이미지 뷰어」(B, 보기용 · 저장 안 함)를 한 화면에서
 * `Segmented`로 바꿔 본다. 서버 호출 · 전역 상태 없음, 값은 모두 props(제어형). A의 좌표 캔버스는 슬롯.
 * 어느 쪽을 보고 있는지(A/B)는 저장되지 않는 화면 안 상태다(spec §6-1).
 */
export function ImageEditScreen(props: ImageEditScreenProps) {
  const { status, errorAt, onRetry, isAdmin, features, aprthngNo } = props
  const [pane, setPane] = React.useState<Pane>("cut")
  const canEdit = isAdmin || features.includes(FEATURES.CRIME_SEARCH) || features.includes(FEATURES.CRIME_REGISTER)

  let body: React.ReactNode
  if (status === "loading") {
    body = <p className="px-[14px] py-[40px] text-center text-[12.5px] text-muted-foreground">이미지를 불러오는 중…</p>
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-center gap-[6px] px-[14px] py-[40px]">
        <span className="text-[12.5px] text-fg-2">편집할 이미지를 불러오지 못했습니다.</span>
        <InlineError message="확인 못 함" at={errorAt} onRetry={onRetry} />
      </div>
    )
  } else {
    body = (
      <div className="flex flex-col gap-[8px] px-[12px] pt-[10px] pb-[12px]">
        {!canEdit ? (
          <p className="text-[11.5px] text-muted-foreground">보기 전용 — 편집 · 저장은 사건 조회 또는 사건 등록 권한이 있어야 합니다.</p>
        ) : null}
        {pane === "cut" ? (
          <CuttingPane {...props} canEdit={canEdit} />
        ) : (
          <ViewerPane
            image={props.viewerImage}
            adjustments={props.adjustments}
            onAdjustmentsChange={props.onAdjustmentsChange}
            onClose={props.onClose}
          />
        )}
      </div>
    )
  }

  return (
    <section aria-label="이미지 편집" aria-busy={status === "loading"} data-screen="S03" className="min-w-0">
      <Panel
        title={
          <>
            이미지 편집 <span className="font-code font-normal text-muted-foreground">{aprthngNo}</span>
          </>
        }
        actions={
          <ButtonBar variant="modal-head">
            {status === "ready" ? (
              <Chip variant={pane === "cut" ? "blue-h20" : "h19"}>{pane === "cut" ? "1차 작업 · 저장함" : "보기용 · 저장 안 함"}</Chip>
            ) : null}
            <Segmented
              aria-label="편집 종류"
              items={PANES}
              value={pane}
              onValueChange={(v) => setPane(v as Pane)}
              className="[&_button]:px-[10px] [&_button]:py-[3px] [&_button]:text-[12px]"
            />
          </ButtonBar>
        }
      >
        {body}
      </Panel>
    </section>
  )
}
