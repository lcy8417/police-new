import { apiGet, apiSend, backendMediaUrl, stripDataUrlPrefix, ApiError } from "@/shared/api";
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

/** 서버가 준 루트 기준 이미지 경로(`image`)를 화면용 주소로(`backendMediaUrl`, 중계면 그대로). */
const withMediaUrl = (shoe: ShoeDto): ShoeDto =>
  shoe.image !== undefined ? { ...shoe, image: backendMediaUrl(shoe.image) } : shoe;

/**
 * 신발 → 수정/등록 공통 본문(설계서 §4-4 키만). 그룹·성별·크기 등 읽기 전용 필드는
 * 보내지 않는다. 비어 있는 메타데이터는 `""`/`null` 그대로(서버가 NULL로 저장).
 */
const toEditBody = (shoe: Shoe): ShoesEditBody => ({
  colctPlace: shoe.colctPlace ?? null,
  colctYear: shoe.colctYear ?? null,
  makrCode: shoe.makrCode ?? null,
  brandCode: shoe.brandCode ?? null,
  modlNm: shoe.modlNm ?? null,
  top: stripZone(shoe.top),
  mid: stripZone(shoe.mid),
  bottom: stripZone(shoe.bottom),
  outline: stripZone(shoe.outline),
});

/**
 * GET /shoes?page=N — 신발 목록 한 페이지(서버 페이지 크기 50). Mirror of
 * crud.js#fetchShoesData. 백엔드는 빈 페이지(데이터 없음/범위 밖)를 404로 응답하므로
 * 이를 빈 목록으로 흡수한다(전체 개수는 fetchShoesCount로 따로 조회한다).
 */
export async function fetchShoesList(page = 0): Promise<Shoe[]> {
  try {
    // 목록 API는 끝에 `/`를 붙인다(빼면 서버가 리다이렉트하며 중계 환경에서 scheme이 틀어짐, 설계서 §3-1).
    const data = await apiGet<ShoeDto[]>(`/shoes/?page=${page}`);
    return convertKeysToCamelCase<Shoe[]>(data.map(withMediaUrl));
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

/** GET /shoes/:ftwrId. ID는 문자열 그대로(앞자리 0 보존) 경로에 넣는다. */
export async function fetchShoeDetail(ftwrId: string): Promise<Shoe> {
  const data = await apiGet<ShoeDto>(`/shoes/${encodeURIComponent(ftwrId)}`);
  return convertKeysToCamelCase<Shoe>(withMediaUrl(data));
}

/**
 * PUT /shoes/:ftwrId — 설계서 §4-4 수정 키만 보낸다(`image`·`ftwrId` 제외, 문양은 이름만).
 * 서버는 `{message}`만 돌려주므로 반환값은 없다.
 */
export async function updateShoe({ ftwrId, body }: UpdateShoeInput): Promise<void> {
  await apiSend(`/shoes/${encodeURIComponent(ftwrId)}`, "PUT", toEditBody(body));
}

/**
 * POST /shoes/register — 새 신발 등록. 수정 본문에 `image`(접두어 제거, 없으면 `""`)와
 * `ftwrId`를 더해 보낸다. Returns `void` (서버 응답은 `{message}`뿐).
 */
export async function registerShoe(input: Shoe): Promise<void> {
  const body: ShoesRegisterBody = {
    image: stripDataUrlPrefix(input.image ?? ""),
    ftwrId: input.ftwrId,
    ...toEditBody(input),
  };

  await apiSend("/shoes/register", "POST", body);
}
