// 매뉴얼용 자동 캡처 — 진열 화면(개발 서버)을 헤드리스 Chromium 으로 열어 매뉴얼 목차 순서대로 찍는다.
//
// 실행:  node scripts/manual/capture.mjs [--out <폴더>] [--base <주소>] [--only <파일 이름 앞부분>]
//   --out   기본 docs/manual/captures/ (.gitignore — 실제 현장 족적 사진이 찍히므로 저장소에 올리지 않는다)
//   --base  기본 http://localhost:5210 (npm run dev 로 띄운 개발 서버. 진열 화면 /dev/* 는 개발 서버에만 있다)
//   --only  예 `--only 3-4` 면 3-4 로 시작하는 캡처만
//
// 결과: <out>/<장>-<절>-<이름>.png (1440×900, deviceScaleFactor 2 → 2880×1800 그림)
//       <out>/captures.json — 캡처마다 제목 · 설명 한 줄 · 주소 · 번호 붙일 요소 목록(marks)
//         marks[].box = 화면 좌표(CSS px, 1440×900 기준 — 그림 픽셀은 ×scale), 못 찾은 요소는 box: null
// 실제 현장 사진(저장소 루트 samples/crime/*.png)이 없으면 화면은 가짜 그림으로 찍힌다.
// 캡처 전에 진열 막대(data-dev-bar)는 숨긴다(매뉴얼에는 실제 앱처럼).
// 하나가 실패해도 나머지는 계속 찍고, 끝에 실패 목록을 보여 준 뒤 종료 코드 1.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { chromium } from "@playwright/test"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const OUT = path.resolve(ROOT, arg("out", "docs/manual/captures"))
const BASE = arg("base", "http://localhost:5210").replace(/\/$/, "")
const ONLY = arg("only", "")
const VIEWPORT = { width: 1440, height: 900 }
const SCALE = 2

// ── 주소 ──

const CASE = "00001-25-0649"
const OPEN_TABS = [CASE, "00001-25-0647", "00001-25-0646"].join(",")
/** 사건 창(감정관, 0649 사건 _1 장) */
const win = (tab, extra = "") => `/dev/s01?as=analyst&open=${CASE}&img=1&tab=${tab}&tabs=${OPEN_TABS}${extra}`

// ── 요소 찾기 ──

const dialogOf = (p) => p.getByRole("dialog", { name: /사건 창$/ })
const btn = (name, scope) => (p) => (scope ? scope(p) : p).getByRole("button", { name, exact: typeof name === "string" }).first()
const role = (r, name, scope) => (p) => (scope ? scope(p) : p).getByRole(r, { name, exact: typeof name === "string" }).first()
const css = (selector) => (p) => p.locator(selector).first()

const pause = (p, ms = 400) => p.waitForTimeout(ms)
async function click(p, locator, ms = 450) {
  await locator(p).click()
  await pause(p, ms)
}

// ── 캡처 목록(매뉴얼 목차 순서) ──
// file = <장>-<절>[-<항>]-<이름>.png · steps = 찍기 전 조작 · marks = 번호 붙일 요소 [이름, 찾기]

const CAPTURES = [
  // 0장 들어가며
  {
    file: "0-1-overview.png",
    title: "화면 구성 한눈에",
    desc: "사건관리 목록 위에 사건 창이 열린 기본 화면 — 위 막대 · 사건 목록 · 사건 창(작업 탭 · 이미지 목록 · 본문)",
    path: win("info"),
    marks: [
      ["위 막대(바로 찾기 · 신발 DB · 화면 설정)", role("banner", undefined)],
      ["사건 목록 거르기(빠른 보기 칩)", role("search", "사건 목록 거르기")],
      ["열린 사건 탭 줄", role("tablist", "열린 사건")],
      ["사건 창", (p) => dialogOf(p)],
      ["현장 이미지 목록", role("navigation", /현장 이미지$/, dialogOf)],
      ["작업 탭", role("tablist", "작업", dialogOf)],
    ],
  },

  // 1장 시작하기
  {
    file: "1-1-login.png",
    title: "로그인",
    desc: "아이디 · 비밀번호를 넣고 로그인 — 뒤 화면은 감정 흐름 예시",
    path: "/dev/s00?case=ready",
    marks: [
      ["아이디", role("textbox", "아이디")],
      ["비밀번호", role("textbox", "비밀번호")],
      ["아이디 저장", role("checkbox", "아이디 저장")],
      ["로그인 단추", btn("로그인")],
    ],
  },
  {
    file: "1-2-password-change.png",
    title: "비밀번호 바꾸기",
    desc: "처음 로그인하거나 90일이 지나면 새 비밀번호를 정한다",
    path: "/dev/s00?case=password-change",
    marks: [
      ["현재 비밀번호", role("textbox", /현재 비밀번호/)],
      ["새 비밀번호", role("textbox", /^새 비밀번호/)],
    ],
  },
  {
    file: "1-3-display-settings.png",
    title: "화면 설정",
    desc: "위 막대 ⚙ 「화면 설정」 — 테마 · 글꼴 · 글자 크기",
    path: "/dev/s01?as=analyst",
    steps: async (p) => click(p, btn("화면 설정")),
    marks: [
      ["화면 설정 단추", btn("화면 설정")],
      ["화면 설정 칸", role("region", "화면 설정")],
      ["색 팔레트", role("group", "색 팔레트")],
      ["글꼴", role("group", "글꼴")],
      ["글자 크기", role("group", "글자 크기")],
    ],
  },

  // 2장 사건관리 목록
  {
    file: "2-1-case-list.png",
    title: "사건관리 목록",
    desc: "사건 목록 표 — 감정번호 · 사건명 · 결과 · 진행 · 사건 진행",
    path: "/dev/s01?as=analyst",
    marks: [
      ["바로 찾기", role("searchbox", "감정번호 · 문서번호 바로 찾기")],
      ["빠른 보기 칩", role("group", "빠른 보기")],
      ["내 담당만", btn("내 담당만")],
      ["사건 등록", btn("등록", (p) => p.getByRole("search", { name: "사건 목록 거르기" }))],
      ["첫 사건 행", btn(/^00001-25-0649 이미지/)],
    ],
  },
  {
    file: "2-2-quick-view-chip.png",
    title: "빠른 보기 칩 누름",
    desc: "「결과 확인 전」 칩을 누르면 그 조건의 사건만 남는다(칩 숫자 = 걸러지는 건수)",
    path: "/dev/s01?as=analyst",
    steps: async (p) => click(p, btn(/^결과 확인 전/)),
    marks: [
      ["누른 칩", btn(/^결과 확인 전/)],
      ["걸러진 목록", role("table", undefined)],
    ],
  },
  {
    file: "2-3-case-register.png",
    title: "사건 등록",
    desc: "새 사건 — 사건 정보를 넣고 현장 이미지를 끌어 놓아 올린다",
    path: "/dev/s02?as=analyst",
    marks: [
      ["사건등록번호", role("textbox", /사건등록번호/)],
      ["이미지 추가", btn("추가")],
      ["끌어 놓아 올리기", (p) => p.getByText(/사진을 끌어 놓으면/).first()],
    ],
  },

  // 3장 사건 창 — 3-1 사건 창 다루기
  {
    file: "3-1-1-work-tabs.png",
    title: "작업 탭 줄",
    desc: "여러 사건을 탭으로 열어 두고 오간다(최대 8개) — 탭의 × 로 닫기",
    path: win("info"),
    marks: [
      ["열린 사건 탭", role("tablist", "열린 사건")],
      ["지금 사건 탭", role("tab", /^00001-25-0649/)],
      ["탭 추가 「+」", btn("탭 추가")],
      ["앞 · 다음 사건", btn("다음 사건", dialogOf)],
      ["창 닫기", btn("창 닫기", dialogOf)],
    ],
  },
  {
    file: "3-1-2-tab-add-menu.png",
    title: "「+」 메뉴",
    desc: "사건을 찾아 새 탭으로 열거나 신발 DB · 사건 등록을 연다",
    path: win("info"),
    steps: async (p) => click(p, btn("탭 추가")),
    marks: [
      ["사건 찾기 칸", role("textbox", "사건 찾기")],
      ["탭 추가 단추", btn("탭 추가")],
    ],
  },
  {
    file: "3-1-3-image-rail-open.png",
    title: "왼쪽 이미지 목록 펼침",
    desc: "» 로 펼치면 장마다 상태(발견 · 검색됨 · 등록)를 함께 본다",
    path: win("info"),
    steps: async (p) => click(p, btn("이미지 목록 펼치기", dialogOf), 600),
    marks: [
      ["이미지 목록", role("navigation", /현장 이미지$/, dialogOf)],
      ["지금 장(_1)", btn(/^_1 · /, dialogOf)],
      ["사진 추가", btn(/사진 추가/, dialogOf)],
    ],
  },
  {
    file: "3-1-4-flow-strip.png",
    title: "흐름 줄",
    desc: "사건 진행 단계(접수 → 1차 작업 → 검색·판정 → 교차 검증 → 감정서)와 작업 탭 표시",
    path: win("info"),
    marks: [
      ["사건 진행 흐름", role("list", "사건 진행 흐름", dialogOf)],
      ["작업 탭(완료 ✓ 표시)", role("tablist", "작업", dialogOf)],
      ["결과 확인(사건 전체)", role("tab", /^결과 확인/, dialogOf)],
    ],
  },

  // 3-2 사건 정보
  {
    file: "3-2-1-case-info.png",
    title: "사건 정보 — 사건정보 탭",
    desc: "의뢰 공문 값 그대로 · 고칠 칸만 고쳐 저장",
    path: win("info"),
    marks: [
      ["족윤적 이미지", role("region", "족윤적 이미지", dialogOf)],
      ["원본 · 이진화 · AI 표시", btn("이진화", dialogOf)],
      ["정보 탭", role("tablist", "정보", dialogOf)],
      ["저장", btn("저장", dialogOf)],
    ],
  },
  {
    file: "3-2-2-image-info.png",
    title: "사건 정보 — 현장 이미지 정보 탭",
    desc: "이 장(_1)의 채취 정보",
    path: win("info"),
    steps: async (p) => click(p, role("tab", /^현장 이미지 정보/, dialogOf)),
    marks: [["현장 이미지 정보 탭", role("tab", /^현장 이미지 정보/, dialogOf)]],
  },

  // 3-3 이미지 편집
  {
    file: "3-3-1-edit-tool.png",
    title: "이미지 편집 — 도구 고름",
    desc: "왼쪽 도구(자르기 · 4점 각도 보정 · 이진화 …)를 고르고 캔버스에서 맞춘 뒤 「확인」",
    path: win("edit"),
    steps: async (p) => click(p, btn("4점 각도 보정", dialogOf), 600),
    marks: [
      ["도구", role("group", "도구", dialogOf)],
      ["고른 도구", btn("4점 각도 보정", dialogOf)],
      ["확대 · 회전", role("group", "보기 · 회전", dialogOf)],
      ["확인 · 저장", role("group", "편집 마무리", dialogOf)],
      ["빠른 보정", role("group", "SCAS 아래 버튼 줄", dialogOf)],
    ],
  },
  {
    file: "3-3-2-edit-history-preview.png",
    title: "편집 이력 미리보기",
    desc: "이력 한 줄을 누르면 그 단계 모습을 미리 본다 — 「되돌리기」로 그 단계로",
    path: win("edit"),
    steps: async (p) => click(p, btn("1단계 좌로 4° 회전 미리보기", dialogOf), 600),
    marks: [
      ["편집 이력", role("region", "편집 이력", dialogOf)],
      ["고른 단계", btn("1단계 좌로 4° 회전 미리보기", dialogOf)],
      ["되돌리기", btn("되돌리기", dialogOf)],
    ],
  },

  // 3-4 문양 코드
  {
    file: "3-4-1-pattern.png",
    title: "문양 코드 — 기본",
    desc: "현장 이미지(상 · 중 · 하 경계선) · 4부위 문양 카드 · 오른쪽 문양 목록",
    path: win("pattern"),
    marks: [
      ["현장 이미지", role("region", "현장 이미지", dialogOf)],
      ["원본 · 편집본", role("group", "검색 이미지", dialogOf)],
      ["4부위 문양", role("region", "현장 이미지 문양", dialogOf)],
      ["문양 목록", role("region", "문양 목록", dialogOf)],
      ["검색", btn("검색", dialogOf)],
    ],
  },
  {
    file: "3-4-2-lens-peek.png",
    title: "확대경 · 확대 보기 칸",
    desc: "「확대경」을 켜고 현장 이미지 위에 올리면 오른쪽 위 칸에 크게 — 문양 그림과 나란히 견준다",
    path: win("pattern"),
    steps: async (p) => {
      await click(p, btn("확대경", dialogOf))
      const box = await p.locator("[data-lens]").first().boundingBox()
      if (box) {
        await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4)
        await pause(p, 200)
        await p.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.42)
        await pause(p, 300)
      }
    },
    marks: [
      ["확대경 단추", btn("확대경", dialogOf)],
      ["확대경", css("[data-lens]")],
      ["확대 보기 칸", role("region", "문양 목록", dialogOf)],
    ],
  },
  {
    file: "3-4-3-peek-large.png",
    title: "크게 살펴보기",
    desc: "현장 이미지를 두 번 누르거나 「크게 살펴보기」 — 큰 창에서 자세히",
    path: win("pattern"),
    steps: async (p) => click(p, btn("크게 살펴보기", dialogOf), 700),
    marks: [["크게 살펴보기 창", (p) => p.getByRole("dialog").last()]],
  },
  {
    file: "3-4-4-pattern-library.png",
    title: "문양 목록에서 넣기",
    desc: "종류 탭(무늬 · 선 · 윤곽 …)을 고르고 문양을 누르면 지금 부위에 들어간다(다시 누르면 빠짐)",
    path: win("pattern"),
    steps: async (p) => {
      const tile = role("button", /^상에 n32_05 넣기/, dialogOf)(p)
      await tile.hover()
      await pause(p, 500)
    },
    marks: [
      ["문양 종류 탭", role("tab", "선", dialogOf)],
      ["넣을 문양", role("button", /^상에 n32_05 넣기/, dialogOf)],
      ["들어간 문양(눌림)", role("button", /^상에서 n32_04 빼기/, dialogOf)],
    ],
  },
  {
    file: "3-4-5-essential-weight.png",
    title: "필수 · 가중치",
    desc: "문양 카드에서 필수(검색에 쓰임) · 개수 · 가중치(낮 · 보 · 높)를 정한다",
    path: win("pattern"),
    marks: [
      ["입력 중 부위", btn(/^상 부위/, dialogOf)],
      ["필수", btn("필수 · 상 n32_04", dialogOf)],
      ["개수", role("combobox", "상 n32_04 개수", dialogOf)],
      ["가중치", role("group", "상 n32_04 가중치 낮음", dialogOf)],
      ["AI 제안 확인", btn("제안 확인 · 상 n21_05", dialogOf)],
      ["제안 모두 확인", btn("제안 모두 확인", dialogOf)],
    ],
  },
  {
    file: "3-4-6-search-history.png",
    title: "검색 이력",
    desc: "이 장으로 검색한 기록 — 조건 비교 · 다시 불러오기 · 결과 자세히",
    path: win("pattern"),
    steps: async (p) => click(p, role("tab", "검색 이력", dialogOf), 600),
    marks: [["검색 이력 탭", role("tab", "검색 이력", dialogOf)], ["검색 이력", role("tabpanel", "검색 이력", dialogOf)]],
  },

  // 3-5 검색 결과
  {
    file: "3-5-1-results-1.png",
    title: "검색 결과 — 한 줄 1개",
    desc: "후보를 하나씩 크게",
    path: win("search"),
    steps: async (p) => click(p, btn("1개", dialogOf), 600),
    marks: [["한 줄 개수", role("group", "한 줄 개수", dialogOf)], ["1위 카드", btn(/^1위 00758 유사도/, dialogOf)]],
  },
  {
    file: "3-5-2-results-3.png",
    title: "검색 결과 — 한 줄 3개",
    desc: "후보 3개씩",
    path: win("search"),
    steps: async (p) => click(p, btn("3개", dialogOf), 600),
    marks: [["한 줄 개수", role("group", "한 줄 개수", dialogOf)]],
  },
  {
    file: "3-5-3-results-5.png",
    title: "검색 결과 — 한 줄 5개(기본)",
    desc: "순위 내림차순 한 목록 — 본 위치 · 확인대상 · 원본/이진화 · 수동/자동",
    path: win("search"),
    marks: [
      ["현장 족적", role("region", "현장 족적", dialogOf)],
      ["본 위치 · 이어 보기", btn("137위부터 이어 보기", dialogOf)],
      ["확인대상", btn("2위 · 305659", dialogOf)],
      ["본 것 거르기", role("group", "본 것 거르기", dialogOf)],
      ["원본 · 이진화", role("group", "결과 이미지 보기", dialogOf)],
      ["수동 · 자동", role("group", "넘김", dialogOf)],
      ["확인대상 넣기(★)", btn("1위 00758 확인대상 넣기", dialogOf)],
    ],
  },
  {
    file: "3-5-4-auto-settings.png",
    title: "자동 설정",
    desc: "자동 넘김 속도 · 쪽 넘김을 정한다",
    path: win("search"),
    steps: async (p) => click(p, btn("자동 설정", dialogOf), 500),
    marks: [["자동 설정 단추", btn("자동 설정", dialogOf)]],
  },
  {
    file: "3-5-5-quick-compare.png",
    title: "빠른 비교",
    desc: "카드에 마우스를 올리면 현장과 나란히 빠른 비교 — Enter 정밀 대조 · S 확인대상",
    path: win("search"),
    steps: async (p) => {
      await btn(/^3위 281904 유사도/, dialogOf)(p).hover()
      await pause(p, 900)
    },
    marks: [["올린 카드", btn(/^3위 281904 유사도/, dialogOf)]],
  },

  // 3-6 정밀 대조
  {
    file: "3-6-1-compare.png",
    title: "정밀 대조 — 기본",
    desc: "유류(현장) · 발견(신발)을 나란히 — 대응 박스 · 구역 선 · AI 대조",
    path: win("compare"),
    marks: [
      ["후보 넘기기", role("group", "후보", dialogOf)],
      ["비교 개수", role("group", "비교", dialogOf)],
      ["대조 도구", role("toolbar", "대조 도구", dialogOf)],
      ["유류 이미지", role("region", "유류 이미지", dialogOf)],
      ["발견 이미지", role("region", "발견 이미지", dialogOf)],
      ["AI 대조", role("complementary", "AI 대조 칸", dialogOf)],
      ["확인대상", btn("확인대상", dialogOf)],
    ],
  },
  {
    file: "3-6-2-zoom-together.png",
    title: "함께 확대",
    desc: "「확대 찍기」 뒤 한쪽을 누르면 반대쪽 같은 위치도 함께 커진다(다시 누르면 풀림)",
    path: win("compare"),
    steps: async (p) => {
      await click(p, btn("확대 찍기", dialogOf))
      const box = await role("region", "유류 이미지", dialogOf)(p).locator("img").first().boundingBox()
      if (box) await p.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35)
      await pause(p, 700)
    },
    marks: [["확대 찍기", btn("확대 찍기", dialogOf)], ["유류 이미지", role("region", "유류 이미지", dialogOf)], ["발견 이미지", role("region", "발견 이미지", dialogOf)]],
  },
  {
    file: "3-6-3-pattern-strip.png",
    title: "상 · 중 · 하 문양 비교 띠",
    desc: "부위마다 현장 문양과 신발 문양을 나란히 — ✓ 일치 · ✕ 다름 · 점수",
    path: win("compare"),
    marks: [["문양 비교 띠", role("region", "상 · 중 · 하 문양 비교", dialogOf)]],
  },
  {
    file: "3-6-4-ai-detail.png",
    title: "AI 대조 자세히",
    desc: "AI 대조 칸 「자세히」 — 근거 · 대응점 · 참고 사항(판정은 감정관)",
    path: win("compare"),
    steps: async (p) => click(p, (q) => role("complementary", "AI 대조 칸", dialogOf)(q).getByText("자세히").first(), 600),
    marks: [["AI 대조 칸", role("complementary", "AI 대조 칸", dialogOf)]],
  },

  // 3-7 결과 확인
  {
    file: "3-7-1-confirm.png",
    title: "결과 확인(사건 전체)",
    desc: "이미지별 판정(발견 · 불발견 · 감정불능)과 사건 결론 · 교차 검증 · 감정서로",
    path: win("confirm"),
    marks: [
      ["결과 확인 탭", role("tab", /^결과 확인/, dialogOf)],
      ["교차 검증 요청", btn("교차 검증 요청", dialogOf)],
      ["감정서로", btn("감정서로", dialogOf)],
    ],
  },

  // 4장 신발 DB
  {
    file: "4-1-shoe-db.png",
    title: "신발 DB 패널",
    desc: "위 막대 「신발 DB」 — 작업 단계 칩 · 찾기 · 카드",
    path: "/dev/s01?as=admin&shoe=1",
    marks: [
      ["신발 DB 패널", role("dialog", "신발 DB")],
      ["작업 단계 칩", btn(/^문양 대기/)],
      ["필터", btn(/^필터/)],
      ["등록", btn("등록", (p) => p.getByRole("dialog", { name: "신발 DB" }))],
      ["카드 · 목록", btn("카드")],
    ],
  },
  {
    file: "4-2-shoe-filter.png",
    title: "신발 DB 필터",
    desc: "상태 · 표시 · 상세 조건(승인 · 문양 입력 …)으로 거른다",
    path: "/dev/s01?as=admin&shoe=1",
    steps: async (p) => click(p, btn(/^필터/), 500),
    marks: [["필터 단추", btn(/^필터/)], ["상세 조건", role("group", "상세 조건")]],
  },
  {
    file: "4-3-shoe-editor.png",
    title: "신발 편집",
    desc: "카드를 열면 큰 편집 판 — 밑창 사진 · 보기 조정 · 4부위 문양 · AI 문양 추출 · 승인",
    path: "/dev/s01?as=admin&shoe=1",
    // 2쪽 = 실제 신발 정보(sample-shoes.ts)
    steps: async (p) => {
      await click(p, btn("다음", (q) => q.getByRole("dialog", { name: "신발 DB" })), 500)
      await click(p, btn("205423 열기"), 800)
    },
    marks: [["편집 판", (p) => p.getByRole("dialog").last()]],
  },

  // 5장 사용자 관리
  {
    file: "5-1-admin-users.png",
    title: "사용자 관리",
    desc: "관리자 — 사용자 찾기 · 역할 · 상태 거르기, 표에서 고르면 오른쪽 상세",
    path: "/dev/s13?as=admin",
    marks: [
      ["역할 거르기", role("group", "역할")],
      ["사용자 추가", btn("사용자 추가")],
      ["사용자 표", role("table", "사용자 표")],
      ["사용자 상세", role("region", "사용자 상세")],
    ],
  },
  {
    file: "5-2-change-permission.png",
    title: "권한 바꾸기",
    desc: "역할 프리셋을 고르거나 기능 권한을 하나씩 켜고 끈 뒤 「역할 저장」",
    path: "/dev/s13?as=admin",
    // 화면 안에 보이는 첫 권한(사건 등록)을 켠다 — 아래쪽 권한을 누르면 화면이 밀려 머리가 잘린다
    steps: async (p) => click(p, role("switch", "사건 등록"), 500),
    marks: [
      ["역할 프리셋", role("group", "역할 프리셋")],
      ["역할 저장", btn("역할 저장")],
      ["기능 권한", role("region", "기능 권한")],
      ["바꾼 권한", role("switch", "사건 등록")],
    ],
  },

  // 6장 기록과 감사
  {
    file: "6-1-activity-log.png",
    title: "사용 기록",
    desc: "관리자 — 사용자 · 기간 · 결과 · 기능으로 거르기, 시간대별 사용량 · 이상 징후 · 기록 무결성",
    path: "/dev/s14?as=admin",
    marks: [
      ["사용 기록 필터", role("search", "사용 기록 필터")],
      ["시간대별 사용량", role("region", "시간대별 사용량")],
      ["이상 징후", role("region", "이상 징후")],
      ["기록 무결성", role("region", "기록 무결성")],
    ],
  },
  {
    file: "6-2-session-expand.png",
    title: "세션 펼침",
    desc: "로그인 한 번(세션)을 펼치면 그 사이의 기능 기록",
    path: "/dev/s14?as=admin",
    steps: async (p) => {
      const b = btn("기능 기록 펼치기")(p)
      await b.scrollIntoViewIfNeeded()
      await b.click()
      await pause(p, 600)
    },
    marks: [["펼친 세션", btn(/기능 기록 접기|기능 기록 펼치기/)]],
  },

  // 7장 설정 바꾸는 법
  {
    file: "7-1-weight-rules.png",
    title: "가중치 규칙",
    desc: "문양 코드 → 검색 조건 탭 — 규칙 요약(R1~R5)과 매칭 조건",
    path: win("pattern"),
    steps: async (p) => click(p, role("tab", "검색 조건", dialogOf), 600),
    marks: [
      ["검색 조건 탭", role("tab", "검색 조건", dialogOf)],
      ["가중치 규칙", role("region", "가중치 규칙", dialogOf)],
      ["매칭 조건", role("region", "매칭 조건", dialogOf)],
    ],
  },
]

// ── 실행 ──

async function boxOf(p, find) {
  try {
    const loc = find(p)
    if ((await loc.count()) === 0) return null
    const b = await loc.boundingBox({ timeout: 1500 })
    if (!b) return null
    // 화면 밖으로 나간 부분은 잘라 낸다(번호 표시가 그림 안에 있게)
    const x = Math.max(0, b.x)
    const y = Math.max(0, b.y)
    const w = Math.min(VIEWPORT.width, b.x + b.width) - x
    const h = Math.min(VIEWPORT.height, b.y + b.height) - y
    if (w <= 0 || h <= 0) return null
    return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
  } catch {
    return null
  }
}

async function main() {
  const list = CAPTURES.filter((c) => c.file.startsWith(ONLY))
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  const failed = []
  for (const cap of list) {
    // 캡처마다 새 컨텍스트 — 화면이 브라우저에 기억하는 보기 설정(한 줄 개수 등)이 다음 캡처로 넘어가지 않게
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE, locale: "ko-KR" })
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    try {
      await page.goto(`${BASE}${cap.path}`, { waitUntil: "domcontentloaded" })
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
      await page.addStyleTag({ content: "[data-dev-bar]{display:none !important}" })
      await page.evaluate(() => document.fonts.ready)
      await pause(page, 600)
      if (cap.steps) await cap.steps(page)
      await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {})
      const marks = []
      for (const [i, [label, find]] of (cap.marks ?? []).entries()) {
        marks.push({ n: i + 1, label, box: await boxOf(page, find) })
      }
      await page.screenshot({ path: path.join(OUT, cap.file) })
      const missing = marks.filter((m) => !m.box).map((m) => m.label)
      results.push({ file: cap.file, title: cap.title, desc: cap.desc, path: cap.path, marks, ...(errors.length ? { pageErrors: errors } : {}) })
      console.log(`✓ ${cap.file}${missing.length ? `  (번호 요소 못 찾음: ${missing.join(", ")})` : ""}`)
    } catch (e) {
      failed.push({ file: cap.file, error: String(e?.message ?? e).split("\n")[0] })
      console.log(`✗ ${cap.file} — ${failed.at(-1).error}`)
    } finally {
      await context.close()
    }
  }
  await browser.close()
  const json = {
    generatedAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace("Z", "+09:00"),
    base: BASE,
    viewport: VIEWPORT,
    scale: SCALE,
    note: "marks[].box 는 CSS px(1440×900 기준). 그림 픽셀 좌표 = box × scale",
    captures: results,
    failed,
  }
  // --only 로 일부만 찍으면 기존 captures.json 에 합친다
  const jsonPath = path.join(OUT, "captures.json")
  if (ONLY && fs.existsSync(jsonPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
      const byFile = new Map((prev.captures ?? []).map((c) => [c.file, c]))
      for (const r of results) byFile.set(r.file, r)
      const order = CAPTURES.map((c) => c.file)
      json.captures = [...byFile.values()].sort((a, b) => order.indexOf(a.file) - order.indexOf(b.file))
    } catch {
      // 읽지 못하면 새로 쓴다
    }
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`\n${results.length}/${list.length}장 → ${OUT}${failed.length ? ` · 실패 ${failed.length}` : ""}`)
  if (failed.length) process.exit(1)
}

await main()
