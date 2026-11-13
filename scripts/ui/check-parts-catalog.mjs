// 부품 목록 검사(설계서 §9).
//  ① components.md 표에서 「상태」가 구현됨·검증됨인 행의 「파일」 경로가 실제로 있는가
//  ② 4개 출입구 index.ts 의 모든 "값" export 이름(export type 제외)이 표의 「부품」 열에 있는가
//  ③ python3 .claude/hooks/parts_gate.py --check-all 종료 코드 0
// 표를 못 찾거나 「상태」가 후보·구현됨·검증됨이 아니면 실패. 하나라도 어기면 종료 코드 1.
// 판정 로직(checkCatalog)은 순수 함수라 src/shared/lib/parts-catalog.test.ts 가 검증한다.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMPONENTS_MD = ".claude/skills/police-ui-design/references/components.md";
const HOOK = ".claude/hooks/parts_gate.py";
const ENTRANCES = ["kit", "viewer", "ai", "panel"].map((n) => `src/shared/ui/${n}/index.ts`);
const STATUSES = ["후보", "구현됨", "검증됨"];

const cells = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const clean = (s) => s.replace(/`/g, "").trim();

// 표 파싱: 머리줄에 「부품」「상태」「파일」 열이 있는 표만 본다.
export function parseCatalog(md) {
  const rows = [];
  let tableFound = false;
  let col = null;
  for (const line of md.split("\n")) {
    if (!line.trim().startsWith("|")) {
      col = null;
      continue;
    }
    const row = cells(line);
    if (row.includes("부품") && row.includes("상태") && row.includes("파일")) {
      col = { part: row.indexOf("부품"), status: row.indexOf("상태"), file: row.indexOf("파일") };
      tableFound = true;
      continue;
    }
    if (!col || row.every((c) => /^:?-+:?$/.test(c))) continue;
    rows.push({
      part: clean(row[col.part] ?? ""),
      status: clean(row[col.status] ?? ""),
      file: clean(row[col.file] ?? ""),
    });
  }
  return { tableFound, rows };
}

// 출입구 값 export 이름 모으기(주석 제거 → `export { … } from` 의 type 항목·`export type {` 는 건너뜀).
export function valueExports(src) {
  const text = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const names = [];
  for (const m of text.matchAll(/export\s*(type\s*)?\{([^}]*)\}/g)) {
    if (m[1]) continue;
    for (const raw of m[2].split(",")) {
      const item = raw.trim();
      if (!item || /^type\s/.test(item)) continue;
      const alias = item.split(/\s+as\s+/);
      names.push(alias[alias.length - 1].trim());
    }
  }
  for (const m of text.matchAll(/export\s+(?:const|function|class|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) names.push(m[1]);
  return names;
}

// entranceSources: { "<index.ts 경로>": 소스 문자열 | null(파일 없음) }, fileExists: (상대경로) => boolean
export function checkCatalog({ md, entranceSources, fileExists }) {
  const { tableFound, rows } = parseCatalog(md);
  if (!tableFound) return ["부품 표를 찾지 못함 — components.md"];

  const problems = [];
  const partNames = new Set();
  for (const { part, status, file } of rows) {
    for (const name of part.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []) partNames.add(name);
    if (!STATUSES.includes(status)) {
      problems.push(`알 수 없는 상태 "${status}" (${part})`);
    } else if (status !== "후보" && (!file || !fileExists(file))) {
      problems.push(`표의 파일 없음: ${part} → ${file || "(빈칸)"}`);
    }
  }

  for (const [rel, src] of Object.entries(entranceSources)) {
    if (src == null) {
      problems.push(`출입구 없음: ${rel}`);
      continue;
    }
    for (const name of valueExports(src)) {
      if (!partNames.has(name)) problems.push(`${rel}: export「${name}」이 표의 「부품」 열에 없음`);
    }
  }
  return problems;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function main() {
  const mdPath = path.join(ROOT, COMPONENTS_MD);
  if (!fs.existsSync(mdPath)) fail(`components.md 없음 — ${COMPONENTS_MD} (Task 10에서 만듦)`);
  if (!fs.existsSync(path.join(ROOT, HOOK))) fail(`parts_gate.py 없음 — ${HOOK} (Task 9에서 만듦)`);

  const entranceSources = {};
  for (const rel of ENTRANCES) {
    const p = path.join(ROOT, rel);
    entranceSources[rel] = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  }
  const problems = checkCatalog({
    md: fs.readFileSync(mdPath, "utf8"),
    entranceSources,
    fileExists: (rel) => fs.existsSync(path.join(ROOT, rel)),
  });

  const gate = spawnSync("python3", [HOOK, "--check-all"], { cwd: ROOT, encoding: "utf8" });
  if (gate.status !== 0) {
    problems.push(`parts_gate.py --check-all 실패(종료 코드 ${gate.status})`);
    if (gate.stdout) console.error(gate.stdout.trimEnd());
    if (gate.stderr) console.error(gate.stderr.trimEnd());
  }

  if (problems.length > 0) {
    console.error(`부품 목록 검사 실패 (${problems.length}건):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log("부품 목록 검사 통과");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
