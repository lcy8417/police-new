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

  let shoesDir = binary === "이진화보기" ? "B" : "Shoerin";
  shoesDir = similarity === "유사부위표출보기" ? shoesDir : "Similarity";

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

export const fetchSimilarity = async ({ crimeNumber, modelNumber }) => {
  const queryString = new URLSearchParams({
    model_number: modelNumber,
  }).toString();
  const fullUrl = `${url}/crime/${crimeNumber}?${queryString}`;

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Perspective correction failed");
  }

  const data = await response.json();
  return data;
};
