import React, { useState } from "react";
import { Input, Button, List, Card } from "antd";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    //Add code to send to the backend here
  };

  const generateOutfit = async () => {
    try {
      const response = await fetch("/suggest-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      const aiMessage = { sender: "ai", text: data.suggested_outfit || "No outfit suggestions found." };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: "Error processing your request." }]);
    }
  };

  return (
    <Card title="Talk to Wardrobe Guru" style={{ width: '80%', margin: "1rem auto" }}>
      <List
        dataSource={messages}
        renderItem={(msg) => (
          <List.Item style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <span style={{ background: msg.sender === "user" ? "#e6f7ff" : "#f5f5f5", padding: "5px 10px", borderRadius: "5px" }}>
              {msg.text}
            </span>
          </List.Item>
        )}
        style={{ maxHeight: 300, overflowY: "auto" }}
      />
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPressEnter={handleSend}
        placeholder="Ask something..."
        addonAfter={<Button onClick={handleSend} type="primary">Send</Button>}
      />
        <Button onClick={generateOutfit} type="primary" style={{width: '100%'}}>
            Generate me an Outfit
        </Button>
    </Card>
  );
};

export default ChatInterface;