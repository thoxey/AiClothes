import React from "react";
import StageWrapper from "./StageWrapper";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const CutoutStage = ({
  imageBase64,
  imageRef,
  svgOverlayRef,
  renderPolygons,
  cutoutBase64,
  loading,
  onConfirm,
}) => {
  return (
    <StageWrapper
      title="Generate Cutout"
      confirmLabel="Generate Cutout & Confirm"
      onConfirm={onConfirm}
      loading={loading}
    >
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
      {cutoutBase64 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Cutout Preview:</h3>
          <img src={getImageSrc(cutoutBase64)} alt="Cutout" />
        </div>
      )}
    </StageWrapper>
  );
};

export default CutoutStage;
