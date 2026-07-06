/**
 * Ported from `src/components/SearchResults.jsx` (CSS -> Tailwind). The
 * legacy component remains in place unchanged because `DetailMain.jsx`
 * (a different, out-of-scope page) still imports it directly.
 *
 * Kept intentionally generic (`T extends object`) since the caller may pass
 * either full `Crime` rows or a narrower projection of them; the row shape
 * is read dynamically via `Object.keys`, exactly like the original.
 */
export interface SearchResultsProps<T extends object> {
  filteredData: T[];
  tableClick: (id: string | number) => void;
  columns: string[];
  title?: React.ReactNode;
  doubleClick?: ((id: unknown) => void) | null;
}

export function SearchResults<T extends object>({
  filteredData,
  tableClick,
  columns,
  title = null,
  doubleClick = null,
}: SearchResultsProps<T>) {
  return (
    <div className="box-border h-full w-full min-w-0 flex-[5] min-h-0 overflow-auto rounded-[10px] border border-white bg-white p-5 shadow-[0px_4px_6px_rgba(0,0,0,0.1)]">
      <h1>{title}</h1>
      <table className="mt-6 w-full border-collapse overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <thead>
          <tr>
            {columns.map((key, index) => (
              <th
                key={index}
                className="border border-[#e0e0e0] bg-[#495057] p-[14px] text-center text-white"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        {filteredData && (
          <tbody>
            {filteredData.map((item, rowIndex) => {
              const row = item as Record<string, unknown>;
              return (
                <tr
                  key={rowIndex}
                  onClick={() =>
                    tableClick(
                      (row.crimeNumber || row.modelNumber || row.id) as
                        | string
                        | number
                    )
                  }
                  onDoubleClick={() => doubleClick && doubleClick(row.id)}
                  className="hover:cursor-pointer hover:bg-[#868e96] hover:text-white"
                >
                  {Object.keys(filteredData[0] as object).map((key, index) => (
                    <td
                      key={index}
                      className="border border-[#e0e0e0] p-[14px] text-center"
                    >
                      {row[key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
}
