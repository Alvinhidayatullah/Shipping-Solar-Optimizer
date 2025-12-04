import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Defer non-critical operations
setTimeout(() => {
  const root = ReactDOM.createRoot(document.getElementById("root"));

  // Use requestIdleCallback if available
  const renderApp = () => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Notify that React is ready (deferred for performance)
    setTimeout(() => {
      if (window.dispatchEvent) {
        window.dispatchEvent(new Event("ReactAppReady"));
      }
    }, 300);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(renderApp, { timeout: 1000 });
  } else {
    requestAnimationFrame(renderApp);
  }
}, 100);
