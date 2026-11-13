"""부품표 관문 훅(.claude/hooks/parts_gate.py) 시험.

실행: python3 -m unittest tests/hooks/test_parts_gate.py -v
"""

import contextlib
import importlib.util
import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".claude" / "hooks" / "parts_gate.py"

HEAD = "| 자리 | 부품 | 판정 | 메모 |\n|---|---|---|---|\n"

# 부품 목록(이름 → 상태). 「그대로」는 구현됨 · 검증됨 부품만 된다(M5).
CATALOG = {"Button": "검증됨", "StatusChip": "구현됨", "StatTile": "후보"}

# 임시 저장소용 components.md(부품 · 상태 열만 있으면 된다).
CATALOG_MD = (
    "| 부품 | 출입구 | 파일 | 상태 |\n|---|---|---|---|\n"
    "| Button | kit | `src/shared/ui/kit/Button.tsx` | 검증됨 |\n"
    "| StatTile | ai | | 후보 |\n"
)


def load_hook():
    """훅 파일을 모듈로 불러온다(validate_plan 직접 호출용)."""
    spec = importlib.util.spec_from_file_location("parts_gate", HOOK)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_hook(payload: dict) -> subprocess.CompletedProcess:
    """훅 모드: stdin 으로 JSON 을 넣고 종료 코드를 본다."""
    return subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


class ValidatePlanTest(unittest.TestCase):
    def setUp(self):
        self.gate = load_hook()

    def test_no_plan_blocks(self):
        self.assertGreaterEqual(len(self.gate.validate_plan("", CATALOG)), 1)

    def test_keep_only_passes(self):
        text = HEAD + "| S01 검색 버튼 | Button | 그대로 | |\n"
        self.assertEqual(self.gate.validate_plan(text, CATALOG), [])

    def test_keep_implemented_part_passes(self):
        text = HEAD + "| S01 꼬리표 | StatusChip | 그대로 | |\n"
        self.assertEqual(self.gate.validate_plan(text, CATALOG), [])

    def test_keep_candidate_part_blocks(self):
        # 후보(코드 없음) 부품은 「그대로」 쓸 수 없다 — 확장 · 새로 + 승인
        text = HEAD + "| S01 통계 | StatTile | 그대로 | |\n"
        problems = self.gate.validate_plan(text, CATALOG)
        self.assertEqual(len(problems), 1)
        self.assertIn("후보", problems[0])

    def test_candidate_part_as_new_with_approval_passes(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — StatTile(기본)\n"
        self.assertEqual(self.gate.validate_plan(text, CATALOG), [])

    def test_unknown_keep_name_blocks(self):
        text = HEAD + "| S01 검색 버튼 | Nope | 그대로 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, CATALOG)), 1)

    def test_bad_verdict_blocks(self):
        text = HEAD + "| S01 | Button | 아마도 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, CATALOG)), 1)

    def test_unapproved_new_blocks(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, CATALOG)), 1)

    def test_approved_new_passes(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — StatTile(기본)\n"
        self.assertEqual(self.gate.validate_plan(text, CATALOG), [])

    def test_approval_for_other_part_does_not_count(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — Other(기본)\n"
        self.assertEqual(len(self.gate.validate_plan(text, CATALOG)), 1)

    def test_exempt_line_passes(self):
        self.assertEqual(self.gate.validate_plan("부품 불필요 — 문구만 수정\n", {}), [])

    def test_read_catalog_reads_status(self):
        # 실제 components.md: 검증됨 · 후보 상태를 이름과 함께 읽는다
        catalog = self.gate.read_catalog((ROOT / self.gate.CATALOG_REL).read_text(encoding="utf-8"))
        self.assertEqual(catalog["Button"], "검증됨")
        self.assertEqual(catalog["AiTag"], "검증됨")
        self.assertEqual(catalog["Segmented"], "후보")
        self.assertEqual(catalog["Tooltip"], "구현됨")


def make_repo(tmp: Path, plan: str | None) -> Path:
    """임시 저장소: components.md + (있으면) 부품표 두 개를 같은 내용으로."""
    catalog = tmp / ".claude/skills/police-ui-design/references/components.md"
    catalog.parent.mkdir(parents=True)
    catalog.write_text(CATALOG_MD, encoding="utf-8")
    if plan is not None:
        for rel in ("docs/mockups/scas-redesign/parts-plan.md", "src/pages/dev/parts/parts-plan.md"):
            (tmp / rel).parent.mkdir(parents=True, exist_ok=True)
            (tmp / rel).write_text(plan, encoding="utf-8")
    return tmp


class CheckAllTest(unittest.TestCase):
    """`--check-all`(check:ui · Codex 쪽) 도 관문 4가지 경우를 똑같이 가른다(설계서 §12-6)."""

    def setUp(self):
        self.gate = load_hook()
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def run_check_all(self, plan: str | None) -> tuple[int, str]:
        root = make_repo(self.tmp, plan)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = self.gate.check_all(root)
        return code, out.getvalue()

    def test_missing_plan_fails(self):
        code, out = self.run_check_all(None)
        self.assertEqual(code, 1)
        self.assertIn("부품표가 없다", out)

    def test_keep_only_passes(self):
        code, out = self.run_check_all(HEAD + "| S01 검색 버튼 | Button | 그대로 | |\n")
        self.assertEqual(code, 0, out)

    def test_unapproved_new_fails(self):
        code, out = self.run_check_all(HEAD + "| S01 통계 | StatTile | 새로 | |\n")
        self.assertEqual(code, 1)
        self.assertIn("StatTile", out)

    def test_approved_new_passes(self):
        code, out = self.run_check_all(
            HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — StatTile(기본)\n"
        )
        self.assertEqual(code, 0, out)


class HookModeTest(unittest.TestCase):
    def test_korean_absolute_path_is_target(self):
        # 한글이 든 절대 경로를 가진 (부품표 없는) 저장소 루트를 가정: 대상으로 인식해 거절해야 한다
        gate = load_hook()
        root = Path("/Users/x/Desktop/족적데이터_1802/police-new")
        payload = {"tool_input": {"file_path": str(root / "src/pages/dev/parts/A.tsx")}}
        reason = gate.decide(payload, root)
        self.assertIsNotNone(reason)
        self.assertIn("부품표가 없다", reason)
        # 같은 루트의 대상 밖 경로는 통과
        self.assertIsNone(gate.decide({"tool_input": {"file_path": str(root / "src/features/a.ts")}}, root))

    def test_real_repo_korean_path_is_target(self):
        # 실제 저장소(한글 경로) 안의 진열 화면 파일을 대상으로 인식한다
        gate = load_hook()
        path = str(ROOT / "src" / "pages" / "dev" / "parts" / "A.tsx")
        rel = gate.relative_to_root(path, ROOT)
        self.assertEqual(rel, "src/pages/dev/parts/A.tsx")
        self.assertEqual(gate.target_plan(rel), "src/pages/dev/parts/parts-plan.md")
        # NFD(분해형) 한글로 들어온 같은 경로도 같은 상대 경로가 된다
        import unicodedata
        nfd = unicodedata.normalize("NFD", path)
        self.assertEqual(gate.relative_to_root(nfd, ROOT), "src/pages/dev/parts/A.tsx")

    def test_outside_repo_path_is_not_target(self):
        path = "/Users/x/Desktop/족적데이터_1802/police-new/src/pages/dev/parts/A.tsx"
        self.assertEqual(run_hook({"tool_input": {"file_path": path}}).returncode, 0)

    def test_mockup_targets(self):
        gate = load_hook()
        for rel in ("docs/mockups/scas-redesign/screens/s01-case-list.js", "docs/mockups/scas-redesign/assets/a.css"):
            self.assertEqual(gate.target_plan(rel), "docs/mockups/scas-redesign/parts-plan.md")
        self.assertIsNone(gate.target_plan("docs/mockups/scas-redesign/README.md"))
        self.assertIsNone(gate.target_plan("docs/mockups/scas-redesign/index.html"))

    def test_non_target_inside_repo_allows(self):
        path = str(ROOT / "src" / "features" / "a.ts")
        self.assertEqual(run_hook({"tool_input": {"file_path": path}}).returncode, 0)

    def test_plan_files_are_never_targets(self):
        for rel in ("src/pages/dev/parts/parts-plan.md", "docs/mockups/scas-redesign/parts-plan.md"):
            path = str(ROOT / rel)
            self.assertEqual(run_hook({"tool_input": {"file_path": path}}).returncode, 0, rel)

    def test_path_key_fallback(self):
        path = str(ROOT / "src" / "features" / "a.ts")
        self.assertEqual(run_hook({"tool_input": {"path": path}}).returncode, 0)

    def test_violation_exits_2_in_subprocess(self):
        # 실제 훅 프로세스가 위반이면 종료 코드 2(쓰기 차단) + stderr 에 이유를 쓴다.
        # 훅은 자기 위치에서 저장소 루트를 잡으므로, 부품표 없는 임시 저장소에 훅을 복사해 돌린다.
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp)
        make_repo(tmp, None)
        hook = tmp / ".claude" / "hooks" / "parts_gate.py"
        hook.parent.mkdir(parents=True)
        shutil.copy(HOOK, hook)
        payload = {"tool_input": {"file_path": str(tmp / "src" / "pages" / "dev" / "parts" / "A.tsx")}}
        result = subprocess.run(
            [sys.executable, str(hook)],
            input=json.dumps(payload, ensure_ascii=False),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn("부품표가 없다", result.stderr)


if __name__ == "__main__":
    unittest.main()
