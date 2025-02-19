import React from "react";
import StageWrapper from "./StageWrapper";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const UploadStage = ({
  imageBase64,
  fileInputRef,
  imageRef,
  svgOverlayRef,
  renderPolygons,
  onFileChange,
  onConfirm,
}) => {
  return (
    <StageWrapper title="Upload an Image" confirmLabel="Confirm Segmentation" onConfirm={onConfirm}>
      <label className="upload-button" htmlFor="imageUpload">
        Choose Image
      </label>
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
          <img id="uploaded-image" src={getImageSrc(imageBase64)} alt="Uploaded" ref={imageRef} />
          <svg
            id="svg-overlay"
            ref={svgOverlayRef}
            style={{ position: "absolute", top: 0, left: 0 }}
            width="100%"
            height="100%"
            viewBox={`0 0 ${imageRef.current?.naturalWidth || 100} ${imageRef.current?.naturalHeight || 100}`}
          >
            {renderPolygons && renderPolygons()}
          </svg>
        </div>
      )}
    </StageWrapper>
  );
};

export default UploadStage;
