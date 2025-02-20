import React from "react";
import { Steps } from "antd";

const { Step } = Steps;

const TimelineBar = ({ stages, currentStage }) => {
  return (
    <Steps current={currentStage} style={{ margin: "1rem 0" }}>
      {stages.map((stage, index) => (
        <Step key={index} title={stage} />
      ))}
    </Steps>
  );
};

export default TimelineBar;
