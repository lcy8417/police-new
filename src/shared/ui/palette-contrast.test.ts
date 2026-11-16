import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// 시안 r3 팔레트(설계서 §14-1·2) 자동 대비 검사.
// src/index.css 의 `[data-theme="…"]` 블록에서 값 토큰 `--t-*` 를 읽어 WCAG 대비 비율을 계산한다.
// 밝은 팔레트 3종: 본문 글자 · 상태 칩 글자 AA(4.5:1) 이상. 상태 의미 색은 다크(:root)와 같은 색상 계열.
const appCss = fs.readFileSync(path.resolve("src/index.css"), "utf8");

const LIGHT_THEMES = ["scas-light", "light-contrast", "light-soft"] as const;

function declsOf(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of block.matchAll(/(--t-[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  return out;
}

function rootTokens(): Record<string, string> {
  const m = appCss.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!m) throw new Error(":root 블록 없음");
  return declsOf(m[1]);
}

// 팔레트 토큰 = :root 값 위에 그 팔레트 블록 값을 덮은 것(브라우저 상속과 같은 결과)
function themeTokens(name: string): Record<string, string> {
  const re = new RegExp(`\\[data-theme="${name}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
  const blocks = [...appCss.matchAll(re)];
  if (blocks.length === 0) throw new Error(`[data-theme="${name}"] 블록 없음`);
  return Object.assign({}, rootTokens(), ...blocks.map((b) => declsOf(b[1])));
}

function rgbOf(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`#rrggbb 가 아님: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function hue(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

// 주요 버튼 글자(Button pri `text-white`)
const WHITE = "#ffffff"; // hex-ok

// [글자 토큰, 바탕 토큰, 최소 대비]. 바탕에 WHITE 를 쓰면 흰색.
type Pair = readonly [string, string, number];

// 본문 글자: 화면 코드가 많이 쓰는 글자색(text-foreground · fg-2 · muted-foreground · dim) × 바탕
const BODY_PAIRS: Pair[] = [
  ...["--t-bg", "--t-bg-2", "--t-panel", "--t-panel-2", "--t-panel-3", "--t-strip", "--t-select", "--t-brand-bg"].map(
    (bg) => ["--t-fg", bg, 4.5] as const,
  ),
  ...["--t-bg", "--t-bg-2", "--t-panel", "--t-panel-2", "--t-panel-3", "--t-strip"].flatMap((bg) => [
    ["--t-fg-2", bg, 4.5] as const,
    ["--t-mute", bg, 4.5] as const,
    ["--t-dim", bg, 4.5] as const,
  ]),
  // 흐린 글자(faint)는 꼬리표 · 닫기 표시 같은 보조 글자 — 큰 글자 기준 3:1
  ["--t-faint", "--t-panel", 3],
  ["--t-faint", "--t-strip", 3],
];

// 상태 칩 · 버튼 글자(Chip · Button 변형의 글자/바탕 짝) + 패널 위 상태 글자
const STATUS_PAIRS: Pair[] = [
  ["--t-brand", "--t-brand-bg", 4.5],
  ["--t-ai", "--t-ai-bg", 4.5],
  ["--t-ai", "--t-ai-bg-deep", 4.5],
  ["--t-ok-fg", "--t-ok-bg", 4.5],
  ["--t-ok", "--t-ok-bg", 4.5],
  ["--t-warn", "--t-warn-bg", 4.5],
  ["--t-danger-fg", "--t-danger-bg", 4.5],
  ["--t-danger", "--t-danger-bg", 4.5],
  ["--t-violet", "--t-violet-bg", 4.5],
  ["--t-warn", "--t-panel-2", 4.5],
  ...["--t-panel", "--t-panel-2", "--t-bg"].flatMap((bg) =>
    ["--t-brand", "--t-brand-2", "--t-ai", "--t-ok", "--t-ok-fg", "--t-warn", "--t-danger", "--t-danger-fg", "--t-violet"].map(
      (fg) => [fg, bg, 4.5] as const,
    ),
  ),
  [WHITE, "--t-brand-3", 4.5],
];

function check(tokens: Record<string, string>, pairs: Pair[]) {
  const value = (name: string) => (name.startsWith("--") ? tokens[name] : name);
  return pairs
    .map(([fg, bg, min]) => ({ pair: `${fg} / ${bg}`, ratio: contrast(value(fg), value(bg)), min }))
    .filter((r) => r.ratio < r.min)
    .map((r) => `${r.pair} = ${r.ratio.toFixed(2)} (< ${r.min})`);
}

describe.each(LIGHT_THEMES)("밝은 팔레트 %s", (name) => {
  const tokens = themeTokens(name);

  it("본문 글자 대비 AA", () => {
    expect(check(tokens, BODY_PAIRS)).toEqual([]);
  });

  it("상태 칩 · 버튼 글자 대비 AA", () => {
    expect(check(tokens, STATUS_PAIRS)).toEqual([]);
  });

  it("상태 의미 색은 다크와 같은 색상 계열(색상각 30° 이내)", () => {
    const root = rootTokens();
    const far = ["--t-brand", "--t-ai", "--t-ok", "--t-warn", "--t-danger", "--t-violet"]
      .map((t) => {
        const d = Math.abs(hue(tokens[t]) - hue(root[t]));
        return { t, diff: Math.min(d, 360 - d) };
      })
      .filter((r) => r.diff > 30)
      .map((r) => `${r.t} 색상각 차이 ${r.diff.toFixed(0)}°`);
    expect(far).toEqual([]);
  });

  it("바탕은 밝다(흰 바탕 계열: 바탕 · 패널 상대 휘도 0.75 이상)", () => {
    for (const t of ["--t-bg", "--t-bg-2", "--t-panel", "--t-panel-2", "--t-strip"]) {
      expect(luminance(tokens[t]), t).toBeGreaterThan(0.75);
    }
  });
});

describe("팔레트 블록 구성", () => {
  it("밝은 팔레트는 :root 의 색 토큰(#rrggbb)을 모두 다시 정의한다(빠진 토큰이 다크 값으로 새지 않게)", () => {
    const root = rootTokens();
    const hexNames = Object.keys(root).filter((n) => /^#[0-9a-f]{6}$/i.test(root[n]));
    for (const name of LIGHT_THEMES) {
      // 같은 이름이 선택자 목록 끝에 오는 공통 블록도 있으므로 그 이름의 블록을 모두 합친다
      const re = new RegExp(`\\[data-theme="${name}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
      const own = Object.assign({}, ...[...appCss.matchAll(re)].map((b) => declsOf(b[1])));
      expect(hexNames.filter((n) => !(n in own)), name).toEqual([]);
    }
  });

  it("dark 팔레트는 값 토큰을 다시 정의하지 않는다(= :root 의 r3 시안 값 그대로)", () => {
    const m = appCss.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
    expect(m, '[data-theme="dark"] 블록').not.toBeNull();
    expect(Object.keys(declsOf(m![1]))).toEqual([]);
  });

  it("대비 계산 확인(흰 · 검정 21:1)", () => {
    expect(contrast("#000000", WHITE)).toBeCloseTo(21, 5); // hex-ok
  });
});
