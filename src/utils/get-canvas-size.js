export const updateCanvasPosition = ({
  imgRef,
  canvasRef,
  mode = "patterns",
}) => {
  let $img = null;
  if (imgRef?.current) {
    $img = imgRef.current;
  } else {
    $img = document.querySelector(
      ".image-edit-display .ImageLoader .image-container > img"
    );
  }

  const $imageLoader = document.querySelector(
    ".image-edit-display .ImageLoader"
  );
  if (!$img || !$imageLoader) return;

  // 이미지가 아직 로드되지 않았다면 리턴
  if (!$img.complete || $img.naturalWidth === 0) return;

  const [maxLeft, maxTop, maxWidth, maxHeight] = [
    $imageLoader.offsetLeft,
    $imageLoader.offsetTop,
    $imageLoader.offsetWidth,
    $imageLoader.offsetHeight,
  ];

  const rect = $img.getBoundingClientRect();

  // 이미지 편집에서는 중심점을 기준으로 캔버스 크기 조정
  const imageWidth = $img.naturalWidth;
  const imageHeight = $img.naturalHeight;

  console.log("imageWidth, imageHeight", imageWidth, imageHeight);

  const loaderRect = $imageLoader.getBoundingClientRect();

  // 중심 정렬 좌표 계산
  const editLeft = loaderRect.left + (loaderRect.width - imageWidth) / 2;
  const editTop = loaderRect.top + (loaderRect.height - imageHeight) / 2;

  // 캔버스의 위치와 크기 계산 (edit와 patterns 모드에 따라 다름)
  const [left, top, width, height] = [
    Math.max(mode == "edit" ? editLeft : rect.left, maxLeft),
    Math.max(mode == "edit" ? editTop : rect.top, maxTop),
    Math.min(mode == "edit" ? imageWidth : rect.width, maxWidth),
    Math.min(mode == "edit" ? imageHeight : rect.height, maxHeight),
  ];

  console.log("left, top, width, height", left, top, width, height, mode);
  const canvas = canvasRef.current;
  if (!canvas) return;

  canvas.width = width;
  canvas.height = height;
  canvas.style.position = "fixed";
  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.pointerEvents = "auto";
  canvas.style.zIndex = 999;
};
