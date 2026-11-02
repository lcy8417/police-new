// @MX:DEBT: [AUTO] 레거시 CRUD API 계층 - services/api.js(이미지 처리, 무변환)와 짝을 이루는 이중 API 컨벤션 중 camelCase 변환 계층. entities/crime·entities/shoe의 타입드 API로 점진 대체 중이나 아직 활성 상태(레거시 .jsx 컴포넌트 다수가 참조)
// @MX:CEILING: entities/{crime,shoe}/api가 이 파일의 모든 export(fetchCrimeData/fetchShoesData/fetchCurrentShoes/fetchShoesEdit/fetchHistoryData/fetchCrimeRegister/fetchPatterns/fetchHistorySave/fetchEditImageSave)를 대체하기 전까지 유효
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

// 서버에서 현재 모델 번호에 해당되는 신발 데이터 가져오기
export const fetchCurrentShoes = async (modelNumber) => {
  const response = await fetch(`${url}/shoes/${modelNumber}`, {
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

// 서버에서 현재 모델 번호에 해당되는 신발 데이터 수정하기
export const fetchShoesEdit = async ({ modelNumber, body }) => {
  const { image, ...restBody } = body; // 이미지 필드는 제외하고 나머지 필드만 전송

  const response = await fetch(`${url}/shoes/${modelNumber}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...restBody,
      top: onlyPatternName(restBody, "top"),
      mid: onlyPatternName(restBody, "mid"),
      bottom: onlyPatternName(restBody, "bottom"),
      outline: onlyPatternName(restBody, "outline"),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shoes data");
  }

  const data = await response.json();
  return convertKeysToCamelCase(data);
};

// 서버에서 id와 매칭되는 범죄 데이터 가져오기
export const fetchHistoryData = async (id) => {
  const response = await fetch(`${url}/crime/history/${id}`, {
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
export const fetchPatterns = async (crimeNumber, currentCrimeData) => {
  const response = await fetch(`${url}/crime/${crimeNumber}`, {
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

export const fetchHistorySave = async ({
  crimeNumber,
  currentCrimeData,
  ranking = null,
  modelNumber = null,
}) => {
  const response = await fetch(`${url}/crime/${crimeNumber}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      top: onlyPatternName(currentCrimeData, "top"),
      mid: onlyPatternName(currentCrimeData, "mid"),
      bottom: onlyPatternName(currentCrimeData, "bottom"),
      outline: onlyPatternName(currentCrimeData, "outline"),
      crimeNumber: currentCrimeData.crimeNumber,
      // @MX:NOTE: [AUTO] KST +9시간 하드코딩 중복 - shared/lib/kst.ts#toKstIso와 동일 로직이 여기 별도로 인라인 중복됨(레거시 미마이그레이션 지점)
      registerTime: new Date(Date.now() + 9 * 60 * 60 * 1000)
        .toISOString()
        .replace("Z", "+09:00"),
      image: currentCrimeData.image,
      ranking: ranking ? parseInt(ranking) : 0,
      editImage: currentCrimeData.editImage?.startsWith("data:image/")
        ? currentCrimeData.editImage.split(",")[1]
        : null,
      matchingShoes: modelNumber,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save patterns");
  }
};

export const fetchEditImageSave = async ({ crimeNumber, scrollState }) => {
  const response = await fetch(`${url}/crime/edit_image/${crimeNumber}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: scrollState.image?.startsWith("data:image/")
        ? scrollState.image.split(",")[1]
        : null,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save edited image");
  }
};
