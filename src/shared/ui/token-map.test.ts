import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mockupCss = fs.readFileSync(
  path.resolve("docs/mockups/scas-redesign/assets/mockup.css"),
  "utf8"
);
const appCss = fs.readFileSync(path.resolve("src/index.css"), "utf8");

// 시안 이름 -> 앱 값 토큰 이름(설계서 §5-2). --blue-bg 는 칩 blue 배경이라 --t-brand-bg 로 매핑(R3b).
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
  "--blue-bg": "--t-brand-bg",
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

// 앱 :root 값 = 선택자 목록에 :root 가 든 블록을 모두 합친 것(r3: 값 토큰 블록은 `:root, [data-theme="dark"]`)
function appRootDecls(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of appCss.matchAll(/(?:^|\n)([^{}\n]*:root[^{}]*)\{([\s\S]*?)\n\}/g)) {
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

describe("토큰 대응표", () => {
  it("시안 앱용 값은 모두 --t-*로 1:1", () => {
    const mock = declsOf(mockupCss, /:root\s*\{([\s\S]*?)\n\}/);
    const app = appRootDecls();
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

// 이 브랜치 이전(d6987ae)부터 @theme 에 있던 shadcn 색 역할. 이 이름들은 shadcn 변수를 그대로 가리킨다.
const SHADCN_COLOR_ROLES = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
];

describe("@theme 역할(기존 화면 변화 0 — 설계서 §12-2)", () => {
  const theme = declsOf(appCss, /@theme inline\s*\{([\s\S]*?)\n\}/);

  it("새로 더한 --color-* 역할은 모두 값 토큰 var(--t-*) 를 가리킨다", () => {
    const added = Object.entries(theme).filter(
      ([name]) => name.startsWith("--color-") && !SHADCN_COLOR_ROLES.includes(name.slice("--color-".length))
    );
    expect(added.length).toBeGreaterThan(0);
    for (const [name, value] of added) expect(value, name).toMatch(/^var\(--t-[\w-]+\)$/);
  });

  it("기존 shadcn 색 역할은 같은 이름의 shadcn 변수를 그대로 가리킨다", () => {
    for (const role of SHADCN_COLOR_ROLES) expect(theme[`--color-${role}`], role).toBe(`var(--${role})`);
  });

  it("Tailwind 기본 글꼴 이름(--font-mono · --font-sans · --font-serif)을 덮어쓰지 않는다", () => {
    // 덮어쓰면 기존 화면의 font-mono · font-sans 글자가 모두 바뀐다(최종 검토 C1).
    for (const name of ["--font-mono", "--font-sans", "--font-serif"]) expect(theme[name], name).toBeUndefined();
  });

  it("부품 글꼴 역할 font-ui · font-code 는 시안 --font-ui · --font-mono 와 같은 글꼴 목록", () => {
    // r3(설계서 §14-3): 역할은 범위 변수 --t-font-* 를 가리키고, :root 기본값이 시안 목록 그대로다.
    const mock = declsOf(mockupCss, /:root\s*\{([\s\S]*?)\n\}/);
    const root = appRootDecls();
    expect(theme["--font-ui"]).toBe("var(--t-font-ui)");
    expect(theme["--font-code"]).toBe("var(--t-font-code)");
    expect(root["--t-font-ui"]).toBe(mock["--font-ui"]);
    expect(root["--t-font-code"]).toBe(mock["--font-mono"]);
  });
});
