import {
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentType,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";

import { useCrimeStore, type Crime } from "@/entities/crime";
import ButtonImpl from "@/components/Button";
import FormListImpl from "@/components/FormList";

import { SearchResults } from "./SearchResults";

// `Button`/`FormList` are untyped legacy `.jsx` components (kept as-is per the
// migration scope); TS infers overly-narrow prop types for their optional
// callback props (e.g. a `null` default), so we widen them locally here
// without touching the shared components themselves.
const Button = ButtonImpl as ComponentType<{
  value: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: string;
  size?: string;
  disabled?: boolean;
}>;

const FormList = FormListImpl as ComponentType<{
  formData: object;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  direction?: string;
  readOnly?: boolean;
}>;

export interface SearchFormState {
  crimeNumber: string;
  imageNumber: string;
  crimeName: string;
  findTime: string;
  requestOffice: string;
  findMethod: string;
}

/** Column subset shown in the results table, projected from `Crime`. */
type CrimeSearchRow = Pick<
  Crime,
  | "crimeNumber"
  | "imageNumber"
  | "crimeName"
  | "findTime"
  | "requestOffice"
  | "findMethod"
>;

const COLUMN_LABELS = [
  "사건등록번호",
  "이미지번호",
  "사건명",
  "채취일시",
  "의뢰관서",
  "채취방법",
];

const toRow = (item: Crime): CrimeSearchRow => ({
  crimeNumber: item.crimeNumber,
  imageNumber: item.imageNumber,
  crimeName: item.crimeName,
  findTime: item.findTime,
  requestOffice: item.requestOffice,
  findMethod: item.findMethod,
});

export interface SearchFormProps {
  searchForm: SearchFormState;
  setSearchForm: Dispatch<SetStateAction<SearchFormState>>;
}

/** Ported from `src/components/SearchMain.jsx` (CSS -> Tailwind, context -> store). */
export function SearchForm({ searchForm, setSearchForm }: SearchFormProps) {
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const crimeData = useCrimeStore((s) => s.crimeData);
  // Matches the original: the initial `filteredData` is the raw, unmapped
  // `crimeData` (only narrowed to `CrimeSearchRow` once the effect below runs).
  const [filteredData, setFilteredData] = useState<CrimeSearchRow[]>(crimeData);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    console.log("crimeData", crimeData);
    if (crimeData && crimeData.length > 0) {
      setFilteredData(crimeData.map(toRow));
      setColumns(COLUMN_LABELS);
    }
  }, [crimeData]);

  const handleSearch = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setFilteredData(() => {
      return crimeData
        .filter((tableData) => {
          return (Object.keys(searchForm) as (keyof SearchFormState)[]).every(
            (key) => {
              if (searchForm[key] === "") return true; // 필터링 조건이 비어있으면 통과
              return (
                tableData[key] && String(tableData[key]) === searchForm[key]
              );
            }
          );
        })
        .map(toRow);
    });
  };

  const handleClear = () => {
    setSearchForm(() => {
      const resetData = {} as SearchFormState;
      (Object.keys(searchForm) as (keyof SearchFormState)[]).forEach((key) => {
        resetData[key] = "";
      });
      return resetData;
    });
    setFilteredData(crimeData.map(toRow)); // 초기화 시 전체 데이터로 되돌리기
  };

  return (
    <div className="box-border flex h-full w-full min-h-0 min-w-0 flex-[9]">
      <div className="box-border flex h-full w-full min-h-0 flex-col gap-5 p-5">
        <FormList
          formData={searchForm}
          handleChange={handleChange}
          direction="grid"
        />
        <div className="flex min-h-0 flex-1 items-center gap-3">
          <Button value="조회" type="submit" onClick={handleSearch} />
          <Button value="초기화" type="submit" onClick={handleClear} />
        </div>
        <SearchResults
          filteredData={filteredData}
          columns={columns}
          tableClick={(rowIndex) => navigate(`/search/${rowIndex}`)}
        />
      </div>
    </div>
  );
}
