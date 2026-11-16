import * as React from "react"

import { Button, Chip, InlineError } from "@/shared/ui/kit"
import { ButtonBar, Panel } from "@/shared/ui/panel"

import { imageEditAccess } from "../model/access"
import type { ImageEditScreenProps } from "../model/types"
import { CuttingPane } from "./CuttingPane"
import { ViewerPane } from "./ViewerPane"

/** 시안 창 위 설명 글(`cap`) */
function Caption({ children }: { children: React.ReactNode }) {
  return <p className="m-0 px-[4px] font-code text-[11px] font-semibold tracking-[0.06em] text-fg-2">{children}</p>
}

/**
 * S03 이미지 편집 — 시안처럼 SCAS 「이미지 커팅」(A, 저장함) 창과 「이미지 뷰어」(B, 보기용 · 저장 안 함) 창을
 * 나란히 둔다(넓은 화면 xl 이상, 좁으면 위아래). 서버 호출 · 전역 상태 없음, 값은 모두 props(제어형).
 * A의 좌표 캔버스는 슬롯. 시안 r2 신규(+α) 요소는 `showPlus` 하나로 모두 숨긴다(`data-plus`).
 */
export function ImageEditScreen(props: ImageEditScreenProps) {
  const { status, errorAt, onRetry, isAdmin, features, aprthngNo, showPlus = true } = props
  const access = imageEditAccess(isAdmin, features, showPlus)

  const cuttingTitle = (
    <>
      이미지 커팅 <span className="font-code font-normal text-muted-foreground">{aprthngNo}</span>
    </>
  )

  if (status !== "ready") {
    return (
      <section aria-label="이미지 편집" aria-busy={status === "loading"} data-screen="S03" className="min-w-0">
        <Panel title={cuttingTitle}>
          {status === "loading" ? (
            <p className="px-[14px] py-[40px] text-center text-[12.5px] text-muted-foreground">이미지를 불러오는 중…</p>
          ) : (
            <div className="flex flex-col items-center gap-[6px] px-[14px] py-[40px]">
              <span className="text-[12.5px] text-fg-2">편집할 이미지를 불러오지 못했습니다.</span>
              <InlineError message="확인 못 함" at={errorAt} onRetry={onRetry} />
            </div>
          )}
        </Panel>
      </section>
    )
  }

  return (
    <section aria-label="이미지 편집" aria-busy={false} data-screen="S03" className="flex min-w-0 flex-col gap-[6px]">
      {!access.canEdit ? (
        <p className="text-[11.5px] text-muted-foreground">보기 전용 — 편집 · 저장은 사건 조회 또는 사건 등록 권한이 있어야 합니다.</p>
      ) : null}
      <div className="grid min-w-0 items-start gap-[10px] xl:grid-cols-[minmax(0,650fr)_minmax(0,512fr)]">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <Caption>A · 1차 작업 — 사건관리 팝업에서 족윤적 이미지를 누를 때</Caption>
          <Panel
            title={cuttingTitle}
            actions={
              <ButtonBar variant="modal-head">
                <Chip variant="blue-h20">1차 작업</Chip>
                <Button size="sm" variant="ghost" aria-label="이미지 커팅 닫기" onClick={props.onCancel}>
                  ✕
                </Button>
              </ButtonBar>
            }
          >
            <div className="px-[12px] pt-[10px] pb-[12px]">
              <CuttingPane {...props} access={access} plus={showPlus} />
            </div>
          </Panel>
        </div>
        <div className="flex min-w-0 flex-col gap-[6px]">
          <Caption>B · 2차 작업 — 검색 중 이미지를 두 번 누를 때</Caption>
          <Panel
            title={showPlus && props.foundImage ? "이미지 뷰어 · 나란히" : "이미지 뷰어"}
            actions={
              <ButtonBar variant="modal-head">
                <Chip variant="h22" className="h-[20px]">
                  보기용
                </Chip>
                {showPlus && access.showVerifierChip ? (
                  <Chip data-plus="" variant="h22" className="h-[20px]">
                    기술책임자 · 보기만
                  </Chip>
                ) : null}
                <Button size="sm" onClick={props.onClose}>
                  닫기
                </Button>
              </ButtonBar>
            }
          >
            <div className="px-[12px] pt-[10px] pb-[12px]">
              <ViewerPane
                image={props.viewerImage}
                adjustments={props.adjustments}
                onAdjustmentsChange={props.onAdjustmentsChange}
                plus={showPlus}
                viewerLabel={props.viewerLabel}
                foundImage={props.foundImage}
                onPlusAction={props.onPlusAction}
                onReextract={props.onReextractFromView}
                canAiRedo={access.canAiRedo}
              />
            </div>
          </Panel>
        </div>
      </div>
    </section>
  )
}
