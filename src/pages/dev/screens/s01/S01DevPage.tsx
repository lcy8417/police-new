import { DEV_CASES, DEV_SCREENS, DevScreenFrame } from "../frame"

const info = DEV_SCREENS.find((s) => s.id === "s01")!

// S01 사건관리 진열 페이지(자리). 화면 트랙이 위젯으로 채운다.
export function S01DevPage() {
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={DEV_CASES}>
      <p className="text-[12.5px] text-muted-foreground">준비 중</p>
    </DevScreenFrame>
  )
}
