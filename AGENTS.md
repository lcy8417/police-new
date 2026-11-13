# AGENTS.md — 이 저장소에서 일하는 AI 에이전트(Codex 등) 안내

저장소 전체 규약은 `CLAUDE.md`(그리고 거기서 가져오는 `docs/architecture.md` · `docs/api-communication.md` · `docs/pattern-data-model.md`)를 따른다.

## 화면을 고치기 전에 — `police-ui-design` 스킬

화면 코드(`src/**/*.tsx` · `src/**/*.css`)나 시안(`docs/mockups/scas-redesign/`)의 색 · 글꼴 · 굵기 · 간격 · 모서리 · 그림자 · 배치 · 상태 표시 중 하나라도 건드리면, 먼저 **`.claude/skills/police-ui-design/SKILL.md`**를 읽는다. 값과 규칙은 그 스킬에만 있다(이 파일에 옮겨 적지 않는다). 참고 파일 5개:

- `.claude/skills/police-ui-design/references/tokens.md`
- `.claude/skills/police-ui-design/references/components.md`
- `.claude/skills/police-ui-design/references/visual-spec.md`
- `.claude/skills/police-ui-design/references/motion.md`
- `.claude/skills/police-ui-design/references/layout.md`

시안(`docs/mockups/scas-redesign/screens/*.js` · `assets/*`)이나 진열 화면(`src/pages/dev/**`)을 고칠 때는 그 묶음의 `parts-plan.md`(부품표)를 먼저 맞춘다. Claude는 쓰기 직전 훅이 막아 주지만 Codex에는 훅이 없으므로, 아래 검사가 같은 부품표 검사를 한 번 더 한다.

## 검사

```bash
npm run check:ui   # hex 검사 + 부품 목록 · 부품표 검사 + Playwright UI 검사(토큰 · 시안 스냅샷 · 부품 대조)
```

생김새를 바꿨으면 `npm run check:ui`와 이 저장소의 완료 검증(`npx tsc --noEmit` · `npx vitest run` · `npm run build` · 변경 파일 `npx eslint`)이 모두 통과해야 완료다.
