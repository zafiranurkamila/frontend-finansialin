"use client";
import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import AddTransactionModal from "../components/AddTransactionModal";
import EditTransactionModal from "../components/EditTransactionModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTransactions } from "../context/TransactionContext";
import "../style/dashboard.css";
import "../style/transaction.css";
import { FaBell, FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';
import NotificationDropdown from "../components/NotificationDropdown";

function TransactionPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [filter, setFilter] = useState('all');

    const {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        totalIncome,
        totalExpenses,
        currentBalance
    } = useTransactions();

    const handleAddTransaction = (transaction) => {
        addTransaction(transaction);
    };

    const handleEditClick = (transaction) => {
        setTransactionToEdit(transaction);
        setIsEditModalOpen(true);
    };

    const handleEditTransaction = (updatedData) => {
        if (transactionToEdit) {
            updateTransaction(transactionToEdit.id, updatedData);
        }
        setIsEditModalOpen(false);
        setTransactionToEdit(null);
    };

    const handleDeleteClick = (id) => {
        setTransactionToDelete(id);
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = () => {
        if (transactionToDelete) {
            deleteTransaction(transactionToDelete);
        }
        setIsAlertOpen(false);
        setTransactionToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsAlertOpen(false);
        setTransactionToDelete(null);
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    return (
        <div className="dashboard-container">
            <Sidebar />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Transactions</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <div className="profile-avatar">
                            <FaUserCircle />
                        </div>
                    </div>
                </header>

                <main className="main-content-wrapper">
                    {/* Summary Cards */}
                    <div className="transaction-summary">
                        <div className="summary-card income">
                            <h4>Total Income</h4>
                            <p className="summary-amount">${totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="summary-card expense">
                            <h4>Total Expenses</h4>
                            <p className="summary-amount">${totalExpenses.toLocaleString()}</p>
                        </div>
                        <div className="summary-card balance">
                            <h4>Net Balance</h4>
                            <p className="summary-amount">${currentBalance.toLocaleString()}</p>
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
                                    {filteredTransactions.map(transaction => (
                                        <tr key={transaction.id}>
                                            <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className="category-badge">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td>{transaction.description || '-'}</td>
                                            <td>
                                                <span className={`type-badge ${transaction.type}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`amount ${transaction.type}`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    ${transaction.amount.toLocaleString()}
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
                                                        onClick={() => handleDeleteClick(transaction.id)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
        </div>
    );
}

export default TransactionPage;