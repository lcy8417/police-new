import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormItem from "./FormItem";
import "./CrimeRegisterMain.css";
import React from "react";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import { handleChange } from "../utils/get-input-change";

const CrimeRegisterMain = ({ formData, setFormData }) => {
  return (
    <div className="CrimeRegisterMain">
      <Sidebar />
      <div className="main">
        <ImageLoader formData={formData} setFormData={setFormData} />
        <FormList
          formData={formData}
          handleChange={(e) => handleChange(e, setFormData)}
        />
      </div>
    </div>
  );
};

export default CrimeRegisterMain;
