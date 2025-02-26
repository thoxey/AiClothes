import React, { useState } from "react";
import { Steps } from "antd";
import UploadStage from "./UploadStage";

const stages = [
  { key: "upload", title: "Upload & Segmentation", component: UploadStage },
  { key: "cutout", title: "Cutout Generation", component: null },
  { key: "identification", title: "Clothing Identification", component: null },
  { key: "save", title: "Save to Wardrobe", component: null },
];

const AddItemFlow = ({ onFlowComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const handleStageComplete = () => {
    console.log(`Stage ${stages[currentStageIndex].title} complete`);
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    } else {
      onFlowComplete();
    }
  };

  const CurrentStageComponent = stages[currentStageIndex].component;

  return (
    // Full parent container: pinned top & bottom via the parent's "relative" container
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* The "book" content takes all available vertical space, without pushing the timeline */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {CurrentStageComponent && <CurrentStageComponent onComplete={handleStageComplete} />}
      </div>

      {/* The timeline is pinned at the bottom (never pushed) */}
      <div
        className="timeline-bar"
        style={{
          padding: "1rem",
          background: "#f9f9f9",
        }}
      >
        <Steps current={currentStageIndex} style={{ margin: "1rem 0" }}>
          {stages.map((stage, index) => (
            <Steps.Step key={stage.key} title={stage.title} />
          ))}
        </Steps>
      </div>
    </div>
  );
};

export default AddItemFlow;
