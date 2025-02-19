import React from "react";
import StageWrapper from "./StageWrapper";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const IdentifyStage = ({ cutoutBase64, identifiedClothing, loading, onConfirm }) => {
  return (
    <StageWrapper
      title="Identify Clothing"
      confirmLabel="Identify Clothing & Confirm"
      onConfirm={onConfirm}
      loading={loading}
    >
      {cutoutBase64 && (
        <div style={{ marginTop: "1rem" }}>
          <img src={getImageSrc(cutoutBase64)} alt="Cutout" />
        </div>
      )}
      {identifiedClothing && (
        <div className="clothing-info" style={{ marginTop: "1rem" }}>
          <p>
            <strong>Type:</strong> {identifiedClothing.type}
          </p>
          <p>
            <strong>Colour:</strong> {identifiedClothing.colour}
          </p>
        </div>
      )}
    </StageWrapper>
  );
};

export default IdentifyStage;
