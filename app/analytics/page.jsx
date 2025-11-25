"use client";
import React from "react";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import { useTransactions } from "../context/TransactionContext";
import {
    BarChart, Bar, PieChart, Pie, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell
} from 'recharts';
import { FaUserCircle } from 'react-icons/fa';
import "../style/dashboard.css";
import "../style/analytics.css";

export default function AnalyticsPage() {
    const { transactions, totalIncome, totalExpenses, currentBalance } = useTransactions();

    // Group by category
    const categoryData = transactions.reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
            acc[category] = { income: 0, expense: 0 };
        }
        if (transaction.type === 'income') {
            acc[category].income += transaction.amount;
        } else {
            acc[category].expense += transaction.amount;
        }
        return acc;
    }, {});

    const categoryChartData = Object.entries(categoryData).map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense
    }));

    // Pie chart data
    const pieData = [
        { name: 'Income', value: totalIncome, color: '#10B981' },
        { name: 'Expenses', value: totalExpenses, color: '#EF4444' }
    ];

    // Monthly trend (last 6 months)
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0 };
        }

        if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount;
        } else {
            monthlyData[monthKey].expense += t.amount;
        }
    });

    const monthlyChartData = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

    return (
        <div className="dashboard-container">
            <Sidebar />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Analytics</h2>
                    <div className="header-actions">
                        <NotificationDropdown />
                        <div className="profile-avatar">
                            <FaUserCircle />
                        </div>
                    </div>
                </header>

                <main className="main-content-wrapper">
                    {transactions.length === 0 ? (
                        <div className="empty-state-large">
                            <p>No data to analyze yet. Start adding transactions!</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="analytics-summary">
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

                            {/* Charts Grid */}
                            <div className="charts-grid">
                                {/* Income vs Expenses Pie Chart */}
                                <div className="chart-card">
                                    <h3>Income vs Expenses</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Category Breakdown */}
                                <div className="chart-card wide">
                                    <h3>Category Breakdown</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={categoryChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            <Bar dataKey="income" fill="#10B981" name="Income" />
                                            <Bar dataKey="expense" fill="#EF4444" name="Expense" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Monthly Trend */}
                                {monthlyChartData.length > 0 && (
                                    <div className="chart-card wide">
                                        <h3>Monthly Trend</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={monthlyChartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                                <Legend />
                                                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                                                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Statistics */}
                            <div className="statistics-section">
                                <h3>Statistics</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Transactions</span>
                                        <span className="stat-value">{transactions.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Average Income</span>
                                        <span className="stat-value income">
                                            ${(totalIncome / Math.max(transactions.filter(t => t.type === 'income').length, 1)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Average Expense</span>
                                        <span className="stat-value expense">
                                            ${(totalExpenses / Math.max(transactions.filter(t => t.type === 'expense').length, 1)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Savings Rate</span>
                                        <span className="stat-value">
                                            {totalIncome > 0 ? ((currentBalance / totalIncome) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}