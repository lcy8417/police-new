import { ShoeWorkbench } from "@/widgets/shoe-workbench"
import { usePageHeader } from "@/widgets/app-shell"
import { DotGrid, GlowOrb } from "@/shared/ui/glow-fx"

import { HeaderTitle } from "./HeaderContent"

// 제목은 정적이다 — 헤더 effect가 이 값 때문에 재실행되지 않도록 엘리먼트를 한 번만 만든다.
const HEADER_TITLE = <HeaderTitle />

/**
 * 커맨드센터 `/shoesRegister`. 신발 문양추출 워크벤치를 `ShoeWorkbench`(위젯)로
 * 이관하고, 이 페이지는 forensic 다크 셸(배경 장식 + 헤더 타이틀)만 담당한다.
 * 워크벤치는 검색 커맨드센터·조회 화면과 동일 위젯을 재사용한다(신규 등록 모드).
 *
 * 참고: 이 라우트는 신발 조회 통합(`/shoesRepository?mode=new`)으로 흡수될
 * 예정이며, 현재는 하위호환을 위해 유지한다.
 */
export function ShoeRegisterPage() {
  usePageHeader({ title: HEADER_TITLE })

  return (
    <div className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-background px-6 py-6">
      <DotGrid />
      <GlowOrb className="-top-24 right-1/4 h-72 w-72 bg-[#2563EB]/10" />
      <GlowOrb className="bottom-0 left-1/3 h-64 w-64 bg-[#4A9EFF]/8" />

      <ShoeWorkbench mode="new" />
    </div>
  )
}
