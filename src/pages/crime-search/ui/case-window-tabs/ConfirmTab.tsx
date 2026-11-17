import * as React from "react"
import { toast } from "sonner"

import { useConfirmView, useRequestIdByNo, useReviewers, type ConfirmRowDto, type ConfirmView } from "@/entities/request"
import { FEATURES } from "@/entities/session"
import { shoeImageUrl } from "@/entities/shoe"
import { useRequestCrossReview, useWithdrawCrossReview } from "@/features/cross-review"
import { useSaveJudgement } from "@/features/judgement"
import { useSessionStore } from "@/features/auth"
import { ApiError, backendMediaUrl } from "@/shared/api"
import { toKstIso } from "@/shared/lib"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import { ConfirmWindow, type ConfirmRow, type CrossReviewState, type Judgement } from "@/widgets/result-confirm"

import { useViewer } from "./model/use-viewer"

/** `ConfirmTab` 이 받는 값 */
export interface ConfirmTabProps {
  /** 사건 감정번호(= 감정의뢰번호). A1 `no=`로 `rqest_id`(최신 회차)를 얻어 G1을 부른다. 감정물 번호를 줘도 그 의뢰로 푼다 */
  aprthngNo: string
  /** 줄 끝 「열기」 — 그 이미지의 검색 결과(판정 전) · 정밀 대조(발견) 탭으로(감정물 번호 전체). 없으면 단추를 그리지 않는다 */
  onOpenImage?: (aprthngNo: string, tab: "search" | "compare") => void
}

const KIND_LABEL: Record<ConfirmRowDto["kind"], string> = { shoe: "신발", tire: "타이어" }
const kstClock = (ms: number) => toKstIso(new Date(ms)).slice(11, 16)
const errorText = (e: unknown, fallback: string) => (e instanceof ApiError && e.detail ? e.detail : fallback)

/** 감정물 번호(`…_5`)를 줘도 감정번호로 — 사건 창 주소는 감정번호지만 옛 길은 감정물 번호를 줄 수 있다 */
function requestNoOf(no: string): string {
  const m = /^(.*)_\d+$/.exec(no)
  return m ? m[1] : no
}

/** G1 줄 → 위젯 줄(이미지 주소는 루트 기준 경로를 백엔드 주소로) */
function toRow(r: ConfirmRowDto): ConfirmRow {
  return {
    no: String(r.no),
    imageNo: r.aprthngNo,
    kind: KIND_LABEL[r.kind],
    thumb: r.thumbUrl ? backendMediaUrl(r.thumbUrl) : "",
    searchNo: r.searchNo === null ? null : String(r.searchNo),
    judgement: r.judgement,
    shoe: r.shoe
      ? {
          ftwrId: r.shoe.ftwrId,
          image: shoeImageUrl(r.shoe.ftwrId, "B"),
          score: r.shoe.score,
          ranking: r.shoe.ranking,
          // 발견 단추 = 채택한 확인대상이 있을 때(★ · 정밀 대조 「확인대상」으로 고른 것 — 판정 확정 전이어도 채택)
          confirmed: true,
        }
      : null,
    moreTargets: r.moreTargets,
    note: r.note ?? undefined,
    opinion: r.opinionCn,
  }
}

function crossStateOf(view: ConfirmView | undefined): CrossReviewState {
  const cr = view?.crossReview
  if (!cr) return "none"
  if (cr.sttus === "requested") return "requested"
  // 회수 · 불일치로 끝난 검증은 「요청 전」(다시 요청), 일치만 「검증 끝」
  return cr.resultCode === "AGREE" ? "done" : "none"
}

/**
 * 사건 창 「결과 확인」 탭 — `widgets/result-confirm` `ConfirmWindow`(창 모드)에 실제 값을 꽂는다(잠금 §1-① S07).
 * 판정(G2 — 누르면 바로 확정, 기대값 = 줄의 판정 번호 · 판 번호) · 검증자 후보(H1) · 교차 검증 요청(H2) · 회수(H5).
 * 「감정서로」는 이번 스프린트 범위 밖 — 위젯이 「감정서 화면 준비 중」으로 잠근다(onToReport 를 넘기지 않음).
 */
export function ConfirmTab({ aprthngNo, onOpenImage }: ConfirmTabProps) {
  const viewer = useViewer()
  const userId = useSessionStore((s) => s.user?.userId ?? null)
  const canDecide = viewer.isAdmin || viewer.features.includes(FEATURES.EXAM_DECIDE)

  const idQuery = useRequestIdByNo(requestNoOf(aprthngNo))
  const rqestId = idQuery.data ?? null
  const viewQuery = useConfirmView(rqestId)
  const view = viewQuery.data
  const crossReview = crossStateOf(view)
  const reviewersQuery = useReviewers(rqestId, canDecide && crossReview === "none")

  const saveJudgement = useSaveJudgement()
  const requestCross = useRequestCrossReview()
  const withdrawCross = useWithdrawCrossReview()
  const [reviewer, setReviewer] = React.useState<string | null>(null)

  const rows = React.useMemo(() => (view ? view.rows.map(toRow) : []), [view])
  const byNo = React.useMemo(() => new Map((view?.rows ?? []).map((r) => [r.aprthngNo, r])), [view])
  const reviewers = React.useMemo(
    () =>
      (reviewersQuery.data ?? []).map((r) => ({
        value: r.userId,
        label: r.orgNm ? `${r.userNm} · ${r.orgNm}` : r.userNm,
      })),
    [reviewersQuery.data]
  )
  // 교차 검증 중이면 서버가 정한 검증자 이름을 보인다(후보 목록은 부르지 않음)
  const shownReviewers =
    crossReview !== "none" && view?.crossReview?.reviewerId
      ? [{ value: view.crossReview.reviewerId, label: view.crossReview.reviewerNm ?? view.crossReview.reviewerId }]
      : reviewers
  const shownReviewer = crossReview !== "none" ? (view?.crossReview?.reviewerId ?? null) : reviewer

  // 상태: 의뢰 번호 찾기 실패 · 결과 확인 실패 = error, 의뢰가 없음(볼 수 없음) = empty
  let status: ScreenStatus
  let errorAt: number | undefined
  if (idQuery.isError || viewQuery.isError) {
    status = "error"
    errorAt = idQuery.isError ? idQuery.errorUpdatedAt : viewQuery.errorUpdatedAt
  } else if (idQuery.isSuccess && rqestId === null) {
    status = "empty"
  } else if (!view) {
    status = "loading"
  } else {
    status = view.rows.length === 0 ? "empty" : "ready"
  }

  const busy = saveJudgement.isPending || requestCross.isPending || withdrawCross.isPending
  const cr = view?.crossReview
  const canWithdraw = crossReview === "requested" && !!cr && (viewer.isAdmin || (userId !== null && cr.requestedBy === userId))

  const handleJudge = (row: ConfirmRow, result: Judgement) => {
    const dto = byNo.get(row.imageNo)
    if (!dto) return
    saveJudgement.mutate(
      { aprthngNo: dto.aprthngNo, result, opinionCn: dto.opinionCn, expectedExamId: dto.examId, rowVersion: dto.rowVersion },
      { onError: (e) => toast.error(errorText(e, "판정을 저장하지 못했습니다. 다시 시도해 주세요.")) }
    )
  }

  // 판정 메모(B15 — 사용자 결정 「둔다」): 같은 판정 + 새 메모로 G2(서버는 같은 결과 · 같은 메모면 새 판본을 만들지 않는다)
  const opinionSent = React.useRef<string | null>(null)
  const handleOpinion = (row: ConfirmRow, opinion: string) => {
    const dto = byNo.get(row.imageNo)
    if (!dto || dto.judgement === null) return
    const opinionCn = opinion === "" ? null : opinion
    // Enter 로 저장한 뒤 칸을 떠나면(blur) 같은 메모가 한 번 더 온다 — 그때는 앞 저장이 판 번호를 올려 낡은 판으로
    // 409 「다른 사람이 먼저 고쳤습니다」가 나던 결함(스모크 4단계). 바뀐 것이 없거나 저장 중이면 보내지 않는다.
    // (Enter 와 blur 는 같은 틱에 오고, 저장이 끝나도 결과 확인을 다시 읽기 전까지는 dto 가 옛 메모 — 보냈거나 보내는 중인
    //  메모를 ref 로 기억해 같은 메모는 다시 보내지 않는다. 실패하면 잊어 다시 보낼 수 있게)
    const key = `${dto.aprthngNo}|${opinionCn ?? ""}`
    if (opinionCn === dto.opinionCn || opinionSent.current === key) return
    opinionSent.current = key
    saveJudgement.mutate(
      { aprthngNo: dto.aprthngNo, result: dto.judgement, opinionCn, expectedExamId: dto.examId, rowVersion: dto.rowVersion },
      {
        onSuccess: () => toast.success(`_${row.no} 판정 메모를 저장했습니다`),
        onError: (e) => {
          opinionSent.current = null
          toast.error(errorText(e, "판정 메모를 저장하지 못했습니다. 다시 시도해 주세요."))
        },
      }
    )
  }

  const handleRequest = (reviewerId: string) => {
    if (rqestId === null) return
    requestCross.mutate(
      { rqestId, reviewerId },
      {
        onSuccess: () => toast.success("교차 검증을 요청했습니다"),
        onError: (e) => toast.error(errorText(e, "교차 검증을 요청하지 못했습니다. 다시 시도해 주세요.")),
      }
    )
  }

  const handleWithdraw = () => {
    if (!cr) return
    // 관리자가 남의 요청을 거두면 서버가 사유를 요구한다 — 요청자 본인이 아니면 고정 사유를 단다
    const reasonCn = cr.requestedBy === userId ? null : "관리자 회수"
    withdrawCross.mutate(
      { stepId: cr.stepId, reasonCn },
      {
        onSuccess: () => toast.success("교차 검증 요청을 회수했습니다"),
        onError: (e) => toast.error(errorText(e, "회수하지 못했습니다. 다시 시도해 주세요.")),
      }
    )
  }

  return (
    <ConfirmWindow
      status={status}
      errorAt={errorAt !== undefined ? kstClock(errorAt) : undefined}
      onRetry={() => {
        if (idQuery.isError) void idQuery.refetch()
        else void viewQuery.refetch()
      }}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      aprthngNo={requestNoOf(aprthngNo)}
      rows={rows}
      onJudgementChange={canDecide ? handleJudge : undefined}
      onOpinionCommit={handleOpinion}
      lockedReason={view?.lockedReason ?? undefined}
      onOpenImage={
        onOpenImage ? (row) => onOpenImage(row.imageNo, row.judgement === "found" ? "compare" : "search") : undefined
      }
      crossReview={crossReview}
      reviewers={shownReviewers}
      reviewer={shownReviewer}
      onReviewerChange={setReviewer}
      onRequestCrossReview={handleRequest}
      onWithdrawCrossReview={canWithdraw ? handleWithdraw : undefined}
      busy={busy}
    />
  )
}
