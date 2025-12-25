// app/components/TransactionDetailModal.jsx
"use client";
import React from "react";
import { FaTimes, FaCalendar, FaTag, FaFileAlt, FaWallet, FaDollarSign, FaPlus, FaMinus } from "react-icons/fa";
import "../style/transactionDetailModal.css";

function TransactionDetailModal({ isOpen, onClose, transaction, categoryName }) {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transaction-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="transaction-detail-header">
          <h2>Transaction Details</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="transaction-detail-content">
          {/* Amount Section */}
          <div className={`amount-section ${transaction.type}`}>
            <div className="amount-info">
              <p className="amount-label">Transaction Amount</p>
              <p className={`amount-value ${transaction.type}`}>
                {transaction.type === "income"}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="details-grid">
            {/* Category */}
            <div className="detail-item">
              <div className="detail-icon category">
                <FaTag />
              </div>
              <div className="detail-content">
                <p className="detail-label">Category</p>
                <p className="detail-value">{categoryName || "Uncategorized"}</p>
              </div>
            </div>

            {/* Date */}
            <div className="detail-item">
              <div className="detail-icon date">
                <FaCalendar />
              </div>
              <div className="detail-content">
                <p className="detail-label">Date</p>
                <p className="detail-value">{formatDate(transaction.date)}</p>
              </div>
            </div>

            {/* Type */}
            <div className="detail-item">
              <div className={`detail-icon type ${transaction.type}`}>{transaction.type === "income" ? <FaPlus /> : <FaMinus />}</div>
              <div className="detail-content">
                <p className="detail-label">Type</p>
                <p className="detail-value">
                  <span className={`type-badge-detail ${transaction.type}`}>{transaction.type === "income" ? "Income" : "Expense"}</span>
                </p>
              </div>
            </div>

            {/* Source (if available) */}
            {transaction.source && (
              <div className="detail-item">
                <div className="detail-icon source">
                  <FaWallet />
                </div>
                <div className="detail-content">
                  <p className="detail-label">Source/Account</p>
                  <p className="detail-value">{transaction.source}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          {transaction.description && (
            <div className="description-section">
              <div className="description-header">
                <FaFileAlt className="description-icon" />
                <h3>Description</h3>
              </div>
              <p className="description-text">{transaction.description}</p>
            </div>
          )}
        </div>

        <div className="transaction-detail-footer">
          <button className="btn-close-detail" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailModal;
