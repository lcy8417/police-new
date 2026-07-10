import { useState } from "react";

import { useCrimeStore } from "@/entities/crime";
import { usePageHeader } from "@/widgets/app-shell";
import { SearchForm, type SearchFormState } from "@/features/crime-search";

const initialSearchForm: SearchFormState = {
  crimeNumber: "",
  imageNumber: "",
  crimeName: "",
  findTime: "",
  requestOffice: "",
  findMethod: "",
};

/** Ported from `src/pages/CrimeSearch.jsx` (context -> store, legacy Header -> usePageHeader). */
export function CrimeSearchPage() {
  const crimeData = useCrimeStore((s) => s.crimeData);
  usePageHeader({ title: "사건 목록" });

  const [searchForm, setSearchForm] = useState<SearchFormState>(initialSearchForm);

  return (
    <>
      {crimeData && (
        <SearchForm searchForm={searchForm} setSearchForm={setSearchForm} />
      )}
    </>
  );
}
