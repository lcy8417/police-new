import { useState, useEffect } from "react";
import "./ShoesResultMain.css";
import ImageLoader from "./ImageLoader";
import RetrievalResults from "./RetrievalResults";

const ShoesResultMain = () => {
  const [currentPageData, setCurrentPageData] = useState([]);
  const formData = {
    image: "/src/assets/00001-23-0360_1.png",
  };
  const [page, setPage] = useState(0);

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const temp = [];

    const shoesFiles = import.meta.glob("/src/assets/Shoes/B/*", {
      eager: true,
    });
    const imagePaths = Object.keys(shoesFiles);
    const randomImages = imagePaths
      .sort(() => 0.5 - Math.random())
      .slice(0, 50);

    for (let i = 0; i < 50; i++) {
      temp.push({
        id: i,
        image: randomImages[i],
        similarity: "95%",
      });
    }

    setCurrentPageData(temp);
  }, [page]);

  return (
    <div className="ShoesResultMain">
      <ImageLoader
        formData={formData}
        value="현장이미지"
        propsImage={formData.image}
      />
      <RetrievalResults
        currentPageData={currentPageData}
        page={page}
        setPage={setPage}
      />
    </div>
  );
};
export default ShoesResultMain;
