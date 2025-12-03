"use client";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import "../style/alert.css";

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, showCancel = true }) {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay" onClick={onCancel}>
      <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="alert-icon">
          <FaExclamationTriangle />
        </div>

        <div className="alert-content">
          <h3>{title || "Confirm Action"}</h3>
          <p>{message || "Are you sure you want to proceed?"}</p>
        </div>

        <div className="alert-actions">
          {showCancel && (
            <button className="alert-btn cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="alert-btn confirm" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
