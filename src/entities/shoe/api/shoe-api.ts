import { apiGet, apiSend, stripDataUrlPrefix, ApiError } from "@/shared/api";
import { convertKeysToCamelCase } from "@/shared/lib";
import { stripPatternPath } from "@/entities/pattern";
import type {
  Shoe,
  ShoeDto,
  ShoesEditBody,
  ShoesRegisterBody,
  UpdateShoeInput,
} from "../model/types";

const stripZone = (entries: string[]): string[] =>
  entries.map((entry) => stripPatternPath(entry) as string);

/**
 * GET /shoes?page=N — 신발 목록 한 페이지(서버 페이지 크기 50). Mirror of
 * crud.js#fetchShoesData. 백엔드는 빈 페이지(데이터 없음/범위 밖)를 404로 응답하므로
 * 이를 빈 목록으로 흡수한다(전체 개수는 fetchShoesCount로 따로 조회한다).
 */
export async function fetchShoesList(page = 0): Promise<Shoe[]> {
  try {
    const data = await apiGet<ShoeDto[]>(`/shoes?page=${page}`);
    return convertKeysToCamelCase<Shoe[]>(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

/** 서버 페이지 크기(GET /shoes?page=N이 페이지당 반환하는 최대 개수). */
export const SHOES_PAGE_SIZE = 50;

/** GET /shoes/count — 전체 신발 개수. 서버 페이징의 총 페이지 수 계산용. */
export async function fetchShoesCount(): Promise<number> {
  const data = await apiGet<{ count: number }>(`/shoes/count`);
  return data.count;
}

/** GET /shoes/:modelNumber. Mirror of crud.js#fetchCurrentShoes. */
export async function fetchShoeDetail(modelNumber: string): Promise<Shoe> {
  const data = await apiGet<ShoeDto>(`/shoes/${modelNumber}`);
  return convertKeysToCamelCase<Shoe>(data);
}

/**
 * PUT /shoes/:modelNumber. Mirror of crud.js#fetchShoesEdit: drops `image`
 * from the body entirely, strips every pattern zone to bare names. The
 * remaining fields stay camelCase on the wire (no re-conversion to
 * snake_case before sending).
 */
export async function updateShoe({ modelNumber, body }: UpdateShoeInput): Promise<Shoe> {
  const { image: _image, ...restBody } = body;

  const editBody: ShoesEditBody = {
    ...restBody,
    top: stripZone(restBody.top),
    mid: stripZone(restBody.mid),
    bottom: stripZone(restBody.bottom),
    outline: stripZone(restBody.outline),
  };

  const response = await apiSend(`/shoes/${modelNumber}`, "PUT", editBody);
  const data = await response.json();
  return convertKeysToCamelCase<Shoe>(data);
}

/**
 * POST /shoes/register — register a new shoe. Typed successor to legacy
 * `ShoesRegister.jsx`'s inline `fetch(POST /shoes/register)`:
 *  - strips every pattern zone to bare names (`stripPatternPath`),
 *  - removes the `data:image/...;base64,` prefix from `image` (`stripDataUrlPrefix`),
 *    but — unlike `updateShoe` — KEEPS the image in the body,
 *  - leaves the remaining field names camelCase on the wire (CRUD write shape).
 * Returns `void` (mirrors the legacy call, which discarded the response body).
 */
export async function registerShoe(input: Shoe): Promise<void> {
  const { image, ...rest } = input;

  const body: ShoesRegisterBody = {
    ...rest,
    image: stripDataUrlPrefix(image ?? ""),
    top: stripZone(rest.top),
    mid: stripZone(rest.mid),
    bottom: stripZone(rest.bottom),
    outline: stripZone(rest.outline),
  };

  await apiSend("/shoes/register", "POST", body);
}
