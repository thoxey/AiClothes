import React, { useState, useEffect } from "react";
import { Carousel, Button, Card } from "antd";

const { Meta } = Card;

const Wardrobe = ({ onAdd }) => {
  const [items, setItems] = useState([]);

  // Fetch the wardrobe items from the DB when the component mounts.
  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const response = await fetch("/clothing-items");
        const data = await response.json();
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
      <Carousel autoplay slidesPerRow={7} style={{ width: '80%', margin: "0 auto" }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
          <Card
            hoverable
            style={{ width: 300 }}
            cover={
              <img
                src={getImageSrc(item.imageBase64)}
                alt={item.clothingType}
                style={{ maxHeight: 300, objectFit: "contain" }}
              />
            }
          >
            <Meta
              title={item.clothingType}
              description={item.dominantColor}
            />
          </Card>
        </div>
      ))}
    </Carousel>
      <div style={{ marginTop: "1rem" }}>
        <Button type="primary" onClick={onAdd}>
          Add Clothing
        </Button>
      </div>
    </div>
  );
};

export default Wardrobe;
