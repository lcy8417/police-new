import {
  apiGet,
  apiSend,
  backendFetch,
  backendMediaUrl,
  stripDataUrl,
  stripDataUrlPrefix,
  toApiError,
} from "@/shared/api";
import { convertKeysToCamelCase } from "@/shared/lib";
import { insertPatternPath, stripPatternPath, type PatternEntry, type PatternZone } from "@/entities/pattern";
import type {
  Crime,
  CrimeDto,
  CrimeHistoryRow,
  CrimeHistoryRowDto,
  CrimeRegisterBody,
  CrimeRegisterInput,
  EditImageSaveBody,
  HistorySaveBody,
  OriginalUploadResult,
  PatternsPutBody,
  SaveCrimeEditImageInput,
  SaveCrimeHistoryInput,
  SaveCrimeHistoryResult,
} from "../model/types";

const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"];

const stripZone = (entries: PatternEntry[]) => entries.map(stripPatternPath);

/** 감정물 번호를 URL 경로 조각으로 — 허용 문자만 쓰지만 방어용으로 인코딩한다. */
const crimePath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}`;

/**
 * GET /crime/ — 앱에서 등록한 감정물 목록. Mirror of crud.js#fetchCrimeData.
 * 목록 API는 끝에 `/`를 붙인다(빼면 서버가 리다이렉트하며 중계 환경에서 scheme이 틀어짐, 설계서 §3-1).
 * 서버가 준 루트 기준 이미지 경로(`image`·`pidinet_outline`)는 `backendMediaUrl`로 화면용 주소로 바꾼다.
 */
export async function fetchCrimeList(): Promise<Crime[]> {
  const data = await apiGet<CrimeDto[]>("/crime/");
  const withMedia = data.map((row) => ({
    ...row,
    ...(row.image !== undefined && { image: backendMediaUrl(row.image) }),
    ...(row.pidinet_outline !== undefined && {
      pidinet_outline: backendMediaUrl(row.pidinet_outline),
    }),
  }));
  return convertKeysToCamelCase<Crime[]>(withMedia);
}

/**
 * GET /crime/:aprthngNo — 이 감정물의 검색 이력 목록
 * (`{searchNo, frstRegistDt, ranking, mtchgId}` 행, searchNo 오름차순).
 */
export async function fetchCrimeDetail(aprthngNo: string): Promise<CrimeHistoryRow[]> {
  const data = await apiGet<CrimeHistoryRowDto[]>(crimePath(aprthngNo));
  return convertKeysToCamelCase<CrimeHistoryRow[]>(data);
}

/**
 * GET /crime/history/:searchNo — 이력 1건 스냅샷, 문양은 전체 경로로 붙인다.
 * Mirror of crud.js#fetchHistoryData.
 */
export async function fetchCrimeHistory(searchNo: number): Promise<Crime> {
  const data = await apiGet<CrimeDto>(`/crime/history/${encodeURIComponent(searchNo)}`);

  for (const zone of PATTERN_ZONES) {
    data[zone] = (data[zone] ?? []).map((item) => insertPatternPath(item));
  }

  return convertKeysToCamelCase<Crime>(data);
}

/**
 * POST /crime/register — 본문 키는 설계서 §4-4 그대로, image만 접두어 제거.
 * `originalFileId`(원본 파일 번호)는 있을 때만 넣는다(실증 확장 설계서 §5-E).
 */
export async function registerCrime(input: CrimeRegisterInput): Promise<Response> {
  const body: CrimeRegisterBody = {
    image: stripDataUrlPrefix(input.image),
    aprthngNo: input.aprthngNo,
    apprslReqestNo: input.apprslReqestNo,
    pickDt: input.pickDt,
    pickPlace: input.pickPlace,
    pickMthCode: input.pickMthCode,
    crimeNm: input.crimeNm,
    rqestGrfcNm: input.rqestGrfcNm,
    ...(input.originalFileId !== undefined && { originalFileId: input.originalFileId }),
  };

  return apiSend("/crime/register", "POST", body);
}

/**
 * POST /files/original — 편집 전 원본 이미지를 바이트 그대로 보관한다(multipart `file`,
 * 실증 확장 설계서 §5-E). 등록 화면이 파일을 고르는 순간 부르고, 받은 `fileId`를 등록 요청의
 * `originalFileId`로 보낸다. 실패는 `ApiError` — 413 「파일이 너무 큽니다(최대 50MB)」·
 * 400 「이미지 파일이 아닙니다」 같은 서버 `detail`을 그대로 담는다.
 *
 * `Content-Type`은 직접 붙이지 않는다(브라우저가 multipart 경계 값을 넣어야 한다).
 */
export async function uploadOriginal(file: File): Promise<OriginalUploadResult> {
  const form = new FormData();
  // File을 그대로 넣는다(파일 이름은 File.name이 따라간다 — 서버가 orgnl_file_nm에 남김).
  form.append("file", file);
  const response = await backendFetch("/files/original", { method: "POST", body: form });
  if (!response.ok) throw await toApiError(response);
  return convertKeysToCamelCase<OriginalUploadResult>(await response.json());
}

/** PUT /crime/:aprthngNo. Mirror of crud.js#fetchPatterns. */
export async function putCrimePatterns(
  aprthngNo: string,
  currentCrimeData: Pick<Crime, PatternZone> & {
    extractedRaw?: Crime["extractedRaw"];
  }
): Promise<Response> {
  const body: PatternsPutBody = {
    top: stripZone(currentCrimeData.top),
    mid: stripZone(currentCrimeData.mid),
    bottom: stripZone(currentCrimeData.bottom),
    outline: stripZone(currentCrimeData.outline),
    // REQ-SCENE-009(a): 있으면 그대로 전달(없으면 생략 — 신발/레거시 경로 영향 없음).
    extracted_raw: currentCrimeData.extractedRaw,
  };

  return apiSend(crimePath(aprthngNo), "PUT", body);
}

/**
 * POST /crime/:aprthngNo — 이력 저장. 저장 시각은 서버가 정하므로 보내지 않는다.
 * 응답 `{"search_no": n}`을 `{ searchNo }`로 돌려준다.
 */
export async function saveCrimeHistory({
  aprthngNo,
  currentCrimeData,
  ranking = null,
  mtchgId = null,
}: SaveCrimeHistoryInput): Promise<SaveCrimeHistoryResult> {
  const body: HistorySaveBody = {
    top: stripZone(currentCrimeData.top),
    mid: stripZone(currentCrimeData.mid),
    bottom: stripZone(currentCrimeData.bottom),
    outline: stripZone(currentCrimeData.outline),
    ranking: ranking ? parseInt(String(ranking), 10) : 0,
    mtchgId,
    editImage: stripDataUrl(currentCrimeData.editImage),
    // REQ-SCENE-009(c): 있으면 히스토리 스냅샷에 포함(없으면 null).
    extractedRaw: currentCrimeData.extractedRaw ?? null,
  };

  const response = await apiSend(crimePath(aprthngNo), "POST", body);
  return convertKeysToCamelCase<SaveCrimeHistoryResult>(await response.json());
}

/** PUT /crime/edit_image/:aprthngNo. Mirror of crud.js#fetchEditImageSave. */
export async function saveCrimeEditImage({
  aprthngNo,
  scrollState,
}: SaveCrimeEditImageInput): Promise<Response> {
  // 백엔드는 image로 string을 요구한다(null이면 422). data URL이면 base64 payload만 떼고,
  // 접두어 없는 raw base64면 그대로 보낸다. 이미지가 아예 없을 때만 null.
  const { image } = scrollState;
  const body: EditImageSaveBody = {
    image: image?.startsWith("data:image/") ? image.split(",")[1] : (image ?? null),
  };

  return apiSend(`/crime/edit_image/${encodeURIComponent(aprthngNo)}`, "PUT", body);
}
