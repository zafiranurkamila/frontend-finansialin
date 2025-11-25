"use client";
import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import DashboardContent from "../components/dashboardContent";
import AddTransactionModal from "../components/AddTransactionModal";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationDropdown from "../components/NotificationDropdown";
import { useTransactions } from "../context/TransactionContext";
import "../style/dashboard.css";
import { FaUserCircle } from 'react-icons/fa';

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addTransaction } = useTransactions();

  const handleAddTransaction = (transaction) => {
    addTransaction(transaction);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content-area">
        <header className="dashboard-header">
          <h2 className="page-title">Dashboard</h2>

          <div className="header-actions">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="main-content-wrapper">
          <div className="add-transaction-wrapper">
            <button 
              className="add-transaction-btn"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Transaction
            </button>
          </div>

          <DashboardContent />
        </main>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}

export default DashboardPage;