export const handleChange = (e, setFormData) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

export const imageChangeHandler = (kind, imgRef, currentCrimeData) => {
  const img = imgRef.current;

  if (!img) {
    console.error("Image element not found.");
    return;
  }

  if (kind === "origin") {
    img.src = currentCrimeData.image || "";
  } else if (kind === "edit") {
    img.src = currentCrimeData.editImage || "";
  }
};

export const onlyPatternName = (data, kind) => {
  return data[kind].map((item) => {
    if (item.length == 2)
      // 필수가 포함된 경우
      return [item[0].split("/").pop().split(".")[0], item[1]];
    else return item.split("/").pop().split(".")[0];
  });
};

export const filteredPatterns = (currentCrimeData) => {
  if (!currentCrimeData) return {};

  // 각 패턴 종류별로 필터링된 패턴을 반환
  const filtered = ["top", "mid", "bottom", "outline"].reduce((acc, key) => {
    acc[key] =
      currentCrimeData[key]?.filter((item) => item[1]).map((item) => item[0]) ||
      [];
    acc[key] = onlyPatternName(acc, key);
    return acc;
  }, {});

  return filtered;
};
