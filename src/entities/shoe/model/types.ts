/**
 * Shoe pattern entries are bare path strings (unlike crime's `[path, essential]`
 * tuple — see @/entities/pattern's `PatternEntry` union). `stripPatternPath`'s
 * string branch and `insertPatternPath`'s string branch both handle this
 * variant directly.
 */
export type ShoePattern = string;

/**
 * Snake_case wire shape for shoe reads:
 *  - GET /shoes?page=N     (list, crud.js#fetchShoesData)
 *  - GET /shoes/:modelNumber (crud.js#fetchCurrentShoes)
 */
export interface ShoeDto {
  id?: number;
  model_number?: string;
  find_location?: string;
  manufacturer?: string;
  find_year?: number | string;
  emblem?: string;
  image?: string | null;
  top: ShoePattern[];
  mid: ShoePattern[];
  bottom: ShoePattern[];
  outline: ShoePattern[];
}

/** CamelCase app model — `convertKeysToCamelCase(ShoeDto)`. */
export interface Shoe {
  id?: number;
  modelNumber?: string;
  findLocation?: string;
  manufacturer?: string;
  findYear?: number | string;
  emblem?: string;
  image?: string | null;
  top: ShoePattern[];
  mid: ShoePattern[];
  bottom: ShoePattern[];
  outline: ShoePattern[];
}

// NO symmetric converter — write bodies are hand-mapped per crud.js#fetchShoesEdit.

/**
 * PUT /shoes/:modelNumber body. Mirror of crud.js#fetchShoesEdit: destructures
 * `{ image, ...restBody } = body` off the (camelCased) `Shoe` state to DROP
 * `image` entirely, then re-serializes `restBody` with every pattern zone
 * stripped to bare names via `onlyPatternName` (typed successor:
 * `stripPatternPath`). The remaining field names stay camelCase on the wire —
 * `fetchShoesEdit` never converts back to snake_case before sending.
 */
export interface ShoesEditBody {
  id?: number;
  modelNumber?: string;
  findLocation?: string;
  manufacturer?: string;
  findYear?: number | string;
  emblem?: string;
  top: string[];
  mid: string[];
  bottom: string[];
  outline: string[];
}

/** Input to `updateShoe`. Mirror of crud.js#fetchShoesEdit's `{ modelNumber, body }` params. */
export interface UpdateShoeInput {
  modelNumber: string;
  body: Shoe;
}
