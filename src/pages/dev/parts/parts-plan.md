# 진열 화면 부품표

부품표 관문(`.claude/hooks/parts_gate.py`, spec §8-3)이 읽는 파일이다. 대상: `src/pages/dev/**`.
부품 이름은 `.claude/skills/police-ui-design/references/components.md`의 「부품」 열과 같아야 한다.

| 자리 | 부품 | 판정 | 메모 |
|---|---|---|---|
| S01 · S02 버튼 | Button | 그대로 | 변형 × 상태 진열 |
| S01 · S02 칩 | Chip | 그대로 | |
| S01 · S02 입력 필드 | Field | 그대로 | |
| S01 · S02 패널 | Panel | 그대로 | |
| S01 · S02 하단 버튼 줄 | ButtonBar | 그대로 | |
| S01 · S02 AI 표시 | AiTag | 그대로 | |
| 진열 화면 S00–S14 kit | Segmented | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | RadioRow | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | Combobox | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | StatusDot | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | Avatar | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | DataGrid | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | Pagination | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | DialogShell | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 kit | InlineError | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | EvidenceImage | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | SoleThumb | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | PatternIcon | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | ZoneBands | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | CompareView | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 viewer | PointPairs | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 ai | AiProgress | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 ai | ConfidenceBar | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 ai | ScanOverlay | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 ai | LiveDot | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 panel | ScasShell | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 panel | SearchForm | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 panel | Crumb | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |
| 진열 화면 S00–S14 panel | PageHead | 새로 | 시안 원본에서 값 읽어 구현(11/16 화면 시안 설계서 §8) |

## 승인 (spec §8 「만들 부품」 표 = 사용자 승인)

승인: 11/16 소유자 — Segmented
승인: 11/16 소유자 — RadioRow
승인: 11/16 소유자 — Combobox
승인: 11/16 소유자 — StatusDot
승인: 11/16 소유자 — Avatar
승인: 11/16 소유자 — DataGrid
승인: 11/16 소유자 — Pagination
승인: 11/16 소유자 — DialogShell
승인: 11/16 소유자 — InlineError
승인: 11/16 소유자 — EvidenceImage
승인: 11/16 소유자 — SoleThumb
승인: 11/16 소유자 — PatternIcon
승인: 11/16 소유자 — ZoneBands
승인: 11/16 소유자 — CompareView
승인: 11/16 소유자 — PointPairs
승인: 11/16 소유자 — AiProgress
승인: 11/16 소유자 — ConfidenceBar
승인: 11/16 소유자 — ScanOverlay
승인: 11/16 소유자 — LiveDot
승인: 11/16 소유자 — ScasShell
승인: 11/16 소유자 — SearchForm
승인: 11/16 소유자 — Crumb
승인: 11/16 소유자 — PageHead
