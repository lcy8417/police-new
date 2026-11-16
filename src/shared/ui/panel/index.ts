// panel 출입구: 패널·카드·섹션 같은 화면 구획 부품이 들어옵니다(설계서 §6). 가져오는 쪽은 kit 만.
export { Panel, type PanelProps, type PanelVariant } from "./Panel"
export { ButtonBar, type ButtonBarProps, type ButtonBarVariant } from "./ButtonBar"
export {
  ScasShell,
  type ScasShellProps,
  type ScasMenuGroup,
  type ScasMenuItem,
  type ScasMenuIcon,
  type ScasLinkProps,
} from "./ScasShell"
export { SearchForm, type SearchFormProps, type SearchFormRow } from "./SearchForm"
export { Crumb, type CrumbProps } from "./Crumb"
export { PageHead, type PageHeadProps } from "./PageHead"
export { Stepper, type StepperProps } from "./Stepper"
export { ThemeScope, type ThemeScopeProps } from "./ThemeScope"
export { ThemeSettings, type ThemeSettingsProps } from "./ThemeSettings"
// r4 창 부품(로망 「거래처 창」 이식)
export { CaseWindowFrame, type CaseWindowFrameProps } from "./window/CaseWindowFrame"
export { WorkTabStrip, type WorkTabStripProps, type WorkTabItem } from "./window/WorkTabStrip"
export { WindowRail, type WindowRailProps, type WindowRailItem, type WindowRailGroup } from "./window/WindowRail"
export { WindowHead, type WindowHeadProps, type WindowHeadMenuItem, type WindowHeadFlowStep } from "./window/WindowHead"
// r4 창 단계 띠 · 할 일 상자 · 밑줄 탭(로망 StageStrip · TaskBoxes · StateBox · UnderlineTabs 이식)
export { StepNum } from "./stage/StateBox"
export type { PanelState } from "./stage/state-tone"
export {
  StageStrip,
  TaskBoxes,
  type StageStripItem,
  type StageStripProps,
  type TaskBoxItem,
  type TaskBoxesProps,
} from "./stage/StageStrip"
export { UnderlineTabs, TabMark, type UnderlineTabsProps, type TabMarkKind } from "./tabs/UnderlineTabs"
// 창 안 칸 머리(11/17 — 사건 창 탭 본문 소제목을 파란 띠 대신 밑줄 탭 모양으로)
export { PaneHead, type PaneHeadProps } from "./pane/PaneHead"
