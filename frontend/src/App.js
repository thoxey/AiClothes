// src/App.js
import React, { useState, useRef } from "react";
import "./App.css"; // or Wardrobe.css

function App() {
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [imageBase64, setImageBase64] = useState(""); // store original uploaded image
  const [maskBase64, setMaskBase64] = useState("");   // store returned mask from Flask
  const [polygons, setPolygons] = useState([]);       // store segmentation polygons
  const [cutoutBase64, setCutoutBase64] = useState(""); // store final cutout
  const [loading, setLoading] = useState(false);

  // Refs for DOM (SVG overlay, etc.)
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const svgOverlayRef = useRef(null);

  // Convert the user’s selected file to Base64 (in the browser)
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // ev.target.result is something like "data:image/png;base64,AAAA..."
      const base64String = ev.target.result.split(",")[1];
      // store in state
      setImageBase64(base64String);

      // Now send to Flask for segmentation
      await uploadImageToFlask(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Send the base64 image to Flask (/upload -> or rename /segment, etc.)
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
        // store returned mask + polygons
        setMaskBase64(data.mask);
        setPolygons(data.polygons);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("An error occurred while uploading.");
      setLoading(false);
    }
  };

  // “Save selection” or “apply mask” call to Flask
  const handleSaveSelection = async () => {
    if (!maskBase64 || !imageBase64) {
      alert("No image or mask available!");
      return;
    }
    try {
      setLoading(true);
      const requestBody = {
        imageBase64: imageBase64,  // original image
        maskBase64: maskBase64,    // the segmentation mask
      };
      const response = await fetch("/save-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      setLoading(false);

      if (data.success) {
        // server returns a final cutout as base64
        setCutoutBase64(data.cutoutBase64);
      } else {
        alert("Error saving selection: " + data.error);
      }
    } catch (err) {
      console.error("Save Error:", err);
      setLoading(false);
    }
  };

  // Deselect all polygons
  const handleDeselectAll = () => {
    setSelectedSegments(new Set());
  };

  // Toggle polygon selection
  const renderPolygons = () => {
    return polygons.map((pathStr, idx) => {
      const handleClick = () => {
        setSelectedSegments((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(pathStr)) {
            newSet.delete(pathStr);
          } else {
            newSet.add(pathStr);
          }
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

  // Helper to assemble a full data URL from base64
  const getImageSrc = (base64) => {
    return base64 ? `data:image/png;base64,${base64}` : "";
  };

  return (
    <div className="App">
      <h1>👕 My Wardrobe (All In-Memory)</h1>

      {/* Upload Button */}
      <label className="upload-button" htmlFor="imageUpload">
        Choose Image
      </label>
      <input
        type="file"
        id="imageUpload"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Buttons */}
      <div className="button-container">
        <button onClick={handleDeselectAll} className="secondary-button">
          Deselect All
        </button>
        <button onClick={handleSaveSelection} className="primary-button">
          Save Selection
        </button>
      </div>

      {/* Spinner */}
      {loading && <div id="loading-spinner" />}

      {/* Image & SVG Overlay */}
      <div id="segmentation-container" style={{ position: "relative" }}>
        {imageBase64 && (
          <>
            <img
              id="uploaded-image"
              src={getImageSrc(imageBase64)}
              alt="Uploaded"
              ref={imageRef}
            />
            <svg
              id="svg-overlay"
              ref={svgOverlayRef}
              style={{ position: "absolute", top: 0, left: 0 }}
              width="100%"
              height="100%"
              viewBox={`0 0 ${
                imageRef.current?.naturalWidth || 100
              } ${imageRef.current?.naturalHeight || 100}`}
            >
              {renderPolygons()}
            </svg>
          </>
        )}
      </div>

      <h2>Cutout Image</h2>
      <div id="cutout-container">
        {cutoutBase64 && (
          <img src={getImageSrc(cutoutBase64)} alt="Cutout" />
        )}
      </div>
    </div>
  );
}

export default App;
