import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import "./RetrievalResults.css";
import Button from "./Button";

const RetrievalResults = ({
  currentPageData,
  page,
  clickAct = true,
  totalCount = 0,
}) => {
  const navigate = useNavigate();
  const { crimeNumber } = useParams();
  const [searchParams] = useSearchParams();
  const resultItemsRef = useRef(null);
  const [inputPage, setInputPage] = useState(page + 1);

  useEffect(() => {
    setInputPage(page + 1);
  }, [page]);

  const getSimilarityClass = (similarity) => {
    const value =
      typeof similarity === "number" ? similarity : parseFloat(similarity);
    if (isNaN(value)) return "similarity-low";
    if (value >= 0.8) return "similarity-high";
    if (value >= 0.6) return "similarity-mid";
    return "similarity-low";
  };

  const handlePageMove = () => {
    const targetPage = Math.max(
      1,
      Math.min(parseInt(inputPage) || 1, Math.ceil(totalCount / 50))
    );
    const newPage = targetPage - 1; // 0-based index
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", newPage);
    resultItemsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    navigate(
      `/search/${crimeNumber}/shoesResult?${newSearchParams.toString()}`
    );
  };

  return (
    <div className="RetrievalResults">
      <div className="header">
        <p />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ margin: 0 }}>현재페이지:</h2>
          <input
            type="number"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePageMove()}
            style={{
              width: "60px",
              padding: "5px",
              fontSize: "16px",
              textAlign: "center",
            }}
            min="1"
            max={Math.ceil(totalCount / 50)}
          />
          <h2 style={{ margin: 0 }}>/ {Math.ceil(totalCount / 50)}</h2>
          <Button value="이동" onClick={handlePageMove} />
        </div>
        <p>총 {totalCount}건</p>
      </div>
      <div className="result-items" ref={resultItemsRef}>
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
            <div className="result-item-title">No. {item.shoesName}</div>
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
          onClick={() => {
            const newPage = Math.max(0, parseInt(page) - 1);
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("page", newPage);
            resultItemsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            navigate(
              `/search/${crimeNumber}/shoesResult?${newSearchParams.toString()}`
            );
          }}
        />
        <Button
          value=">"
          onClick={() => {
            const newPage = parseInt(page) + 1;
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("page", newPage);
            resultItemsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            navigate(
              `/search/${crimeNumber}/shoesResult?${newSearchParams.toString()}`
            );
          }}
        />
      </div>
    </div>
  );
};
export default RetrievalResults;
