import React from "react";
import Sidebar from "../components/sidebar";
import DashboardContent from "../components/dashboardContent"; // Sesuaikan casing
import "../style/dashboard.css";

function DashboardPage() {
  return (
    <div className="dashboard-container">

      <Sidebar />

      <div className="main-content-area">

        {/* ===== HEADER ATAS (Full Width) ===== */}
        <header className="dashboard-header">
          <h2 className="page-title">Dashboard</h2>

          <div className="header-right">
            <button className="notif-btn">🔔</button>
            <img src="/user.png" className="user-avatar" alt="User"/>
          </div>
        </header>

        <main className="dashboard-main-content">
          
          <div className="add-transaction-wrapper">
            <button className="add-transaction-btn">
              + Add Transaction
            </button>
          </div>

          <DashboardContent />
          
        </main>
        
      </div>
    </div>
  );
}

export default DashboardPage;