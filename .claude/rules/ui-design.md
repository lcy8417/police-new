---
paths: ["src/**/*.tsx", "src/**/*.css", "docs/mockups/scas-redesign/**"]
---

# 화면 디자인 — 먼저 `police-ui-design` 스킬을 연다

색 · 글꼴 · 굵기 · 간격 · 모서리 · 그림자 · 배치 · 상태 표시 중 하나라도 건드리면, 고치기 전에 **`police-ui-design` 스킬**(`.claude/skills/police-ui-design/SKILL.md`)을 연다. 생김새와 상관없는 로직 · 데이터 수정이면 열지 않아도 된다.

값과 규칙은 스킬에만 있다(이 파일에 옮겨 적지 않는다). 참고 파일 5개:

- `references/tokens.md`
- `references/components.md`
- `references/visual-spec.md`
- `references/motion.md`
- `references/layout.md`

시안(`docs/mockups/scas-redesign/`)이나 진열 화면(`src/pages/dev/`)을 고칠 때는 그 묶음의 `parts-plan.md`부터 맞춘다(훅이 검사한다). 다 고친 뒤 `npm run check:ui`.
