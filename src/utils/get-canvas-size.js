export const updateCanvasPosition = ({
  imgRef,
  canvasRef,
  mode = "patterns",
  originSize = null,
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

  let imageWidth = $img.offsetWidth;
  let imageHeight = $img.offsetHeight;

  // originSize의 정보가 있는 경우
  if (originSize) {
    imageWidth = originSize[0];
    imageHeight = originSize[1];
  }

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
