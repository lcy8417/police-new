import "./ResultDetailMain.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import PatternList from "./PatternList";

const ShoesResultDetail = () => {
  const [formData, setFormData] = useState({
    image: "/src/assets/00001-23-0360_1.png",
    사건등록번호: "2023-00001",
    이미지번호: "1",
    사건명: "신발 사건",
    의뢰관서: "서울지방경찰청",
    채취일시: "2023-10-01",
    작성자: "홍길동",
    채취장소: "서울시 강남구",
    채취방법: "현장채취",
    순위: "1",
    처리구분: "",
  });
  const { number } = useParams();

  const [currentPageData, setCurrentPageData] = useState([]);
  const [currentPartial, setCurrentParial] = useState("상");

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const temp = [];

    const shoesFiles = import.meta.glob("/src/assets/Patterns/다각/*", {
      eager: true,
    });
    const imagePaths = Object.keys(shoesFiles);
    const randomImages = imagePaths.sort(() => 0.5 - Math.random()).slice(0, 8);

    for (let i = 0; i < 8; i++) {
      temp.push({
        id: i,
        image: randomImages[i],
      });
    }

    setCurrentPageData(temp);
  }, [number, currentPartial]);

  const partialChange = (e) => {
    const kinds = ["상", "중", "하"];
    const currentIndex = kinds.indexOf(currentPartial);

    if (e.target.textContent === "<") {
      setCurrentParial(kinds[(currentIndex - 1 + kinds.length) % kinds.length]);
    } else if (e.target.textContent === ">") {
      setCurrentParial(kinds[(currentIndex + 1) % kinds.length]);
    }
  };

  return (
    <div className="ResultDetailMain">
      <ImageLoader formData={formData} propsImage={formData.image} />
      <div className="gt-shoes-images">
        <div className="gt-shoes-image">
          <ImageLoader
            formData={formData}
            propsImage={formData.image}
            value="바닥이미지"
          />
        </div>
        <div className="gt-shoes-image">
          <ImageLoader
            formData={formData}
            propsImage={formData.image}
            value="측면이미지"
          />
        </div>
      </div>
      <div className="partial-patterns">
        <div className="header-buttons">
          <Button value="<" onClick={partialChange} />
          <h3>문양 비교</h3>
          <Button value=">" onClick={partialChange} />
        </div>
        <div className="patterns-container">
          <h3 className="partial-kind">{currentPartial}</h3>
          <PatternList
            patterns={
              currentPageData && currentPageData.map((data) => data.image)
            }
            title="현장패턴"
            buttonVisible={false}
          />
          <PatternList
            patterns={
              currentPageData && currentPageData.map((data) => data.image)
            }
            title="DB패턴"
            buttonVisible={false}
          />
        </div>
      </div>
      <div className="detail-info">
        <FormList formData={formData} direction="flex" />
        <div className="button-items">
          <Button
            value="불발견"
            size="full-width"
            onClick={() => {
              setFormData({
                ...formData,
                처리구분: "불발견",
              });
            }}
          />
          <Button
            value="발견"
            size="full-width"
            onClick={() => {
              setFormData({
                ...formData,
                처리구분: "발견",
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default ShoesResultDetail;
