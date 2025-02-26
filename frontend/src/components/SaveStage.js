import React, { useEffect, useState } from "react";
import { Spin, message, Result } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import BookStage from "./BookStage";
import { useAddItemFlowContext } from "./AddItemFlowContext";

const SaveStage = ({ onComplete }) => {
  const { cutoutBase64 } = useAddItemFlowContext();
  const { clothingType, dominantColor } = useAddItemFlowContext(); // From IdentifyStage
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!cutoutBase64 || !clothingType || !dominantColor) return;

    // Call the save API when the stage loads
    const saveClothing = async () => {
      try {
        const response = await fetch("/save-to-wardrobe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cutoutBase64, clothingType, dominantColor }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          message.success("Clothing saved to wardrobe!");

          // Auto-complete after 2 seconds
          setTimeout(() => {
            onComplete();
          }, 2000);
        } else {
          message.error("Failed to save clothing: " + data.error);
        }
      } catch (error) {
        console.error("Error saving clothing:", error);
        message.error("Failed to save clothing.");
      } finally {
        setLoading(false);
      }
    };

    saveClothing();
  }, [cutoutBase64, clothingType, dominantColor]);

  return (
    <BookStage
      title="Saving to Wardrobe"
      leftContent={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          {loading ? (
            <Spin size="large" />
          ) : success ? (
            <CheckCircleOutlined style={{ fontSize: "50px", color: "green" }} />
          ) : (
            <p>Saving failed.</p>
          )}
        </div>
      }
      rightContent={
        success ? (
          <Result
            status="success"
            title="Clothing Saved!"
            subTitle="Your item has been added to the wardrobe."
          />
        ) : (
          <p>Saving...</p>
        )
      }
    />
  );
};

export default SaveStage;
