import {
  FileText,
  ListFilter,
  Footprints,
  FileSearch,
  FileCheck2,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  disabled?: boolean
  disabledReason?: string
}

export const navItems: NavItem[] = [
  { label: "사건 등록", to: "/crimeRegister", icon: FileText },
  { label: "사건 조회", to: "/search", icon: ListFilter },
  { label: "신발", to: "/shoesRepository", icon: Footprints },
  {
    label: "감정 의뢰",
    to: "",
    icon: FileSearch,
    disabled: true,
    disabledReason: "사건을 먼저 선택하세요",
  },
  {
    label: "감정 결과",
    to: "",
    icon: FileCheck2,
    disabled: true,
    disabledReason: "사건을 먼저 선택하세요",
  },
]
