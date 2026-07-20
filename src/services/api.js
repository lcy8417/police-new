// @MX:DEBT: [AUTO] 이미지 처리 API 계층 - services/crud.js(CRUD, camelCase 변환)와 짝을 이루는 이중 API 컨벤션 중 무변환 계층. 응답이 서버 원형 snake_case 그대로 유지되어 소비 측에서 항상 어느 계층인지 확인해야 함(docs/api-communication.md §2)
// @MX:CEILING: 이미지 처리 엔드포인트(patterns_extract/search/image_load/perspective/similarity/edit-save)가 typed entities 계층으로 승격되기 전까지 유효
// @MX:UPGRADE: entities/crime(또는 신규 entities/image-processing)에 타입드 래퍼가 추가되고 이 파일의 호출부가 모두 이전되면 삭제 검토
const url = import.meta.env.VITE_API_URL;

export const imageProcessing = async (
  crimeNumber,
  endPoint,
  body = null,
  params = null
) => {
  const queryString =
    params instanceof URLSearchParams ? `?${params.toString()}` : "";

  const fullUrl = `${url}/crime/${crimeNumber}/${endPoint}${queryString}`;
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error(`${endPoint} request failed`);
  }

  const data = await response.json();
  return data.image;
};

export const patternsExtract = async ({ crimeNumber = "", body }) => {
  const fullUrl = `${url}/crime/${crimeNumber}/patterns_extract`;
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Patterns extraction failed");
  }

  const data = await response.json();

  // REQ-SCENE-002/006(D2): 현장(crime)은 부위별 4-키 응답이 아니라 단일 통합
  // {code,score} 리스트다 — 기존 top/mid/bottom/outline 정규화 분기를 타지 않는다.
  // 신발(shoes) 등 그 외 type은 레거시 4-키 응답을 그대로 유지한다(REQ-SCENE-011).
  if (body?.type === "crime") {
    return { extracted: data };
  }

  return {
    top: data.top,
    mid: data.mid,
    bottom: data.bottom,
    outline: data.outline,
  };
};

export const imageSearch = async ({
  crimeNumber = "",
  body,
  page = 0,
  binary = "원본",
  similarity = false,
}) => {
  const queryString = new URLSearchParams({ page, similarity }).toString();
  const fullUrl = `${url}/crime/${crimeNumber}/search?${queryString}`;
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Patterns extraction failed");
  }

  const data = await response.json();

  let shoesDir = binary === "이진화보기" ? "B" : "Shoerinsics";

  const total = data.total;
  const result = data.result.map((item) => ({
    ...item,
    image: `${url}/shoes_images/${shoesDir}/${item.image}.png`, // Adjust the path as needed
    shoesName: item.image,
  }));
  return { result, total };
};

export const imageLoad = async ({ crimeNumber, edit }) => {
  const queryString = new URLSearchParams({ edit }).toString();
  const fullUrl = `${url}/crime/${crimeNumber}/image_load?${queryString}`;
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Image load failed");
  }

  const data = await response.json();
  return data.image;
};

export const fetchPerspective = async (image, points) => {
  const body = {
    polygon: points,
    image: image,
  };

  const fullUrl = `${url}/crime/demo/perspective`;
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error("Perspective correction failed");
  }

  const data = await response.json();
  return data;
};

export const fetchSimilarity = async ({
  crimeNumber,
  modelNumber,
  maxMatches = 6,
  minScore = 0.25,
  verify = true,
  filterUninformative = true,
  edge = true,
}) => {
  // 이미지 처리 API라 camelCase 변환은 하지 않는다(응답은 서버 원형 snake_case 그대로).
  // 강화 응답(query/ref/matches[])을 받기 위한 파라미터를 추가한다.
  const queryString = new URLSearchParams({
    model_number: modelNumber,
    max_matches: maxMatches,
    min_score: minScore,
    verify,
    filter_uninformative: filterUninformative,
    edge,
  }).toString();

  const fullUrl = `${url}/crime/${crimeNumber}/similarity?${queryString}`;

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Similarity correction failed");
  }

  const data = await response.json();
  return data;
};

export const saveEditImage = async ({ id, image, folder }) => {
  const fullUrl = `${url}/crime/${id}/edit-save`;

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, save_name: `${folder}_${id}` }),
  });

  if (!response.ok) {
    throw new Error("Edit save failed");
  }

  const data = await response.json();
  return data;
};
