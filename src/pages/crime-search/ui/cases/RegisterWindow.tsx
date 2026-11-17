/** `RegisterWindow` 이 받는 값 — 묶음 ②가 등록 모드(S02 `mode="register"`) 배선 때 넓힌다 */
export interface RegisterWindowProps {
  /** 사건복사로 연 경우 채워 둘 감정번호(없으면 빈 새 등록) */
  copyFrom?: string | null
}

/**
 * 새 사건 등록 창 자리(`/cases?new=1` — 0단계, 잠금 파일 §3-2). 묶음 ②가 `widgets/case-detail` 등록 모드에
 * 원본 올리기(B1) → 등록(A6)을 꽂아 채운다. 그때까지 옛 등록 화면(`/crimeRegister`)이 그대로 동작한다.
 */
export function RegisterWindow({ copyFrom = null }: RegisterWindowProps) {
  return (
    <p
      className="m-0 grid h-full place-items-center p-[24px] text-center text-[12.5px] text-muted-foreground"
      data-copy-from={copyFrom ?? undefined}
    >
      새 사건 등록 창은 준비 중입니다.
    </p>
  )
}
