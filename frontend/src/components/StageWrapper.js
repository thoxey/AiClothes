import React from "react";
import PropTypes from "prop-types";

const StageWrapper = ({ title, children, confirmLabel, onConfirm, loading }) => {
  return (
    <div className="stage-container">
      <h1>{title}</h1>
      <div className="stage-content">{children}</div>
      <button onClick={onConfirm} className="primary-button" style={{ marginTop: "1rem" }}>
        {loading ? "Processing..." : confirmLabel}
      </button>
    </div>
  );
};

StageWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  confirmLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

StageWrapper.defaultProps = {
  confirmLabel: "Confirm",
  loading: false,
};

export default StageWrapper;
