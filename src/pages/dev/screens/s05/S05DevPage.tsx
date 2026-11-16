import { DEV_CASES, DevScreenFrame } from "../frame"

// S05 검색 결과 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S05DevPage() {
  return (
    <DevScreenFrame screen="S05" title="검색 결과" cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
