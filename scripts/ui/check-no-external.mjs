// 외부 주소 검사(내부망 대응 — police-server/docs/operations/airgap-audit.md).
// 운영 환경(경찰 내부망)은 인터넷이 없다. 화면이 실행 중 외부 주소(Google Fonts · CDN · 분석 등)를 부르면
// 그 기능이 조용히 깨지므로, 배포에 들어가는 파일에 외부 http(s) 주소가 있으면 실패한다.
//
// 보는 곳:
//   - 소스: index.html · public/** · src/**(테스트 파일 *.test.* · *.spec.* · src/test/** 와 글꼴 라이선스 OFL.txt 제외)
//   - 빌드 결과: dist/**(--dist 를 줄 때만. dist 가 없으면 실패 — 먼저 npm run build)
// 그림 · 글꼴 같은 바이너리(.png .jpg .woff2 …)는 보지 않는다(브라우저가 그 안의 주소를 부르지 않음 — 예 PNG 의 XMP 메타데이터).
// SVG 는 글자 파일이라 본다.
//
// 허용(실제로 접속하지 않는 글자) — 목록에 없는 외부 주소는 모두 실패:
//   - 어디서나: XML 이름공간(http://www.w3.org/…), 자기 PC(localhost · 127.0.0.1)
//   - dist 에서만(라이브러리가 넣은 안내 문구 · 라이선스 주석 — 화면이 이 주소로 요청하지 않음):
//       React 오류 안내(https://react.dev/errors/), React Router 안내(https://reactrouter.com/…),
//       React Router 의 IE11 안내(https://github.com/ungap/url-search-params), Tailwind 라이선스 주석(https://tailwindcss.com)
//   새 라이브러리가 안내 문구로 주소를 넣으면, 그 코드가 실제로 요청하지 않는지 확인한 뒤에만 DIST_ONLY_ALLOWED 에 더한다.
//
// 사용: node scripts/ui/check-no-external.mjs          (소스만 — check:ui:static 에 포함)
//       node scripts/ui/check-no-external.mjs --dist   (소스 + dist — npm run build 뒤 postbuild 로 자동 실행)
// 판정 로직(findExternalUrls)은 순수 함수라 src/shared/lib/no-external.test.ts 가 검증한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** 주소로 보는 글자: http(s):// 로 시작하는 덩어리 + CSS · HTML 의 프로토콜 생략 주소(url(//… · src="//… · href="//…). */
const URL_RE = /https?:\/\/[^\s"'`()<>\\]+/g;
const PROTOCOL_RELATIVE_RE = /(?:url\(\s*["']?|(?:src|href)\s*=\s*["'])(\/\/[^\s"'`()<>\\]+)/gi;

/** 어디서나 허용(접속하지 않음). */
const ALWAYS_ALLOWED = [
  /^http:\/\/www\.w3\.org\//, // XML 이름공간(svg · xlink · MathML)
  /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/, // 자기 PC
];

/** dist 에서만 허용 — 라이브러리 안내 문구 · 라이선스 주석(위 머리말 참고). */
const DIST_ONLY_ALLOWED = [
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/reactrouter\.com\//,
  /^https:\/\/github\.com\/ungap\/url-search-params/,
  /^https:\/\/tailwindcss\.com\/?$/,
];

const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".mp4", ".webm", ".pdf", ".zip",
]);

/** 검사에서 빼는 소스 파일(배포에 안 들어가거나 라이선스 문서). */
export function isExcludedSource(rel) {
  const p = rel.split(path.sep).join("/");
  if (/(^|\/)(OFL|LICENSE|license)(\.[a-z]+)?$/.test(p)) return true;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(p)) return true;
  if (p.startsWith("src/test/")) return true;
  return false;
}

/**
 * 글자에서 허용되지 않은 외부 주소를 찾는다.
 * @param {{ text: string, scope: "source" | "dist" }} args
 * @returns {{ url: string, line: number }[]}
 */
export function findExternalUrls({ text, scope }) {
  const allowed = scope === "dist" ? [...ALWAYS_ALLOWED, ...DIST_ONLY_ALLOWED] : ALWAYS_ALLOWED;
  const found = [];
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;]+$/, "");
    if (allowed.some((re) => re.test(url))) continue;
    found.push({ url, line: lineOf(m.index ?? 0) });
  }
  for (const m of text.matchAll(PROTOCOL_RELATIVE_RE)) {
    found.push({ url: m[1], line: lineOf(m.index ?? 0) });
  }
  return found;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function scanFiles(files, scope, problems) {
  for (const full of files) {
    if (BINARY_EXT.has(path.extname(full).toLowerCase())) continue;
    const rel = path.relative(ROOT, full);
    if (scope === "source" && isExcludedSource(rel)) continue;
    const text = fs.readFileSync(full, "utf8");
    for (const { url, line } of findExternalUrls({ text, scope })) {
      problems.push(`${rel}:${line}  ${url.length > 120 ? `${url.slice(0, 120)}…` : url}`);
    }
  }
}

function main() {
  const withDist = process.argv.includes("--dist");
  const problems = [];
  const sources = [
    path.join(ROOT, "index.html"),
    ...walk(path.join(ROOT, "public")),
    ...walk(path.join(ROOT, "src")),
  ];
  scanFiles(sources, "source", problems);
  if (withDist) {
    const dist = path.join(ROOT, "dist");
    if (!fs.existsSync(dist)) {
      console.error("외부 주소 검사: dist 없음 — 먼저 npm run build");
      process.exit(1);
    }
    scanFiles(walk(dist), "dist", problems);
  }
  if (problems.length > 0) {
    console.error(`외부 주소 검사 실패 (${problems.length}건) — 내부망에서는 외부 주소를 부를 수 없다. 파일을 저장소에 넣어 상대 경로로:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`외부 주소 검사 통과(${withDist ? "소스 + dist" : "소스"})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
