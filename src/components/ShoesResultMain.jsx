import { useState, useEffect } from "react";
import "./ShoesResultMain.css";
import ImageLoader from "./ImageLoader";
import RetrievalResults from "./RetrievalResults";
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation
import { imageSearch } from "../services/api"; // Adjust the import path as necessary
import { useParams } from "react-router-dom"; // For accessing route parameters

const ShoesResultMain = () => {
  const { crimeNumber } = useParams();
  const [currentPageData, setCurrentPageData] = useState([]);
  const formData = {
    image: `http://localhost:8000/crime_images/${crimeNumber}.png`,
  };
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await imageSearch({
          crimeNumber: crimeNumber,
          body: { image: crimeNumber },
          page: page,
        });

        setCurrentPageData(data);
      } catch (error) {
        console.error("Error fetching image search data:", error);
      }
    };

    fetchData();
  }, [page]);

  return (
    <div className="ShoesResultMain">
      <Sidebar />
      <div className="main">
        <ImageLoader formData={formData} value="현장이미지" />
        <RetrievalResults
          currentPageData={currentPageData}
          page={page}
          setPage={setPage}
        />
      </div>
    </div>
  );
};
export default ShoesResultMain;
