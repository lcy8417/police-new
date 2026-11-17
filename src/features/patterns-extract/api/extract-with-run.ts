import { backendFetch } from "@/shared/api"

/**
 * AI 문양 추출 + 실행 번호 — 서버 C3 `POST /crime/{aprthng_no}/patterns_extract`(B 단계 설계서 2026-11-17 §4-3).
 * 이미지 처리 계층(무변환). **응답 본문 모양은 옛 그대로**(현장 = `[{code, score}]` 배열, 신발 = 4부위 객체)이고,
 * 실행 번호(app.ai_run)는 응답 헤더 `X-AI-Run-Id`로 온다 — 헤더가 없으면(옛 서버 · 기록 실패) `runId: null`.
 * 옛 `services/api.js` `patternsExtract`는 그대로 둔다(옛 화면용). 좌표 계약(신발 `line_ys` · `render_size`)은 부르는 쪽이 만든 값을 그대로 보낸다.
 */

/** 현장 통합 추출 한 건 */
export interface ExtractedItem {
  /** 문양 이름(예 `n32_04`) */
  code: string
  /** AI 점수 0~1 */
  score: number
}

/** 신발 4부위 추출(부위마다 [이름, 점수]) */
export type ShoeExtractZones = Record<"top" | "mid" | "bottom" | "outline", [string, number][]>

export interface CrimeExtractResult {
  extracted: ExtractedItem[]
  runId: number | null
}

export interface ShoeExtractResult {
  zones: ShoeExtractZones
  runId: number | null
}

export class ExtractError extends Error {
  readonly status: number
  constructor(status: number) {
    super("문양 추출에 실패했습니다")
    this.name = "ExtractError"
    this.status = status
  }
}

const extractPath = (no: string) => `/crime/${encodeURIComponent(no)}/patterns_extract`

/** `X-AI-Run-Id` → 숫자(없거나 숫자가 아니면 null) */
export function runIdOf(response: Response): number | null {
  const raw = response.headers.get("X-AI-Run-Id")
  if (!raw || !/^\d+$/.test(raw)) return null
  return Number(raw)
}

// 이미지 값: data URL이면 그대로(서버 `full_image_prepaire` · `patterns_prepaire`가 접두어를 처리 — 옛 patternsExtract와 같음),
// 아니면 감정물 번호 · 신발 ID 문자열 그대로(서버가 저장 이미지를 그 이름으로 찾는다).
async function post(path: string, body: unknown): Promise<Response> {
  const response = await backendFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new ExtractError(response.status)
  return response
}

/** 현장(type=crime) 통합 추출 — 경계선 좌표를 보내지 않는다(REQ-SCENE-015) */
export async function extractCrimeWithRun(aprthngNo: string, image: string): Promise<CrimeExtractResult> {
  const response = await post(extractPath(aprthngNo), { image, type: "crime" })
  return { extracted: (await response.json()) as ExtractedItem[], runId: runIdOf(response) }
}

/** 신발(type=shoes) 4부위 추출 — `line_ys` · `render_size`는 정수 + clamp 된 값을 부르는 쪽이 넘긴다(docs/api-communication.md §4) */
export async function extractShoeWithRun(
  ftwrId: string,
  image: string,
  coords: { line_ys: [number, number]; render_size: [number, number] },
): Promise<ShoeExtractResult> {
  const response = await post(extractPath(ftwrId), { image, type: "shoes", ...coords })
  return { zones: (await response.json()) as ShoeExtractZones, runId: runIdOf(response) }
}
