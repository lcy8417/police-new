import {
  FileText,
  ListFilter,
  Footprints,
  Search,
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
  { label: "사건 등록", to: "/search?mode=register", icon: FileText },
  { label: "사건 조회", to: "/search", icon: ListFilter },
  { label: "신발 등록", to: "/shoesRegister", icon: Footprints },
  { label: "신발 조회", to: "/shoesRepository/0", icon: Search },
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
