// 부품 「쓰는 화면」 세기(설계서 §8-1 마지막 줄).
//  components.md 표의 행마다 「원본(data-part)」 칸의 시안 클래스 · 그림 함수(`.btn`, `M.photo` …)가
//  시안 화면 파일 screens/s00~s15*.js 와, 그 화면이 부르는 assets/core.js 공용 틀(M.shell 등)에서
//  쓰이는 화면 번호를 세어 출력한다. 결과로 components.md 의 「쓰는 화면」 칸을 적는다.
// 세는 방식(일부러 단순하게):
//  - 클래스는 HTML 의 class="…" 속성 안에서만 센다(끼워 넣기 ${…} 안은 따옴표 문자열만).
//  - `.a .b` 처럼 여러 클래스가 적힌 선택자는 같은 화면 파일에 모두 있어야 센다(위치 관계는 보지 않음).
//  - 화면 파일이 `M.이름`을 쓰거나 `const { 이름 } = M` 으로 꺼내 부르면, core.js 의 그 구간이 그리는
//    클래스도 그 화면 것으로 센다.
//  - 「원본」 칸에 백틱 선택자가 없으면(설명만) 셀 수 없음 — 손으로 적는다.
// 판정 함수는 순수 함수라 src/shared/lib/part-usage.test.ts 가 검증한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMPONENTS_MD = ".claude/skills/police-ui-design/references/components.md";
const MOCKUP = "docs/mockups/scas-redesign";
const SCREEN_FILE = /^s(\d{2})-.*\.js$/;

const cells = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const WORD = /[A-Za-z_][\w-]*/g;

// 「원본」 칸 → [{ kind: "fn", name }, { kind: "class", classes: [...] }]
export function originTokens(cell) {
  const tokens = [];
  for (const m of cell.matchAll(/`([^`]+)`/g)) {
    const text = m[1].trim();
    if (/^M\.\w+$/.test(text)) {
      tokens.push({ kind: "fn", name: text });
      continue;
    }
    const classes = [...text.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((c) => c[1]);
    if (classes.length > 0) tokens.push({ kind: "class", classes });
  }
  return tokens;
}

// 소스 안의 class="…" 속성에 적힌 클래스 이름 모음.
// 끼워 넣기 ${…} 안에서는 따옴표 문자열 안의 낱말만 클래스로 본다(변수 이름 제외).
export function classesInSource(src) {
  const out = new Set();
  const start = /class=(["'])/g;
  let m;
  while ((m = start.exec(src))) {
    const quote = m[1];
    let i = start.lastIndex;
    let depth = 0;
    let buf = "";
    const limit = i + 2000; // 닫는 따옴표를 못 찾을 때 멈춤
    while (i < src.length && i < limit) {
      const c = src[i];
      if (depth === 0) {
        if (c === quote) break;
        if (c === "$" && src[i + 1] === "{") {
          depth = 1;
          buf += " ";
          i += 2;
          continue;
        }
        buf += c;
        i += 1;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        const end = src.indexOf(c, i + 1);
        if (end < 0) break;
        buf += ` ${src.slice(i + 1, end)} `;
        i = end + 1;
        continue;
      }
      if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      if (depth === 0) buf += " ";
      i += 1;
    }
    start.lastIndex = i + 1;
    for (const w of buf.match(WORD) ?? []) out.add(w);
  }
  return out;
}

// core.js 를 `M.이름 =` 구간으로 나눠 구간마다 그리는 클래스 모음. Map<"M.이름", Set<클래스>>
export function coreHelpers(core) {
  const helpers = new Map();
  let name = null;
  let lines = [];
  const flush = () => {
    if (name) helpers.set(name, classesInSource(lines.join("\n")));
  };
  for (const line of core.split("\n")) {
    const head = line.match(/^\s*M\.(\w+)\s*=/);
    if (head) {
      flush();
      name = `M.${head[1]}`;
      lines = [];
    }
    if (name) lines.push(line);
  }
  flush();
  return helpers;
}

// [0, 1, 2, 4] → "S00–S02 · S04" (3개 이상 이어지면 범위)
export function formatScreens(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  if (sorted.length === 0) return "—";
  const code = (n) => `S${String(n).padStart(2, "0")}`;
  const parts = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
    if (j - i >= 2) parts.push(`${code(sorted[i])}–${code(sorted[j])}`);
    else for (let k = i; k <= j; k += 1) parts.push(code(sorted[k]));
    i = j + 1;
  }
  return parts.join(" · ");
}

// components.md 에서 「부품」·「원본…」 열이 있는 표의 행만 읽는다.
function catalogRows(md) {
  const rows = [];
  let col = null;
  for (const line of md.split("\n")) {
    if (!line.trim().startsWith("|")) {
      col = null;
      continue;
    }
    const row = cells(line);
    const origin = row.findIndex((c) => c.startsWith("원본"));
    if (row.includes("부품") && origin >= 0) {
      col = { part: row.indexOf("부품"), origin };
      continue;
    }
    if (!col || row.every((c) => /^:?-+:?$/.test(c))) continue;
    rows.push({ part: (row[col.part] ?? "").replace(/`/g, "").trim(), origin: row[col.origin] ?? "" });
  }
  return rows;
}

// 화면 소스가 공용 틀 M.이름 을 쓰는가 — `M.이름` 직접, 또는 `const { 이름 } = M` 으로 꺼내 `이름(` 호출.
function usesHelper(src, fullName) {
  const name = fullName.slice(2);
  if (new RegExp(`\\bM\\.${name}\\b`).test(src)) return true;
  const pulled = [...src.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*M\b/g)].some((m) =>
    m[1].split(",").some((n) => n.trim() === name),
  );
  return pulled && new RegExp(`(?<![\\w.])${name}\\s*\\(`).test(src);
}

// screens: { [화면 번호]: 소스 }, core: core.js 소스
export function countPartUsage({ md, screens, core }) {
  const helpers = coreHelpers(core);
  const perScreen = Object.entries(screens).map(([num, src]) => {
    const classes = new Set(classesInSource(src));
    for (const [name, helperClasses] of helpers) {
      if (usesHelper(src, name)) {
        for (const c of helperClasses) classes.add(c);
      }
    }
    return { num: Number(num), src, classes };
  });

  return catalogRows(md).map(({ part, origin }) => {
    const tokens = originTokens(origin);
    const used = perScreen
      .filter(({ src, classes }) =>
        tokens.some((t) =>
          t.kind === "fn" ? usesHelper(src, t.name) : t.classes.every((c) => classes.has(c)),
        ),
      )
      .map(({ num }) => num)
      .sort((a, b) => a - b);
    return { part, origin, screens: used, countable: tokens.length > 0 };
  });
}

function main() {
  const mdPath = path.join(ROOT, COMPONENTS_MD);
  if (!fs.existsSync(mdPath)) {
    console.error(`components.md 없음 — ${COMPONENTS_MD}`);
    process.exit(1);
  }
  const screenDir = path.join(ROOT, MOCKUP, "screens");
  const screens = {};
  for (const name of fs.readdirSync(screenDir)) {
    const m = name.match(SCREEN_FILE);
    if (m) screens[Number(m[1])] = fs.readFileSync(path.join(screenDir, name), "utf8");
  }
  const core = fs.readFileSync(path.join(ROOT, MOCKUP, "assets/core.js"), "utf8");
  const rows = countPartUsage({ md: fs.readFileSync(mdPath, "utf8"), screens, core });

  console.log(`부품 쓰는 화면 (시안 화면 ${Object.keys(screens).length}개 + core.js 공용 틀)`);
  for (const { part, origin, screens: used, countable } of rows) {
    const where = countable ? formatScreens(used) : "셀 수 없음(원본이 설명뿐) — 손으로 적음";
    console.log(`${part}\t${origin}\t${where}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
