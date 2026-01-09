"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "../components/sidebar";
import DashboardContent from "../components/dashboardContent";
import AddTransactionModal from "../components/AddTransactionModal";
import ProfileDropdown from "../components/ProfileDropdown";
import NotificationDropdown from "../components/NotificationDropdown";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchWithAuth } from "../utils/authHelper";
import ConfirmDialog from '../components/ConfirmDialog';
import "../style/dashboard.css";
import DashboardBanner from "../components/DashboardBanner";

function DashboardPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { addTransaction, setTransactionsFromBackend } = useTransactions();
    const { fetchCategories } = useCategories();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Check auth saat mount
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        console.log("=== DASHBOARD AUTH CHECK ===");
        console.log("Token:", token);

        if (!token || token === "undefined" || token === "null") {
            console.log("❌ No valid token, redirect to login");
            router.push("/login");
        } else {
            console.log("✅ Token valid");
            setIsAuthed(true);
        }
        setLoading(false);
    }, [router]);

    // Fetch data from backend
    useEffect(() => {
        if (isAuthed) {
            console.log("📥 Loading dashboard data...");
            fetchCategories();
            fetchTransactions();
        }
    }, [isAuthed]);

    const fetchTransactions = async () => {
        try {
            console.log("🔍 Fetching transactions for dashboard...");

            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }

            const result = await response.json();
            console.log("✅ Transactions loaded:", result);

            const transactionsData = result.data || result;

            const transformed = transactionsData.map(t => ({
                id: t.idTransaction,
                idTransaction: t.idTransaction,
                type: t.type,
                amount: parseFloat(t.amount),
                description: t.description,
                date: t.date,
                source: t.source,
                idCategory: t.idCategory,
                category: t.category,
                userId: t.idUser
            }));

            setTransactionsFromBackend(transformed);

        } catch (err) {
            console.error("❌ Fetch transactions error:", err);
        }
    };

    const handleAddTransaction = async (transaction) => {
        try {
            console.log("📤 Adding transaction from dashboard:", transaction);

            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
                method: "POST",
                body: JSON.stringify(transaction),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Error:", errorData);
                throw new Error(errorData.message || "Failed to add transaction");
            }

            const newTransaction = await response.json();
            console.log("✅ Transaction added from backend:", newTransaction);

            // Transform backend response
            const transformed = {
                id: newTransaction.idTransaction,
                idTransaction: newTransaction.idTransaction,
                type: newTransaction.type,
                amount: parseFloat(newTransaction.amount),
                description: newTransaction.description,
                date: newTransaction.date,
                source: newTransaction.source,
                idCategory: newTransaction.idCategory,
                category: newTransaction.category,
                userId: newTransaction.idUser
            };

            console.log("✅ Transformed transaction:", transformed);

            // Only add once to context
            addTransaction(transformed);
            setIsModalOpen(false);
        } catch (err) {
            console.error("❌ Add transaction error:", err);
            alert("Failed to add transaction: " + err.message);
        }
    };

    const handleLogoutAttempt = () => {
        setIsLogoutAlertOpen(true);
    };

    const handleConfirmLogout = () => {
        setIsLogoutAlertOpen(false);
        setIsLoggingOut(true);
        const token = localStorage.getItem('access_token');

        if (token) {
            fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            }).catch(console.error);
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Wait for animation to complete before redirecting
        setTimeout(() => {
            router.push('/login');
        }, 500);
    };

    const handleCancelLogout = () => {
        setIsLogoutAlertOpen(false);
    };

    if (loading || !isAuthed) return (
        <div className="loading">
            <div className="loading-container">
                <div className="loading-text">Finansialin</div>
            </div>
        </div>
    );

    return (
        <div className={`dashboard-container ${isLoggingOut ? 'logout' : ''}`}>
            <Sidebar onLogoutAttempt={handleLogoutAttempt} />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">{t('dashboard')}</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
                    </div>
                </header>

                <main className="main-content-wrapper">
                    <DashboardBanner />
                    <button className="add-transaction-btn" onClick={() => setIsModalOpen(true)}>
                        + {t('addTransaction')}
                    </button>

                    <DashboardContent />
                </main>
            </div>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddTransaction={handleAddTransaction}
            />

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