import React, { useRef } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAddItemFlowContext } from "./AddItemFlowContext";
import BookStage from "./BookStage";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const UploadStage = ({ onComplete }) => {
  const fileInputRef = useRef(null);
  const { updateImage } = useAddItemFlowContext(); // Use the context to update image

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1]; // Extract base64 data
        updateImage(base64); // Store in context

        setTimeout(() => {
          onComplete(); // Proceed to the next stage
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <BookStage
      title="Upload an Image"
      leftContent={
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          <Button
            type="dashed"
            shape="circle"
            icon={<PlusOutlined style={{ fontSize: "4rem" }} />}
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "40%", height: "40%", minWidth: "150px", minHeight: "150px", borderRadius: "50%" }}
          />
        </div>
      }
      rightContent={<div />}
    />
  );
};

export default UploadStage;
