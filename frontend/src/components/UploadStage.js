import React, { useState, useEffect } from "react";
import StageWrapper from "./StageWrapper";
import {Button} from "antd";
import {UploadOutlined} from "@ant-design/icons";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const UploadStage = ({
  imageBase64,
  fileInputRef,
  imageRef,
  svgOverlayRef,
  renderPolygons,
  onFileChange,
  onConfirm,
  loading,
}) => {
  const [imgSize, setImgSize] = useState({ width: 100, height: 100 });

  // When the image loads, store natural dimensions so the SVG lines up
  useEffect(() => {
    const handleLoad = () => {
      if (imageRef.current) {
        setImgSize({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        });
      }
    };

    if (imageRef.current && imageRef.current.complete) {
      // If user picks a small file that loads instantly
      handleLoad();
    } else {
      imageRef.current?.addEventListener("load", handleLoad);
    }

    return () => {
      imageRef.current?.removeEventListener("load", handleLoad);
    };
  }, [imageBase64]);

    const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <StageWrapper
      title="Upload an Image"
      confirmLabel="Confirm Segmentation"
      onConfirm={onConfirm}
      loading={loading}
    >
      <Button onClick={handleUploadClick} size="large" icon={<UploadOutlined />}>
        Upload Image
      </Button>
      <input
        type="file"
        id="imageUpload"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {imageBase64 && (
        <div style={{ position: "relative", marginTop: "1rem" }}>
          {/* The image is displayed at 100% width, but the natural dimension
              is used inside the SVG's viewBox for correct polygon alignment. */}
          <img
            id="uploaded-image"
            src={getImageSrc(imageBase64)}
            alt="Uploaded"
            ref={imageRef}
            style={{ display: "block", width: "100%", height: "auto" }}
          />

          <svg
            id="svg-overlay"
            ref={svgOverlayRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
          >
            {renderPolygons && renderPolygons()}
          </svg>
        </div>
      )}
    </StageWrapper>
  );
};

export default UploadStage;
