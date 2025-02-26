import React from "react";

const BookStage = ({ title, leftContent, rightContent }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        overflow: "hidden", // So it doesn't force scrolling
        padding: "2rem",
      }}
    >
      {/* Left Side (with vertical border) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: "2px solid #ddd",
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        <h2>{title}</h2>
        {/* A wrapper to ensure leftContent can stretch but not overflow */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
          {leftContent}
        </div>
      </div>

      {/* Right Side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        {rightContent}
      </div>
    </div>
  );
};

export default BookStage;
