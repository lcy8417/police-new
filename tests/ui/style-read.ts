import type { Locator } from "@playwright/test";

// 시안 요소 ↔ 구현 요소의 계산된 스타일(computed style)을 읽고 비교하는 도구(설계서 §9).
// 요소 자신 + 자식 요소 전부(문서 순서, 트리로) + ::before · ::after 를 읽는다.

/** 요소 하나의 계산값 묶음. 자식은 문서 순서. */
export type StyleSnapshot = {
  tag: string;
  props: Record<string, string>;
  pseudo: { before: Record<string, string>; after: Record<string, string> };
  children: StyleSnapshot[];
};

/** 읽는 속성(브리프 목록 그대로). */
export const STYLE_PROPS: readonly string[] = [
  "color",
  "background-color",
  "background-image",
  ...["top", "right", "bottom", "left"].flatMap((side) =>
    ["color", "width", "style"].map((k) => `border-${side}-${k}`)
  ),
  ...["top-left", "top-right", "bottom-right", "bottom-left"].map(
    (corner) => `border-${corner}-radius`
  ),
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "width",
  "height",
  "box-shadow",
  "opacity",
  "gap",
  "text-transform",
  "content",
  // 위치 · 빛번짐(R24): 모서리 장식(::before/::after)의 위치와 drop-shadow 를 지킨다.
  "filter",
  "position",
  "top",
  "right",
  "bottom",
  "left",
];

/** px 비교 허용 오차(설계서 §9 · R5). */
const PX_TOLERANCE = 0.01;
/** 부동소수 오차(4.02 − 4.01 이 0.0100000002 로 나오는 경우)를 흡수하는 여유. */
const EPSILON = 1e-9;

/**
 * 요소와 그 자식 전부의 계산값을 읽는다. 숫자 px 값은 소수 2자리로 반올림한다.
 * ::before · ::after 는 content 가 none/normal 이면(그려지지 않음) `{ content }` 만 담는다 —
 * 그리지 않는 가상 요소의 나머지 값은 비교 소음이기 때문.
 */
export async function readStyle(locator: Locator): Promise<StyleSnapshot> {
  return locator.evaluate((root, props) => {
    const round = (value: string) =>
      value.replace(/(-?\d*\.?\d+(?:e[-+]?\d+)?)px/gi, (_m, num: string) => {
        const r = Math.round(Number(num) * 100) / 100;
        return `${Object.is(r, -0) ? 0 : r}px`;
      });
    const pick = (style: CSSStyleDeclaration) =>
      Object.fromEntries(props.map((p) => [p, round(style.getPropertyValue(p).trim())]));
    const pseudo = (el: Element, which: "::before" | "::after") => {
      const style = getComputedStyle(el, which);
      const content = style.getPropertyValue("content").trim();
      if (content === "none" || content === "normal") return { content };
      return pick(style);
    };
    type Snap = {
      tag: string;
      props: Record<string, string>;
      pseudo: { before: Record<string, string>; after: Record<string, string> };
      children: Snap[];
    };
    const walk = (el: Element): Snap => ({
      tag: el.tagName.toLowerCase(),
      props: pick(getComputedStyle(el)),
      pseudo: { before: pseudo(el, "::before"), after: pseudo(el, "::after") },
      children: Array.from(el.children).map(walk),
    });
    return walk(root);
  }, STYLE_PROPS as string[]);
}

const PX_NUMBER = /(-?\d*\.?\d+(?:e[-+]?\d+)?)px/gi;

/** 두 계산값이 같은가: px 숫자는 0.01 이내면 같음, 나머지 글자는 정확히 같아야 한다. */
function sameValue(a: string, b: string): boolean {
  if (a === b) return true;
  const shapeA = a.replace(PX_NUMBER, "#px");
  const shapeB = b.replace(PX_NUMBER, "#px");
  if (shapeA !== shapeB) return false;
  const numsA = [...a.matchAll(PX_NUMBER)].map((m) => Number(m[1]));
  const numsB = [...b.matchAll(PX_NUMBER)].map((m) => Number(m[1]));
  if (numsA.length === 0) return false;
  return numsA.every((n, i) => Math.abs(n - numsB[i]) <= PX_TOLERANCE + EPSILON);
}

function diffProps(
  a: Record<string, string>,
  b: Record<string, string>,
  path: string
): string[] {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const out: string[] = [];
  for (const key of keys) {
    const va = a[key] ?? "(없음)";
    const vb = b[key] ?? "(없음)";
    if (!sameValue(va, vb)) out.push(`${path} ${key}: 시안=${va} 구현=${vb}`);
  }
  return out;
}

/**
 * 시안(a) ↔ 구현(b) 차이를 한 줄씩 돌려준다: `"<경로> <속성>: 시안=<값> 구현=<값>"`.
 * 경로는 `button > span[0]`(자식 순번) · `button::after` 꼴. 같으면 `[]`.
 */
export function diffStyle(a: StyleSnapshot, b: StyleSnapshot, path?: string): string[] {
  const here = path ?? a.tag;
  const out: string[] = [];
  if (a.tag !== b.tag) out.push(`${here} tag: 시안=${a.tag} 구현=${b.tag}`);
  out.push(...diffProps(a.props, b.props, here));
  out.push(...diffProps(a.pseudo.before, b.pseudo.before, `${here}::before`));
  out.push(...diffProps(a.pseudo.after, b.pseudo.after, `${here}::after`));
  if (a.children.length !== b.children.length) {
    out.push(`${here} 자식 수: 시안=${a.children.length} 구현=${b.children.length}`);
  }
  const common = Math.min(a.children.length, b.children.length);
  for (let i = 0; i < common; i += 1) {
    out.push(...diffStyle(a.children[i], b.children[i], `${here} > ${a.children[i].tag}[${i}]`));
  }
  return out;
}

/** 입력칸 대조용 정규화에서 앱 쪽 자식 중 빼는 태그: 진짜 입력(시안은 글자를 span 안에 직접 씀), 돋보기 아이콘(시안은 글자 ⌕). */
const CONTROL_DROP_TAGS = new Set(["input", "svg"]);

/**
 * 폼 입력칸(Field) 대조용 정규화(R18). 시안 `.inp` 는 span 에 글자를 직접 쓴 모양이라 앱의 `<input>` 과 다음 두 점만 구조상 다르다:
 * 루트 태그, 그리고 앱 쪽 `<input>`(· 돋보기 svg) 자식. 이 둘만 덮는다.
 * - 루트 태그: 둘 다 "control" 로 통일.
 * - 앱(`side: "app"`): `<input>` · `<svg>` 자식을 뺀다. 자식을 가진 span(`after` 묶음)은 풀어 그 자식(칩)을 시안 자식과 같은 층에 놓는다.
 * 나머지(루트 계산값 · ::before/::after · 캐럿 · 칩 등 자식 계산값과 수)는 diffStyle 이 그대로 비교한다.
 */
export function normalizeControl(snap: StyleSnapshot, side: "mockup" | "app"): StyleSnapshot {
  const flatten = (children: StyleSnapshot[]): StyleSnapshot[] =>
    children.flatMap((child) => {
      if (side !== "app") return [child];
      if (CONTROL_DROP_TAGS.has(child.tag)) return [];
      if (child.tag === "span" && child.children.length > 0) return flatten(child.children);
      return [child];
    });
  return { ...snap, tag: "control", children: flatten(snap.children) };
}

/** 컨테이너 대조에서 제외할 크기 속성(내용 크기로 정해지는 자리). */
export type ShellIgnore = "width" | "height";

/**
 * 컨테이너 부품(Panel · ButtonBar) 대조용 정규화(Task 7). 컨테이너의 안쪽 내용(데이터 표 · 라디오 · 분할 버튼 같은 부품이 아닌
 * 시안 조각)은 부품이 소유하지 않으므로 대조 대상이 아니다. 남기는 것:
 * - 루트의 자기 계산값 + ::before/::after (단 `ignoreSize` 로 지정한 width/height 는 내용 크기라 뺀다)
 * - `head: true` 이면 첫 자식(머리: 시안 `.panel-h` ↔ 앱 `<header>`)의 자기 계산값(태그는 header 로 통일)과, 머리의 첫 자식(제목:
 *   시안 span.t ↔ 앱 h2, 태그는 title 로 통일)의 자기 계산값. 제목 안쪽과 머리의 나머지 자식은 뺀다.
 * 나머지 자식은 모두 뺀다. 자식 수 · 계산값은 한쪽이라도 어긋나면 diffStyle 이 그대로 잡는다(루트 · 머리 · 가상요소).
 */
export function normalizeShell(
  snap: StyleSnapshot,
  opts: { head?: boolean; ignoreSize?: readonly ShellIgnore[] } = {}
): StyleSnapshot {
  const props = { ...snap.props };
  const before = { ...snap.pseudo.before };
  const after = { ...snap.pseudo.after };
  for (const key of opts.ignoreSize ?? []) {
    delete props[key];
    // 모서리 장식의 반대편 간격(::before 의 bottom/right, ::after 의 top/left)은 루트 크기에서 파생되므로 같이 뺀다.
    if (key === "height") {
      delete before.bottom;
      delete after.top;
    } else {
      delete before.right;
      delete after.left;
    }
  }
  const first = snap.children[0];
  // 머리의 첫 자식 = 제목(시안 span.t ↔ 앱 h2): 태그만 통일하고 자기 값(글자 크기 · 굵기 · 색 · 줄 높이)은 비교, 그 안쪽은 뺀다(R23).
  const title = first?.children[0];
  const children: StyleSnapshot[] =
    opts.head && first
      ? [{ ...first, tag: "header", children: title ? [{ ...title, tag: "title", children: [] }] : [] }]
      : [];
  return { ...snap, props, pseudo: { before, after }, children };
}
