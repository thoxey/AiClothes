import React, { useState } from "react";
import { Layout, Menu } from "antd";

import "./App.css"; // Your custom styles
import Wardrobe from "./components/Wardrobe";
import AddClothingFlow from "./components/AddClothingFlow";

const { Header, Content } = Layout;

function App() {
  const [page, setPage] = useState("wardrobe");

  const handleFlowComplete = () => {
    setPage("wardrobe");
  };

  return (
    <Layout className="app-layout">
      <Header>
        {/* The top navigation menu with two items. */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[page]}
          style={{ lineHeight: "64px" }}
        >
          <Menu.Item key="wardrobe" onClick={() => setPage("wardrobe")}>
            Wardrobe
          </Menu.Item>
          <Menu.Item key="add" onClick={() => setPage("add")}>
            Add Clothing
          </Menu.Item>
        </Menu>
      </Header>

      {/* Main content area */}
      <Content style={{ padding: "24px" }}>
        {page === "wardrobe" ? (
          <Wardrobe onAdd={() => setPage("add")} />
        ) : (
          <AddClothingFlow onFlowComplete={handleFlowComplete} />
        )}
      </Content>
    </Layout>
  );
}

export default App;
