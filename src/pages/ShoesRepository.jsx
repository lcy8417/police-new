import ShoesRepositoryMain from "../components/ShoesRepositoryMain";
import Header from "../components/Header";
import { useState } from "react";

const CrimeSearch = () => {
  return (
    <>
      <Header value={"신발 조회 "} />
      <ShoesRepositoryMain />
    </>
  );
};

export default CrimeSearch;
