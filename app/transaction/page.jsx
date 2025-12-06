"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import AddTransactionModal from "../components/AddTransactionModal";
import EditTransactionModal from "../components/EditTransactionModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { fetchWithAuth, setupTokenRefresh } from "../utils/authHelper";
import "../style/dashboard.css";
import "../style/transaction.css";
import { FaEdit, FaTrash } from 'react-icons/fa';
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";

function TransactionPage() {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [filter, setFilter] = useState('all');
    const [isAuthed, setIsAuthed] = useState(false);
    const [loading, setLoading] = useState(true);

    const {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setTransactionsFromBackend,
        totalIncome,
        totalExpenses,
        currentBalance
    } = useTransactions();

    const { getCategoryById } = useCategories();

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Check auth & setup token refresh
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("access_token");
            console.log("=== CEK AUTH ===");
            console.log("Token dari localStorage:", token);

            if (!token || token === "undefined" || token === "null" || token === null) {
                console.log("Tidak ada token valid, redirect ke login");
                setIsAuthed(false);
                setLoading(false);
                router.push("/login");
                return;
            }

            console.log("✅ Token valid, set isAuthed = true");
            setIsAuthed(true);
            setLoading(false);
        };

        checkAuth();

        // Setup auto token refresh
        const cleanup = setupTokenRefresh();

        return () => {
            if (cleanup) cleanup();
        };
    }, [router]);

    // Fetch transactions dari backend
    useEffect(() => {
        if (isAuthed) {
            fetchTransactions();
        }
    }, [isAuthed]);

    const fetchTransactions = async () => {
        try {
            console.log("🔍 Fetching transactions...");

            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
                method: "GET",
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }

            const result = await response.json();
            console.log("✅ Raw data dari backend:", result);

            // Backend return: { data: [...], meta: {...} } atau langsung array
            const transactionsData = result.data || result;

            // Transform to consistent format
            const transformed = transactionsData.map(t => ({
                id: t.idTransaction,
                idTransaction: t.idTransaction,
                type: t.type,
                amount: parseFloat(t.amount),
                description: t.description,
                date: t.date,
                source: t.source,
                idCategory: t.idCategory,
                category: t.category, // Backend might include joined category data
                userId: t.idUser
            }));

            console.log("✅ Transformed transactions:", transformed);
            setTransactionsFromBackend(transformed);

        } catch (err) {
            console.error("❌ Fetch transactions error:", err);
        }
    };

    const handleAddTransaction = async (transaction) => {
        try {
            console.log("=== ADD TRANSACTION START ===");
            console.log("1️⃣ Data dari modal:", transaction);

            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
                method: "POST",
                body: JSON.stringify(transaction),
            });

            console.log("2️⃣ Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("3️⃣ Error dari backend:", errorData);
                throw new Error(errorData.message || "Failed to add transaction");
            }

            const newTransaction = await response.json();
            console.log("4️⃣ Data dari backend:", newTransaction);

            // Transform response
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

            console.log("5️⃣ Transformed:", transformed);
            console.log("6️⃣ Calling addTransaction to context");
            
            // Add to context
            addTransaction(transformed);
            
            console.log("7️⃣ Context updated, closing modal");
            setIsAddModalOpen(false);
            
            console.log("=== ADD TRANSACTION END ===");
        } catch (err) {
            console.error("❌ Add transaction error:", err);
            alert("Gagal menambahkan transaksi: " + err.message);
        }
    };

    const handleEditClick = (transaction) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    const handleEditTransaction = async (updatedData) => {
        try {
            if (!transactionToEdit) return;

            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions/${transactionToEdit.id}`, {
                method: "PUT",
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error("Failed to update transaction");
            }

            const updated = await response.json();
            updateTransaction(transactionToEdit.id, updated);
            setIsEditModalOpen(false);
            setTransactionToEdit(null);
        } catch (err) {
            console.error("Edit transaction error:", err);
            alert("Gagal mengupdate transaksi");
        }
    };

    const handleDeleteClick = (id) => {
        setTransactionToDelete(id);
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (!transactionToDelete) return;

            console.log("🗑️ Deleting transaction ID:", transactionToDelete);

            const token = localStorage.getItem('access_token');

            const response = await fetch(`${BACKEND_URL}/api/transactions/${transactionToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log("Delete response status:", response.status);
            console.log("Delete response ok?:", response.ok);

            // Backend returns 200 with { message: "Transaction deleted" }
            if (response.ok) {
                console.log("✅ Transaction deleted successfully from backend");

                // Remove from context
                deleteTransaction(transactionToDelete);

                setIsAlertOpen(false);
                setTransactionToDelete(null);

                console.log("✅ UI updated");
            } else {
                const errorData = await response.json();
                console.error("❌ Delete error response:", errorData);
                throw new Error(errorData.message || "Failed to delete transaction");
            }
        } catch (err) {
            console.error("❌ Delete transaction error:", err);
            alert("Gagal menghapus transaksi: " + err.message);
            setIsAlertOpen(false);
            setTransactionToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setIsAlertOpen(false);
        setTransactionToDelete(null);
    };

    const handleLogoutAttempt = () => {
        setIsLogoutAlertOpen(true);
    };

    const handleConfirmLogout = () => {
        setIsLogoutAlertOpen(false);
        const token = localStorage.getItem('access_token');

        if (token) {
            fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }).catch(console.error);
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
    };

    const handleCancelLogout = () => {
        setIsLogoutAlertOpen(false);
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    if (loading || !isAuthed) return (
        <div className="loading">
            <div className="loading-container">
                <div className="loading-text">Finansialin</div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar onLogoutAttempt={handleLogoutAttempt} />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Transactions</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
                    </div>
                </header>

                <main className="main-content-wrapper">
                    {/* Summary Cards */}
                    <div className="transaction-summary">
                        <div className="summary-card income">
                            <h4>Total Income</h4>
                            <p className="summary-amount">Rp {totalIncome.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="summary-card expense">
                            <h4>Total Expenses</h4>
                            <p className="summary-amount">Rp {totalExpenses.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="summary-card balance">
                            <h4>Net Balance</h4>
                            <p className="summary-amount">Rp {currentBalance.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="actions-bar">
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All ({transactions.length})
                            </button>
                            <button
                                className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
                                onClick={() => setFilter('income')}
                            >
                                Income ({transactions.filter(t => t.type === 'income').length})
                            </button>
                            <button
                                className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
                                onClick={() => setFilter('expense')}
                            >
                                Expenses ({transactions.filter(t => t.type === 'expense').length})
                            </button>
                        </div>

                        <button
                            className="add-transaction-btn"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            + Add Transaction
                        </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="transactions-table-container">
                        {filteredTransactions.length === 0 ? (
                            <div className="empty-state-large">
                                <p>No transactions yet</p>
                                <button
                                    className="add-transaction-btn"
                                    onClick={() => setIsAddModalOpen(true)}
                                >
                                    + Add Your First Transaction
                                </button>
                            </div>
                        ) : (
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(transaction => {
                                        // Get category name from transaction
                                        const categoryName = transaction.category?.name ||
                                            getCategoryById(transaction.idCategory)?.name ||
                                            'Unknown';

                                        return (
                                            <tr key={transaction.id || transaction.idTransaction}>
                                                <td>{new Date(transaction.date).toLocaleDateString('id-ID')}</td>
                                                <td>
                                                    <span className="category-badge">
                                                        {categoryName}
                                                    </span>
                                                </td>
                                                <td>{transaction.description || transaction.source || '-'}</td>
                                                <td>
                                                    <span className={`type-badge ${transaction.type}`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`amount ${transaction.type}`}>
                                                        {transaction.type === 'income' ? '+' : '-'}
                                                        Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleEditClick(transaction)}
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDeleteClick(transaction.id || transaction.idTransaction)}
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </main>
            </div>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddTransaction={handleAddTransaction}
            />

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setTransactionToEdit(null);
                }}
                onEditTransaction={handleEditTransaction}
                transaction={transactionToEdit}
            />

            <ConfirmDialog
                isOpen={isAlertOpen}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction?"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
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

export default TransactionPage;