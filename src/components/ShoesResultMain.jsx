import { useState, useEffect } from "react";
import "./ShoesResultMain.css";
import ImageLoader from "./ImageLoader";
import RetrievalResults from "./RetrievalResults";
import Sidebar from "./Sidebar";
import { imageSearch, imageLoad } from "../services/api";
import { useParams, useSearchParams } from "react-router-dom";
import { crimeDataContext } from "../App";
import { useContext } from "react";
import { filteredPatterns } from "../utils/get-input-change";

const ShoesResultMain = () => {
  const { crimeNumber } = useParams();
  const [currentPageData, setCurrentPageData] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams] = useSearchParams();
  const [currentImage, setCurrentImage] = useState(null);
  const edit = searchParams.get("edit") === "true";
  const { crimeData } = useContext(crimeDataContext);
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );
  const formData = {
    image: edit
      ? currentImage
      : `http://192.168.0.17:8000/crime_images/${crimeNumber}.png`,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentImage) {
          const image = await imageLoad({ crimeNumber, edit });
          setCurrentImage(image);
        }
        if (currentImage) {
          const { top, mid, bottom, outline } =
            filteredPatterns(currentCrimeData);

          const { result, total } = await imageSearch({
            crimeNumber: crimeNumber,
            body: { image: currentImage, top, mid, bottom, outline },
            page: page,
          });
          setTotalCount(total);
          setCurrentPageData(result);
        }
      } catch (error) {
        console.error("Error fetching image search data:", error);
      }
    };

    fetchData();
  }, [page, currentImage]);

  return (
    <div className="ShoesResultMain">
      <Sidebar />
      <div className="main">
        <ImageLoader formData={formData} value="현장이미지" />
        <RetrievalResults
          currentPageData={currentPageData}
          page={page}
          setPage={setPage}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};
export default ShoesResultMain;
