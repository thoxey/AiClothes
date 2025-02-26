import React, { useState, useRef } from "react";
import BookStage from "./BookStage";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const UploadStage = () => {
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result.split(",")[1]); // Extract Base64 data
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <BookStage
      title="Upload an Image"
      leftContent={
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {!imageBase64 && (
            <Button
              type="dashed"
              shape="circle"
              icon={<PlusOutlined style={{ fontSize: "8rem" }} />} // Large plus icon
              onClick={handleUploadClick}
              style={{
                width: "40%",
                height: "40%",
                minWidth: "150px",
                minHeight: "150px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "50%",
              }}
            />
          )}

          {imageBase64 && (
            <img
              src={getImageSrc(imageBase64)}
              alt="Uploaded"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}
        </div>
      }
      rightContent={<div />} // Empty right panel for now
    />
  );
};

export default UploadStage;
