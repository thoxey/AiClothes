import React, { useEffect, useState } from "react";
import { Card, Spin, message, Select } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import BookStage from "./BookStage";
import { useAddItemFlowContext } from "./AddItemFlowContext";

const { Option } = Select;

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const IdentifyStage = ({ onComplete }) => {
  const { cutoutBase64 } = useAddItemFlowContext();
  const [identifiedClothing, setIdentifiedClothing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClothing, setSelectedClothing] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);

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
          const clothingOptions = data.clothingType?.map(item => item.label) || ["Unknown"];
          const colorOptions = data.colors?.map(item => item.label) || ["Unknown"];
          const patternOptions = data.pattern?.map(item => item.label) || ["Unknown"];
          const styleOptions = data.style?.map(item => item.label) || ["Unknown"];

          setIdentifiedClothing({
            clothingOptions,
            colorOptions,
            patternOptions,
            styleOptions,
            imageBase64: cutoutBase64, // Keep the cutout as the preview image
          });

          // ✅ Preselect the top result for each category
          setSelectedClothing(clothingOptions[0]);
          setSelectedColors(colorOptions.slice(0, 2)); // Allow multiple colours
          setSelectedPattern(patternOptions[0]);
          setSelectedStyle(styleOptions[0]);
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
    if (!selectedClothing || selectedColors.length === 0 || !selectedPattern || !selectedStyle) return;
    setSaving(true);

    try {
      const response = await fetch("/save-to-wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutoutBase64,
          clothingType: selectedClothing,
          colors: selectedColors,
          pattern: selectedPattern,
          style: selectedStyle
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
              cover={<img src={getImageSrc(identifiedClothing.imageBase64)} alt={selectedClothing} />}
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
              <div style={{ marginBottom: "10px" }}>
                <p style={{ marginBottom: "4px" }}>Clothing Type:</p>
                <Select
                  value={selectedClothing}
                  onChange={setSelectedClothing}
                  style={{ width: "100%" }}
                >
                  {identifiedClothing.clothingOptions.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <p style={{ marginBottom: "4px" }}>Colors:</p>
                <Select
                  mode="multiple"
                  value={selectedColors}
                  onChange={setSelectedColors}
                  style={{ width: "100%" }}
                >
                  {identifiedClothing.colorOptions.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <p style={{ marginBottom: "4px" }}>Pattern:</p>
                <Select
                  value={selectedPattern}
                  onChange={setSelectedPattern}
                  style={{ width: "100%" }}
                >
                  {identifiedClothing.patternOptions.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <p style={{ marginBottom: "4px" }}>Style:</p>
                <Select
                  value={selectedStyle}
                  onChange={setSelectedStyle}
                  style={{ width: "100%" }}
                >
                  {identifiedClothing.styleOptions.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </div>
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
