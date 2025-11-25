// DashboardPage.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "../components/sidebar";
import DashboardContent from "../components/dashboardContent";
import AddTransactionModal from "../components/AddTransactionModal";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationDropdown from "../components/NotificationDropdown";
import { useTransactions } from "../context/TransactionContext";
import ConfirmDialog from '../components/ConfirmDialog';
import "../style/dashboard.css";
import { FaUserCircle } from 'react-icons/fa';

function DashboardPage() {
    const router = useRouter(); 
    const { addTransaction } = useTransactions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State untuk Logout Dialog
    const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

    // Handlers
    const handleAddTransaction = (transaction) => {
        addTransaction(transaction);
    };
    
    // Handler yang dipanggil oleh kedua komponen anak (Sidebar & Dropdown)
    const handleLogoutAttempt = () => { 
        setIsLogoutAlertOpen(true);
    };

    // Logika Logout yang sebenarnya (dipanggil saat Confirm Dialog menekan OK)
    const handleConfirmLogout = () => { 
        setIsLogoutAlertOpen(false); 
        
        localStorage.removeItem('token');
        router.push('/login');
    };

    // Dipanggil saat user menekan 'Cancel'
    const handleCancelLogout = () => {
        setIsLogoutAlertOpen(false);
    };

    return (
        <div className="dashboard-container">
            {/* [1] Meneruskan handler ke Sidebar */}
            <Sidebar onLogoutAttempt={handleLogoutAttempt} /> 

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Dashboard</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        
                        {/* [2] Meneruskan handler ke ProfileDropdown */}
                        <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} /> 
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

            {/* Rendering ConfirmDialog */}
            <ConfirmDialog
                isOpen={isLogoutAlertOpen}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
        </div>
    );
}

export default DashboardPage;