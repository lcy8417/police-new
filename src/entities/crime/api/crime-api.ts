import { apiGet, apiSend, stripDataUrl, stripDataUrlPrefix } from "@/shared/api";
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
  PatternsPutBody,
  SaveCrimeEditImageInput,
  SaveCrimeHistoryInput,
  SaveCrimeHistoryResult,
} from "../model/types";

const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"];

const stripZone = (entries: PatternEntry[]) => entries.map(stripPatternPath);

/** 감정물 번호를 URL 경로 조각으로 — 허용 문자만 쓰지만 방어용으로 인코딩한다. */
const crimePath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}`;

/** GET /crime — 앱에서 등록한 감정물 목록. Mirror of crud.js#fetchCrimeData. */
export async function fetchCrimeList(): Promise<Crime[]> {
  const data = await apiGet<CrimeDto[]>("/crime");
  return convertKeysToCamelCase<Crime[]>(data);
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

/** POST /crime/register — 본문 키는 설계서 §4-4 그대로, image만 접두어 제거. */
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
  };

  return apiSend("/crime/register", "POST", body);
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
