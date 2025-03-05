import React, { useState } from "react";
import { Card } from "antd";
import "../ClothesRail.css"; // Import styles

const getImageSrc = (base64) => (base64 ? `data:image/png;base64,${base64}` : "");

const ClothesRail = ({ items }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div className="clothes-rail">
      <div className="clothes-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className="clothing-item"
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <img src={getImageSrc(item.imageBase64)} alt={item.clothingType} />

            {hoveredItem && hoveredItem.id === item.id && (
              <div className="hover-info">
                <Card size="small" className="info-card">
                  <p><strong>Type:</strong> {item.clothingType}</p>
                  <p><strong>Colors:</strong> {item.colors?.join(", ") || "Unknown"}</p>
                  <p><strong>Pattern:</strong> {item.pattern || "None"}</p>
                  <p><strong>Style:</strong> {item.style || "Casual"}</p>
                </Card>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClothesRail;
