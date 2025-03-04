import React, { useState } from "react";
import { Button, List, Card, Spin } from "antd";
import { useWidgetContext } from "./WidgetContext";
import ReactMarkdown from "react-markdown";

const ChatInterface = () => {
  const { widgetData } = useWidgetContext(); // Get city & weather from context
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateOutfit = async () => {
    setLoading(true); // Disable button while loading

    try {
      const response = await fetch("/suggest-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: widgetData.city || "Unknown Location",
          weather: widgetData.weather ? widgetData.weather.temperature : null,
        }),
      });

      const data = await response.json();
      const aiMessage = { sender: "ai", text: data.suggested_outfit || "No outfit suggestions found." };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: "Error processing your request." }]);
    } finally {
      setLoading(false); // Re-enable button after response
    }
  };

  return (
    <Card title="Wardrobe Guru" style={{ width: "80%", margin: "1rem auto" }}>
      <List
        dataSource={messages}
        renderItem={(msg) => (
          <List.Item style={{ textAlign: "left" }}>
            <span style={{ background: "#f5f5f5", padding: "5px 10px", borderRadius: "5px", display: "block" }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown> {/* Markdown rendering */}
            </span>
          </List.Item>
        )}
        style={{ maxHeight: 300, overflowY: "auto" }}
      />

      <Button onClick={generateOutfit} type="primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? <Spin /> : "Generate me an Outfit"}
      </Button>
    </Card>
  );
};

export default ChatInterface;
