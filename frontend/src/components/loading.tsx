import React from "react";

const Loading = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <span className="loading-orbit" aria-hidden="true">
      <span />
    </span>
    <span className="loading-caption">Getting things ready</span>
  </div>
);

export default Loading;
