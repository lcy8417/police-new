import { apiGet, apiSend } from "@/shared/api";
import { convertKeysToCamelCase } from "@/shared/lib";
import { stripPatternPath } from "@/entities/pattern";
import type { Shoe, ShoeDto, ShoesEditBody, UpdateShoeInput } from "../model/types";

const stripZone = (entries: string[]): string[] =>
  entries.map((entry) => stripPatternPath(entry) as string);

/** GET /shoes?page=N — a page of the shoe list. Mirror of crud.js#fetchShoesData. */
export async function fetchShoesList(page = 0): Promise<Shoe[]> {
  const data = await apiGet<ShoeDto[]>(`/shoes?page=${page}`);
  return convertKeysToCamelCase<Shoe[]>(data);
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
