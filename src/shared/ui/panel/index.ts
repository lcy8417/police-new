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
export { WindowHead, type WindowHeadProps } from "./window/WindowHead"
