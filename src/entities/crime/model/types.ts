import type { EssentialFlag, PatternEntry, PatternZone } from "@/entities/pattern";

/**
 * A pattern entry after `stripPatternPath` — the bare-name wire form sent
 * back to the server on writes (PUT /crime/:aprthngNo, POST /crime/:aprthngNo).
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
 * 사건(감정물) 읽기 응답의 snake_case 원형(설계서 §4-1, SCAS 열 이름):
 *  - GET /crime                    (감정물 목록 — 앱에서 등록한 것만)
 *  - GET /crime/history/:searchNo  (이력 1건 스냅샷: edit_image·mtchg_id·문양·extracted_raw·pidinet_outline)
 *
 * 두 엔드포인트가 이 모양의 서로 다른 부분집합을 돌려주므로 문양 4부위를 뺀
 * 나머지는 모두 optional이다. ID(`aprthng_no`)는 문자열 — 숫자로 바꾸지 않는다.
 */
export interface CrimeDto {
  /** 감정물 번호 `의뢰번호_순번`(예 `05019-24-0017_5`), 최대 20자. */
  aprthng_no?: string;
  /** 감정의뢰번호(예 `05019-24-0017`), 최대 20자. */
  apprsl_reqest_no?: string;
  /** 채취 일시 `YYYY-MM-DDTHH:MM:SS` 또는 null. */
  pick_dt?: string | null;
  /** 채취 장소(최대 200자). */
  pick_place?: string | null;
  /** 채취 방법 코드(최대 8자). */
  pick_mth_code?: string | null;
  /** 사건명(최대 300자). */
  crime_nm?: string | null;
  /** 의뢰관서명(최대 300자). */
  rqest_grfc_nm?: string | null;
  /** 처리 상태(정수, 기본 0). */
  process_sttus?: number;
  image?: string | null;
  /** 편집 이미지 `data:image/png;base64,...` 또는 null. */
  edit_image?: string | null;
  top: PatternEntry[];
  mid: PatternEntry[];
  bottom: PatternEntry[];
  outline: PatternEntry[];
  // REQ-SCENE-009/010: 통합 DINOv2 추출 원본({code,score} 목록). 저장 전이거나
  // 레거시(신발) 레코드에는 없을 수 있다.
  extracted_raw?: ExtractedPatternItem[] | null;
  /** PiDiNet 윤곽 PNG URL 또는 null. */
  pidinet_outline?: string | null;
  /** 최초 등록 일시(목록 정렬 기준). */
  frst_regist_dt?: string;
  /** 이력 스냅샷의 순위(이력 응답에만 있을 수 있음). */
  ranking?: number;
  /** 이력 스냅샷에서 확인된(매칭) 신발 ID — 없으면 null. */
  mtchg_id?: string | null;
}

/** CamelCase app model — `convertKeysToCamelCase(CrimeDto)`. */
export interface Crime {
  /** 감정물 번호 `의뢰번호_순번`(예 `05019-24-0017_5`). */
  aprthngNo?: string;
  /** 감정의뢰번호(예 `05019-24-0017`). */
  apprslReqestNo?: string;
  /** 채취 일시 `YYYY-MM-DDTHH:MM:SS` 또는 null. */
  pickDt?: string | null;
  /** 채취 장소. */
  pickPlace?: string | null;
  /** 채취 방법 코드. */
  pickMthCode?: string | null;
  /** 사건명. */
  crimeNm?: string | null;
  /** 의뢰관서명. */
  rqestGrfcNm?: string | null;
  /** 처리 상태(정수). */
  processSttus?: number;
  image?: string | null;
  editImage?: string | null;
  top: PatternEntry[];
  mid: PatternEntry[];
  bottom: PatternEntry[];
  outline: PatternEntry[];
  // REQ-SCENE-009/010: 통합 DINOv2 추출 원본({code,score} 목록). 저장 전이거나
  // 레거시(신발) 레코드에는 없을 수 있다.
  extractedRaw?: ExtractedPatternItem[] | null;
  /** PiDiNet 윤곽 PNG URL 또는 null. */
  pidinetOutline?: string | null;
  /** 최초 등록 일시. */
  frstRegistDt?: string;
  /** 이력 스냅샷의 순위. */
  ranking?: number;
  /** 이력 스냅샷의 매칭 신발 ID — 없으면 null. */
  mtchgId?: string | null;
}

/** GET /crime/:aprthngNo 응답 1행(snake) — 그 감정물의 검색 이력 목록. */
export interface CrimeHistoryRowDto {
  /** 검색 번호(정수) — 이력 URL `/search/:aprthngNo/crimeHistory/:searchNo`의 키. */
  search_no: number;
  /** 저장 시각 `YYYY-MM-DD HH:MM:SS`. */
  frst_regist_dt: string;
  ranking: number;
  /** 매칭 신발 ID. 매칭 없이 저장했으면 null. */
  mtchg_id: string | null;
}

/** CamelCase app model — `convertKeysToCamelCase(CrimeHistoryRowDto)`. */
export interface CrimeHistoryRow {
  /** 검색 번호(정수). */
  searchNo: number;
  /** 저장 시각 `YYYY-MM-DD HH:MM:SS`. */
  frstRegistDt: string;
  ranking: number;
  /** 매칭 신발 ID. 매칭 없이 저장했으면 null. */
  mtchgId: string | null;
}

// NO symmetric fromCrime — write bodies are per-endpoint by contract.

/** POST /crime/register 본문(설계서 §4-4, camelCase 그대로 전송). */
export interface CrimeRegisterBody {
  /** base64 이미지 — `data:image/...;base64,` 접두어 제거 후. */
  image: string;
  /** 감정물 번호 `<apprslReqestNo>_<순번>`. */
  aprthngNo: string;
  /** 감정의뢰번호. */
  apprslReqestNo: string;
  /** 채취 일시: 빈 값, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD HH:mm:ss`. */
  pickDt: string;
  /** 채취 장소(최대 200자). */
  pickPlace: string;
  /** 채취 방법 코드(최대 8자). */
  pickMthCode: string;
  /** 사건명(최대 300자). */
  crimeNm: string;
  /** 의뢰관서명(최대 300자). */
  rqestGrfcNm: string;
}

/** Input to `registerCrime` — 등록 폼 값(본문과 같은 키), `image`는 접두어 제거 전. */
export type CrimeRegisterInput = CrimeRegisterBody;

/** PUT /crime/:aprthngNo body. Mirror of crud.js#fetchPatterns. */
export interface PatternsPutBody {
  top: StrippedPatternEntry[];
  mid: StrippedPatternEntry[];
  bottom: StrippedPatternEntry[];
  outline: StrippedPatternEntry[];
  // REQ-SCENE-009(a): extracted_raw 컬럼 영속화. 배치 저장 시점에 통합 추출
  // 원본이 있으면 함께 보낸다(없으면 생략 — 신발/레거시 경로 영향 없음).
  // 서버는 이 키를 snake 그대로 받는다(설계서 §5).
  extracted_raw?: ExtractedPatternItem[] | null;
}

/** POST /crime/:aprthngNo(이력 저장) 본문(설계서 §4-4). 저장 시각은 서버가 정한다. */
export interface HistorySaveBody {
  top: StrippedPatternEntry[];
  mid: StrippedPatternEntry[];
  bottom: StrippedPatternEntry[];
  outline: StrippedPatternEntry[];
  /** 매칭 순위(없으면 0). */
  ranking: number;
  /** 확인된(매칭) 신발 ID — 매칭 없이 저장하면 null. */
  mtchgId: string | null;
  /** 편집 이미지 base64(접두어 제거) 또는 null. */
  editImage: string | null;
  // REQ-SCENE-009(c): 이력 스냅샷에도 통합 추출 원본을 포함한다(없으면 null).
  extractedRaw: ExtractedPatternItem[] | null;
}

/** POST /crime/:aprthngNo 응답(camel 변환 후) — 새로 발급된 검색 번호. */
export interface SaveCrimeHistoryResult {
  searchNo: number;
}

/** Input to `saveCrimeHistory`. */
export interface SaveCrimeHistoryInput {
  /** 이력을 저장할 감정물 번호(URL 경로). */
  aprthngNo: string;
  currentCrimeData: Pick<Crime, PatternZone> & {
    editImage?: string | null;
    // REQ-SCENE-009(c): 있으면 히스토리 스냅샷에 포함(없으면 null).
    extractedRaw?: ExtractedPatternItem[] | null;
  };
  ranking?: string | number | null;
  /** 확인된(매칭) 신발 ID(`ftwrId`) — 없으면 null. */
  mtchgId?: string | null;
}

/** PUT /crime/edit_image/:aprthngNo body. Mirror of crud.js#fetchEditImageSave. */
export interface EditImageSaveBody {
  image: string | null;
}

/** Input to `saveCrimeEditImage`. Mirror of crud.js#fetchEditImageSave's destructured params. */
export interface SaveCrimeEditImageInput {
  /** 감정물 번호(URL 경로). */
  aprthngNo: string;
  scrollState: { image?: string | null };
}
