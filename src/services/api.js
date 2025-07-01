export const imageProcessing = async (
  crimeNumber,
  endPoint,
  body = null,
  params = null
) => {
  const queryString =
    params instanceof URLSearchParams ? `?${params.toString()}` : "";

  const url = `http://localhost:8000/crime/${crimeNumber}/${endPoint}${queryString}`;
  const response = await fetch(url, {
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
  const url = `http://localhost:8000/crime/${crimeNumber}/patterns_extract`;
  const response = await fetch(url, {
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
  const url = `http://localhost:8000/crime/${crimeNumber}/search?${queryString}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Patterns extraction failed");
  }

  let data = await response.json();
  data = data.result.map((item) => ({
    ...item,
    image: `http://localhost:8000/shoes_images/B/${item.image}.png`, // Adjust the path as needed
    shoesName: item.image,
  }));
  return data;
};
