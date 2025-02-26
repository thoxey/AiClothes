import React, { useState } from "react";
import { Layout, Menu } from "antd";
import { AddItemFlowProvider } from "./components/AddItemFlowContext";
import AddItemFlow from "./components/AddItemFlow";
import Wardrobe from "./components/Wardrobe";

const { Header, Content } = Layout;

function App() {
  const [page, setPage] = useState("wardrobe");

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
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

      <Content style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {page === "wardrobe" ? (
          <Wardrobe />
        ) : (
          <AddItemFlowProvider>
            <AddItemFlow />
          </AddItemFlowProvider>
        )}
      </Content>
    </Layout>
  );
}

export default App;
