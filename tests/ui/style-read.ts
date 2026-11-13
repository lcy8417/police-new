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
