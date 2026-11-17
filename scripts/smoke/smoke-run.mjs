// 안전 스모크 1바퀴(B 단계 스프린트 4단계) — 실제 화면을 헤드리스 Chromium 으로 역할마다 끝까지 관통한다.
//
// 전제: 스모크 전용 DB(footprint_smoke)를 심고(police-server/scripts/smoke_seed.py) 그 DB 로 띄운 서버 · 이 저장소 개발 서버.
//   서버: cd <스모크 폴더> && DATABASE_CONN=postgresql+psycopg://footprint_app@localhost:5432/footprint_smoke \
//         POLICE_DATA_ROOT=<스모크 폴더> EVIDENCE_DIR=<스모크 폴더>/data/evidence ALLOWED_ORIGINS=http://localhost:5212 \
//         uvicorn main:app --app-dir <police-server> --host 127.0.0.1 --port 8010
//   화면: VITE_PROXY_TARGET=http://127.0.0.1:8010 npx vite --port 5212 --strictPort
//
// 실행:  node scripts/smoke/smoke-run.mjs [--base http://localhost:5212] [--out <폴더>] [--only exam,inv,rev,admin,shoe]
//   --out 기본 = 운영체제 임시 폴더/police-smoke (스크린샷에 실제 현장 사진이 찍히므로 저장소 밖)
//
// 매 단계 기록: 브라우저 콘솔 오류 · 실패한 요청(4xx/5xx — 단계가 「의도됨」으로 적은 상태 · 경로는 따로) · 외부 주소 요청
//   · 「불러오는 중」 10초 넘게 남음 · 눌러도 반응 없는 단추(단계 안 확인 실패). 단계마다 스크린샷.
// 결과: <out>/smoke-result.json + 화면 요약. 결함(의도 안 된 4xx/5xx · 콘솔 오류 · 외부 요청 · 확인 실패)이 있으면 종료 코드 1.
// ★ 스모크 DB 를 바꾸는 단계(접수 · 판정 · 교차 검증 · 신발 등록 · 승인 · 권한)가 있어 두 번째 실행 전에는 smoke_seed.py 로 다시 심는다.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"

import { chromium, request as pwRequest } from "@playwright/test"

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg("base", "http://localhost:5212").replace(/\/$/, "")
const OUT = path.resolve(arg("out", path.join(os.tmpdir(), "police-smoke")))
const ONLY = new Set(arg("only", "exam,shoe,admin,inv,rev").split(","))
const PASSWORD = "Smoke-pass-2026"
const LOADING_LIMIT_MS = 10_000
const ORIGIN_HOST = new URL(BASE).host

// 스모크 심기(smoke_seed.py)가 만든 감정번호 — 실행 순서대로 0001 · 0002 …
const CASE = {
  requestedA: "00001-26-0001", // 수사관 A · 접수 전
  receiveMe: "00001-26-0002", // 수사관 A · 접수 전(감정관이 「접수」)
  received: "00001-26-0003", // 수사관 A · 접수됨 2장
  otherOrg: "00001-26-0004", // 수사관 B(다른 관서) · 접수 전
  inExam: "00001-26-0005", // 감정관 3장 · 진행 중(1번 장 검색 기록)
}

fs.mkdirSync(OUT, { recursive: true })

/** @type {{role:string, step:string, ok:boolean, notes:string[], http:string[], intended:string[], console:string[], external:string[], loading:boolean, shot:string, ms:number}[]} */
const results = []

// ── 역할 세션 ──

async function openRole(browser, role) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: "ko-KR" })
  const page = await context.newPage()
  const sess = { role, context, page, cur: null, loginDone: false }
  page.on("console", (m) => {
    if (m.type() !== "error" || !sess.cur) return
    const t = m.text()
    // 로그인 전 GET /auth/me 401 은 정상(세션 확인) — 같은 요청의 「리소스 실패」 콘솔 줄도 함께 뺀다
    if (/status of 401/.test(t) && !sess.loginDone) return
    // 의도한 4xx 응답이 남기는 브라우저 기본 줄(「Failed to load resource … 409」)은 요청 기록에서 판정
    if (/Failed to load resource: the server responded with a status of (\d+)/.test(t)) {
      const code = Number(RegExp.$1)
      if (sess.cur.expect.some((e) => e.status === code)) return
    }
    sess.cur.console.push(t.slice(0, 300))
  })
  page.on("pageerror", (e) => sess.cur && sess.cur.console.push(`pageerror: ${String(e.message).slice(0, 300)}`))
  page.on("request", (r) => {
    const u = r.url()
    if (/^(data|blob|about|chrome-extension):/.test(u)) return
    try {
      if (new URL(u).host !== ORIGIN_HOST && sess.cur) sess.cur.external.push(`${r.method()} ${u}`)
    } catch {
      /* 주소 아님 */
    }
  })
  page.on("requestfailed", (r) => {
    if (!sess.cur) return
    const f = r.failure()?.errorText ?? ""
    if (/ERR_ABORTED|NS_BINDING_ABORTED/.test(f)) return // 화면 이동 · 취소(react-query) — 결함 아님
    sess.cur.http.push(`FAILED ${r.method()} ${short(r.url())} ${f}`)
  })
  page.on("response", (r) => {
    if (!sess.cur) return
    const s = r.status()
    if (s < 400) return
    const p = short(r.url())
    const m = r.request().method()
    if (s === 401 && p.startsWith("/auth/me") && !sess.loginDone) return
    const hit = sess.cur.expect.find((e) => e.status === s && (!e.path || e.path.test(p)) && (!e.method || e.method === m))
    const list = hit ? sess.cur.intended : sess.cur.http
    const i = list.push(`${s} ${m} ${p}`) - 1
    // 서버 문구(detail)를 붙여 둔다 — 결함 원인 찾기용
    r.text()
      .then((t) => {
        const d = t.match(/"detail"\s*:\s*"([^"]{0,120})/)?.[1]
        if (d) list[i] += ` 「${d}」`
      })
      .catch(() => {})
  })
  return sess
}

const short = (u) => u.replace(BASE, "").slice(0, 160)

async function step(sess, name, fn, { expect = [] } = {}) {
  const rec = { role: sess.role, step: name, ok: true, notes: [], http: [], intended: [], console: [], external: [], loading: false, shot: "", ms: 0 }
  rec.expect = expect
  sess.cur = rec
  const t0 = Date.now()
  try {
    await fn(sess.page, rec)
  } catch (e) {
    rec.ok = false
    const lines = String(e.message).split("\n")
    const why = lines.find((l) => /intercepts pointer|not enabled|not visible|waiting for/.test(l))
    rec.notes.push(`실패${rec.at ? `(${rec.at})` : ""}: ${lines[0].slice(0, 240)}${why ? ` — ${why.trim().slice(0, 160)}` : ""}`)
  }
  delete rec.at
  await sess.page.waitForTimeout(300)
  if (await stuckLoading(sess.page)) {
    rec.loading = true
    rec.notes.push("「불러오는 중」이 10초 넘게 남음")
  }
  rec.ms = Date.now() - t0
  const file = `${String(results.length + 1).padStart(2, "0")}-${sess.role}-${name.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40)}.png`
  await sess.page.screenshot({ path: path.join(OUT, file) }).catch(() => {})
  rec.shot = file
  delete rec.expect
  sess.cur = null
  results.push(rec)
  const bad = !rec.ok || rec.http.length || rec.console.length || rec.external.length || rec.loading
  console.log(`${bad ? "✗" : "✓"} [${sess.role}] ${name} (${rec.ms}ms)`)
  for (const n of rec.notes) console.log(`    · ${n}`)
  for (const h of rec.http) console.log(`    · HTTP ${h}`)
  for (const h of rec.intended) console.log(`    · (의도됨) ${h}`)
  for (const c of rec.console) console.log(`    · console ${c}`)
  for (const x of rec.external) console.log(`    · 외부 ${x}`)
}

/** 「불러오는 중」 글자가 보이면 10초까지 기다려 본다 — 그래도 남으면 true. */
async function stuckLoading(page) {
  const loc = page.getByText(/불러오는 중/)
  const deadline = Date.now() + LOADING_LIMIT_MS
  while (Date.now() < deadline) {
    const n = await loc.count()
    let shown = false
    for (let i = 0; i < n; i++) if (await loc.nth(i).isVisible().catch(() => false)) shown = true
    if (!shown) return false
    await page.waitForTimeout(500)
  }
  return true
}

// ── 공용 동작 ──

function check(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function login(sess, userId) {
  const page = sess.page
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState("networkidle")
  const inputs = page.locator("input")
  await inputs.nth(0).fill(userId)
  await inputs.nth(1).fill(PASSWORD)
  const res = page.waitForResponse((r) => r.url().includes("/auth/login") && r.request().method() === "POST")
  await inputs.nth(1).press("Enter")
  const r = await res
  check(r.status() === 200, `로그인 응답 ${r.status()}`)
  sess.loginDone = true
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10_000 })
  await page.waitForLoadState("networkidle")
}

const dialog = (page) => page.getByRole("dialog", { name: /사건 창$/ })
const btn = (scope, name, exact = true) => scope.getByRole("button", { name, exact }).first()

/** 응답 하나를 기다리며 동작 — 경로 정규식 · 메서드로 고른다. */
async function withResponse(page, re, method, action, timeout = 15_000) {
  const wait = page.waitForResponse((r) => re.test(short(r.url())) && r.request().method() === method, { timeout })
  try {
    await action()
  } catch (e) {
    wait.catch(() => {}) // 동작이 실패하면 기다리던 응답 대기는 버린다(처리 안 된 거절로 전체가 멈추지 않게)
    throw e
  }
  return wait
}

/** 목록에서 그 감정번호 줄(가장 안쪽 칸). */
function listRow(page, no) {
  return page
    .locator("tr, li, [role=row], div")
    .filter({ has: page.getByText(no, { exact: true }) })
    .filter({ has: page.getByRole("button") })
    .last()
}

async function openCase(page, no, tab = "info") {
  await page.goto(`${BASE}/cases?open=${no}&tab=${tab}&tabs=${no}`)
  await page.waitForLoadState("networkidle")
  await dialog(page).waitFor({ timeout: 10_000 })
}

async function apiAs(userId) {
  const ctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Origin: BASE } })
  const r = await ctx.post("/auth/login", { data: { userId, password: PASSWORD } })
  check(r.status() === 200, `API 로그인 ${userId} ${r.status()}`)
  return ctx
}

async function requestIdOf(api, no) {
  const r = await api.get(`/requests?no=${encodeURIComponent(no)}&src=ALL`)
  check(r.ok(), `A1 no= ${r.status()}`)
  const body = await r.json()
  const items = body.items ?? body
  check(items.length > 0, `${no} 의뢰 없음`)
  return items[0].rqest_id
}

async function toastText(page) {
  const t = page.locator("[data-sonner-toast]")
  await t.first().waitFor({ timeout: 5_000 }).catch(() => {})
  return (await t.allInnerTexts().catch(() => [])).join(" / ")
}

/** 글이 맞는 알림(toast)이 뜰 때까지 — 앞 단계 알림이 남아 있어도 이 글만 본다. 못 찾으면 null. */
async function waitToast(page, re, timeout = 6_000) {
  const t = page.locator("[data-sonner-toast]").filter({ hasText: re }).first()
  const ok = await t.waitFor({ timeout }).then(() => true, () => false)
  return ok ? (await t.innerText()).replace(/\s+/g, " ").trim() : null
}

/** 단추가 (저장 중 잠금이 풀려) 눌릴 수 있게 될 때까지 기다린다 */
async function expectEnabled(loc, timeout) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await loc.isEnabled().catch(() => false)) return true
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

/** 단계 안 위치 표시 — 실패하면 어느 동작에서 멈췄는지 남는다. */
function at(rec, label) {
  rec.at = label
}

// ── 감정관 ──

async function runExaminer(browser) {
  const s = await openRole(browser, "감정관")
  const p = s.page
  await step(s, "로그인 → 첫 화면 /cases", async (pg, rec) => {
    // 새 사건관리는 전역 사건 목록(GET /crime/ — 편집 이미지 base64 포함 전체)을 부르지 않아야 한다
    const full = []
    const onReq = (r) => /^\/crime\/(\?|$)/.test(short(r.url())) && full.push(short(r.url()))
    pg.on("request", onReq)
    await login(s, "smoke_exam")
    check(new URL(p.url()).pathname === "/cases", `첫 화면 ${p.url()}`)
    await p.getByText(CASE.inExam, { exact: true }).waitFor()
    await pg.waitForLoadState("networkidle")
    pg.off("request", onReq)
    rec.notes.push(`GET /crime/ ${full.length}번`)
    check(full.length === 0, "로그인 직후 전역 사건 목록(GET /crime/)을 부름")
  })

  await step(s, "목록 거르기 칩 · 바로 찾기 · 다음 쪽", async (pg, rec) => {
    at(rec, "칩 켜기")
    const r1 = await withResponse(pg, /^\/requests\?.*flow=/, "GET", () => btn(pg, "검색·판정").click())
    check(r1.ok(), `칩 응답 ${r1.status()}`)
    await pg.waitForLoadState("networkidle")
    await pg.getByText("00001-26-0021", { exact: true }).waitFor({ state: "hidden", timeout: 8_000 })
    check(await pg.getByText(CASE.inExam, { exact: true }).isVisible(), "검색·판정 칩에 진행 중 사건 없음")
    at(rec, "칩 끄기")
    await btn(pg, "검색·판정").click()
    await pg.getByText("00001-26-0021", { exact: true }).waitFor({ timeout: 8_000 })
    at(rec, "바로 찾기")
    const box = pg.getByRole("searchbox", { name: /바로 찾기/ }).first()
    await box.fill("차량털이")
    await pg.getByText(CASE.inExam, { exact: true }).waitFor({ state: "hidden", timeout: 8_000 })
    check(await pg.getByText(CASE.received, { exact: true }).isVisible(), "바로 찾기 결과 없음")
    await box.fill("")
    await pg.getByText("00001-26-0021", { exact: true }).waitFor({ timeout: 8_000 })
    at(rec, "다음 쪽")
    await btn(pg, /^다음/, false).click()
    await pg.getByText(CASE.requestedA, { exact: true }).waitFor({ timeout: 8_000 })
    rec.notes.push("2쪽에 접수 전 사건 보임")
    at(rec, "이전 쪽")
    await btn(pg, /이전$/, false).click()
    await pg.getByText("00001-26-0021", { exact: true }).waitFor({ timeout: 8_000 })
  })

  await step(
    s,
    "「접수」 두 번 누르기",
    async (pg, rec) => {
      const row = listRow(pg, CASE.receiveMe)
      const b = row.getByRole("button", { name: "접수", exact: true })
      const res = []
      pg.on("response", (r) => /\/receive$/.test(r.url()) && res.push(r.status()))
      await b.dblclick()
      await pg.waitForTimeout(1500)
      await pg.waitForLoadState("networkidle")
      rec.notes.push(`접수 응답 ${res.join(",")}`)
      check(res.filter((x) => x === 200).length === 1, `접수 200 이 ${res.filter((x) => x === 200).length}번`)
      check(!(await row.getByRole("button", { name: "접수", exact: true }).isVisible().catch(() => false)), "접수 뒤에도 「접수」 단추가 남음")
    },
    { expect: [{ status: 409, path: /\/receive$/ }] },
  )

  const api = await apiAs("smoke_admin")
  const ridInExam = await requestIdOf(api, CASE.inExam)

  await step(s, "사건 창 열기 → 사건 정보 수정 저장", async (pg) => {
    await openCase(pg, CASE.inExam, "info")
    const d = dialog(pg)
    const doc = d.getByRole("textbox", { name: "문서번호" })
    await doc.fill("SMK-DOC-1")
    const r = await withResponse(pg, /^\/requests\/\d+$/, "PUT", () => btn(d, "저장").click())
    check(r.status() === 200, `A3 저장 ${r.status()}`)
    await pg.waitForLoadState("networkidle")
    check((await doc.inputValue()) === "SMK-DOC-1", "저장 뒤 값이 바뀜")
  })

  await step(
    s,
    "사건 정보 동시 수정 409 흉내",
    async (pg, rec) => {
      // 다른 사람(관리자)이 먼저 고침 → 화면이 가진 판 번호는 낡음
      const cur = await (await api.get(`/requests/${ridInExam}`)).json()
      const put = await api.put(`/requests/${ridInExam}`, { data: { rm: "관리자가 먼저 고침", rowVersion: cur.row_version } })
      check(put.ok(), `관리자 A3 ${put.status()}`)
      const d = dialog(pg)
      await d.getByRole("textbox", { name: "비고" }).fill("감정관이 나중에 고침")
      const r = await withResponse(pg, /^\/requests\/\d+$/, "PUT", () => btn(d, "저장").click())
      check(r.status() === 409, `낡은 판 저장이 ${r.status()}`)
      const t = await waitToast(pg, /먼저|다시|고쳤/)
      rec.notes.push(`알림: ${t ?? `(없음 — 보이는 알림: ${await toastText(pg)})`}`)
      check(t, "409 안내 알림 없음")
      await pg.waitForLoadState("networkidle")
    },
    { expect: [{ status: 409, path: /^\/requests\/\d+$/, method: "PUT" }] },
  )

  await step(s, "창 닫고 다시 열기(값 유지)", async (pg) => {
    await openCase(pg, CASE.inExam, "info")
    const d = dialog(pg)
    check((await d.getByRole("textbox", { name: "문서번호" }).inputValue()) === "SMK-DOC-1", "문서번호가 유지되지 않음")
    const rm = await d.getByRole("textbox", { name: "비고" }).inputValue()
    check(rm === "관리자가 먼저 고침", `비고 = ${rm}`)
  })

  await step(s, "이미지 편집 — 도구 · 저장 · 이력 · 되돌리기", async (pg, rec) => {
    await openCase(pg, CASE.inExam, "edit")
    const d = dialog(pg)
    for (const t of ["자르기", "4점 각도 보정", "길이 측정", "배경제거", "이진화", "노이즈제거"]) check(await btn(d, t).isVisible(), `도구 ${t} 없음`)
    at(rec, "좌우반전 저장")
    await btn(d, "좌우반전").click()
    const r1 = await withResponse(pg, /\/crime\/[^/]+\/edits$/, "POST", () => btn(d, "저장").click())
    check(r1.status() === 200, `B4 ${r1.status()}`)
    await pg.waitForLoadState("networkidle")
    await d.getByText(/1단계/).first().waitFor({ timeout: 8_000 })
    await btn(d, "상하반전").click()
    const r2 = await withResponse(pg, /\/crime\/[^/]+\/edits$/, "POST", () => btn(d, "저장").click())
    check(r2.status() === 200, `B4(2) ${r2.status()}`)
    await pg.waitForLoadState("networkidle")
    await d.getByText(/2단계/).first().waitFor({ timeout: 8_000 })
    const r3 = await withResponse(pg, /\/edits\/revert$/, "POST", () => btn(d, "되돌리기").click())
    check(r3.status() === 200, `B5 ${r3.status()}`)
    await pg.waitForLoadState("networkidle")
    rec.notes.push(`이력: ${(await d.getByText(/\d단계/).first().innerText()).trim()}`)
  })

  await step(
    s,
    "이미지 편집 — 저장 두 번 누르기",
    async (pg, rec) => {
      const d = dialog(pg)
      const before = await (await api.get(`/crime/${CASE.inExam}_1/edits`)).json()
      await btn(d, "좌우반전").click()
      await btn(d, "저장").dblclick()
      await pg.waitForTimeout(2000)
      await pg.waitForLoadState("networkidle")
      const after = await (await api.get(`/crime/${CASE.inExam}_1/edits`)).json()
      rec.notes.push(`이력 ${before.items.length} → ${after.items.length}`)
      check(after.items.length - before.items.length === 1, `두 번 눌러 이력이 ${after.items.length - before.items.length}개 늘어남`)
    },
    { expect: [{ status: 409, path: /\/edits$/ }] },
  )

  await step(
    s,
    "문양 코드 — 넣기 · 필수 · 가중치 직접 · 저장 · 검색(모델 없음)",
    async (pg, rec) => {
      await openCase(pg, CASE.inExam, "pattern")
      const d = dialog(pg)
      at(rec, "문양 넣기")
      await btn(d, "상에 s21b 넣기").click()
      await btn(d, "상에 s22a 넣기").click()
      check(await btn(d, "상 s21b").isVisible(), "넣은 문양 카드 없음")
      at(rec, "필수")
      const ess = btn(d, "필수 · 상 s21b")
      await ess.click()
      check((await ess.getAttribute("aria-pressed")) === "true", "필수가 켜지지 않음")
      at(rec, "가중치 직접(높음)")
      // 카드의 가중치 단계 단추 = 「직접」 값(규칙보다 먼저). s21b 카드(첫 카드)의 높음
      const high = d.getByRole("button", { name: "가중치 높음", exact: true }).first()
      await high.click()
      check((await high.getAttribute("aria-pressed")) === "true", "가중치 직접 값이 켜지지 않음")
      at(rec, "검색(C2 저장 → D1)")
      const saved = pg.waitForResponse((r) => /^\/crime\/[^/]+$/.test(short(r.url())) && r.request().method() === "PUT", { timeout: 15_000 })
      const searched = pg.waitForResponse((r) => /\/search(\?|$)/.test(short(r.url())) && r.request().method() === "POST", { timeout: 20_000 })
      await btn(d, "검색").click()
      const sv = await saved
      check(sv.status() === 200, `C2 저장 ${sv.status()}`)
      const sr = await searched
      rec.notes.push(`D1 ${sr.status()}`)
      const t = await waitToast(pg, /모델|사용할 수 없|준비|실패/)
      const body = (await d.innerText()).replace(/\s+/g, " ")
      const inline = body.match(/[^.。]{0,30}(모델|사용할 수 없)[^.。]{0,40}/)?.[0]
      rec.notes.push(`알림: ${t ?? "(없음)"} · 화면 글: ${inline ?? "(없음)"}`)
      check(sr.status() !== 503 || t || inline, "모델 없음 안내가 없음")
    },
    { expect: [{ status: 503, path: /\/search/ }] },
  )

  await step(s, "문양 코드 — 창 다시 열기(저장값 유지)", async (pg) => {
    await openCase(pg, CASE.inExam, "pattern")
    const d = dialog(pg)
    await btn(d, /^상 s21b/, false).waitFor({ timeout: 8_000 })
    check((await btn(d, "필수 · 상 s21b").getAttribute("aria-pressed")) === "true", "필수가 다시 열면 꺼짐")
    check((await d.getByRole("button", { name: "가중치 높음", exact: true }).first().getAttribute("aria-pressed")) === "true", "가중치 직접 값이 다시 열면 사라짐")
  })

  await step(s, "검색 결과 — 이력 결과 쪽 · ★ 확인대상 · 본 것", async (pg, rec) => {
    await openCase(pg, CASE.inExam, "search")
    const d = dialog(pg)
    at(rec, "결과 쪽")
    await btn(d, /^1위 \d+ 유사도/, false).waitFor({ timeout: 10_000 })
    at(rec, "★ 확인대상")
    const star = btn(d, /^1위 \d+ 확인대상 넣기/, false)
    const r = await withResponse(pg, /\/targets$/, "POST", () => star.click())
    check(r.status() === 200, `E3 ${r.status()}`)
    await btn(d, /^1위 \d+ 확인대상 빼기/, false).waitFor({ timeout: 5_000 })
    at(rec, "카드 고르기 → 본 위치")
    const seen = pg.waitForResponse((x) => /\/seen$/.test(x.url()) && x.request().method() === "PUT", { timeout: 8_000 }).catch(() => null)
    await btn(d, /^3위 \d+ 유사도/, false).click()
    const sv = await seen
    rec.notes.push(`본 위치 저장 ${sv ? sv.status() : "요청 없음"}`)
    at(rec, "본 것 거르기")
    await btn(d, "본 것").click()
    await pg.waitForTimeout(800)
    rec.notes.push(`본 것 거르기 뒤 카드 ${await d.getByRole("button", { name: /^\d+위 \d+ 유사도/ }).count()}장`)
    await btn(d, "전체").click()
  })

  await step(
    s,
    "정밀 대조(모델 없음)",
    async (pg, rec) => {
      const d = dialog(pg)
      at(rec, "1위 카드 고르기")
      await btn(d, /^1위 \d+ 유사도/, false).click()
      at(rec, "정밀 대조 단추")
      const cmp = d.getByRole("button", { name: /정밀 대조$/ }).last()
      check(await cmp.isEnabled(), "정밀 대조 단추가 잠김")
      const calls = []
      const onRes = (r) => /\/crime\/[^/]+\/(similarity|alignment|match|outline|comparisons)/.test(r.url()) && calls.push(`${r.status()} ${r.request().method()} ${short(r.url()).replace(/^\/crime\/[^/]+/, "")}`)
      pg.on("response", onRes)
      await cmp.click()
      await pg.waitForTimeout(2000)
      // 정렬(ROI + 방향)이 없으면 정렬부터 — 정렬 저장 뒤 윤곽 계산 · 대조가 모델을 부른다
      at(rec, "정렬 설정")
      const setup = d.getByRole("button", { name: /정렬 설정/ }).last()
      if (await setup.isVisible().catch(() => false)) {
        rec.notes.push("정렬 없음 안내 보임")
        await setup.click()
        await pg.waitForTimeout(1000)
        // 기본 밑창 틀(관심영역)은 이미 있다 — 앞굽 · 뒤꿈치를 그림 위 · 아래 가운데에 찍는다
        at(rec, "앞굽 · 뒤꿈치 찍기")
        const img = pg.getByRole("dialog", { name: "정렬 설정" }).locator("img").first()
        const box = await img.boundingBox()
        check(box, "정렬 그림 없음")
        await pg.mouse.click(box.x + box.width / 2, box.y + box.height * 0.2)
        await pg.waitForTimeout(300)
        await pg.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8)
        await pg.waitForTimeout(300)
        at(rec, "정렬 저장")
        await pg.getByRole("button", { name: "정렬 저장", exact: true }).last().click()
        const saved = await waitToast(pg, /정렬|지정한 뒤/, 4_000)
        rec.notes.push(`정렬 저장 알림: ${saved ?? "(없음)"}`)
        check(!saved || !/지정한 뒤/.test(saved), "앞굽 · 뒤꿈치를 찍어도 정렬을 저장할 수 없음(방향 지정 단계로 못 넘어감)")
        await pg.waitForTimeout(4000)
      }
      pg.off("response", onRes)
      rec.notes.push(`요청: ${calls.join(" · ") || "(없음)"}`)
      // 정렬 저장 알림이 아니라 대응점 계산(모델) 실패 안내를 본다
      const t = await waitToast(pg, /모델|사용할 수 없|윤곽|대응점/, 4_000)
      const body = (await d.innerText()).replace(/\s+/g, " ")
      const m = body.match(/[^.]{0,20}(모델|사용할 수 없|실패)[^.]{0,40}/)
      rec.notes.push(`알림: ${t ?? "(없음)"} · 화면: ${m ? m[0] : "(안내 글 없음)"}`)
      check(t || m, "정밀 대조가 모델 없음을 안내하지 않음")
    },
    { expect: [{ status: 503 }, { status: 409, path: /match|similarity|outline/ }] },
  )

  await step(
    s,
    "결과 확인 — 판정 · 메모 · 교차 검증 요청 · 회수",
    async (pg, rec) => {
      await openCase(pg, CASE.inExam, "confirm")
      const d = dialog(pg)
      const rows = ["_1", "_2", "_3"]
      const judge = async (i, name) => {
        const b = d.getByRole("button", { name, exact: true }).nth(i)
        at(rec, `${rows[i]} ${name}`)
        const r = await withResponse(pg, /\/examination$/, "PUT", () => b.click())
        if (r.status() !== 200) {
          const g1 = await (await api.get(`/requests/${ridInExam}/confirm`)).json()
          const row = g1.rows.find((x) => x.aprthng_no.endsWith(rows[i]))
          rec.notes.push(`보낸 값 ${r.request().postData()} · 지금 G1 exam_id=${row?.exam_id} row_version=${row?.row_version}`)
        }
        check(r.status() === 200, `${rows[i]} ${name} G2 ${r.status()}`)
        await pg.waitForLoadState("networkidle")
      }
      await judge(0, "발견")
      await judge(1, "불발견")
      await judge(2, "감정불능")
      const memo = d.getByRole("textbox", { name: "_1 판정 메모" })
      await memo.fill("스모크 메모")
      const rm = await withResponse(pg, /\/examination$/, "PUT", () => memo.press("Enter"))
      check(rm.status() === 200, `메모 G2 ${rm.status()}`)
      await pg.waitForLoadState("networkidle")
      at(rec, "검증자 고르기")
      await btn(d, /스모크 감정관2/, false).click()
      const req = btn(d, "교차 검증 요청")
      const enabled = await expectEnabled(req, 5_000)
      check(enabled, "검증자를 골라도 교차 검증 요청 단추가 잠김")
      at(rec, "교차 검증 요청")
      const r = await withResponse(pg, /\/cross-review$/, "POST", () => req.click())
      check(r.status() === 200, `H2 ${r.status()}`)
      await pg.waitForLoadState("networkidle")
      const wd = btn(d, "회수")
      await wd.waitFor({ timeout: 8_000 })
      const w = await withResponse(pg, /\/withdraw$/, "POST", () => wd.click())
      check(w.status() === 200, `H5 ${w.status()}`)
      await pg.waitForLoadState("networkidle")
    },
    { expect: [] },
  )

  await step(
    s,
    "결과 확인 — 같은 판정 두 번 · 창 다시 열기(값 유지)",
    async (pg, rec) => {
      const before = await (await api.get(`/crime/${CASE.inExam}_2/examinations`)).json()
      const d = dialog(pg)
      await d.getByRole("button", { name: "불발견", exact: true }).nth(1).dblclick()
      await pg.waitForTimeout(1500)
      const after = await (await api.get(`/crime/${CASE.inExam}_2/examinations`)).json()
      rec.notes.push(`판본 ${before.length} → ${after.length}`)
      check(after.length === before.length, "같은 판정을 두 번 눌러 판본이 늘어남")
      await openCase(pg, CASE.inExam, "confirm")
      const d2 = dialog(pg)
      check((await d2.getByRole("textbox", { name: "_1 판정 메모" }).inputValue()) === "스모크 메모", "메모가 유지되지 않음")
    },
    { expect: [{ status: 409, path: /\/examination$/ }] },
  )
  await api.dispose()
  await s.context.close()
}

// ── 신발 DB(감정관 — 등록 · 문양 입력 · 승인 권한) ──

/** 신발 편집기 — 「기본정보」 칸(section)의 부모(머리 줄 · 밑창 · 문양이 함께 있음). div 전체에 has 거르기를 걸면 매우 느려 멈춘다 */
function shoeEditor(page) {
  return page.locator("section[aria-label='기본정보']").locator("xpath=..")
}

async function runShoe(browser) {
  const s = await openRole(browser, "신발")
  const p = s.page
  await step(s, "로그인 → 신발 DB 패널 · 거르기", async (pg, rec) => {
    await login(s, "smoke_exam")
    await pg.goto(`${BASE}/cases?shoe=1`)
    await pg.waitForLoadState("networkidle")
    await btn(pg, "211190 열기").waitFor({ timeout: 10_000 })
    const r = await withResponse(pg, /^\/shoes\/?\?/, "GET", () => btn(pg, /^문양 대기/, false).click())
    check(r.ok(), `J1 stage ${r.status()}`)
    const cards = pg.getByRole("button", { name: / 열기$/ })
    const deadline = Date.now() + 5_000
    while (Date.now() < deadline && (await cards.count()) !== 4) await pg.waitForTimeout(250)
    const n = await cards.count()
    rec.notes.push(`문양 대기 거르기 ${n}켤레`)
    check(n === 4, `문양 대기 거르기 결과 ${n}켤레(4 기대)`)
    await btn(pg, /^문양 대기/, false).click()
    await pg.waitForLoadState("networkidle")
  })

  await step(s, "신발 편집 — 등록", async (pg, rec) => {
    at(rec, "패널 「등록」")
    await pg.getByRole("button", { name: "등록", exact: true }).last().click()
    await pg.getByText("새 신발", { exact: true }).waitFor({ timeout: 8_000 })
    // 편집기는 패널 대화 상자(role=dialog) 밖에 그려진다 — 「새 신발」 머리를 품은 가장 안쪽 칸을 편집기로 본다
    const dlg = shoeEditor(pg)
    at(rec, "신발 ID")
    // 칸은 <label> 로 감싸여 있어 칸 이름이 곧 접근 이름
    await dlg.getByRole("textbox", { name: "신발ID", exact: true }).fill("SMK0001")
    await dlg.getByRole("textbox", { name: "모델명", exact: true }).fill("스모크 모델")
    at(rec, "그림 고르기")
    const chooser = pg.waitForEvent("filechooser", { timeout: 5_000 })
    await btn(dlg, "이미지 등록").click()
    await (await chooser).setFiles(path.join(process.cwd(), "src/assets/Shoes/B/B205423.png"))
    await pg.waitForTimeout(800)
    at(rec, "문양 넣기")
    await btn(dlg, "상에 s21b 넣기").click()
    at(rec, "저장(J4)")
    const r = await withResponse(pg, /^\/shoes\/register$/, "POST", () => btn(dlg, "저장").click())
    check(r.ok(), `J4 ${r.status()}`) // 신발 등록은 201
    await pg.waitForLoadState("networkidle")
  })

  await step(
    s,
    "신발 편집 — 문양 입력 · 승인 · 승인 뒤 문양 잠김",
    async (pg, rec) => {
      const dlg = shoeEditor(pg)
      at(rec, "문양 더 넣고 저장")
      await btn(dlg, "상에 s22a 넣기").click()
      const r1 = await withResponse(pg, /^\/shoes\/SMK0001(\/patterns)?$/, "PUT", () => btn(dlg, "저장").click())
      check(r1.ok(), `J5/J6 ${r1.status()}`)
      await pg.waitForLoadState("networkidle")
      at(rec, "승인")
      // 저장 뒤 편집기가 서버 값으로 다시 그려질 때까지(그 전엔 「바뀐 내용을 저장한 뒤 승인하세요」)
      await pg.waitForTimeout(800)
      const approve = btn(dlg, /승인$/, false)
      check(await expectEnabled(approve, 5_000), "저장 뒤에도 승인 단추가 잠김")
      const r2 = await withResponse(pg, /\/approve$/, "POST", () => approve.click(), 6_000).catch(async (e) => {
        rec.notes.push(`승인 요청 없음 — 알림: ${await toastText(pg)}`)
        throw e
      })
      check(r2.status() === 200, `J7 ${r2.status()}`)
      await pg.waitForLoadState("networkidle")
      const locked = await pg.getByText(/승인됨 · 문양 잠김/).first().waitFor({ timeout: 6_000 }).then(() => true, () => false)
      rec.notes.push(`머리 「승인됨 · 문양 잠김」 ${locked ? "보임" : "없음"}`)
      check(locked, "승인 뒤 문양 잠김 표시가 없음")
      at(rec, "승인 뒤 문양 바꾸기(화면)")
      const add = btn(dlg, "상에 s21c 넣기")
      // 잠긴 팔레트는 눌리지 않게(pointer-events) 막혀 있다 — 시험 누르기(trial)로 눌리는지만 본다
      const canAdd = await add.click({ trial: true, timeout: 2_000 }).then(() => true, () => false)
      rec.notes.push(`승인 뒤 문양 넣기 단추 ${canAdd ? "눌림" : "막힘"}`)
      if (canAdd) {
        await add.click()
        const r3 = await withResponse(pg, /^\/shoes\/SMK0001(\/patterns)?$/, "PUT", () => btn(dlg, "저장").click())
        const t = await waitToast(pg, /승인|잠|취소/)
        rec.notes.push(`승인 뒤 저장 = ${r3.status()} · 알림 ${t ?? "(없음)"}`)
        check(r3.status() === 409 && t, "승인 뒤 문양 저장이 409 안내 없이 지나감")
      }
      const api = await apiAs("smoke_exam")
      const lock = await api.put("/shoes/SMK0001/patterns", { data: { top: ["s22a"], mid: [], bottom: [], outline: [] } })
      rec.notes.push(`승인 뒤 직접 J6 = ${lock.status()}`)
      check(lock.status() === 409, `승인 뒤 문양 변경이 ${lock.status()}`)
      await api.dispose()
    },
    { expect: [{ status: 409, path: /^\/shoes\/SMK0001/ }] },
  )
  await s.context.close()
}

// ── 관리자 ──

async function runAdmin(browser) {
  const s = await openRole(browser, "관리자")
  await step(s, "로그인 → 첫 화면", async (pg, rec) => {
    await login(s, "smoke_admin")
    rec.notes.push(`첫 화면 ${new URL(pg.url()).pathname}`)
    check(new URL(pg.url()).pathname === "/cases", `첫 화면 ${pg.url()}`)
  })
  await step(s, "사용자 관리 — 권한 바꾸기", async (pg, rec) => {
    await pg.goto(`${BASE}/manage/users`)
    await pg.waitForLoadState("networkidle")
    // 다른 역할 단계(검증자 「보기만」)에 영향이 없게 감정관2 에게 「신발 등록·수정」(SHOE_EDIT)을 켠다
    await pg.getByText("smoke_exam2", { exact: true }).click()
    await pg.waitForTimeout(800)
    const toggles = pg.getByRole("switch")
    const names = await toggles.evaluateAll((s) => s.map((e) => e.getAttribute("aria-label") ?? ""))
    rec.notes.push(`기능 스위치 ${names.length}개 · 접근 이름 있는 것 ${names.filter(Boolean).length}개`)
    // 스위치에 접근 이름이 없어 줄 글(기능 코드)로 찾는다
    const sw = pg.getByText("SHOE_EDIT", { exact: true }).locator("xpath=following::*[@role='switch'][1]")
    await sw.click()
    check((await sw.getAttribute("aria-checked")) === "true", "SHOE_EDIT 스위치가 켜지지 않음")
    const r = await withResponse(pg, /^\/admin\/users\/[^/]+\/(features|roles)$/, "PUT", () => btn(pg, "권한 저장").click())
    check(r.status() === 200, `권한 저장 ${r.status()}`)
    await pg.waitForLoadState("networkidle")
    const api = await apiAs("smoke_admin")
    const users = await (await api.get("/admin/users")).json()
    const u = (users.items ?? users).find((x) => x.user_id === "smoke_exam2")
    rec.notes.push(`smoke_exam2 기능 = ${JSON.stringify(u?.features ?? u?.direct_features ?? "?")}`)
    await api.dispose()
  })
  await step(s, "사용 기록 — 대상 번호 거르기 · 감사 무결성", async (pg, rec) => {
    await pg.goto(`${BASE}/manage/logs`)
    await pg.waitForLoadState("networkidle")
    await btn(pg, "기능 기록").click()
    const box = pg.getByPlaceholder(/감정번호·화류번호/)
    await box.fill(CASE.inExam)
    const r = await withResponse(pg, /^\/admin\/events\?.*target_id=/, "GET", () => box.press("Enter"))
    check(r.ok(), `K1 ${r.status()}`)
    await pg.waitForLoadState("networkidle")
    const rows = (await r.json()).length ?? 0
    rec.notes.push(`대상 번호 기록 ${rows}줄`)
    check(rows > 0, "대상 번호 거르기 결과 0줄")
    await btn(pg, "관리자 행위").click()
    await pg.waitForLoadState("networkidle")
    await pg.getByText(/변조 없음|사슬 어긋남/).first().waitFor({ timeout: 10_000 })
    rec.notes.push((await pg.getByText(/변조 없음|사슬 어긋남/).first().innerText()).trim())
  })
  await s.context.close()
}

// ── 수사관 ──

async function runInvestigator(browser) {
  const s = await openRole(browser, "수사관")
  await step(s, "로그인 → 목록(타 관서 · 다른 소속 사건 안 보임)", async (pg, rec) => {
    await login(s, "smoke_inv")
    check(new URL(pg.url()).pathname === "/cases", `첫 화면 ${pg.url()}`)
    await pg.getByText(CASE.requestedA, { exact: true }).waitFor({ timeout: 10_000 })
    check(!(await pg.getByText(CASE.otherOrg, { exact: true }).isVisible()), "다른 관서 사건이 보임")
    check(!(await pg.getByText(CASE.inExam, { exact: true }).isVisible()), "다른 소속(경찰청) 사건이 보임")
    rec.notes.push(`보이는 사건: ${(await pg.getByText(/^00001-26-\d{4}$/).allInnerTexts()).join(", ")}`)
  })
  await step(
    s,
    "타 관서 사건 주소로 바로 열기",
    async (pg, rec) => {
      await pg.goto(`${BASE}/cases?open=${CASE.otherOrg}&tab=info&tabs=${CASE.otherOrg}`)
      await pg.waitForLoadState("networkidle")
      await pg.waitForTimeout(1000)
      const d = dialog(pg)
      const shown = await d.getByText("스모크 B서", { exact: false }).isVisible().catch(() => false)
      rec.notes.push(shown ? "타 관서 사건 내용이 보임" : "사건 내용 안 보임")
      check(!shown, "타 관서 사건 내용이 열림")
    },
    { expect: [{ status: 404 }, { status: 403 }] },
  )
  await step(s, "접수 전 사건 — 사건 정보 수정 저장", async (pg) => {
    await openCase(pg, CASE.requestedA, "info")
    const d = dialog(pg)
    await d.getByRole("textbox", { name: "사건개요" }).fill("수사관 접수 전 수정")
    const r = await withResponse(pg, /^\/requests\/\d+$/, "PUT", () => btn(d, "저장").click())
    check(r.status() === 200, `A3 ${r.status()}`)
  })
  await step(
    s,
    "접수 뒤 사건 — 수정 불가",
    async (pg, rec) => {
      await openCase(pg, CASE.received, "info")
      const d = dialog(pg)
      const save = btn(d, "저장")
      const visible = await save.isVisible().catch(() => false)
      const enabled = visible && (await save.isEnabled().catch(() => false))
      const ro = await d.getByRole("textbox", { name: "사건개요" }).isEditable().catch(() => false)
      rec.notes.push(`저장 단추 ${visible ? (enabled ? "켜짐" : "잠김") : "없음"} · 사건개요 ${ro ? "고칠 수 있음" : "읽기 전용"}`)
      check(!enabled && !ro, "접수 뒤에도 수사관이 고칠 수 있게 보임")
      const api = await apiAs("smoke_inv")
      const rid = await requestIdOf(api, CASE.received)
      const cur = await (await api.get(`/requests/${rid}`)).json()
      const put = await api.put(`/requests/${rid}`, { data: { rm: "x", rowVersion: cur.row_version } })
      rec.notes.push(`직접 A3 = ${put.status()}`)
      check(put.status() === 403, `접수 뒤 수사관 A3 가 ${put.status()}`)
      await api.dispose()
    },
    { expect: [{ status: 403 }] },
  )
  await s.context.close()
}

// ── 검증자(보기만) ──

async function runReviewer(browser) {
  const s = await openRole(browser, "검증자")
  await step(s, "로그인 → 목록(접수 단추 없음)", async (pg) => {
    await login(s, "smoke_rev")
    check(new URL(pg.url()).pathname === "/cases", `첫 화면 ${pg.url()}`)
    await pg.getByText(CASE.inExam, { exact: true }).waitFor({ timeout: 10_000 })
    check((await pg.getByRole("button", { name: "접수", exact: true }).count()) === 0, "검증자에게 「접수」 단추가 보임")
  })
  await step(s, "사건 창 — 보기만(저장 · 판정 잠김)", async (pg, rec) => {
    await openCase(pg, CASE.inExam, "info")
    const d = dialog(pg)
    const save = btn(d, "저장")
    const canSave = (await save.isVisible().catch(() => false)) && (await save.isEnabled().catch(() => false))
    rec.notes.push(`사건 정보 저장 ${canSave ? "켜짐" : "없음/잠김"}`)
    check(!canSave, "검증자에게 사건 정보 저장이 켜짐")
    for (const tab of ["edit", "pattern", "search", "confirm"]) {
      await openCase(pg, CASE.inExam, tab)
      await pg.waitForTimeout(500)
    }
    const d2 = dialog(pg)
    const judge = d2.getByRole("button", { name: "불발견", exact: true }).first()
    const can = (await judge.isVisible().catch(() => false)) && (await judge.isEnabled().catch(() => false))
    rec.notes.push(`판정 단추 ${can ? "켜짐" : "없음/잠김"}`)
    check(!can, "검증자에게 판정 단추가 켜짐")
  })
  await s.context.close()
}

// ── 실행 ──

const browser = await chromium.launch()
try {
  if (ONLY.has("exam")) await runExaminer(browser)
  if (ONLY.has("shoe")) await runShoe(browser)
  if (ONLY.has("admin")) await runAdmin(browser)
  if (ONLY.has("inv")) await runInvestigator(browser)
  if (ONLY.has("rev")) await runReviewer(browser)
} finally {
  await browser.close()
}

const bad = results.filter((r) => !r.ok || r.http.length || r.console.length || r.external.length || r.loading)
const external = results.reduce((n, r) => n + r.external.length, 0)
fs.writeFileSync(path.join(OUT, "smoke-result.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2))
console.log(`\n단계 ${results.length} · 통과 ${results.length - bad.length} · 문제 ${bad.length} · 외부 요청 ${external} · 결과 ${OUT}`)
process.exit(bad.length ? 1 : 0)
