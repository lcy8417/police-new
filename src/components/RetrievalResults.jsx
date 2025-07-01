import { useNavigate } from "react-router-dom";
import "./RetrievalResults.css";
import Button from "./Button";

const RetrievalResults = ({
  currentPageData,
  page,
  setPage,
  clickAct = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="RetrievalResults">
      <div className="header">
        <p />
        <h2>현재페이지: {page}</h2>
        <p>총 76400건</p>
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
              <p>유사도: {item.similarity}</p>
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
