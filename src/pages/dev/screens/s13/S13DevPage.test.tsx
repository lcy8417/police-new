import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"

import { S13DevPage } from "./S13DevPage"
import { MOCK_FEATURES, MOCK_USERS } from "./mock-cases"

// r3 보기 설정(열 · 거르기 칩)은 localStorage 에 기억되므로 테스트마다 비운다
beforeEach(() => window.localStorage.clear())

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s13${query}`]}>
      <S13DevPage />
    </MemoryRouter>
  )

const admin = (c: string) => renderAt(`?case=${c}&as=admin`)
// R6: 표가 로망 목록 표(role=row · cell)로 바뀜
const rowOf = (userId: string) => screen.getByText(userId, { selector: '[role="cell"] *, [role="cell"]' }).closest('[role="row"]') as HTMLElement

describe("S13 사용자 관리 진열 페이지", () => {
  it("ready 케이스에 사용자 표와 오른쪽 상세를 그린다", () => {
    admin("ready")
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    const headers = within(grid)
      .getAllByRole("columnheader")
      .map((h) => h.textContent)
    expect(headers).toEqual(["아이디", "이름", "구분(역할)", "소속 관서", "상태", "마지막 로그인"])
    expect(within(grid).getByText("park0412")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "사용자 상세" })).toBeInTheDocument()
  })

  it("상태 칩 「사용」 · 「잠금」 · 「중지」가 모두 보인다", () => {
    admin("ready")
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    expect(within(grid).getAllByText("사용").length).toBeGreaterThan(0)
    expect(within(grid).getAllByText("잠금").length).toBeGreaterThan(0)
    expect(within(grid).getAllByText("중지").length).toBeGreaterThan(0)
  })

  // 서버 기능 14종(B 단계 0013 결재 삭제 · EXAM_VIEW, 0017 분업 2종). 분업 스위치와 기능 스위치 합치기는 묶음 ⑤
  it("권한 스위치가 서버 기능 목록 14종 그대로 나온다", () => {
    admin("ready")
    expect(MOCK_FEATURES).toHaveLength(14)
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    // r2: 신발 DB 분업 스위치 3개가 따로 있어 「기능 권한」 칸 안에서 센다
    const switches = within(within(detail).getByRole("region", { name: "기능 권한" })).getAllByRole("switch")
    expect(switches).toHaveLength(14)
    expect(within(detail).getByText("신발 수집 검수")).toBeInTheDocument()
    expect(within(detail).getByText("CRIME_REGISTER")).toBeInTheDocument()
  })

  it("잠긴 사용자만 「잠금 해제」 버튼이 있다", () => {
    admin("ready")
    expect(screen.queryByRole("button", { name: "잠금 해제" })).toBeNull()
    fireEvent.click(rowOf("lee0508"))
    expect(screen.getByRole("button", { name: "잠금 해제" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "잠금 해제" }))
    // 해제하면 상태가 사용으로 바뀌고 버튼이 사라진다
    expect(screen.queryByRole("button", { name: "잠금 해제" })).toBeNull()
  })

  it("관리자 계정은 스위치 대신 안내를 보인다", () => {
    admin("ready")
    fireEvent.click(rowOf("admin01"))
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    expect(within(detail).queryAllByRole("switch")).toHaveLength(0)
    expect(within(detail).getByText("관리자는 모든 기능을 사용할 수 있습니다")).toBeInTheDocument()
  })

  it("스위치를 켜면 값이 바뀌고 「권한 저장」이 눌린다", () => {
    admin("ready")
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    const save = within(detail).getByRole("button", { name: "권한 저장" })
    expect(save).toBeDisabled()
    const sw = within(detail).getByRole("switch", { name: /감정 기록 보기/ })
    expect(sw).toHaveAttribute("aria-checked", "false")
    fireEvent.click(sw)
    expect(sw).toHaveAttribute("aria-checked", "true")
    expect(save).toBeEnabled()
  })

  it("신발 등록·수정을 켜면 신발 조회가 함께 켜지고 잠긴다", () => {
    admin("ready")
    fireEvent.click(rowOf("han0911"))
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    fireEvent.click(within(detail).getByRole("switch", { name: /신발 등록·수정/ }))
    const view = within(detail).getByRole("switch", { name: /신발 조회/ })
    expect(view).toHaveAttribute("aria-checked", "true")
    expect(view).toBeDisabled()
  })

  it("본인 계정은 구분을 바꿀 수 없다는 안내가 있다", () => {
    admin("ready")
    fireEvent.click(rowOf("admin01"))
    expect(screen.getByText("본인 계정의 구분·사용 여부는 바꿀 수 없습니다.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "사용 중지" })).toBeNull()
  })

  it("긴 소속 관서도 표 안에 그대로 들어 있다(잘리지 않고 줄바꿈)", () => {
    admin("ready")
    const long = MOCK_USERS.find((u) => u.orgNm.length > 30)!
    const cell = within(screen.getByRole("region", { name: "사용자 목록" })).getByText(long.orgNm)
    // R6: 목록 표 줄 안에서 두 줄까지 줄바꿈, 전체 이름은 마우스 설명
    expect(cell.className).toMatch(/whitespace-normal/)
    expect(cell).toHaveAttribute("title", long.orgNm)
  })

  it("「사용자 추가」를 누르면 만들기 창이 열린다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "사용자 추가" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("임시 비밀번호")).toBeInTheDocument()
  })

  it("사용자 추가 창에 기능 권한 선택 · 본청 소속 안내 · 전국 사건 사진 안내가 있다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "사용자 추가" }))
    const dlg = screen.getByRole("dialog")
    expect(within(dlg).getByText("새 사용자는 본청 소속 — 관서를 지정하세요")).toBeInTheDocument()
    expect(within(dlg).getAllByRole("checkbox")).toHaveLength(14)
    expect(within(dlg).queryByText("전국 사건 사진을 볼 수 있게 됩니다")).toBeNull()
    fireEvent.click(within(dlg).getByRole("checkbox", { name: "사건 조회" }))
    expect(within(dlg).getByText("전국 사건 사진을 볼 수 있게 됩니다")).toBeInTheDocument()
  })

  it("사용자 추가 창에서 관리자를 고르면 기능 선택 대신 안내를 보인다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "사용자 추가" }))
    const dlg = screen.getByRole("dialog")
    fireEvent.click(within(dlg).getByRole("button", { name: "관리자" }))
    expect(within(dlg).queryAllByRole("checkbox")).toHaveLength(0)
    expect(within(dlg).getByText("관리자는 모든 기능을 사용할 수 있습니다")).toBeInTheDocument()
  })

  it("추가 창이 아이디 규칙 위반을 서버 규칙 문구로 막는다", () => {
    admin("ready")
    fireEvent.click(screen.getByRole("button", { name: "사용자 추가" }))
    fireEvent.click(screen.getByRole("button", { name: "추가" }))
    expect(screen.getByRole("alert")).toHaveTextContent("아이디는 영문·숫자·_ 4~20자로 입력하세요")
  })

  it("비직원이 사건 조회를 켜면 상세에도 전국 사건 사진 안내가 뜬다", () => {
    admin("ready")
    fireEvent.click(rowOf("han0911")) // INVESTIGATOR(비직원) — r2: 시안 프리셋대로 개인 사건 조회 없음
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    expect(within(detail).queryByText("전국 사건 사진을 볼 수 있게 됩니다")).toBeNull()
    fireEvent.click(within(detail).getByRole("switch", { name: /^사건 조회/ }))
    expect(within(detail).getByText("전국 사건 사진을 볼 수 있게 됩니다")).toBeInTheDocument()
    fireEvent.click(rowOf("park0412")) // 감정관(직원) — 안내 없음
    expect(within(screen.getByRole("region", { name: "사용자 상세" })).queryByText("전국 사건 사진을 볼 수 있게 됩니다")).toBeNull()
  })

  it("본청 소속 비직원 상세에는 관서 지정 안내가 뜬다", () => {
    admin("ready")
    fireEvent.click(rowOf("kim0301")) // 감정관 · 본청 → 직원이라 안내 없음
    expect(screen.queryByText("본청 소속이라 의뢰를 볼 수 없습니다 — 관서를 지정하세요")).toBeNull()
    fireEvent.click(rowOf("newbie01"))
    expect(screen.getByText("본청 소속이라 의뢰를 볼 수 없습니다 — 관서를 지정하세요")).toBeInTheDocument()
  })

  it("본인 계정의 구분 칸은 aria-disabled", () => {
    admin("ready")
    fireEvent.click(rowOf("admin01"))
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    expect(within(detail).getByRole("group", { name: "구분", hidden: true }).parentElement).toHaveAttribute("aria-disabled", "true")
  })

  it("loading 케이스는 aria-busy=true", () => {
    const { container } = admin("loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    admin("error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText("결과 없음")).toBeNull()
  })

  it("empty 케이스는 「결과 없음」을 보인다", () => {
    admin("empty")
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
  })

  it.each(["investigator", "readonly"])("%s 보기는 「관리자만 볼 수 있습니다」만 보이고 쓰기 버튼이 없다", (as) => {
    renderAt(`?case=ready&as=${as}`)
    expect(screen.getByText("관리자만 볼 수 있습니다")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "사용자 목록" })).toBeNull()
    expect(screen.queryByRole("button", { name: "사용자 추가" })).toBeNull()
    expect(screen.queryByRole("switch")).toBeNull()
  })
})

describe("S13 사용자 관리 — r2 시안 구성", () => {
  it("운영 상태 타일(역할 분포 · 잠긴 계정 · 만료 · 미접속)과 「신발 승인 담당 부족」 경고를 시안 문구로 보인다", () => {
    admin("ready")
    const tiles = screen.getByRole("region", { name: "계정 운영 상태" })
    expect(within(tiles).getByText("역할 분포 · 전체 계정 38명")).toBeInTheDocument()
    expect(within(tiles).getByText("잠긴 계정")).toBeInTheDocument()
    expect(within(tiles).getByText("lee0508 · 07-22 18:03 비밀번호 5회 실패")).toBeInTheDocument()
    expect(within(tiles).getByText("비밀번호 90일 지남")).toBeInTheDocument()
    expect(within(tiles).getByText("30일 넘게 미접속")).toBeInTheDocument()
    const warn = tiles.querySelector('[data-warning="approver-shortage"]') as HTMLElement
    expect(warn).toHaveTextContent("신발 승인 담당 부족")
    expect(warn).toHaveTextContent("/ 미승인 536건")
    expect(warn).toHaveTextContent("3월분 미승인 · 하루 약 50매면 약 11일 걸림 · 승인 담당 추가 검토")
  })

  it("사용자별 실제 권한 표: 시안 9칸(역할 6 + 분업 3), 프리셋과 다른 칸은 주황 — 시안처럼 han0911 만 1칸 다름", () => {
    admin("ready")
    const eff = screen.getByRole("region", { name: "사용자별 실제 권한" })
    expect(within(eff).getByText("프리셋과 다름 1명")).toBeInTheDocument()
    const han = eff.querySelector('[data-effective-row="han0911"]') as HTMLElement
    expect(han.querySelectorAll("[data-override]")).toHaveLength(1)
    expect(han).toHaveTextContent("1칸 다름")
    // 수사관: 사건 조회 · 감정서는 보기만(◐)
    expect(within(han).getAllByRole("img", { name: "보기만" })).toHaveLength(2)
    const park = eff.querySelector('[data-effective-row="park0412"]') as HTMLElement
    expect(park).toHaveTextContent("같음")
    expect(within(park).getAllByRole("img", { name: "신발 DB 일 맡음" })).toHaveLength(1) // 문양 입력 ◆
    const seo = eff.querySelector('[data-effective-row="seo0322"]') as HTMLElement
    expect(seo).toHaveTextContent("같음") // 신발 등록은 분업(◆)이라 프리셋 비교에서 빠진다
    expect(within(seo).getAllByRole("img", { name: "신발 DB 일 맡음" })).toHaveLength(1)
    expect(han.children).toHaveLength(2 + 9 + 1)
    expect(eff.querySelector('[data-effective-row="yoon0203"]')).toHaveTextContent("중지 · 꺼짐")
    expect(within(eff).getByText(/경북청 신발 조회 협조/)).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "관리자 변경 이력" })).toHaveTextContent("본인 권한 변경 시도")
  })

  it("역할별 기본 권한 표: 역할 기능 6줄 + 「신발 DB 분업」 구분 줄 + 분업 3줄(감정관 ◇), 역할 이름은 기술책임자", () => {
    admin("ready")
    const presets = screen.getByRole("region", { name: "역할별 기본 권한" })
    expect(within(presets).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["기능", "수사관", "감정관", "기술책임자", "관리자", "메모"])
    expect(within(presets).getByText("신발 DB 분업 — 역할과 따로, 사람마다 지정")).toBeInTheDocument()
    expect(within(presets).getAllByRole("img", { name: "사람마다 지정" })).toHaveLength(3)
    expect(within(presets).getByText("SHOE_APPROVE")).toBeInTheDocument()
    expect(within(presets).getAllByRole("row")).toHaveLength(1 + 6 + 1 + 3)
  })

  it("r3 거르기 줄: 검색 · 역할 · 신발 DB · 상태 묶음이 있고 검색으로 표가 걸러진다", () => {
    admin("ready")
    const filter = screen.getByRole("search")
    for (const g of ["역할", "신발 DB", "상태"]) expect(within(filter).getByRole("group", { name: g })).toBeInTheDocument()
    fireEvent.change(within(filter).getByLabelText("검색어"), { target: { value: "jang" } })
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    expect(within(grid).getByText("jang0105")).toBeInTheDocument()
    expect(within(grid).queryByText("park0412")).toBeNull()
  })

  it("r3 칩 숫자가 시안 · 운영 타일(전체 38명)과 같다", () => {
    admin("ready")
    expect(MOCK_USERS).toHaveLength(38)
    const filter = screen.getByRole("search")
    const chip = (group: string, label: string) =>
      within(within(filter).getByRole("group", { name: group })).getByRole("button", { name: new RegExp(`^${label}\\s*\\d+$`) }).textContent
    for (const [g, l, n] of [
      ["역할", "수사관", "18"],
      ["역할", "감정관", "14"],
      ["역할", "기술책임자", "3"],
      ["역할", "관리자", "3"],
      ["신발 DB", "등록", "1"],
      ["신발 DB", "문양 입력", "3"],
      ["신발 DB", "승인", "1"],
      ["상태", "사용", "34"],
      ["상태", "잠금", "1"],
      ["상태", "중지", "3"],
    ] as const) {
      expect(chip(g, l)).toBe(`${l} ${n}`)
    }
    expect(within(filter).getByText("38 / 전체 38")).toBeInTheDocument()
  })

  it("r3 상태 · 역할 칩으로 걸러지고, 0건이면 「조건에 맞는 항목 없음」과 「조건 지우기」", () => {
    admin("ready")
    const filter = screen.getByRole("search")
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    fireEvent.click(within(within(filter).getByRole("group", { name: "상태" })).getByRole("button", { name: /잠금/ }))
    expect(within(grid).getByText("lee0508")).toBeInTheDocument()
    expect(within(grid).queryByText("park0412")).toBeNull()
    fireEvent.click(within(within(filter).getByRole("group", { name: "역할" })).getByRole("button", { name: /기술책임자/ }))
    // 잠금 AND 기술책임자 = 없음
    expect(within(grid).getByText("조건에 맞는 항목 없음")).toBeInTheDocument()
    expect(within(grid).queryByText("결과 없음")).toBeNull()
    fireEvent.click(within(grid).getByRole("button", { name: "조건 지우기" }))
    expect(within(grid).getByText("park0412")).toBeInTheDocument()
  })

  it("r3 ?plus=0 에서도 거르기 줄이 보이고 신발 DB 묶음만 없다", () => {
    renderAt("?case=ready&as=admin&plus=0")
    const filter = screen.getByRole("search")
    expect(within(filter).getByRole("group", { name: "역할" })).toBeInTheDocument()
    expect(within(filter).queryByRole("group", { name: "신발 DB" })).toBeNull()
  })

  it("r3 열 선택: 아이디는 고정, 끄면 열이 빠지고 순서는 그대로", () => {
    admin("ready")
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    fireEvent.click(within(grid).getByRole("button", { name: /열 선택/ }))
    expect(within(grid).getByRole("checkbox", { name: /아이디/ })).toBeDisabled()
    fireEvent.click(within(grid).getByRole("checkbox", { name: /소속 관서/ }))
    expect(within(grid).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["아이디", "이름", "구분(역할)", "상태", "마지막 로그인"])
    fireEvent.click(within(grid).getByRole("checkbox", { name: /소속 관서/ }))
    expect(within(grid).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["아이디", "이름", "구분(역할)", "소속 관서", "상태", "마지막 로그인"])
  })

  it("r3 고른 열 · 거르기 칩은 다시 열어도 기억되고(검색어는 아님), 깨진 저장값이면 기본값", () => {
    const first = admin("ready")
    const grid = () => screen.getByRole("region", { name: "사용자 목록" })
    const filter = () => screen.getByRole("search")
    fireEvent.click(within(grid()).getByRole("button", { name: /열 선택/ }))
    fireEvent.click(within(grid()).getByRole("checkbox", { name: /소속 관서/ }))
    fireEvent.click(within(within(filter()).getByRole("group", { name: "상태" })).getByRole("button", { name: /잠금/ }))
    fireEvent.change(within(filter()).getByLabelText("검색어"), { target: { value: "lee" } })
    first.unmount()

    const second = admin("ready")
    expect(within(grid()).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["아이디", "이름", "구분(역할)", "상태", "마지막 로그인"])
    expect(within(within(filter()).getByRole("group", { name: "상태" })).getByRole("button", { name: /잠금/ })).toHaveAttribute("aria-pressed", "true")
    expect(within(grid()).queryByText("park0412")).toBeNull()
    expect(within(filter()).getByLabelText("검색어")).toHaveValue("")
    second.unmount()

    window.localStorage.setItem("scas-dev:s13:columns", JSON.stringify(["없는열"]))
    window.localStorage.setItem("scas-dev:s13:filters", "{깨짐")
    admin("ready")
    expect(within(grid()).getAllByRole("columnheader")).toHaveLength(6)
    expect(within(grid()).getByText("park0412")).toBeInTheDocument()
  })

  it("표 구분 아래 신발 DB 담당 ◇ 칩 · 「소속 관서 · 전체」 · 상세 머리 「그 뒤 실패 n회」", () => {
    admin("ready")
    const grid = screen.getByRole("region", { name: "사용자 목록" })
    expect(within(grid).getAllByText("◇ 문양 입력")).toHaveLength(3)
    expect(within(grid).getByText("◇ 신발 승인")).toBeInTheDocument()
    expect(within(grid).getByText("◇ 신발 등록")).toBeInTheDocument()
    expect(within(grid).getByRole("button", { name: /소속 관서 · 전체/ })).toBeInTheDocument()
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    expect(within(detail).getByText(/그 뒤 실패/).textContent).toMatch(/10\.14\.43\.\*\*\* · 그 뒤 실패 0회/)
  })

  it("상세 신발 DB 분업: 스위치 3개(신발 등록 = SHOE_EDIT · 문양 입력 · 신발 승인), 누르면 실제 권한 표가 바뀐다", () => {
    admin("ready")
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    const duty = within(detail).getByRole("region", { name: "신발 DB 분업" })
    expect(within(duty).getAllByRole("switch")).toHaveLength(3)
    const approve = within(duty).getByRole("switch", { name: /신발 승인/ })
    expect(approve).toHaveAttribute("aria-checked", "false")
    expect(within(duty).getByRole("switch", { name: /문양 입력/ })).toHaveAttribute("aria-checked", "true")
    fireEvent.click(approve)
    expect(approve).toHaveAttribute("aria-checked", "true")
    const park = screen.getByRole("region", { name: "사용자별 실제 권한" }).querySelector('[data-effective-row="park0412"]') as HTMLElement
    expect(within(park).getAllByRole("img", { name: "신발 DB 일 맡음" })).toHaveLength(2)
    expect(within(detail).getByText("프리셋과 같음")).toBeInTheDocument()
  })

  it("상세 역할 프리셋: 4개 중 지금 역할이 눌려 있고, 고르면 편집 값의 역할이 바뀐다(역할 저장 켜짐)", () => {
    admin("ready")
    const detail = screen.getByRole("region", { name: "사용자 상세" })
    const preset = within(detail).getByRole("group", { name: "역할 프리셋" })
    expect(within(preset).getByRole("button", { name: "감정관" })).toHaveAttribute("aria-pressed", "true")
    expect(within(detail).getByText("감정관 = 검색·판단·교차 검증·감정서 작성 / 기술책임자 = 감정서 검토")).toBeInTheDocument()
    fireEvent.click(within(preset).getByRole("button", { name: "기술책임자" }))
    expect(within(preset).getByRole("button", { name: "기술책임자" })).toHaveAttribute("aria-pressed", "true")
    expect(within(detail).getByRole("button", { name: "역할 저장" })).toBeEnabled()
  })

  it("?plus=0 이면 [data-plus] 가 없고 1차 표 · 상세는 그대로다", () => {
    const { container } = renderAt("?case=ready&as=admin&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByRole("region", { name: "계정 운영 상태" })).toBeNull()
    expect(screen.getByRole("region", { name: "사용자 목록" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "사용자 상세" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "사용자 추가" })).toBeInTheDocument()
  })

  it("보는 사람이 관리자일 때만 타일 · 엑셀 · 사용자 추가가 보이고, 감정관이면 가드만 보인다(시안 data-lock=admin)", () => {
    const { unmount } = admin("ready")
    expect(screen.getByRole("button", { name: "엑셀" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "계정 운영 상태" })).toBeInTheDocument()
    unmount()
    renderAt("?case=ready&as=analyst")
    expect(screen.getByText("관리자만 볼 수 있습니다")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "엑셀" })).toBeNull()
    expect(screen.queryByRole("region", { name: "계정 운영 상태" })).toBeNull()
  })
})
