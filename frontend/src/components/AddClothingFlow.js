import React, { useState, useRef } from "react";
import TimelineBar from "./TimelineBar";
import UploadStage from "./UploadStage";
import CutoutStage from "./CutoutStage";
import IdentifyStage from "./IdentifyStage";
import SaveStage from "./SaveStage";

// Define the stages for the timeline bar.
const stages = [
  "Upload & Segmentation",
  "Cutout Generation",
  "Clothing Identification",
  "Save to Wardrobe"
];

const AddClothingFlow = ({ onFlowComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [imageBase64, setImageBase64] = useState("");
  const [maskBase64, setMaskBase64] = useState("");
  const [polygons, setPolygons] = useState([]);
  const [cutoutBase64, setCutoutBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [identifiedClothing, setIdentifiedClothing] = useState(null);

  // Refs for DOM elements in the image stages.
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const svgOverlayRef = useRef(null);

  // Stage 0: Upload & Segmentation
  const handleFileChange = async (e) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64String = ev.target.result.split(",")[1];
      setImageBase64(base64String);
      await uploadImageToFlask(base64String);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToFlask = async (base64String) => {
    try {
      setLoading(true);
      const response = await fetch("/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64String }),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        setMaskBase64(data.mask);
        setPolygons(data.polygons || []);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("An error occurred while uploading.");
      setLoading(false);
    }
  };

  // Stage 1: Generate Cutout
  const generateCutout = async () => {
    if (!maskBase64 || !imageBase64) {
      alert("No image or mask available!");
      return;
    }
    try {
      setLoading(true);
      const requestBody = { imageBase64, maskBase64 };
      const response = await fetch("/save-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        setCutoutBase64(data.cutoutBase64);
      } else {
        alert("Error generating cutout: " + data.error);
      }
    } catch (err) {
      console.error("Generate Cutout Error:", err);
      alert("An error occurred while generating the cutout.");
      setLoading(false);
    }
  };

  // Stage 2: Clothing Identification
  const identifyClothingFunc = async () => {
    if (!cutoutBase64) {
      alert("No cutout image available!");
      return;
    }
    try {
      setLoading(true);
      const requestBody = { cutoutBase64 };
      const response = await fetch("/identify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        setIdentifiedClothing({
          type: data.clothingType,
          colour: data.dominantColor,
        });
      } else {
        alert("Identification failed: " + data.error);
      }
    } catch (err) {
      console.error("Error identifying image:", err);
      alert("An error occurred while identifying.");
      setLoading(false);
    }
  };

  // Stage 3: Save Clothing to Wardrobe
  const saveClothing = async () => {
    if (!cutoutBase64) {
      alert("No cutout image available!");
      return;
    }
    if (!identifiedClothing) {
      alert("No clothing identified!");
      return;
    }
    try {
      setLoading(true);
      const requestBody = {
        cutoutBase64,
        clothingType: identifiedClothing.type,
        dominantColor: identifiedClothing.colour,
      };
      const response = await fetch("/save-to-wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        alert("Clothing saved successfully!");
      } else {
        alert("Saving failed: " + data.error);
      }
    } catch (err) {
      console.error("Error saving clothing:", err);
      alert("An error occurred while saving.");
      setLoading(false);
    }
  };

  // Handle confirm button presses for each stage.
  const handleConfirmStage = async () => {
    if (currentStage === 1 && !cutoutBase64) {
      await generateCutout();
    } else if (currentStage === 2 && !identifiedClothing) {
      await identifyClothingFunc();
    } else if (currentStage === 3) {
      await saveClothing();
    }
    if (currentStage < stages.length - 1) {
      setCurrentStage((prev) => prev + 1);
    } else {
      // When the final stage is complete, return to the main Wardrobe page.
      onFlowComplete();
    }
  };

  // Render overlay polygons on the image.
  const renderPolygons = () => {
    return polygons.map((pathStr, idx) => {
      const handleClick = () => {
        setSelectedSegments((prev) => {
          const newSet = new Set(prev);
          newSet.has(pathStr) ? newSet.delete(pathStr) : newSet.add(pathStr);
          return newSet;
        });
      };
      const isSelected = selectedSegments.has(pathStr);
      return (
        <path
          key={idx}
          d={pathStr}
          fillRule="evenodd"
          className={`segment ${isSelected ? "selected" : ""}`}
          onClick={handleClick}
        />
      );
    });
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 0:
        return (
          <UploadStage
            imageBase64={imageBase64}
            fileInputRef={fileInputRef}
            imageRef={imageRef}
            svgOverlayRef={svgOverlayRef}
            renderPolygons={renderPolygons}
            onFileChange={handleFileChange}
            onConfirm={() => setCurrentStage((prev) => prev + 1)}
          />
        );
      case 1:
        return (
          <CutoutStage
            imageBase64={imageBase64}
            imageRef={imageRef}
            svgOverlayRef={svgOverlayRef}
            renderPolygons={renderPolygons}
            cutoutBase64={cutoutBase64}
            loading={loading}
            onConfirm={handleConfirmStage}
          />
        );
      case 2:
        return (
          <IdentifyStage
            cutoutBase64={cutoutBase64}
            identifiedClothing={identifiedClothing}
            loading={loading}
            onConfirm={handleConfirmStage}
          />
        );
      case 3:
        return (
          <SaveStage
            cutoutBase64={cutoutBase64}
            identifiedClothing={identifiedClothing}
            loading={loading}
            onConfirm={handleConfirmStage}
          />
        );
      default:
        return (
          <div className="stage-container">
            <h1>Process Complete!</h1>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {loading && <div id="loading-spinner">Loading...</div>}
      <div className="content">{renderStageContent()}</div>
      <TimelineBar stages={stages} currentStage={currentStage} />
    </div>
  );
};

export default AddClothingFlow;
