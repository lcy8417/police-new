import { useNavigate } from "react-router-dom";
import "./RetrievalResults.css";
import Button from "./Button";

const RetrievalResults = ({
  currentPageData,
  page,
  setPage,
  clickAct = true,
  totalCount = 0,
}) => {
  const navigate = useNavigate();

  const getSimilarityClass = (similarity) => {
    const value =
      typeof similarity === "number" ? similarity : parseFloat(similarity);
    if (isNaN(value)) return "similarity-low";
    if (value >= 0.8) return "similarity-high";
    if (value >= 0.6) return "similarity-mid";
    return "similarity-low";
  };

  return (
    <div className="RetrievalResults">
      <div className="header">
        <p />
        <h2>
          현재페이지: {page + 1} / {Math.ceil(totalCount / 50)}
        </h2>
        <p>총 {totalCount}건</p>
      </div>
      <div className="result-items">
        {currentPageData?.map((item, i) => (
          <div
            className="result-item"
            key={i}
            onClick={
              clickAct &&
              (() =>
                navigate(
                  `detail/${item.shoesName}?ranking=${50 * page + i + 1}`
                ))
            }
          >
            <img src={item.image} alt={`신발 이미지 ${i}`} />
            <div className="item-similarity">
              <div>
                {50 * page + i + 1} / {50 * (page + 1)}
              </div>
              <div>
                유사도:{" "}
                <span
                  className={`similarity-badge ${getSimilarityClass(
                    item.similarity
                  )}`}
                >
                  {item.similarity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="result-footer">
        <Button
          value="<"
          onClick={() => setPage(Math.max(0, parseInt(page) - 1))}
        />
        <Button value=">" onClick={() => setPage(parseInt(page) + 1)} />
      </div>
    </div>
  );
};
export default RetrievalResults;
