import "./SearchResults.css";

const SearchResults = ({
  filteredData,
  tableClick,
  columns,
  title = null,
  doubleClick = null,
}) => {
  return (
    <div className="SearchResults">
      <h1>{title}</h1>
      <table className="form-table">
        <thead>
          <tr>
            {columns.map((key, index) => (
              <th key={index}>{key}</th>
            ))}
          </tr>
        </thead>
        {filteredData && (
          <tbody>
            {filteredData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() =>
                  tableClick(item.crimeNumber || item.modelNumber || item.id)
                }
                onDoubleClick={() => doubleClick && doubleClick(item.id)}
                className="table-row"
              >
                {Object.keys(filteredData[0]).map((key, index) => (
                  <td key={index}>{item[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default SearchResults;
