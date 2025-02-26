import React, { useRef, useState } from "react";
import { Spin, message } from "antd";
import { CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import BookStage from "./BookStage";
import { useAddItemFlowContext } from "./AddItemFlowContext";

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const CutoutStage = ({ onComplete }) => {
  const { imageBase64 } = useAddItemFlowContext();
  const imageRef = useRef(null);
  const [clickPoint, setClickPoint] = useState(null);
  const [imagePoint, setImagePoint] = useState(null); // Image-space coordinates
  const [loading, setLoading] = useState(false); // Track API request status
  const [cutoutImage, setCutoutImage] = useState(null); // Store the final cutout

  const handleContainerClick = (event) => {
    if (!imageRef.current) return;
    if (event.target !== imageRef.current) return; // Ignore clicks outside the image

    const rect = event.currentTarget.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    setClickPoint({ x: rawX, y: rawY }); // Store the raw display position
  };

  const handleImageClick = (event) => {
    if (!imageRef.current) return;

    const offsetX = event.nativeEvent.offsetX;
    const offsetY = event.nativeEvent.offsetY;

    setImagePoint({ x: offsetX, y: offsetY });

    sendToSegmentedImageAPI(offsetX, offsetY);
  };

    const { updateCutout } = useAddItemFlowContext(); // Get the context function

    const sendToSegmentedImageAPI = async (x, y) => {
      if (!imageBase64) return;

      setLoading(true);

      try {
        const response = await fetch("/create-segmented-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            clickPoint: { x, y }, // Send clicked point to backend
          }),
        });

        const data = await response.json();
        setLoading(false);

        if (data.success) {
          setCutoutImage(data.cutoutBase64); // Store the processed cutout
          updateCutout(data.cutoutBase64); // Save cutout to context
        } else {
          message.error("Failed to generate cutout: " + data.error);
        }
      } catch (error) {
        console.error("Error processing segmentation:", error);
        message.error("Failed to process image.");
        setLoading(false);
      }
    };

  return (
    <BookStage
      title="Generate Cutout"
      leftContent={
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "crosshair",
            userSelect: "none", // Prevents selection drag
          }}
          onClick={handleContainerClick}
        >
          {imageBase64 && (
            <img
              ref={imageRef}
              src={getImageSrc(imageBase64)}
              alt="Uploaded"
              draggable="false"
              onClick={handleImageClick}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", pointerEvents: "auto" }}
            />
          )}

          {clickPoint && (
            <CloseCircleOutlined
              style={{
                position: "absolute",
                top: `${clickPoint.y}px`,
                left: `${clickPoint.x}px`,
                fontSize: "20px",
                color: "red",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          )}

          {loading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(255, 255, 255, 0.6)",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <Spin size="large" />
            </div>
          )}
        </div>
      }
      rightContent={
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {cutoutImage ? (
            <>
              <img src={getImageSrc(cutoutImage)} alt="Cutout" style={{ maxWidth: "100%", maxHeight: "100%" }} />

              {/* Tick icon to move to the next stage */}
              <CheckCircleOutlined
                onClick={() => {
                  console.log("✅ Tick clicked, moving to next stage...");
                  onComplete(); // Call the next stage function
                }}
                style={{
                  position: "absolute",
                  bottom: "10%",
                  right: "10%",
                  fontSize: "50px",
                  color: "rgba(0, 255, 0, 0.7)", // Semi-transparent green
                  cursor: "pointer",
                }}
              />
            </>
          ) : (
            <p>Click on the image to generate a cutout.</p>
          )}
        </div>
      }
    />
  );
};

export default CutoutStage;
