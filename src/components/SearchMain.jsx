import Button from "./Button";
import FormItem from "./FormItem";
import "./SearchMain.css"; // Assuming you have a CSS file for styling
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FormList from "./FormList"; // Assuming you have a FormList component

const SearchMain = ({ formData, setFormData, formDemoItems }) => {
  const navigate = useNavigate(); // 훅 호출\

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [filteredData, setFilteredData] = useState(formDemoItems);

  const handleSearch = (e) => {
    e.preventDefault();

    setFilteredData(() => {
      return formDemoItems.filter((tableData) => {
        return Object.keys(formData).every((key) => {
          if (formData[key] === "") return true; // 필터링 조건이 비어있으면 통과
          return tableData[key] && String(tableData[key]) === formData[key];
        });
      });
    });
  };

  return (
    <div className="SearchMain">
      <FormList
        formData={formData}
        handleChange={handleChange}
        direction="grid"
      />
      <div className="button-container">
        <Button value="조회" type="submit" onClick={handleSearch} />
        <Button
          value="초기화"
          type="submit"
          onClick={() =>
            setFormData(() => {
              const resetData = {};
              Object.keys(formData).forEach((key) => {
                resetData[key] = "";
              });
              return resetData;
            })
          }
        />
      </div>
      <div className="search-results">
        <table className="form-table">
          <thead>
            <tr>
              {Object.keys(formData).map((key, index) => (
                <th key={index}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => navigate(`/search/${rowIndex}`)}
                className="table-row"
              >
                {Object.keys(formData).map((key, index) => (
                  <td key={index}>{item[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SearchMain;
