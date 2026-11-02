// @MX:DEBT: [AUTO] 레거시 CRUD API 계층 - services/api.js(이미지 처리, 무변환)와 짝을 이루는 이중 API 컨벤션 중 camelCase 변환 계층. entities/crime·entities/shoe의 타입드 API로 점진 대체 중이나 아직 활성 상태(레거시 .jsx 컴포넌트 다수가 참조)
// @MX:CEILING: entities/{crime,shoe}/api가 이 파일의 모든 export(fetchCrimeData/fetchShoesData/fetchCurrentShoes/fetchHistoryData/fetchCrimeRegister/fetchPatterns)를 대체하기 전까지 유효
// @MX:UPGRADE: 레거시 .jsx 컴포넌트(components/*, pages/EditorMode.jsx 등)가 모두 FSD entities/api 계층으로 이전되면 이 파일 삭제
import { onlyPatternName } from "../utils/get-input-change";
import { convertKeysToCamelCase } from "../utils/get-convert-camelcase";

const url = import.meta.env.VITE_API_URL;

// 서버에서 범죄 데이터 가져오기
export const fetchCrimeData = async () => {
  const response = await fetch(`${url}/crime`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch crime data");
  }

  const data = await response.json();
  return convertKeysToCamelCase(data);
};

// 서버에서 현재 page에 해당되는 신발 데이터 가져오기
export const fetchShoesData = async (page = 0) => {
  const fullUrl = `${url}/shoes?page=${page}`;
  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shoes data");
  }

  const data = await response.json();
  return convertKeysToCamelCase(data);
};

// 서버에서 신발 ID(ftwrId, 문자열 — 앞자리 0 보존)에 해당되는 신발 데이터 가져오기
export const fetchCurrentShoes = async (ftwrId) => {
  const response = await fetch(`${url}/shoes/${encodeURIComponent(ftwrId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shoes data");
  }

  const data = await response.json();
  return convertKeysToCamelCase(data);
};

// 서버에서 검색 번호(searchNo)와 매칭되는 이력 스냅샷 가져오기
export const fetchHistoryData = async (searchNo) => {
  const response = await fetch(`${url}/crime/history/${encodeURIComponent(searchNo)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch crime data");
  }

  const urlInsert = (item) => {
    return [`/src/assets/Patterns/전체/${item[0]}.png`, item[1]];
  };

  const data = await response.json();

  console.log(data);

  ["top", "mid", "bottom", "outline"].forEach((key) => {
    data[key] = data[key].map(urlInsert);
  });

  return convertKeysToCamelCase(data);
};

export const fetchCrimeRegister = async (formData) => {
  const response = await fetch(`${url}/crime/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...formData,
      image: formData.image.replace(/^data:image\/[a-z]+;base64,/, ""),
    }),
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response;
};

// 신발 검색 클릭시, 현재까지 패턴의 정보들 DB에 저장
export const fetchPatterns = async (aprthngNo, currentCrimeData) => {
  const response = await fetch(`${url}/crime/${encodeURIComponent(aprthngNo)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      top: onlyPatternName(currentCrimeData, "top"),
      mid: onlyPatternName(currentCrimeData, "mid"),
      bottom: onlyPatternName(currentCrimeData, "bottom"),
      outline: onlyPatternName(currentCrimeData, "outline"),
      // REQ-SCENE-009(a): 통합 DINOv2 추출 원본이 있으면 함께 영속화한다
      // (신발 등 extractedRaw가 없는 레코드는 undefined → JSON에서 생략됨).
      extracted_raw: currentCrimeData.extractedRaw,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save patterns");
  }
};

// 이력 저장(POST /crime/{aprthng_no})·편집 이미지 저장(PUT /crime/edit_image/{aprthng_no})·
// 신발 수정(PUT /shoes/{ftwr_id})의 레거시 함수(fetchHistorySave·fetchEditImageSave·fetchShoesEdit)는
// 호출처가 없어 삭제했다 — entities/crime#saveCrimeHistory·saveCrimeEditImage, entities/shoe#updateShoe를 쓴다.
