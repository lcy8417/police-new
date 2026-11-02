import type { EssentialFlag, PatternEntry, PatternZone } from "@/entities/pattern";

/**
 * A pattern entry after `stripPatternPath` — the bare-name wire form sent
 * back to the server on writes (PUT /crime/:crimeNumber, POST /crime/:crimeNumber).
 */
export type StrippedPatternEntry = string | readonly [string, EssentialFlag];

/**
 * 현장 단일 DINOv2 통합 추출 결과 1건 (REQ-SCENE-002/009). `code`는 문양 코드,
 * `score`는 DINOv2 sigmoid 신뢰도(0~1) — code-only가 아니다.
 */
export interface ExtractedPatternItem {
  code: string;
  score: number;
}

/**
 * Snake_case wire shape for crime reads:
 *  - GET /crime            (list, crud.js#fetchCrimeData)
 *  - GET /crime/:crimeNumber (per-crime rows, ad hoc in DetailMain.jsx)
 *  - GET /crime/history/:id  (single history record, crud.js#fetchHistoryData)
 *
 * These three endpoints return different subsets of this shape depending on
 * context, so every field beyond the pattern zones is optional.
 */
export interface CrimeDto {
  id?: number;
  crime_number?: string;
  image_number?: string;
  crime_name?: string;
  find_time?: string;
  request_office?: string;
  find_method?: string;
  state?: string;
  image?: string | null;
  edit_image?: string | null;
  top: PatternEntry[];
  mid: PatternEntry[];
  bottom: PatternEntry[];
  outline: PatternEntry[];
  // REQ-SCENE-009/010: 통합 DINOv2 추출 원본({code,score} 목록). 저장 전이거나
  // 레거시(신발) 레코드에는 없을 수 있다.
  extracted_raw?: ExtractedPatternItem[] | null;
  ranking?: number;
  matching_shoes?: string | null;
  register_time?: string;
}

/** CamelCase app model — `convertKeysToCamelCase(CrimeDto)`. */
export interface Crime {
  id?: number;
  crimeNumber?: string;
  imageNumber?: string;
  crimeName?: string;
  findTime?: string;
  requestOffice?: string;
  findMethod?: string;
  state?: string;
  image?: string | null;
  editImage?: string | null;
  top: PatternEntry[];
  mid: PatternEntry[];
  bottom: PatternEntry[];
  outline: PatternEntry[];
  // REQ-SCENE-009/010: 통합 DINOv2 추출 원본({code,score} 목록). 저장 전이거나
  // 레거시(신발) 레코드에는 없을 수 있다.
  extractedRaw?: ExtractedPatternItem[] | null;
  ranking?: number;
  matchingShoes?: string | null;
  registerTime?: string;
}

// NO symmetric fromCrime — write bodies are per-endpoint by contract.

/** Input to `registerCrime` — CrimeRegister.jsx's `formData`, pre-strip `image`. */
export interface CrimeRegisterInput {
  image: string;
  crimeNumber: string;
  imageNumber: string;
  crimeName: string;
  findTime: string;
  requestOffice: string;
  findMethod: string;
}

/** POST /crime/register body. Mirror of crud.js#fetchCrimeRegister. */
export interface CrimeRegisterBody {
  image: string;
  crimeNumber: string;
  imageNumber: string;
  crimeName: string;
  findTime: string;
  requestOffice: string;
  findMethod: string;
}

/** PUT /crime/:crimeNumber body. Mirror of crud.js#fetchPatterns. */
export interface PatternsPutBody {
  top: StrippedPatternEntry[];
  mid: StrippedPatternEntry[];
  bottom: StrippedPatternEntry[];
  outline: StrippedPatternEntry[];
  // REQ-SCENE-009(a): extracted_raw 컬럼 영속화. 배치 저장 시점에 통합 추출
  // 원본이 있으면 함께 보낸다(없으면 생략 — 신발/레거시 경로 영향 없음).
  extracted_raw?: ExtractedPatternItem[] | null;
}

/** POST /crime/:crimeNumber body. Mirror of crud.js#fetchHistorySave. */
export interface HistorySaveBody {
  top: StrippedPatternEntry[];
  mid: StrippedPatternEntry[];
  bottom: StrippedPatternEntry[];
  outline: StrippedPatternEntry[];
  crimeNumber: string;
  registerTime: string;
  image: string | null | undefined;
  ranking: number;
  editImage: string | null;
  matchingShoes: string | null;
  // REQ-SCENE-009(c): crime_data_history 스냅샷에도 통합 추출 원본을 포함한다.
  extractedRaw?: ExtractedPatternItem[] | null;
}

/** Input to `saveCrimeHistory`. Mirror of crud.js#fetchHistorySave's destructured params. */
export interface SaveCrimeHistoryInput {
  crimeNumber: string;
  currentCrimeData: Pick<Crime, PatternZone> & {
    crimeNumber: string;
    image?: string | null;
    editImage?: string | null;
    // REQ-SCENE-009(c): 있으면 히스토리 스냅샷에 포함(없으면 생략 가능).
    extractedRaw?: ExtractedPatternItem[] | null;
  };
  ranking?: string | number | null;
  modelNumber?: string | null;
}

/** PUT /crime/edit_image/:crimeNumber body. Mirror of crud.js#fetchEditImageSave. */
export interface EditImageSaveBody {
  image: string | null;
}

/** Input to `saveCrimeEditImage`. Mirror of crud.js#fetchEditImageSave's destructured params. */
export interface SaveCrimeEditImageInput {
  crimeNumber: string;
  scrollState: { image?: string | null };
}
