import type { EssentialFlag, PatternEntry, PatternZone } from "@/entities/pattern";

/**
 * A pattern entry after `stripPatternPath` — the bare-name wire form sent
 * back to the server on writes (PUT /crime/:crimeNumber, POST /crime/:crimeNumber).
 */
export type StrippedPatternEntry = string | readonly [string, EssentialFlag];

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
}

/** Input to `saveCrimeHistory`. Mirror of crud.js#fetchHistorySave's destructured params. */
export interface SaveCrimeHistoryInput {
  crimeNumber: string;
  currentCrimeData: Pick<Crime, PatternZone> & {
    crimeNumber: string;
    image?: string | null;
    editImage?: string | null;
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
