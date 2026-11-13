// 부품 목록 검사(설계서 §9).
//  ① components.md 표에서 「상태」가 구현됨·검증됨인 행의 「파일」 경로가 실제로 있는가
//  ② 4개 출입구 index.ts 의 모든 "값" export 이름(export type 제외)이 표의 「부품」 열에 있는가
//  ③ python3 .claude/hooks/parts_gate.py --check-all 종료 코드 0
// 하나라도 어기면 종료 코드 1.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMPONENTS_MD = ".claude/skills/police-ui-design/references/components.md";
const HOOK = ".claude/hooks/parts_gate.py";
const ENTRANCES = ["kit", "viewer", "ai", "panel"].map((n) => `src/shared/ui/${n}/index.ts`);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const mdPath = path.join(ROOT, COMPONENTS_MD);
if (!fs.existsSync(mdPath)) fail(`components.md 없음 — ${COMPONENTS_MD} (Task 10에서 만듦)`);
if (!fs.existsSync(path.join(ROOT, HOOK))) fail(`parts_gate.py 없음 — ${HOOK} (Task 9에서 만듦)`);

const problems = [];

// 표 파싱: 머리줄에 「부품」「상태」「파일」 열이 있는 표만 본다.
const cells = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const clean = (s) => s.replace(/`/g, "").trim();

const partNames = new Set();
let col = null;
for (const line of fs.readFileSync(mdPath, "utf8").split("\n")) {
  if (!line.trim().startsWith("|")) {
    col = null;
    continue;
  }
  const row = cells(line);
  if (row.includes("부품") && row.includes("상태") && row.includes("파일")) {
    col = { part: row.indexOf("부품"), status: row.indexOf("상태"), file: row.indexOf("파일") };
    continue;
  }
  if (!col || row.every((c) => /^:?-+:?$/.test(c))) continue;

  for (const name of clean(row[col.part] ?? "").match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []) partNames.add(name);

  const status = clean(row[col.status] ?? "");
  if (status === "구현됨" || status === "검증됨") {
    const file = clean(row[col.file] ?? "");
    if (!file || !fs.existsSync(path.join(ROOT, file))) {
      problems.push(`표의 파일 없음: ${clean(row[col.part] ?? "")} → ${file || "(빈칸)"}`);
    }
  }
}

// 출입구 값 export 이름 모으기(주석 제거 → `export { … } from` 의 type 항목·`export type {` 는 건너뜀).
function valueExports(src) {
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

for (const rel of ENTRANCES) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    problems.push(`출입구 없음: ${rel}`);
    continue;
  }
  for (const name of valueExports(fs.readFileSync(p, "utf8"))) {
    if (!partNames.has(name)) problems.push(`${rel}: export「${name}」이 표의 「부품」 열에 없음`);
  }
}

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
