// hex 색 파일 단위 검사(설계서 §5-4·§9).
//   node scripts/ui/count-hex.mjs          검사: 전환 완료 목록은 0, 기준 있는 파일은 기준 이하, 새 파일은 0
//   node scripts/ui/count-hex.mjs --write  현재 수를 scripts/ui/hex-baseline.json 에 기록(기준 뜨기)
// 대상: src/**/*.{ts,tsx,js,jsx,css} (src/index.css = 토큰 정의는 제외).
// 정규식·`// hex-ok` 규칙은 src/shared/lib/hex-count.ts 와 같아야 한다(.mjs 는 .ts 를 직접 못 읽어 복제).
// 두 구현이 같은지는 src/shared/lib/hex-count.test.ts 가 지킨다 — 바꾸면 둘 다 고칠 것.
//
// 참고 — check:ui 는 Playwright 를 갱신 플래그 없이 돌린다(parts-compare 가 -u 에서 일부러 실패).
// 시각 기준 갱신은 범위를 좁혀서: npx playwright test -c playwright.ui.config.ts mockup-snap -u
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT_DIR = path.join(ROOT, "scripts/ui");
const BASELINE_PATH = path.join(SCRIPT_DIR, "hex-baseline.json");
const CONVERTED_PATH = path.join(SCRIPT_DIR, "ui-converted.txt");
const EXCLUDED = new Set(["src/index.css"]);
const EXT = /\.(?:ts|tsx|js|jsx|css)$/;

export const HEX_PATTERN = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const HEX_OK_SUFFIX = /\/\/\s*hex-ok\s*$/;

export function countHex(source) {
  let total = 0;
  for (const line of source.split("\n")) {
    if (HEX_OK_SUFFIX.test(line)) continue;
    total += line.match(HEX_PATTERN)?.length ?? 0;
  }
  return total;
}

// glob → 정규식: `**/` 는 폴더 0개 이상, `**` 는 슬래시 포함 전부, `*` 는 슬래시 제외, `?` 는 한 글자.
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.test(entry.name)) out.push(path.relative(ROOT, full).split(path.sep).join("/"));
  }
}

function collectCounts() {
  const files = [];
  walk(path.join(ROOT, "src"), files);
  const counts = {};
  for (const file of files.sort()) {
    if (EXCLUDED.has(file)) continue;
    const n = countHex(fs.readFileSync(path.join(ROOT, file), "utf8"));
    if (n > 0) counts[file] = n;
  }
  return counts;
}

function loadConvertedGlobs() {
  if (!fs.existsSync(CONVERTED_PATH)) return [];
  return fs
    .readFileSync(CONVERTED_PATH, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map(globToRegExp);
}

function main() {
  const counts = collectCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (process.argv.includes("--write")) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(counts, null, 2) + "\n");
    console.log(`hex 기준 기록: 파일 ${Object.keys(counts).length}개, 합계 ${total}곳 → scripts/ui/hex-baseline.json`);
    return;
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error("hex-baseline.json 없음 — npm run check:ui:baseline 으로 먼저 기준을 뜨세요");
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const converted = loadConvertedGlobs();
  const problems = [];

  for (const [file, n] of Object.entries(counts)) {
    if (converted.some((re) => re.test(file))) {
      problems.push(`${file}: hex ${n}곳 — 전환 완료 파일은 0이어야 합니다`);
    } else if (!(file in baseline)) {
      problems.push(`${file}: hex ${n}곳 — 새 파일은 0이어야 합니다(토큰을 쓰세요)`);
    } else if (n > baseline[file]) {
      problems.push(`${file}: hex ${n}곳 — 기준 ${baseline[file]}곳보다 늘었습니다`);
    }
  }

  if (problems.length > 0) {
    console.error(`hex 검사 실패 (${problems.length}건):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`hex 검사 통과: 파일 ${Object.keys(counts).length}개, 합계 ${total}곳`);
}

// 직접 실행할 때만 돈다(vitest 가 import 해서 countHex·HEX_PATTERN 만 쓸 수 있게).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
