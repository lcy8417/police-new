/** `ConfirmTab` 이 받는 값 — 묶음 ②가 결과 확인(G1) · 판정(G2) · 교차 검증(H1 · H2 · H5) 배선 때 넓힌다 */
export interface ConfirmTabProps {
  /** 사건 감정번호(= 감정의뢰번호). 묶음 ②가 A1 `no=`로 `rqest_id`를 얻어 G1을 부른다 */
  aprthngNo: string
}

/**
 * 사건 창 「결과 확인」 탭 자리(0단계 — 잠금 파일 §3-2). 지금은 「준비 중」 껍데기이고,
 * 묶음 ②가 `widgets/result-confirm` `ConfirmWindow`(창 모드)에 G1 · G2 · H1 · H2 · H5를 꽂아 채운다.
 * 「감정서로」는 이번 스프린트 범위 밖(잠금 §4) — 채운 뒤에도 「준비 중」.
 */
export function ConfirmTab({ aprthngNo }: ConfirmTabProps) {
  return (
    <p
      className="m-0 grid h-full place-items-center p-[24px] text-center text-[12.5px] text-muted-foreground"
      data-case={aprthngNo}
    >
      결과 확인(판정)은 준비 중입니다.
    </p>
  )
}
