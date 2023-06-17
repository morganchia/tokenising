import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <center>
        <div className="loading-spinner"></div>
        <br/>Transaction in progress, please wait...
      </center>
    </div>
  );
}
