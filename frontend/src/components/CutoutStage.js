import React, { useState, useEffect } from "react";
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
  const [imgSize, setImgSize] = useState({ width: 100, height: 100 });

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
      handleLoad();
    } else {
      imageRef.current?.addEventListener("load", handleLoad);
    }

    return () => {
      imageRef.current?.removeEventListener("load", handleLoad);
    };
  }, [imageBase64]);

  return (
    <StageWrapper
      title="Generate Cutout"
      confirmLabel="Generate Cutout & Confirm"
      onConfirm={onConfirm}
      loading={loading}
    >
      {imageBase64 && (
        <div style={{ position: "relative", marginTop: "1rem" }}>
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
