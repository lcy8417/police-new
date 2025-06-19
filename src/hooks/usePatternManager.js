import filesLoad from "../hooks/useFileLoad";
import { useEffect, useRef, useState, useContext } from "react";
import { crimeDataContext } from "../App";

const usePatternManager = ({
  index = -1,
  formData = null,
  setFormData = null,
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

  const extractPattern = () => {
    console.log("패턴 추출");
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

    const exists = crimeData[index][kind].some(
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
