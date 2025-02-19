import React from "react";

const TimelineBar = ({ stages, currentStage }) => {
  return (
    <div className="timeline-bar">
      {stages.map((stage, index) => (
        <div key={index} className="timeline-item">
          <div
            className={`timeline-stage ${
              index < currentStage
                ? "completed"
                : index === currentStage
                ? "active"
                : "pending"
            }`}
          >
            {stage}
          </div>
          {index < stages.length - 1 && (
            <div className="timeline-connector"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TimelineBar;
