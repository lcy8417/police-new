import filesLoad from "../hooks/useFileLoad";
import { useEffect, useRef, useState, useContext } from "react";
import { crimeDataContext } from "../App";
import { patternsExtract } from "../services/api";

const url = "http://192.168.0.17:8000";

const usePatternManager = ({
  index = -1,
  currentData = null,
  formData = null,
  setFormData = null,
  imgRef = null,
}) => {
  const canvasRef = useRef(null);

  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState(null);
  const { crimeData, setCrimeData } = useContext(crimeDataContext);
  const [lineState, setLineState] = useState({
    lineYs: [100, 200],
    draggingLine: null,
    offsetY: 0,
  });

  const extractPattern = async () => {
    const patternsRoot = "/src/assets/Patterns/전체/";

    // 패턴 이미지 경로를 생성하는 함수. 족적과 신발은 필수 문양 여부에 따라 다르게 처리
    const format = (src) => {
      const returnText = patternsRoot + src + ".png";
      return formData ? returnText : [returnText, 0];
    };

    const requestType = formData ? "shoes" : "crime";

    // 신발 정보 수정일 때는 png 파일 이름을 추출하여 사용
    const shoesImage = formData?.image.includes(".png")
      ? formData?.image.split("/").pop().split(".")[0]
      : formData?.image;

    let requestImage = null;
    // imgRef(현장, 편집이미지 모달)가 있는 경우
    if (imgRef && imgRef.current) {
      // 편집 이미지의 경우
      requestImage = imgRef.current.src.startsWith("data:image")
        ? imgRef.current.src
        : imgRef.current.src.split("/").pop().replace(".png", "");
    } else {
      // 현장 이미지의 경우
      requestImage = currentData?.crimeNumber || shoesImage;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const { top, mid, bottom, outline } = await patternsExtract({
      crimeNumber: currentData?.crimeNumber || "shoes",
      body: {
        image: requestImage,
        line_ys: lineState.lineYs,
        render_size: [rect.width, rect.height],
        type: requestType,
      },
    });

    if (currentData) {
      setCrimeData((prev) =>
        prev.map((item) => {
          if (String(item.crimeNumber) !== String(currentData.crimeNumber)) {
            return item;
          }

          return {
            ...item,
            top: top.map(format),
            mid: mid.map(format),
            bottom: bottom.map(format),
            outline: outline.map(format),
          };
        })
      );
    } else {
      // shoesRegister에서 호출되는 경우
      setFormData((prev) => ({
        ...prev,
        top: top.map(format),
        mid: mid.map(format),
        bottom: bottom.map(format),
        outline: outline.map(format),
      }));
    }
  };

  const clearPattern = () => {
    if (setFormData) {
      // shoesRegister에서 호출되는 경우
      setFormData((prev) => ({
        ...prev,
        top: [],
        mid: [],
        bottom: [],
        outline: [],
      }));
      return;
    }

    // crimeExtract에서 호출되는 경우
    setCrimeData((prev) => {
      if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              top: [],
              mid: [],
              bottom: [],
              outline: [],
            }
          : item
      );
    });
  };

  const patternsKindSelect = (e) => {
    const kind = e.target.textContent;
    filesLoad(kind, setPatterns);
  };

  const insertPattern = (e) => {
    const kind = ["top", "mid", "bottom", "outline"][selected];

    if (setFormData) {
      // shoesRegister에서 호출되는 경우
      if (selected !== null && !formData[kind].includes(e.target.src)) {
        setFormData((prev) => ({
          ...prev,
          [kind]: [...prev[kind], e.target.src],
        }));
      }
      return;
    }

    // crimeExtract에서 호출되는 경우
    if (index === -1) return; // id가 없는 경우 함수 종료

    const exists = crimeData[index][kind]?.some(
      (item) => item[0] === e.target.src
    );

    if (selected !== null && !exists) {
      setCrimeData((prev) => {
        if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

        return prev.map((item, i) =>
          i === index
            ? {
                ...item,
                [kind]: [...item[kind], [e.target.src, 0]], // 새로운 데이터 추가
              }
            : item
        );
      });
    }
  };

  const deletePattern = (kind, src) => {
    if (setFormData) {
      // shoesRegister에서 호출되는 경우
      setFormData((prev) => ({
        ...prev,
        [kind]: prev[kind].filter((prevSrc) => prevSrc !== src),
      }));
      return;
    }

    // crimeExtract에서 호출되는 경우
    if (index === -1) return; // id가 없는 경우 함수 종료

    setCrimeData((prev) => {
      if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [kind]: item[kind].filter((subItem) => subItem[0] !== src),
            }
          : item
      );
    });
  };

  const essentialCheck = (kind, src) => {
    setCrimeData((prev) => {
      if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [kind]: item[kind].map((subItem) => {
                if (subItem[0] === src) {
                  return [subItem[0], !subItem[1]];
                }
                return subItem;
              }),
            }
          : item
      );
    });
  };

  useEffect(() => {
    filesLoad("무늬", setPatterns);
  }, []);

  return {
    canvasRef,
    patterns,
    selected,
    lineState,
    setLineState,
    setSelected,
    extractPattern,
    clearPattern,
    patternsKindSelect,
    insertPattern,
    deletePattern,
    essentialCheck,
    setPatterns, // 추가: 패턴을 외부에서 설정할 수 있도록
  };
};

export default usePatternManager;
