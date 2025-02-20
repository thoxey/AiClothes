import React, { useState, useEffect } from "react";
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Carousel, Button, Card, Popconfirm } from "antd";
import "../Wardrobe.css";

const { Meta } = Card;

const Wardrobe = ({ onAdd }) => {
  const [items, setItems] = useState([]);

  // Fetch the wardrobe items from the DB when the component mounts.
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

  const getImageSrc = (base64) => base64 ? `data:image/png;base64,${base64}` : "";

  // Function to delete the item
  const handleDelete = async (itemId) => {
    console.log("Deleting item with ID:", itemId); // Debugging

    if (!itemId) {
      console.error("Invalid item ID");
      return;
    }

    try {
      const response = await fetch(`/clothing-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item.");
      }

      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  return (
    <div className="wardrobe-container">
      <h1 className="shimmering-header">WARDROBE</h1>

      <Carousel autoplay slidesPerRow={6} draggable={true} style={{ width: '80%', margin: "0 auto"}}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
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
                actions={[
                  <Popconfirm
                    title="Are you sure?"
                    description="This action cannot be undone."
                    okText="Yes, delete"
                    cancelText="Cancel"
                    onConfirm={() => handleDelete(item.id)} // Now using the correct `id`
                  >
                    <DeleteOutlined key="delete" style={{ color: "red" }} />
                  </Popconfirm>
                ]}
            >
              <Meta title={item.clothingType} description={item.dominantColor} />
            </Card>
          </div>
        ))}
      </Carousel>

      <Button shape="square" icon={<PlusCircleOutlined />} placement="top" size="large" onClick={onAdd} />
    </div>
  );
};

export default Wardrobe;
