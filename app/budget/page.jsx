"use client";
import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import AddBudgetModal from "../components/AddBudgetModal";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import { useBudget } from "../context/BudgetContext";
import "../style/dashboard.css";
import "../style/budget.css";
import { FaPlus, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';

function BudgetGoalsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { budgets, deleteBudget, getBudgetProgress } = useBudget();

    const handleDeleteBudget = (id) => {
        if (confirm('Are you sure you want to delete this budget goal?')) {
            deleteBudget(id);
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Budget Goals</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="main-content-wrapper">
                    {/* Add Budget Button */}
                    <div className="budget-header">
                        <p className="budget-subtitle">Set monthly spending limits for different categories</p>
                        <button 
                            className="add-budget-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FaPlus /> Add Budget Goal
                        </button>
                    </div>

                    {/* Budget Cards Grid */}
                    <div className="budget-grid">
                        {budgets.length === 0 ? (
                            <div className="empty-state-budget">
                                <FaChartLine className="empty-icon" />
                                <h3>No Budget Goals Yet</h3>
                                <p>Start by creating your first budget goal to track your spending</p>
                                <button 
                                    className="add-budget-btn"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <FaPlus /> Create Budget Goal
                                </button>
                            </div>
                        ) : (
                            budgets.map(budget => {
                                const progress = getBudgetProgress(budget.id);
                                const isOverBudget = progress.percentage > 100;
                                
                                return (
                                    <div key={budget.id} className="budget-card">
                                        <div className="budget-card-header">
                                            <div>
                                                <h3 className="budget-category">{budget.category}</h3>
                                                <p className="budget-period">{budget.period}</p>
                                            </div>
                                            <div className="budget-actions">
                                                <button className="icon-btn edit" title="Edit">
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    className="icon-btn delete" 
                                                    onClick={() => handleDeleteBudget(budget.id)}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="budget-amounts">
                                            <div className="amount-item">
                                                <span className="amount-label">Spent</span>
                                                <span className={`amount-value ${isOverBudget ? 'over' : ''}`}>
                                                    ${progress.spent.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="amount-item">
                                                <span className="amount-label">Limit</span>
                                                <span className="amount-value">
                                                    ${budget.limit.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div 
                                                    className={`progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                                    style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className={`progress-text ${isOverBudget ? 'over' : ''}`}>
                                                {progress.percentage.toFixed(0)}% used
                                            </span>
                                        </div>

                                        {isOverBudget && (
                                            <div className="budget-warning">
                                                ⚠️ Over budget by ${progress.remaining.toLocaleString()}
                                            </div>
                                        )}

                                        {!isOverBudget && progress.remaining > 0 && (
                                            <div className="budget-info">
                                                ${progress.remaining.toLocaleString()} remaining
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary Section */}
                    {budgets.length > 0 && (
                        <div className="budget-summary">
                            <h3>Budget Summary</h3>
                            <div className="summary-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Total Budget</span>
                                    <span className="stat-value">
                                        ${budgets.reduce((sum, b) => sum + b.limit, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Active Goals</span>
                                    <span className="stat-value">
                                        {budgets.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <AddBudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export default BudgetGoalsPage;