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

export const rotateImage = (base64Image, degrees) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 회전 각도에 따라 캔버스 크기 조정
      const isVertical = Math.abs(degrees % 180) === 90;
      canvas.width = isVertical ? img.height : img.width;
      canvas.height = isVertical ? img.width : img.height;

      // 캔버스 중앙으로 이동
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // 회전
      ctx.rotate((degrees * Math.PI) / 180);

      // 이미지 그리기 (중앙 기준)
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Base64로 변환
      const rotatedBase64 = canvas.toDataURL("image/png");
      resolve(rotatedBase64);
    };
    img.src = base64Image;
  });
};
