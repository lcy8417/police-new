import { apiGet, apiSend, stripDataUrl, stripDataUrlPrefix } from "@/shared/api";
import { convertKeysToCamelCase, toKstIso } from "@/shared/lib";
import { insertPatternPath, stripPatternPath, type PatternEntry, type PatternZone } from "@/entities/pattern";
import type {
  Crime,
  CrimeDto,
  CrimeRegisterBody,
  CrimeRegisterInput,
  EditImageSaveBody,
  HistorySaveBody,
  PatternsPutBody,
  SaveCrimeEditImageInput,
  SaveCrimeHistoryInput,
} from "../model/types";

const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"];

const stripZone = (entries: PatternEntry[]) => entries.map(stripPatternPath);

/** GET /crime — the full crime list. Mirror of crud.js#fetchCrimeData. */
export async function fetchCrimeList(): Promise<Crime[]> {
  const data = await apiGet<CrimeDto[]>("/crime");
  return convertKeysToCamelCase<Crime[]>(data);
}

/**
 * GET /crime/:crimeNumber — rows for a single crime.
 * No literal counterpart in crud.js/api.js: the app fetches this URL ad hoc
 * in components/DetailMain.jsx without camelCasing. Implemented here with
 * `convertKeysToCamelCase` for consistency with the rest of the typed read
 * layer; see the final report for this deviation.
 */
export async function fetchCrimeDetail(crimeNumber: string): Promise<Crime[]> {
  const data = await apiGet<CrimeDto[]>(`/crime/${crimeNumber}`);
  return convertKeysToCamelCase<Crime[]>(data);
}

/**
 * GET /crime/history/:id — a single history record, patterns hydrated to
 * full asset paths. Mirror of crud.js#fetchHistoryData.
 */
export async function fetchCrimeHistory(id: string | number): Promise<Crime> {
  const data = await apiGet<CrimeDto>(`/crime/history/${id}`);

  for (const zone of PATTERN_ZONES) {
    data[zone] = (data[zone] ?? []).map((item) => insertPatternPath(item));
  }

  return convertKeysToCamelCase<Crime>(data);
}

/** POST /crime/register. Mirror of crud.js#fetchCrimeRegister. */
export async function registerCrime(input: CrimeRegisterInput): Promise<Response> {
  const body: CrimeRegisterBody = {
    ...input,
    image: stripDataUrlPrefix(input.image),
  };

  return apiSend("/crime/register", "POST", body);
}

/** PUT /crime/:crimeNumber. Mirror of crud.js#fetchPatterns. */
export async function putCrimePatterns(
  crimeNumber: string,
  currentCrimeData: Pick<Crime, PatternZone>
): Promise<Response> {
  const body: PatternsPutBody = {
    top: stripZone(currentCrimeData.top),
    mid: stripZone(currentCrimeData.mid),
    bottom: stripZone(currentCrimeData.bottom),
    outline: stripZone(currentCrimeData.outline),
  };

  return apiSend(`/crime/${crimeNumber}`, "PUT", body);
}

/** POST /crime/:crimeNumber. Mirror of crud.js#fetchHistorySave. */
export async function saveCrimeHistory({
  crimeNumber,
  currentCrimeData,
  ranking = null,
  modelNumber = null,
}: SaveCrimeHistoryInput): Promise<Response> {
  const body: HistorySaveBody = {
    top: stripZone(currentCrimeData.top),
    mid: stripZone(currentCrimeData.mid),
    bottom: stripZone(currentCrimeData.bottom),
    outline: stripZone(currentCrimeData.outline),
    crimeNumber: currentCrimeData.crimeNumber,
    registerTime: toKstIso(),
    image: currentCrimeData.image,
    ranking: ranking ? parseInt(String(ranking), 10) : 0,
    editImage: stripDataUrl(currentCrimeData.editImage),
    matchingShoes: modelNumber,
  };

  return apiSend(`/crime/${crimeNumber}`, "POST", body);
}

/** PUT /crime/edit_image/:crimeNumber. Mirror of crud.js#fetchEditImageSave. */
export async function saveCrimeEditImage({
  crimeNumber,
  scrollState,
}: SaveCrimeEditImageInput): Promise<Response> {
  const body: EditImageSaveBody = {
    image: stripDataUrl(scrollState.image),
  };

  return apiSend(`/crime/edit_image/${crimeNumber}`, "PUT", body);
}
