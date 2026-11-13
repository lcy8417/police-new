import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mockupCss = fs.readFileSync(
  path.resolve("docs/mockups/scas-redesign/assets/mockup.css"),
  "utf8"
);
const appCss = fs.readFileSync(path.resolve("src/index.css"), "utf8");

// 시안 이름 -> 앱 값 토큰 이름(설계서 §5-2). 시안 --blue-bg 는 앱에 매핑하지 않는다.
const MAP: Record<string, string> = {
  "--bg": "--t-bg",
  "--bg2": "--t-bg-2",
  "--panel": "--t-panel",
  "--panel2": "--t-panel-2",
  "--panel3": "--t-panel-3",
  "--strip": "--t-strip",
  "--line": "--t-line",
  "--line2": "--t-line-2",
  "--line3": "--t-line-3",
  "--fg": "--t-fg",
  "--fg2": "--t-fg-2",
  "--mute": "--t-mute",
  "--dim": "--t-dim",
  "--faint": "--t-faint",
  "--blue": "--t-brand",
  "--blue2": "--t-brand-2",
  "--blue3": "--t-brand-3",
  "--teal": "--t-ai",
  "--teal-bg": "--t-ai-bg",
  "--red": "--t-danger",
  "--red-bg": "--t-danger-bg",
  "--green": "--t-ok",
  "--green-bg": "--t-ok-bg",
  "--amber": "--t-warn",
  "--amber-bg": "--t-warn-bg",
  "--violet": "--t-violet",
  "--violet-bg": "--t-violet-bg",
};

// 블록(:root 등) 안의 `--이름: 값;` 을 사전으로. 첫 번째 일치하는 블록만 쓴다.
function declsOf(css: string, selector: RegExp): Record<string, string> {
  const m = css.match(selector);
  if (!m) throw new Error(`블록 없음: ${selector}`);
  const out: Record<string, string> = {};
  for (const d of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  return out;
}

describe("토큰 대응표", () => {
  it("시안 앱용 값은 모두 --t-*로 1:1", () => {
    const mock = declsOf(mockupCss, /:root\s*\{([\s\S]*?)\n\}/);
    const app = declsOf(appCss, /:root\s*\{([\s\S]*?)\n\}/);
    for (const [from, to] of Object.entries(MAP)) {
      expect(mock[from], `시안 ${from}`).toBeDefined();
      expect(app[to], `앱 ${to}`).toBe(mock[from]);
    }
    expect(app["--t-select"]).toBe("#16233b");
  });

  it("시안 전용 토큰은 앱에 없다", () => {
    expect(appCss).not.toMatch(/--k-/);
    expect(appCss).not.toMatch(/--s-/);
  });

  it("기존 이름 뜻 유지", () => {
    const dark = declsOf(appCss, /\.dark\s*\{([\s\S]*?)\n\}/);
    expect(dark["--accent"]).toBe("var(--t-select)");
  });
});
