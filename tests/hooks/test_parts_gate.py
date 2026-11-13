"""부품표 관문 훅(.claude/hooks/parts_gate.py) 시험.

실행: python3 -m unittest tests/hooks/test_parts_gate.py -v
"""

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".claude" / "hooks" / "parts_gate.py"

HEAD = "| 자리 | 부품 | 판정 | 메모 |\n|---|---|---|---|\n"


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
        self.assertGreaterEqual(len(self.gate.validate_plan("", {"Button"})), 1)

    def test_keep_only_passes(self):
        text = HEAD + "| S01 검색 버튼 | Button | 그대로 | |\n"
        self.assertEqual(self.gate.validate_plan(text, {"Button"}), [])

    def test_unknown_keep_name_blocks(self):
        text = HEAD + "| S01 검색 버튼 | Nope | 그대로 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, {"Button"})), 1)

    def test_bad_verdict_blocks(self):
        text = HEAD + "| S01 | Button | 아마도 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, {"Button"})), 1)

    def test_unapproved_new_blocks(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n"
        self.assertEqual(len(self.gate.validate_plan(text, {"Button"})), 1)

    def test_approved_new_passes(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — StatTile(기본)\n"
        self.assertEqual(self.gate.validate_plan(text, {"Button"}), [])

    def test_approval_for_other_part_does_not_count(self):
        text = HEAD + "| S01 통계 | StatTile | 새로 | |\n\n승인: 11/13 소유자 — Other(기본)\n"
        self.assertEqual(len(self.gate.validate_plan(text, {"Button"})), 1)

    def test_exempt_line_passes(self):
        self.assertEqual(self.gate.validate_plan("부품 불필요 — 문구만 수정\n", set()), [])


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


if __name__ == "__main__":
    unittest.main()
