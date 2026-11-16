// kit 출입구: 어디서나 쓰는 기본 부품(버튼류·입력·칩·장식·다이얼로그 등). 설계서 §6-1.
// 루트 `@/shared/ui` 는 기존 사용처 때문에 유지하고, RetrievalResultsGrid 는 kit 에 넣지 않는다(§6-2).
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button'
export { Field, type FieldProps, type FieldVariant } from './Field'
export { Chip, type ChipProps, type ChipVariant } from './Chip'
export { StatusChip, type StatusChipTone } from '../status-chip'
export { TechCorners } from '../tech-corners'
export { DotGrid, GlowOrb, EdgeGlow } from '../glow-fx'
export { LoadingImage, ImageLoadingOverlay } from '../image-loading-overlay'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog'
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
export { Checkbox } from '../checkbox'
export { Label } from '../label'
export { Switch } from '../switch'
export { ToggleGroup, ToggleGroupItem } from '../toggle-group'
export { Segmented, type SegmentedItem, type SegmentedProps } from './Segmented'
export { RadioRow, type RadioRowOption, type RadioRowProps } from './RadioRow'
export { StatusDot, type StatusDotProps, type StatusDotTone } from './StatusDot'
export { Avatar, type AvatarProps, type AvatarTone } from './Avatar'
export { DataGrid, type DataGridColumn, type DataGridProps } from './DataGrid'
export { Pagination, type PaginationProps } from './Pagination'
export { InlineError, type InlineErrorProps } from './InlineError'
export { Combobox, type ComboboxItem, type ComboboxProps } from './Combobox'
export { AutoPlayControl, type AutoPlayControlProps } from './AutoPlayControl'
export { FilterBar, type FilterBarProps, type FilterGroup, type FilterOption } from './FilterBar'
export { ViewCountSwitch, type ViewCountSwitchProps } from './ViewCountSwitch'
export { ColumnPicker, type ColumnPickerColumn, type ColumnPickerProps } from './ColumnPicker'
export { DialogShell,type DialogShellProps, type DialogShellSize } from './DialogShell'
