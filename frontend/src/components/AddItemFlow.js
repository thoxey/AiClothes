import React, { useState } from "react";
import { Steps } from "antd";
import UploadStage from "./UploadStage";
import CutoutStage from "./CutoutStage";
import IdentifyStage from "./IdentifyStage";
import { useAddItemFlowContext } from "./AddItemFlowContext";

const stages = [
  { key: "upload", title: "Upload & Segmentation", component: UploadStage },
  { key: "cutout", title: "Cutout Generation", component: CutoutStage },
  { key: "identification", title: "Clothing Identification", component: IdentifyStage },
];

const AddItemFlow = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const { updateImage, setLoadingState, updateCutout } = useAddItemFlowContext();

  const handleStageComplete = () => {
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    } else {
      // Reset everything to allow adding another item
      updateImage(null);
      updateCutout(null);
      setCurrentStageIndex(0);
    }
  };

  const CurrentStageComponent = stages[currentStageIndex].component;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        {CurrentStageComponent && (
          <CurrentStageComponent
            onComplete={handleStageComplete}
            updateImage={updateImage}
            setLoadingState={setLoadingState}
          />
        )}
      </div>

      <div className="timeline-bar" style={{ padding: "1rem", background: "#f9f9f9" }}>
        <Steps current={currentStageIndex} style={{ margin: "1rem 0" }}>
          {stages.map((stage) => (
            <Steps.Step key={stage.key} title={stage.title} />
          ))}
        </Steps>
      </div>
    </div>
  );
};

export default AddItemFlow;
