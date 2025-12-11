// AnalyticsPage.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import ReportView from "../components/ReportView";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { fetchWithAuth } from "../utils/authHelper";
import {
    BarChart, Bar, PieChart, Pie, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell
} from 'recharts';
import { FaChartLine, FaFileAlt, FaDownload } from 'react-icons/fa';
import "../style/dashboard.css";
import "../style/analytics.css";

export default function AnalyticsPage() {
    const router = useRouter();
    const { transactions, totalIncome, totalExpenses, currentBalance, setTransactionsFromBackend } = useTransactions();
    const { getCategoryById } = useCategories();
    const [activeTab, setActiveTab] = useState('charts');
    const [isAuthed, setIsAuthed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Check auth saat mount
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
        } else {
            setIsAuthed(true);
        }
        setLoading(false);
    }, [router]);

    // Fetch transactions saat mounted atau jika transactions kosong
    useEffect(() => {
        if (isAuthed) {
            fetchAnalyticsData();
        }
    }, [isAuthed]);

    // Fetch data dari backend
    const fetchAnalyticsData = async () => {
        try {
            setDataLoading(true);
            console.log("📥 Fetching analytics data...");
            
            const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }

            const result = await response.json();
            console.log("✅ Analytics data loaded:", result);
            
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
            setDataLoading(false);
            
        } catch (err) {
            console.error("❌ Fetch analytics error:", err);
            setDataLoading(false);
        }
    };

    // Category Data
    const categoryData = transactions.reduce((acc, transaction) => {
        // Get normalized category name
        const categoryName = transaction.category?.name || 
                            getCategoryById(transaction.idCategory)?.name || 
                            'Uncategorized';
        
        if (!acc[categoryName]) {
            acc[categoryName] = { income: 0, expense: 0 };
        }
        
        if (transaction.type === 'income') {
            acc[categoryName].income += parseFloat(transaction.amount) || 0;
        } else {
            acc[categoryName].expense += parseFloat(transaction.amount) || 0;
        }
        return acc;
    }, {});

    const categoryChartData = Object.keys(categoryData).length > 0
        ? Object.entries(categoryData).map(([name, data]) => ({
            name,
            income: data.income,
            expense: data.expense
        }))
        : [];

    // Pie Data
    const pieData = [
        { name: 'Income', value: totalIncome, color: '#10B981' },
        { name: 'Expenses', value: totalExpenses, color: '#EF4444' }
    ];

    // Monthly Data
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

    // Calculate statistics
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const avgIncome = incomeTransactions.length > 0
        ? totalIncome / incomeTransactions.length
        : 0;

    const avgExpense = expenseTransactions.length > 0
        ? totalExpenses / expenseTransactions.length
        : 0;

    const highestIncome = incomeTransactions.length > 0
        ? Math.max(...incomeTransactions.map(t => t.amount))
        : 0;

    const highestExpense = expenseTransactions.length > 0
        ? Math.max(...expenseTransactions.map(t => t.amount))
        : 0;

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

    // Show loading saat initial load atau data sedang dimuat
    if (loading || dataLoading) return (
        <div className="loading">
            <div className="loading-container">
                <div className="loading-text">Finansialin</div>
            </div>
        </div>
    );

    if (!isAuthed) return (
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
                    <h2 className="page-title">Analytics & Reports</h2>
                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
                    </div>
                </header>

                <main className="main-content-wrapper">
                    {/* Tabs */}
                    <div className="analytics-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('charts')}
                        >
                            <FaChartLine /> Charts & Analytics
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            <FaFileAlt /> Monthly Reports
                        </button>
                    </div>

                    {activeTab === 'charts' ? (
                        transactions.length === 0 ? (
                            <div className="empty-state-large">
                                <FaChartLine className="empty-icon" />
                                <p>No data to analyze yet. Start adding transactions!</p>
                            </div>
                        ) : (
                            <div className="analytics-main-content">
                                {/* Summary Cards */}
                                <div className="analytics-summary">
                                    <div className="summary-card income">
                                        <h4>Total Income</h4>
                                        <p className="summary-amount">
                                            Rp {totalIncome.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="summary-card expense">
                                        <h4>Total Expenses</h4>
                                        <p className="summary-amount">
                                            Rp {totalExpenses.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="summary-card balance">
                                        <h4>Net Balance</h4>
                                        <p className="summary-amount">
                                            Rp {currentBalance.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                {/* Charts Grid */}
                                <div className="charts-grid">
                                    
                                    {/* Income vs Expenses Pie Chart */}
                                    <div className="chart-card wide">
                                        <h3>Income vs Expenses</h3>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={140}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Category Breakdown Bar Chart */}
                                    <div className="chart-card wide">
                                        <h3>Category Breakdown</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={categoryChartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                                                <Legend />
                                                <Bar dataKey="income" fill="#10B981" name="Income" />
                                                <Bar dataKey="expense" fill="#EF4444" name="Expense" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Monthly Trend Line Chart */}
                                    {monthlyChartData.length > 0 && (
                                        <div className="chart-card wide">
                                            <h3>Monthly Trend</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={monthlyChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
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
                                                Rp {avgIncome.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Average Expense</span>
                                            <span className="stat-value expense">
                                                Rp {avgExpense.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Highest Income</span>
                                            <span className="stat-value income">
                                                Rp {highestIncome.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Highest Expense</span>
                                            <span className="stat-value expense">
                                                Rp {highestExpense.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Savings Rate</span>
                                            <span className="stat-value balance">
                                                {totalIncome > 0 ? ((currentBalance / totalIncome) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <ReportView />
                    )}
                </main>
            </div>

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