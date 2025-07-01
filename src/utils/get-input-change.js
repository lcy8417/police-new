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
  console.log(data, kind);
  return data[kind].map((item) => {
    if (item.length == 2)
      // 필수가 포함된 경우
      return [item[0].split("/").pop().split(".")[0], item[1]];
    else return item.split("/").pop().split(".")[0];
  });
};
