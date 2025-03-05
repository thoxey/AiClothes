import React, { useState, useEffect } from "react";
import { Row, Col } from "antd";
import ChatInterface from "./ChatInterface";
import LocationFetcher from "./LocationFetcher";
import { WidgetProvider } from "./WidgetContext";
import ClothesRail from "./ClothesRail";
import "../Wardrobe.css";

const Wardrobe = ({ onAdd }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const response = await fetch("/clothing-items");
        const data = await response.json();
        setItems(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error("Error fetching wardrobe:", err);
        alert("Error fetching wardrobe");
      }
    };
    fetchWardrobe();
  }, []);

  const handleDelete = async (itemId) => {
    if (!itemId) return;

    try {
      const response = await fetch(`/clothing-items/${itemId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item.");
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  return (
    <WidgetProvider>
      <div className="wardrobe-container">
        <h1 className="shimmering-header">WARDROBE</h1>

        <Row justify="center" style={{ width: "100%" }}>
          <Col span={4}>
            <LocationFetcher />
          </Col>
        </Row>

        <ChatInterface />

        {/* ✅ Use the new ClothesRail component */}
        <ClothesRail items={items} onDelete={handleDelete} />
      </div>
    </WidgetProvider>
  );
};

export default Wardrobe;
