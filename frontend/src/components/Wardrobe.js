import React, { useState, useEffect } from "react";

const Wardrobe = ({ onAdd }) => {
  const [items, setItems] = useState([]);

  // Fetch the wardrobe items from the DB when the component mounts.
  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const response = await fetch("/clothing-items");
        const data = await response.json();
        // If the API returns an array directly, use it;
        // otherwise, check for a property called "items"
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("Error fetching wardrobe:", err);
        alert("Error fetching wardrobe");
      }
    };
    fetchWardrobe();
  }, []);

  const getImageSrc = (base64) =>
    base64 ? `data:image/png;base64,${base64}` : "";

  return (
    <div className="wardrobe-container">
      <h1>My Wardrobe</h1>
      <div className="carousel">
        {items.map((item, index) => (
          <div key={index} className="carousel-item">
            <img
              src={getImageSrc(item.imageBase64)}
              alt={item.clothingType}
            />
            <div className="item-info">
              <p>{item.clothingType}</p>
              <p>{item.dominantColor}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="add-button">
        Add Clothing
      </button>
    </div>
  );
};

export default Wardrobe;
