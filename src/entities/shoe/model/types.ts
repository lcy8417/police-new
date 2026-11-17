/**
 * Shoe pattern entries are bare path strings (unlike crime's `[path, essential]`
 * tuple — see @/entities/pattern's `PatternEntry` union). `stripPatternPath`'s
 * string branch and `insertPatternPath`'s string branch both handle this
 * variant directly.
 */
export type ShoePattern = string;

/**
 * 신발 읽기 응답의 snake_case 원형(설계서 §4-2, SCAS `tbf_ftwrinfo` 열 이름):
 *  - GET /shoes?page=N  (목록, crud.js#fetchShoesData)
 *  - GET /shoes/:ftwrId (상세, crud.js#fetchCurrentShoes)
 *
 * SCAS에는 비어 있는(NULL) 메타데이터가 많아 `ftwr_id` 외 메타 필드는 `string | null`.
 */
export interface ShoeDto {
  /** 신발 ID — 문자열(앞자리 0 보존, 예 `00758`), 최대 8자. */
  ftwr_id: string;
  /** 신발 그룹 ID. */
  ftwr_group_id: string | null;
  /** 신발 그룹명 — 상표 이름 역할(예 `crocs(크록스)-038`). */
  ftwr_group_nm: string | null;
  /** 모델명(최대 500자). */
  modl_nm: string | null;
  /** 상표 코드(최대 9자). */
  brand_code: string | null;
  /** 제조사 코드(최대 8자). */
  makr_code: string | null;
  /** 수집처(최대 200자). */
  colct_place: string | null;
  /** 수집 연도(숫자 4자리 문자열). */
  colct_year: string | null;
  /** 성별 구분 코드. */
  sexdstn_se: string | null;
  /** 스윙 구분 코드. */
  swing_se: string | null;
  /** 신발 크기. */
  ftwr_size: string | null;
  /** 이진 이미지 URL `.../shoes_images/B/<ftwr_id>.png`. */
  image?: string | null;
  top: ShoePattern[];
  mid: ShoePattern[];
  bottom: ShoePattern[];
  outline: ShoePattern[];
  /** (B 단계 J1 · J3) 등록관서 이름. 모르면 `null`(「미상」). */
  regist_org_nm?: string | null;
  /** (J1 · J3) 등록 일시 KST ISO(`2026-11-17T14:03:00+09:00`). SCAS 원본에 없으면 `null`. */
  frst_regist_dt?: string | null;
  /** (J1 · J3) 승인됨(`confm_de` 있음). 승인된 신발은 문양이 잠긴다(J5 · J6 409). */
  approved?: boolean;
  /** (J1 · J3) 승인일자 `YYYYMMDD`(KST). */
  confm_de?: string | null;
  /** (J1 · J3) 작업 상태 — 「문양 대기」 · 「승인 대기」 · 「측면 없음」 중 해당하는 것(없으면 빈 배열). */
  work_status?: string[];
  /** (J1 · J3) 지금 검색 후보에 들어 있나(false = 「검색 후보 아님(배치 반영 전)」). */
  in_search_index?: boolean;
  /** (J3) 승인자 ID. */
  confmer_id?: string | null;
  /** (J3) 승인자 이름. */
  confmer_nm?: string | null;
}

/**
 * CamelCase app model — `convertKeysToCamelCase(ShoeDto)`. 등록 폼(`EMPTY_SHOE_FORM`)도
 * 이 모양을 쓰므로 메타 필드는 optional이고, 화면은 `null`을 빈 칸으로 표시한다.
 */
export interface Shoe {
  /** 신발 ID — 문자열(앞자리 0 보존). `Number()` 변환 금지. */
  ftwrId: string;
  /** 신발 그룹 ID. */
  ftwrGroupId?: string | null;
  /** 신발 그룹명(상표 이름 역할). */
  ftwrGroupNm?: string | null;
  /** 모델명. */
  modlNm?: string | null;
  /** 상표 코드. */
  brandCode?: string | null;
  /** 제조사 코드. */
  makrCode?: string | null;
  /** 수집처. */
  colctPlace?: string | null;
  /** 수집 연도(숫자 4자리 문자열). */
  colctYear?: string | null;
  /** 성별 구분 코드. */
  sexdstnSe?: string | null;
  /** 스윙 구분 코드. */
  swingSe?: string | null;
  /** 신발 크기. */
  ftwrSize?: string | null;
  image?: string | null;
  top: ShoePattern[];
  mid: ShoePattern[];
  bottom: ShoePattern[];
  outline: ShoePattern[];
  /** (B 단계) 등록관서 이름(`null` = 미상). 등록 폼에는 없다. */
  registOrgNm?: string | null;
  /** (B 단계) 등록 일시 KST ISO. */
  frstRegistDt?: string | null;
  /** (B 단계) 승인됨 — 문양 잠김. 서버를 읽기 전(등록 폼)이면 없다. */
  approved?: boolean;
  /** (B 단계) 승인일자 `YYYYMMDD`. */
  confmDe?: string | null;
  /** (B 단계) 작업 상태 목록(「문양 대기」 · 「승인 대기」 · 「측면 없음」). */
  workStatus?: string[];
  /** (B 단계) 검색 후보 여부 — false면 「검색 후보 아님(배치 반영 전)」. 모르면 없다. */
  inSearchIndex?: boolean;
  /** (B 단계, 상세만) 승인자 ID · 이름. */
  confmerId?: string | null;
  confmerNm?: string | null;
}

/**
 * 신발 목록 · 개수 거르기(J1 · J2 쿼리 매개변수). 빈 값 · `"all"`은 보내지 않는다.
 * 날짜는 KST `YYYY-MM-DD`(끝 날짜 포함), 등록관서는 관서 id 문자열.
 */
export interface ShoeListFilters {
  ftwrId?: string;
  makrCode?: string;
  brandCode?: string;
  sex?: string;
  registOrg?: string | null;
  registFrom?: string;
  registTo?: string;
  approval?: "all" | "yes" | "no" | string;
  patternInput?: "all" | "in" | "out" | string;
  groupNm?: string;
  stage?: "pattern" | "group" | "approve";
}

/** J8 `GET /shoes/stages` 응답(camel 변환 뒤). key: pattern · group · approve(· approved — stages만) */
export interface ShoeStages {
  stages: { key: string; count: number }[];
  backlog: { month: string; total: number; parts: { key: string; count: number }[] };
  todayApproved: number;
}

// NO symmetric converter — write bodies are hand-mapped per endpoint.

/**
 * PUT /shoes/:ftwrId 본문(설계서 §4-4, camelCase 그대로 전송). `image`·`ftwrId`는 보내지
 * 않는다(ID는 URL 경로). 비어 있는 메타데이터는 `""`/`null` 그대로 보내면 서버가 NULL로 저장한다.
 * 문양은 `stripPatternPath`로 이름만 남긴다.
 */
export interface ShoesEditBody {
  /** 수집처(최대 200자). */
  colctPlace: string | null;
  /** 수집 연도(빈 값 또는 숫자 4자리). */
  colctYear: string | null;
  /** 제조사 코드(최대 8자). */
  makrCode: string | null;
  /** 상표 코드(최대 9자). */
  brandCode: string | null;
  /** 모델명(최대 500자). */
  modlNm: string | null;
  top: string[];
  mid: string[];
  bottom: string[];
  outline: string[];
}

/** Input to `updateShoe`. */
export interface UpdateShoeInput {
  /** 수정할 신발 ID(URL 경로). */
  ftwrId: string;
  body: Shoe;
  /**
   * (B 단계 J5 선택) 바꿀 바닥 그림 — data URL(그림 바꾸기 · 돌리기). 주면 접두어를 떼어 `image`로 보낸다.
   * 안 주면 그림은 그대로(옛 호출과 같음).
   */
  replaceImage?: string;
}

/**
 * POST /shoes/register 본문(설계서 §4-4). `ShoesEditBody`에 `image`(접두어 제거한 base64)와
 * `ftwrId`가 더해진다.
 */
export interface ShoesRegisterBody extends ShoesEditBody {
  /** base64 이미지 — `data:image/...;base64,` 접두어 제거 후. */
  image: string;
  /** 신발 ID — 필수, 1~8자, 영문·숫자·`-`·`_`, 예약어 `count` 금지. */
  ftwrId: string;
}
