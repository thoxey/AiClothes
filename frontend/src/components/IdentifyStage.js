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

  // Stores available options from backend
  const [fashionOptions, setFashionOptions] = useState({
    clothingTypes: [],
    colors: [],
    patterns: [],
    styles: []
  });

  // Selected values
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);

  // ✅ Fetch all fashion options from backend
  useEffect(() => {
    const fetchFashionOptions = async () => {
      try {
        const response = await fetch("/fashion-options");
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setFashionOptions(data);
      } catch (error) {
        console.error("Error fetching fashion options:", error);
        message.error("Failed to load fashion options.");
      }
    };

    fetchFashionOptions();
  }, []);

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
            clothingOptions: sortOptionsByConfidence(data.clothingType, fashionOptions.clothingTypes),
            colorOptions: sortOptionsByConfidence(data.colors, fashionOptions.colors),
            patternOptions: sortOptionsByConfidence(data.pattern, fashionOptions.patterns),
            styleOptions: sortOptionsByConfidence(data.style, fashionOptions.styles),
            imageBase64: cutoutBase64,
          });

          // ✅ Preselect identified values if available, otherwise use first from available options
          setSelectedClothing(data.clothingType?.[0]?.label || fashionOptions.clothingTypes[0]);
          setSelectedColors(data.colors?.map(item => item.label) || [fashionOptions.colors[0]]);
          setSelectedPattern(data.pattern?.[0]?.label || fashionOptions.patterns[0]);
          setSelectedStyle(data.style?.[0]?.label || fashionOptions.styles[0]);
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
  }, [cutoutBase64, fashionOptions]); // Runs when fashionOptions are available

  // ✅ Function to sort detected items (top confidence first, then the given order)
  const sortOptionsByConfidence = (detected, allOptions) => {
    if (!detected || detected.length === 0) return allOptions;

    const detectedLabels = detected.map(item => item.label);
    const remainingOptions = allOptions.filter(option => !detectedLabels.includes(option));

    return [...detectedLabels, ...remainingOptions];
  };

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
            <Card hoverable style={{ width: 300 }} cover={<img src={getImageSrc(identifiedClothing.imageBase64)} alt={selectedClothing} />} actions={[
              saving ? <Spin size="small" /> : <CheckCircleOutlined key="confirm" style={{ fontSize: "30px", color: "green", cursor: "pointer" }} onClick={handleConfirm} />
            ]}>
              <p>Clothing Type:</p>
              <Select showSearch value={selectedClothing} onChange={setSelectedClothing} style={{ width: "100%" }}>
                {identifiedClothing.clothingOptions.map((option) => <Option key={option} value={option}>{option}</Option>)}
              </Select>

              <p>Colors:</p>
              <Select mode="multiple" showSearch value={selectedColors} onChange={setSelectedColors} style={{ width: "100%" }}>
                {identifiedClothing.colorOptions.map((option) => <Option key={option} value={option}>{option}</Option>)}
              </Select>

              <p>Pattern:</p>
              <Select showSearch value={selectedPattern} onChange={setSelectedPattern} style={{ width: "100%" }}>
                {identifiedClothing.patternOptions.map((option) => <Option key={option} value={option}>{option}</Option>)}
              </Select>

              <p>Style:</p>
              <Select showSearch value={selectedStyle} onChange={setSelectedStyle} style={{ width: "100%" }}>
                {identifiedClothing.styleOptions.map((option) => <Option key={option} value={option}>{option}</Option>)}
              </Select>
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
