// 매뉴얼 Word(.docx) 조립 — 원고(manual.md) + 캡처 폴더(capture.mjs 결과) → 번호 표시 그림 → docx 한 권.
//
// 실행:  node scripts/manual/build-docx.mjs [--captures <폴더>] [--out <docx 경로>] [--manuscript <원고>] [--tools <docx 모듈 폴더>]
//   --captures   기본 ../output/manual/captures (capture.mjs 의 --out 과 같은 곳, captures.json 이 있어야 함)
//   --out        기본 ../output/manual/족적감정플랫폼_사용자매뉴얼_v0.1.docx
//   --manuscript 기본 scripts/manual/manual.md
//   --tools      `docx` npm 모듈이 설치된 폴더(기본 ../output/manual/_tools — README 의 설치 한 줄 참고).
//                저장소 package.json 은 건드리지 않으려고 저장소 밖에 따로 설치한다.
// 번호 표시 그림은 <docx 폴더>/annotated/*.jpg 로 만든다(실제 족적 사진이 들어 있으므로 저장소 밖).
// 경로는 모두 저장소 루트 기준(절대 경로도 됨).
//
// 원고 문법(manual.md 머리 주석에 같은 설명):
//   %키: 값                 표지 정보(제목 · 부제 · 판 · 날짜 · 표시)
//   # / ## / ###            제목 1 / 2 / 3 (Word 「제목」 스타일 — 자동 목차에 쓰임). 제목 1 은 새 쪽에서 시작
//   > 목적: …               절의 목적 한 줄(옅은 상자)
//   ![캡처이름 | 그림 제목 | 확대]  캡처 그림(번호 표시본) + 캡션 「그림 N. 제목」. 제목을 비우면 captures.json 의 title.
//                           「| 확대」를 붙이면 번호 붙인 요소들 둘레만 잘라 크게(작은 단추가 모인 그림용)
//   (3) …                   그림의 ③ 번 설명. 그림에는 원고에 설명이 있는 번호만 그린다(설명이 없으면 전부)
//   - …                     글머리표 목록
//   ! 팁: … / ! 주의: …     팁 · 주의 상자
//   ※ …                     실증 적용 예정 등 알림 상자
//   | a | b |               표(첫 줄 = 머리, 둘째 줄 |---| 는 건너뜀)
//   ---쪽---                쪽 나눔
//   그 밖의 줄              본문 문단(빈 줄로 문단을 나눔). **굵게** 만 지원
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { chromium } from "@playwright/test"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const CAPTURES = path.resolve(ROOT, arg("captures", "../output/manual/captures"))
const OUT = path.resolve(ROOT, arg("out", "../output/manual/족적감정플랫폼_사용자매뉴얼_v0.1.docx"))
const MANUSCRIPT = path.resolve(ROOT, arg("manuscript", "scripts/manual/manual.md"))
const TOOLS = path.resolve(ROOT, arg("tools", "../output/manual/_tools"))
const ANNOTATED = path.join(path.dirname(OUT), "annotated")

// ── docx 모듈(저장소 밖 설치본) ──

function loadDocx() {
  const tries = [path.join(TOOLS, "package.json"), path.join(ROOT, "package.json")]
  for (const base of tries) {
    try {
      const req = createRequire(base)
      return { docx: req("docx"), layout: req("docx/layout") }
    } catch {
      // 다음 후보
    }
  }
  console.error(`docx 모듈을 찾지 못했습니다. 설치: npm install --prefix "${TOOLS}" docx@9`)
  process.exit(1)
}
const { docx, layout } = loadDocx()
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  SequentialIdentifier,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} = docx

// ── 원고 읽기 ──

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
const circled = (n) => CIRCLED[n - 1] ?? `(${n})`

function parseManuscript(text) {
  const meta = {}
  const blocks = []
  let para = []
  let table = null
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") })
    para = []
  }
  const flushTable = () => {
    if (table) blocks.push({ kind: "table", rows: table })
    table = null
  }
  const lines = text.split(/\r?\n/)
  let inComment = false
  for (const raw of lines) {
    const line = raw.trimEnd()
    // HTML 주석(<!-- … -->)은 원고 설명용 — 건너뛴다
    if (inComment) {
      if (line.includes("-->")) inComment = false
      continue
    }
    if (line.trimStart().startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true
      continue
    }
    if (line.startsWith("|")) {
      flushPara()
      const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim())
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
      table = table ?? []
      table.push(cells)
      continue
    }
    flushTable()
    let m
    if (line.trim() === "") {
      flushPara()
    } else if ((m = line.match(/^%\s*([^:]+):\s*(.*)$/))) {
      meta[m[1].trim()] = m[2].trim()
    } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushPara()
      blocks.push({ kind: "h", level: m[1].length, text: m[2] })
    } else if ((m = line.match(/^>\s*(.*)$/))) {
      flushPara()
      blocks.push({ kind: "purpose", text: m[1] })
    } else if ((m = line.match(/^!\[([^\]]+)\]\s*$/))) {
      flushPara()
      const [name, title = "", opt = ""] = m[1].split("|").map((s) => s.trim())
      blocks.push({ kind: "figure", name: name.replace(/\.png$/, ""), title, crop: opt === "확대" })
    } else if ((m = line.match(/^\((\d+)\)\s+(.*)$/))) {
      flushPara()
      blocks.push({ kind: "callout", n: Number(m[1]), text: m[2] })
    } else if ((m = line.match(/^-\s+(.*)$/))) {
      flushPara()
      blocks.push({ kind: "bullet", text: m[1] })
    } else if ((m = line.match(/^!\s*(팁|주의):\s*(.*)$/))) {
      flushPara()
      blocks.push({ kind: "tip", label: m[1], text: m[2] })
    } else if ((m = line.match(/^※\s*(.*)$/))) {
      flushPara()
      blocks.push({ kind: "note", text: m[1] })
    } else if (line.trim() === "---쪽---") {
      flushPara()
      blocks.push({ kind: "pagebreak" })
    } else {
      para.push(line.trim())
    }
  }
  flushPara()
  flushTable()
  // 그림마다 뒤따르는 번호 설명의 번호들(다음 그림 · 제목 전까지)
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].kind !== "figure") continue
    const ns = []
    for (let j = i + 1; j < blocks.length && blocks[j].kind !== "figure" && blocks[j].kind !== "h"; j++) {
      if (blocks[j].kind === "callout") ns.push(blocks[j].n)
    }
    blocks[i].numbers = ns
  }
  return { meta, blocks }
}

// ── 번호 표시 그림(헤드리스 Chromium 으로 원본 캡처 위에 테 · 동그라미 번호) ──

const MARK_COLOR = "#E03131"

function annotateHtml(dataUrl, viewport, marks, R = 13) {
  const placed = []
  const isBig = (b) => b.width > viewport.width * 0.55 || b.height > viewport.height * 0.7
  // 번호가 다른 (작은) 표시 칸 안쪽을 덮는지 — 덮지 않는 자리를 먼저 고른다
  const covers = (x, y) => marks.some((o) => !isBig(o.box) && x > o.box.x - R * 0.5 && x < o.box.x + o.box.width + R * 0.5 && y > o.box.y - R * 0.5 && y < o.box.y + o.box.height + R * 0.5)
  const items = marks.map((m) => {
    const b = m.box
    const big = isBig(b)
    const clampX = (x) => Math.min(Math.max(x, R + 2), viewport.width - R - 2)
    const clampY = (y) => Math.min(Math.max(y, R + 2), viewport.height - R - 2)
    const midY = b.y + Math.min(R, b.height / 2)
    // 자리 후보: 큰 칸은 안쪽 왼쪽 위, 작은 칸은 위 → 왼쪽 → 왼쪽 위 모서리 → 오른쪽 → 아래(내용을 덜 가리게)
    const candidates = (big
      ? [[b.x + R + 6, b.y + R + 6]]
      : [
          [b.x + R, b.y - R - 3],
          [b.x - R - 3, midY],
          [b.x - 2, b.y - 2],
          [b.x + b.width + R + 3, midY],
          [b.x + R, b.y + b.height + R + 3],
        ]
    ).map(([x, y]) => [clampX(x), clampY(y)])
    const free = (x, y) => !placed.some((p) => Math.hypot(p.cx - x, p.cy - y) < R * 2 + 2)
    let [cx, cy] =
      candidates.find(([x, y]) => free(x, y) && (big || !covers(x, y))) ?? candidates.find(([x, y]) => free(x, y)) ?? candidates[0]
    // 그래도 겹치면 오른쪽으로 민다
    for (let guard = 0; guard < 40 && !free(cx, cy); guard++) {
      cx += R * 2 + 2
      if (cx > viewport.width - R - 2) {
        cx = R + 2
        cy += R * 2 + 2
      }
    }
    placed.push({ cx, cy })
    return { ...m, cx, cy, big }
  })
  const boxes = items
    .map(
      (m) =>
        `<div style="position:absolute;left:${m.box.x}px;top:${m.box.y}px;width:${m.box.width}px;height:${m.box.height}px;` +
        `border:2.5px ${m.big ? "dashed" : "solid"} ${MARK_COLOR};border-radius:6px;box-sizing:border-box;` +
        `box-shadow:0 0 0 1.5px rgba(255,255,255,.85), inset 0 0 0 1px rgba(255,255,255,.6)"></div>`,
    )
    .join("")
  const dots = items
    .map(
      (m) =>
        `<div style="position:absolute;left:${m.cx - R}px;top:${m.cy - R}px;width:${R * 2}px;height:${R * 2}px;border-radius:50%;` +
        `background:${MARK_COLOR};color:#fff;font:700 ${Math.round(R * 1.15)}px/${R * 2 - 4}px -apple-system,'Apple SD Gothic Neo',sans-serif;text-align:center;` +
        `border:2px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.45)">${m.n}</div>`,
    )
    .join("")
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden}</style></head>
<body><div style="position:relative;width:${viewport.width}px;height:${viewport.height}px">
<img src="${dataUrl}" style="position:absolute;inset:0;width:100%;height:100%">${boxes}${dots}</div></body></html>`
}

async function annotateAll(figures, captureIndex, viewport) {
  fs.mkdirSync(ANNOTATED, { recursive: true })
  const browser = await chromium.launch()
  // 전체 그림은 1.5배, 잘라 크게 보이는 그림은 2배 해상도로
  const pageFull = await (await browser.newContext({ viewport, deviceScaleFactor: 1.5 })).newPage()
  const pageCrop = await (await browser.newContext({ viewport, deviceScaleFactor: 2 })).newPage()
  const out = new Map()
  const warnings = []
  for (const fig of figures) {
    if (out.has(fig.key)) continue
    const cap = captureIndex.get(fig.name)
    const png = path.join(CAPTURES, `${fig.name}.png`)
    if (!cap || !fs.existsSync(png)) {
      warnings.push(`캡처 없음: ${fig.name}`)
      continue
    }
    // 원고에 (n) 설명이 없는 그림은 번호를 그리지 않는다(원고 규칙 — 3회차 검수: 전체 번호를 그리던 것)
    const wanted = fig.numbers
    const marks = []
    for (const n of wanted) {
      const m = cap.marks.find((x) => x.n === n)
      if (!m) warnings.push(`${fig.name}: 원고의 (${n}) 번 요소가 captures.json 에 없음`)
      else if (!m.box) warnings.push(`${fig.name}: (${n}) ${m.label} — 화면에서 못 찾아 그림에 번호 없음`)
      else marks.push(m)
    }
    const dataUrl = `data:image/png;base64,${fs.readFileSync(png).toString("base64")}`
    const page = fig.crop ? pageCrop : pageFull
    await page.setContent(annotateHtml(dataUrl, viewport, marks, fig.crop ? 10 : 13), { waitUntil: "load" })
    const file = path.join(ANNOTATED, `${fig.key}.jpg`)
    // 「확대」: 번호 붙인 요소들을 감싸는 부분만 잘라 크게(작은 단추가 모인 그림용)
    // 테두리 요소(capture.mjs marks 의 { frame: true } — 열린 창 전체 등)도 잘라 내기 범위에 넣는다(번호는 안 그림)
    let clip
    const area = [...marks, ...cap.marks.filter((m) => m.frame && m.box)]
    if (fig.crop && area.length) {
      const pad = 48
      const x0 = Math.max(0, Math.min(...area.map((m) => m.box.x)) - pad)
      const y0 = Math.max(0, Math.min(...area.map((m) => m.box.y)) - pad)
      const x1 = Math.min(viewport.width, Math.max(...area.map((m) => m.box.x + m.box.width)) + pad)
      const y1 = Math.min(viewport.height, Math.max(...area.map((m) => m.box.y + m.box.height)) + pad)
      clip = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
    }
    await page.screenshot({ path: file, type: "jpeg", quality: 84, ...(clip ? { clip } : {}) })
    out.set(fig.key, { file, width: clip?.width ?? viewport.width, height: clip?.height ?? viewport.height })
  }
  await browser.close()
  return { files: out, warnings }
}

// ── docx 조각 ──

const FONT = "맑은 고딕"
const COLOR = { ink: "1F2937", muted: "6B7280", brand: "1E3A8A", mark: "C92A2A", line: "CBD5E1" }
const PAGE = { width: 11906, height: 16838, margin: 1134 } // A4, 여백 2cm
const TEXT_W = PAGE.width - PAGE.margin * 2 // 9638 DXA

/** **굵게** · `코드` 를 나눠 TextRun 들로 */
function runs(text, base = {}) {
  const out = []
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  for (const part of parts) {
    if (!part) continue
    const bold = part.startsWith("**") && part.endsWith("**")
    const code = part.startsWith("`") && part.endsWith("`")
    const body = bold ? part.slice(2, -2) : code ? part.slice(1, -1) : part
    out.push(
      new TextRun({
        text: body,
        bold: bold || base.bold,
        color: code ? "334155" : base.color,
        size: code ? (base.size ?? 20) - 2 : base.size,
        italics: base.italics,
        ...(code ? { font: { ascii: "Consolas", hAnsi: "Consolas", eastAsia: FONT }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "F1F5F9" } } : {}),
      }),
    )
  }
  return out
}

function boxParagraph(children, fill, edge) {
  return new Paragraph({
    children,
    shading: { type: ShadingType.CLEAR, color: "auto", fill },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: edge, space: 6 } },
    indent: { left: 140, right: 140 },
    spacing: { before: 80, after: 120 },
  })
}

function tableOf(rows) {
  const cols = Math.max(...rows.map((r) => r.length))
  // 열 너비 = 글자 수 비례(1~4배로 자름)
  const weight = Array.from({ length: cols }, (_, c) => {
    const len = Math.max(...rows.map((r) => (r[c] ?? "").length))
    return Math.min(Math.max(len, 4), 30)
  })
  const sum = weight.reduce((a, b) => a + b, 0)
  const widths = weight.map((w) => Math.floor((TEXT_W * w) / sum))
  widths[cols - 1] += TEXT_W - widths.reduce((a, b) => a + b, 0)
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLOR.line }
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (r, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          cantSplit: true,
          children: Array.from({ length: cols }, (_, c) =>
            new TableCell({
              width: { size: widths[c], type: WidthType.DXA },
              borders: { top: border, bottom: border, left: border, right: border },
              shading: ri === 0 ? { type: ShadingType.CLEAR, color: "auto", fill: "E8EDF5" } : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: runs(r[c] ?? "", { bold: ri === 0, size: 18 }) })],
            }),
          ),
        }),
    ),
  })
}

function coverChildren(meta) {
  const line = (text, opts = {}) =>
    new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: opts.before ?? 0, after: opts.after ?? 120 }, children: [new TextRun({ text, ...opts.run })] })
  return [
    line("", { before: 2400 }),
    line(meta["부제"] ?? "", { run: { size: 24, color: COLOR.muted } }),
    new Paragraph({
      spacing: { before: 120, after: 360 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.brand, space: 12 } },
      children: [new TextRun({ text: meta["제목"] ?? "사용자 매뉴얼", bold: true, size: 56, color: COLOR.brand })],
    }),
    line(`판 ${meta["판"] ?? ""}`, { run: { size: 24 } }),
    line(`날짜 ${meta["날짜"] ?? ""}`, { run: { size: 24 } }),
    line("", { before: 480 }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF4E5" },
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: "E8590C", space: 8 } },
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: meta["표시"] ?? "", bold: true, size: 26, color: "C2410C" })],
    }),
    ...(meta["안내"] ? [line(meta["안내"], { run: { size: 18, color: COLOR.muted }, before: 120 })] : []),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}

function buildBody(blocks, images, captureIndex) {
  const out = []
  let firstH1 = true
  for (const b of blocks) {
    switch (b.kind) {
      case "h": {
        const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][b.level - 1]
        out.push(new Paragraph({ heading: level, pageBreakBefore: b.level === 1 && !firstH1, children: [new TextRun(b.text)] }))
        if (b.level === 1) firstH1 = false
        break
      }
      case "purpose":
        out.push(boxParagraph(runs(b.text, { color: COLOR.brand }), "EEF2FA", COLOR.brand))
        break
      case "figure": {
        const img = images.get(b.key)
        const cap = captureIndex.get(b.name)
        if (!img) {
          out.push(new Paragraph({ children: [new TextRun({ text: `[그림 없음: ${b.name}]`, color: COLOR.mark })] }))
          break
        }
        const file = img.file
        // 본문 폭 16.5cm(624px, 96dpi), 높이는 13cm(490px)를 넘지 않게. 잘라 낸 그림은 원래 배율보다 2배 넘게 키우지 않는다
        const maxW = b.crop ? Math.min(624, img.width * 0.87) : 624
        let w = maxW
        let h = (w * img.height) / img.width
        if (h > 490) {
          h = 490
          w = (h * img.width) / img.height
        }
        w = Math.round(w)
        h = Math.round(h)
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { before: 120, after: 40 },
            children: [
              new ImageRun({
                type: "jpg",
                data: fs.readFileSync(file),
                transformation: { width: w, height: h },
                altText: { name: b.name, title: b.title || cap?.title || b.name, description: cap?.desc ?? "" },
              }),
            ],
          }),
        )
        out.push(
          new Paragraph({
            style: "Caption",
            alignment: AlignmentType.CENTER,
            children: [new TextRun("그림 "), new SequentialIdentifier("그림"), new TextRun(`. ${b.title || cap?.title || b.name}`)],
          }),
        )
        break
      }
      case "callout":
        out.push(
          new Paragraph({
            indent: { left: 400, hanging: 400 },
            tabStops: [{ type: TabStopType.LEFT, position: 400 }],
            spacing: { before: 30, after: 50 },
            children: [new TextRun({ text: circled(b.n), bold: true, color: COLOR.mark, size: 22 }), new TextRun("\t"), ...runs(b.text)],
          }),
        )
        break
      case "bullet":
        out.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 20, after: 40 }, children: runs(b.text) }))
        break
      case "tip":
        out.push(
          boxParagraph(
            [new TextRun({ text: `${b.label}  `, bold: true, color: b.label === "주의" ? "C2410C" : "0F766E" }), ...runs(b.text)],
            b.label === "주의" ? "FFF4E5" : "ECFDF5",
            b.label === "주의" ? "E8590C" : "0F766E",
          ),
        )
        break
      case "note":
        out.push(boxParagraph([new TextRun({ text: "※ ", bold: true, color: "7C3AED" }), ...runs(b.text, { color: "4C1D95" })], "F5F3FF", "7C3AED"))
        break
      case "table":
        out.push(tableOf(b.rows))
        out.push(new Paragraph({ spacing: { before: 0, after: 80 }, children: [] }))
        break
      case "pagebreak":
        out.push(new Paragraph({ children: [new PageBreak()] }))
        break
      default:
        out.push(new Paragraph({ spacing: { before: 40, after: 100 }, children: runs(b.text) }))
    }
  }
  return out
}

// ── 실행 ──

async function main() {
  const jsonPath = path.join(CAPTURES, "captures.json")
  if (!fs.existsSync(jsonPath)) {
    console.error(`captures.json 이 없습니다: ${jsonPath} — 먼저 node scripts/manual/capture.mjs`)
    process.exit(1)
  }
  const capJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
  const captureIndex = new Map(capJson.captures.map((c) => [c.file.replace(/\.png$/, ""), c]))
  const { meta, blocks } = parseManuscript(fs.readFileSync(MANUSCRIPT, "utf8"))

  // 같은 캡처를 두 번 쓰면 두 번째부터 이름 뒤에 _2, _3 …
  const figures = blocks.filter((b) => b.kind === "figure")
  const seen = new Map()
  for (const f of figures) {
    const k = (seen.get(f.name) ?? 0) + 1
    seen.set(f.name, k)
    f.key = k === 1 ? f.name : `${f.name}_${k}`
  }
  // 지난 실행의 번호 표시본은 지운다(이름이 바뀐 그림이 남지 않게)
  if (fs.existsSync(ANNOTATED)) for (const f of fs.readdirSync(ANNOTATED)) if (f.endsWith(".jpg")) fs.rmSync(path.join(ANNOTATED, f))
  const { files, warnings } = await annotateAll(figures, captureIndex, capJson.viewport ?? { width: 1440, height: 900 })

  const heading = (size, before, after, color = COLOR.brand) => ({
    run: { font: FONT, size, bold: true, color },
    paragraph: { spacing: { before, after }, keepNext: true, keepLines: true },
  })
  const doc = new Document({
    creator: "족적 감정 플랫폼 매뉴얼 조립 스크립트",
    title: meta["제목"] ?? "사용자 매뉴얼",
    description: `${meta["판"] ?? ""} · ${meta["표시"] ?? ""}`,
    pageNumbers: layout.estimatePageNumbersWith({ guess: true }),
    styles: {
      default: {
        document: { run: { font: FONT, size: 20, color: COLOR.ink }, paragraph: { spacing: { line: 300 } } },
        heading1: heading(32, 0, 240),
        heading2: heading(26, 360, 140),
        heading3: heading(22, 240, 100, COLOR.ink),
      },
      paragraphStyles: [
        {
          id: "Caption",
          name: "Caption",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: 17, color: COLOR.muted },
          paragraph: { spacing: { before: 0, after: 200 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: { size: { width: PAGE.width, height: PAGE.height }, margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin, header: 567, footer: 567 } },
        },
        headers: {
          first: new Header({ children: [new Paragraph({ children: [] })] }),
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.line, space: 4 } },
                children: [new TextRun({ text: `${meta["제목"] ?? ""} ${meta["판"] ?? ""} · ${meta["표시"] ?? ""}`, size: 16, color: COLOR.muted })],
              }),
            ],
          }),
        },
        footers: {
          first: new Footer({ children: [new Paragraph({ children: [] })] }),
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 16, color: COLOR.muted })],
              }),
            ],
          }),
        },
        children: [
          ...coverChildren(meta),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "목차", bold: true, size: 32, color: COLOR.brand })] }),
          new TableOfContents("목차", { hyperlink: true, headingStyleRange: "1-2" }),
          new Paragraph({ children: [new PageBreak()] }),
          ...buildBody(blocks, files, captureIndex),
        ],
      },
    ],
  })

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, await Packer.toBuffer(doc))
  const figureCount = figures.length
  console.log(`✓ ${OUT}`)
  console.log(`  그림 ${figureCount}개(번호 표시본 ${files.size}장 → ${ANNOTATED})`)
  if (warnings.length) {
    console.log(`  확인할 것 ${warnings.length}건:`)
    for (const w of warnings) console.log(`   - ${w}`)
  }
}

await main()
