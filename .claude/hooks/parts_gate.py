#!/usr/bin/env python3
"""부품표(parts-plan.md) 관문 — PreToolUse 훅 + 전체 검사(--check-all).

spec §8-3. 시안·진열 화면 파일에 손대기 전에 부품표를 요구한다.
romang `mockup-parts-gate.py`를 이 저장소 대상에 맞게 고친 것.

사용:
- 인자 없음(훅 모드): stdin 의 JSON `tool_input.file_path`(없으면 `path`)가 대상이면 부품표를 검사한다.
  위반이면 stderr 에 이유를 쓰고 종료 코드 2(쓰기 차단), 아니면 0.
- `--check-all`: 부품표 두 개를 모두 검사. 위반이면 종료 코드 1.

대상(저장소 루트 기준 상대 경로):
- docs/mockups/scas-redesign/screens/*.js, assets/*.js · *.css  -> docs/mockups/scas-redesign/parts-plan.md
- src/pages/dev/**                                             -> src/pages/dev/parts/parts-plan.md
부품표 파일 자체와 components.md 는 대상이 아니다(관문의 입력을 고치는 일을 막지 않는다).
표준 라이브러리만 사용한다.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_REL = ".claude/skills/police-ui-design/references/components.md"

MOCKUP_DIR = "docs/mockups/scas-redesign"
DEV_DIR = "src/pages/dev"
MOCKUP_PLAN = f"{MOCKUP_DIR}/parts-plan.md"
DEV_PLAN = f"{DEV_DIR}/parts/parts-plan.md"

PLAN_NAME = "parts-plan.md"
VERDICTS = {"그대로", "확장", "새로"}
NEEDS_APPROVAL = {"확장", "새로"}

# 「부품 불필요 — 사유」 한 줄
EXEMPT_RE = re.compile(r"^\s*부품\s*불필요\s*[—–:-]\s*\S.*$", re.MULTILINE)
# 「승인: MM/DD 소유자 — 부품(변형), …」 한 줄
APPROVAL_RE = re.compile(
    r"^\s*승인\s*:\s*(?:1[0-2]|0?[1-9])/(?:3[01]|[12]\d|0?[1-9])\s+\S+.*$", re.MULTILINE
)
FENCE_RE = re.compile(r"^```.*?^```[^\S\n]*$", re.MULTILINE | re.DOTALL)

HOW_TO = (
    f"`{PLAN_NAME}` 형식:\n"
    "| 자리 | 부품 | 판정 | 메모 |\n"
    "|---|---|---|---|\n"
    "| S01 검색 버튼 | Button | 그대로 | |\n"
    "판정은 그대로 · 확장 · 새로 중 하나. 확장·새로는 `승인: 11/13 소유자 — 부품(변형)` 줄에 부품 이름이 있어야 한다. "
    "부품과 상관없는 수정은 `부품 불필요 — 사유` 한 줄."
)


def target_plan(rel: str) -> str | None:
    """저장소 루트 기준 상대 경로(/ 구분)가 관문 대상이면 그 묶음의 부품표 상대 경로를 돌려준다."""
    if rel.endswith(PLAN_NAME) or rel.endswith("components.md"):
        return None  # 관문의 입력 파일은 대상이 아니다
    parts = rel.split("/")
    mockup = MOCKUP_DIR.split("/")
    n = len(mockup)
    if parts[:n] == mockup and len(parts) == n + 2:
        folder, name = parts[n], parts[n + 1]
        if folder == "screens" and name.endswith(".js"):
            return MOCKUP_PLAN
        if folder == "assets" and name.endswith((".js", ".css")):
            return MOCKUP_PLAN
        return None
    if rel.startswith(DEV_DIR + "/"):
        return DEV_PLAN
    return None


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def part_names(cell: str) -> list[str]:
    """한 칸에 `A · B` 처럼 여러 부품을 적어도 하나씩 대조한다."""
    return [n.strip(" `*") for n in re.split(r"[·,/]", cell) if n.strip(" `*")]


def read_catalog_names(catalog_text: str) -> set[str]:
    """components.md 표의 「부품」 열만 이름으로 인정한다(설명 문장은 부품이 아니다)."""
    names: set[str] = set()
    col = None
    for line in catalog_text.splitlines():
        if not line.strip().startswith("|"):
            col = None
            continue
        cells = split_row(line)
        if col is None:
            if "부품" in cells:
                col = cells.index("부품")
            continue
        if col < len(cells) and not re.fullmatch(r":?-+:?", cells[col] or "-"):
            names.update(part_names(cells[col]))
    return names


def find_table(text: str) -> tuple[list[str], list[list[str]]] | None:
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if not line.strip().startswith("|"):
            continue
        cells = split_row(line)
        if "자리" in cells and "부품" in cells and any(c.startswith("판정") for c in cells):
            body = []
            for row_line in lines[i + 1 :]:
                if not row_line.strip().startswith("|"):
                    break
                row = split_row(row_line)
                if not all(re.fullmatch(r":?-+:?", c or "-") for c in row):
                    body.append(row)
            return cells, body
    return None


def validate_plan(text: str, catalog_names: set[str] | None) -> list[str]:
    """부품표 본문을 검사해 위반 목록을 돌려준다(빈 목록이면 통과).

    catalog_names 가 None 이면 components.md 를 못 읽은 상태다.
    """
    text = FENCE_RE.sub("", text)  # 코드 블록 안의 예시는 실제 부품표가 아니다
    if EXEMPT_RE.search(text):
        return []
    table = find_table(text)
    if table is None:
        return ["`| 자리 | 부품 | 판정 | 메모 |` 머리를 가진 부품표가 없다."]
    columns, body = table
    slot_i = columns.index("자리")
    part_i = columns.index("부품")
    verdict_i = next(i for i, c in enumerate(columns) if c.startswith("판정"))
    if not body:
        return ["부품표에 행이 한 줄도 없다."]

    problems: list[str] = []
    approval_text = "\n".join(m.group(0) for m in APPROVAL_RE.finditer(text))
    catalog_missing_reported = False
    for row in body:
        if len(row) <= max(slot_i, part_i, verdict_i):
            problems.append(f"칸 수가 모자란 줄: {' | '.join(row)}")
            continue
        verdict = row[verdict_i]
        if verdict not in VERDICTS:
            problems.append(f"판정 「{verdict}」 은 그대로 · 확장 · 새로 중 하나여야 한다.")
            continue
        names = part_names(row[part_i])
        if not row[slot_i]:
            problems.append(f"자리 이름이 빈 줄: {' | '.join(row)}")
        if not names:
            problems.append(f"부품 이름이 빈 줄: {' | '.join(row)}")
        for name in names:
            if verdict == "그대로":
                if catalog_names is None:
                    if not catalog_missing_reported:
                        problems.append("components.md 없음 — 「그대로」 부품 이름을 확인할 수 없음")
                        catalog_missing_reported = True
                elif name not in catalog_names:
                    problems.append(f"「그대로」 부품 「{name}」 이 components.md 에 없다 — 없으면 판정을 새로로 적는다.")
            elif verdict in NEEDS_APPROVAL:
                if not re.search(rf"(?<![\w]){re.escape(name)}(?![\w])", approval_text):
                    problems.append(f"「{verdict}」 부품 「{name}」 이 `승인: MM/DD 소유자 — {name}(…)` 줄에 없다.")
    return problems


def load_catalog(root: Path) -> set[str] | None:
    try:
        return read_catalog_names((root / CATALOG_REL).read_text(encoding="utf-8"))
    except OSError:
        return None


def check_plan_file(root: Path, plan_rel: str) -> list[str]:
    plan = root / plan_rel
    if not plan.is_file():
        return [f"부품표가 없다: {plan_rel}"]
    return validate_plan(plan.read_text(encoding="utf-8"), load_catalog(root))


def relative_to_root(file_path: str, root: Path) -> str | None:
    """저장소 루트 기준 상대 경로(/ 구분)를 돌려준다. 밖이면 None.

    macOS 는 한글 경로를 NFD 로 돌려주기도 해서(resolve 결과와 입력의 정규형이 다름) NFC 로 맞춰 비교한다.
    """
    norm = lambda p: unicodedata.normalize("NFC", p.as_posix())  # noqa: E731
    path = norm(Path(file_path).resolve())
    base = norm(root.resolve()).rstrip("/") + "/"
    return path[len(base):] if path.startswith(base) else None


def decide(payload: dict, root: Path = ROOT) -> str | None:
    """거절 사유를 돌려준다. 통과면 None."""
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("path")
    if not file_path:
        return None
    rel = relative_to_root(str(file_path), root)
    if rel is None:
        return None  # 저장소 밖은 대상이 아니다
    plan_rel = target_plan(rel)
    if plan_rel is None:
        return None
    problems = check_plan_file(root, plan_rel)
    if not problems:
        return None
    return f"{rel} 을(를) 고치려면 부품표({plan_rel})를 먼저 맞춰야 한다.\n" + "\n".join(f"- {p}" for p in problems) + f"\n{HOW_TO}"


def check_all(root: Path = ROOT) -> int:
    failed = False
    for plan_rel in (MOCKUP_PLAN, DEV_PLAN):
        for problem in check_plan_file(root, plan_rel):
            failed = True
            print(f"[parts_gate] {plan_rel}: {problem}")
    if not failed:
        print("[parts_gate] 부품표 2개 모두 통과")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    if "--check-all" in argv:
        return check_all()
    try:
        reason = decide(json.load(sys.stdin))
    except Exception as error:  # noqa: BLE001 — 훅 오류로 작업이 멈추면 안 된다
        print(f"[parts_gate] 검사 실패, 통과시킨다: {error}", file=sys.stderr)
        return 0
    if reason:
        print(reason, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
