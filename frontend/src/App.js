import React, { useState } from "react";
import "./App.css";
import Wardrobe from "./components/Wardrobe";
import AddClothingFlow from "./components/AddClothingFlow";

function App() {
  // Use a page state: "wardrobe" shows the main display, "add" shows the add flow.
  const [page, setPage] = useState("wardrobe");

  // When the add flow is complete, return to the wardrobe page.
  const handleFlowComplete = () => {
    setPage("wardrobe");
  };

  return (
    <div className="app-container">
      {page === "wardrobe" ? (
        <Wardrobe onAdd={() => setPage("add")} />
      ) : (
        <AddClothingFlow onFlowComplete={handleFlowComplete} />
      )}
    </div>
  );
}

export default App;
