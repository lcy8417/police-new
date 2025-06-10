import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormItem from "./FormItem";
import "./CrimeRegisterMain.css";
import React from "react";
import FormList from "./FormList";

const CrimeRegisterMain = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="CrimeRegisterMain">
      <ImageLoader formData={formData} setFormData={setFormData} />
      <FormList formData={formData} handleChange={handleChange} />
    </div>
  );
};

export default CrimeRegisterMain;
