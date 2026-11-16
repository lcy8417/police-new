# 시안 부품표

부품표 관문(`.claude/hooks/parts_gate.py`, spec §8-3)이 읽는 파일이다. 대상: `screens/*.js`, `assets/*.js|css`.
부품 이름은 `.claude/skills/police-ui-design/references/components.md`의 「부품」 열과 같아야 한다.

| 자리 | 부품 | 판정 | 메모 |
|---|---|---|---|
| S01 · S02 버튼 | Button | 그대로 | 시안 표식 `data-part-id` 부착 완료 |
| S01 · S02 칩 | Chip | 그대로 | |
| S01 · S02 입력 필드 | Field | 그대로 | |
| S01 · S02 패널 | Panel | 그대로 | |
| S01 · S02 하단 버튼 줄 | ButtonBar | 그대로 | |
| S01 · S02 AI 표시 | AiTag | 그대로 | |
| S01 목록 머리 보기 전환 | Segmented | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S01 목록 머리 보기 방식 | RadioRow | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| 상단 메뉴 사용자 이니셜 | Avatar | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S01 AI 사전 처리 머리 점 | LiveDot | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S01 AI 사전 처리 막대 | AiProgress | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S04 AI 확신도 막대 | ConfidenceBar | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S01 밑창 작은 그림 | SoleThumb | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S04 문양 아이콘 | PatternIcon | 그대로 | 시안 표식 `data-part-id` 부착(잠금 대조) |
| S01 현황 타일(결과 확인 전 · 교차 검증 · 우리 청 의뢰) | StatTile | 새로 | r2: 시안 표식 `data-part-id` 부착 |
| S01 사건 진행 단계 막대 | Stepper | 새로 | r2: 시안 표식 `data-part-id` 부착 |
| S03 AI 제안 줄(기울기 맞추기) | AiSuggestion | 새로 | r2: 시안 표식 `data-part-id` 부착 |

승인: 11/16 소유자 — StatTile
승인: 11/16 소유자 — Stepper
승인: 11/16 소유자 — AiSuggestion
