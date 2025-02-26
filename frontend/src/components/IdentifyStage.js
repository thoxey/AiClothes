import React, { useEffect, useState } from "react";
import { Card, Spin, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import BookStage from "./BookStage";
import { useAddItemFlowContext } from "./AddItemFlowContext";

const { Meta } = Card;

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const IdentifyStage = ({ onComplete }) => {
  const { cutoutBase64 } = useAddItemFlowContext();
  const [identifiedClothing, setIdentifiedClothing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cutoutBase64) return;

    const identifyClothing = async () => {
      try {
        const response = await fetch("/identify-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cutoutBase64 }),
        });

        const data = await response.json();
        setLoading(false);

        if (data.success) {
          setIdentifiedClothing({
            clothingType: data.clothingType,
            dominantColor: data.dominantColor,
            imageBase64: cutoutBase64, // Keep the cutout as the preview image
          });
        } else {
          message.error("Failed to identify clothing: " + data.error);
        }
      } catch (error) {
        console.error("Error identifying clothing:", error);
        message.error("Failed to process image.");
        setLoading(false);
      }
    };

    identifyClothing();
  }, [cutoutBase64]);

  const handleConfirm = async () => {
    if (!identifiedClothing) return;
    setSaving(true);

    try {
      const response = await fetch("/save-to-wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutoutBase64,
          clothingType: identifiedClothing.clothingType,
          dominantColor: identifiedClothing.dominantColor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Clothing saved to wardrobe!");
        onComplete(); // Reset the flow to add another item
      } else {
        message.error("Failed to save clothing: " + data.error);
      }
    } catch (error) {
      console.error("Error saving clothing:", error);
      message.error("Failed to save clothing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookStage
      title="Identify Clothing"
      leftContent={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          {cutoutBase64 ? (
            <img src={getImageSrc(cutoutBase64)} alt="Cutout" style={{ maxWidth: "100%", maxHeight: "100%" }} />
          ) : (
            <p>No cutout available.</p>
          )}
        </div>
      }
      rightContent={
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
          {loading ? (
            <Spin size="large" />
          ) : identifiedClothing ? (
            <Card
              hoverable
              style={{ width: 300 }}
              cover={<img src={getImageSrc(identifiedClothing.imageBase64)} alt={identifiedClothing.clothingType} />}
              actions={[
                saving ? (
                  <Spin size="small" />
                ) : (
                  <CheckCircleOutlined
                    key="confirm"
                    style={{ fontSize: "30px", color: "green", cursor: "pointer" }}
                    onClick={handleConfirm}
                  />
                ),
              ]}
            >
              <Meta title={identifiedClothing.clothingType} description={identifiedClothing.dominantColor} />
            </Card>
          ) : (
            <p>Clothing identification failed.</p>
          )}
        </div>
      }
    />
  );
};

export default IdentifyStage;
