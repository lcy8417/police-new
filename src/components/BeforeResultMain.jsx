import "./BeforeResultMain.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader";
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation
import PartialPatterns from "./PartialPatterns"; // Assuming you have a PartialPatterns component for displaying patterns
import RetrievalResults from "./RetrievalResults";

const ShoesResultDetail = () => {
  const [formData, setFormData] = useState({
    image: "/src/assets/00001-23-0360_1.png",
    editImage: "/src/assets/00001-23-0360_1.png",
  });

  const { number } = useParams();

  const [currentPatterns, setCurrentPatterns] = useState([]);
  const [currentPartial, setCurrentParial] = useState("상");

  const [currentPageData, setCurrentPageData] = useState([]);
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

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const temp = [];

    const shoesFiles = import.meta.glob("/src/assets/Patterns/다각/*", {
      eager: true,
    });
    const imagePaths = Object.keys(shoesFiles);
    const randomImages = imagePaths.sort(() => 0.5 - Math.random()).slice(0, 8);

    for (let i = 0; i < 8; i++) {
      temp.push(randomImages[i]);
    }

    setCurrentPatterns([
      {
        title: "현장패턴",
        top: temp.slice(0, 3),
        mid: temp.slice(3, 6),
        bottom: temp.slice(6, 8),
      },
      {
        title: "DB패턴",
        top: temp.slice(0, 3),
        mid: temp.slice(3, 6),
        bottom: temp.slice(6, 8),
      },
    ]);
  }, [number, currentPartial]);

  return (
    <div className="BeforeResultMain">
      <div className="main">
        <div className="images-container">
          <div className="shoes-image">
            <ImageLoader
              formData={formData}
              propsImage={formData.image}
              value="현장이미지"
            />
          </div>
          <div className="shoes-image">
            <ImageLoader
              formData={formData}
              propsImage={formData.image}
              value="편집이미지"
            />
          </div>
        </div>
        <div className="images-container">
          <div className="shoes-image">
            <ImageLoader
              formData={formData}
              propsImage={formData.image}
              value="바닥이미지"
            />
          </div>
          <div className="shoes-image">
            <ImageLoader
              formData={formData}
              propsImage={formData.image}
              value="측면이미지"
            />
          </div>
        </div>
        <PartialPatterns patternItems={currentPatterns} />
        <RetrievalResults
          currentPageData={currentPageData}
          page={page}
          setPage={setPage}
          clickAct={false}
        />
      </div>
    </div>
  );
};
export default ShoesResultDetail;
