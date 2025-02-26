import React from "react";
import PropTypes from "prop-types";
import { Card, Button, Spin } from "antd";

const StageWrapper = ({ title, children, confirmLabel, onConfirm, loading }) => {
  return (
    <Card title={title} style={{ marginTop: "1rem"}}>
      <Spin spinning={loading} tip="Processing...">
        <div className="stage-content">{children}</div>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          style={{ marginTop: "1rem" }}
        >
          {confirmLabel}
        </Button>
      </Spin>
    </Card>
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
