import React, { useState } from "react";
import { Layout, Menu } from "antd";
import AddItemFlow from "./components/AddItemFlow";
import Wardrobe from "./components/Wardrobe";

const { Header, Content } = Layout;

function App() {
  const [page, setPage] = useState("wardrobe");

  const handleFlowComplete = () => {
    setPage("wardrobe");
  };

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header at the top (never pushed) */}
      <Header>
        <Menu theme="dark" mode="horizontal" selectedKeys={[page]}>
          <Menu.Item key="wardrobe" onClick={() => setPage("wardrobe")}>
            Wardrobe
          </Menu.Item>
          <Menu.Item key="add" onClick={() => setPage("add")}>
            Add Clothing
          </Menu.Item>
        </Menu>
      </Header>

      {/* Content area takes remaining space */}
      <Content style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {page === "wardrobe" ? (
          <Wardrobe onAdd={() => setPage("add")} />
        ) : (
          <AddItemFlow onFlowComplete={handleFlowComplete} />
        )}
      </Content>
    </Layout>
  );
}

export default App;
