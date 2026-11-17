/**
 * 신발 편집 판 「문양 목록」 — 종류 탭별 전체 문양 이름(앱에 들어 있는 문양 그림 폴더 그대로 · 이름순).
 * 종류 → 폴더는 docs/pattern-data-model.md §3(「윤곽」만 폴더가 `윤곽선`). 파일 이름만 읽는다(그림은 불러오지 않음).
 * 신발 문양은 이름 문자열이라 편집 판이 `insertPatternPath` 로 그림 경로를 붙여 보인다.
 */
const KIND_FOLDER: Record<string, string> = {
  무늬: "무늬",
  선: "선",
  윤곽: "윤곽선",
  다각: "다각",
  삼각: "삼각",
  사각: "사각",
  원: "원",
  항목: "항목",
}

const PATTERN_FILES = Object.keys(import.meta.glob("/src/assets/Patterns/*/*.png"))

/** 파일 경로 목록 → 종류별 이름 목록(테스트용으로 따로) */
export function buildPatternLibrary(files: readonly string[]): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(KIND_FOLDER).map(([kind, folder]) => [
      kind,
      files
        .filter((f) => f.split("/").at(-2) === folder)
        .map((f) => (f.split("/").at(-1) ?? "").replace(/\.png$/, ""))
        .sort(),
    ]),
  )
}

export const SHOE_PATTERN_LIBRARY: Record<string, string[]> = buildPatternLibrary(PATTERN_FILES)
