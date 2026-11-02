export type { CrimeSearchRow } from "./model/case-row";
export { QuickSearchBar } from "./ui/QuickSearchBar";
export type { QuickSearchBarProps, QuickSearchFilters } from "./ui/QuickSearchBar";
export { CaseListCompact } from "./ui/CaseListCompact";
export type { CaseListCompactProps } from "./ui/CaseListCompact";
// RetrievalResultsGrid는 SPEC-MATCH-TOP10-001에서 shared/ui로 이동했다(여러
// feature가 재사용하는 순수 프레젠테이셔널 컴포넌트라 features↔features
// cross-import를 유발하지 않도록 FSD 단방향 규칙에 맞춰 재배치). 기존 소비처
// (CrimeDetailPage 등)가 계속 이 배럴에서 import할 수 있도록 재-export한다.
export { RetrievalResultsGrid } from "@/shared/ui";
export type {
  RetrievalResultsGridProps,
  RetrievalResultItem,
} from "@/shared/ui";
export { PartialPatternsCompare } from "./ui/PartialPatternsCompare";
export type {
  PartialPatternsCompareProps,
  PatternCompareGroup,
} from "./ui/PartialPatternsCompare";
export { ShoeDetailContent } from "./ui/ShoeDetailContent";
export type { ShoeDetailContentProps } from "./ui/ShoeDetailContent";
export { MatchViewer } from "./ui/MatchViewer";
export type { MatchViewerProps } from "./ui/MatchViewer";
export type {
  SimilarityImage,
  SimilarityMatch,
  SimilarityResponse,
} from "./model/similarity";
