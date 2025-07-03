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

export const imageSearch = async ({ crimeNumber = "", body, page = 0 }) => {
  const queryString = new URLSearchParams({ page }).toString();
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

  const total = data.total;
  const result = data.result.map((item) => ({
    ...item,
    image: `${url}/shoes_images/B/${item.image}.png`, // Adjust the path as needed
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
