"use client";
import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { FaDownload, FaPrint, FaCalendar } from 'react-icons/fa';
import '../style/report.css';

function ReportView() {
    const { transactions } = useTransactions();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Get available months from transactions
    const availableMonths = [...new Set(
        transactions.map(t => {
            const date = new Date(t.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )].sort().reverse();

    // Filter transactions for selected month
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === selectedMonth;
    });

    // Calculate monthly totals
    const monthlyIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Category breakdown
    const categoryBreakdown = monthTransactions.reduce((acc, t) => {
        if (t.type === 'expense') {
            if (!acc[t.category]) {
                acc[t.category] = { amount: 0, count: 0 };
            }
            acc[t.category].amount += t.amount;
            acc[t.category].count += 1;
        }
        return acc;
    }, {});

    const topCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 5);

    // Format month name
    const formatMonthName = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle download (simple CSV export)
    // Fungsi baru untuk memastikan nilai CSV aman
    const escapeCsvValue = (value) => {
        // 1. Konversi ke string, ganti null/undefined menjadi string kosong
        const stringValue = (value === null || value === undefined) ? '' : String(value);

        // 2. Jika nilai mengandung tanda kutip ganda ("), ganti dengan dua tanda kutip ganda ("")
        const escapedValue = stringValue.replace(/"/g, '""');

        // 3. Bungkus seluruh nilai dalam tanda kutip ganda
        // Ini menangani kasus jika nilai mengandung koma (,) atau newline.
        return `"${escapedValue}"`;
    };

    // Handle download (simple CSV export)
    const handleDownload = () => {
        const headers = ['Date', 'Category', 'Description', 'Type', 'Amount'];
        const csvData = monthTransactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.category,
            t.description || '-',
            t.type,
            t.amount
        ]);

        // Tambahkan baris 'sep=,' di paling atas
        const csvContent = [
            'sep=,', // <--- TAMBAHKAN BARIS INI
            headers.map(escapeCsvValue).join(','),
            ...csvData.map(row => row.map(escapeCsvValue).join(','))
        ].join('\n');

        const bom = '\ufeff'; // BOM untuk UTF-8, sangat disarankan
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' }); // Gunakan csvContent
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${selectedMonth}.csv`;
        a.click();
    };


    return (
        <div className="report-container">
            {/* Report Header */}
            <div className="report-header">
                <div className="report-title-section">
                    <h2>Monthly Financial Report</h2>
                    <div className="month-selector">
                        <FaCalendar />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="month-select"
                        >
                            {availableMonths.length > 0 ? (
                                availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {formatMonthName(month)}
                                    </option>
                                ))
                            ) : (
                                <option value={selectedMonth}>
                                    {formatMonthName(selectedMonth)}
                                </option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="report-btn" onClick={handlePrint}>
                        <FaPrint /> Print
                    </button>
                    <button className="report-btn" onClick={handleDownload}>
                        <FaDownload /> Download CSV
                    </button>
                </div>
            </div>

            {monthTransactions.length === 0 ? (
                <div className="report-empty">
                    <p>No transactions found for {formatMonthName(selectedMonth)}</p>
                </div>
            ) : (
                <>
                    {/* Report Summary */}
                    <div className="report-summary">
                        <div className="report-summary-card income">
                            <h4>Total Income</h4>
                            <p className="report-amount">${monthlyIncome.toLocaleString()}</p>
                            <span className="report-count">
                                {monthTransactions.filter(t => t.type === 'income').length} transactions
                            </span>
                        </div>
                        <div className="report-summary-card expense">
                            <h4>Total Expenses</h4>
                            <p className="report-amount">${monthlyExpenses.toLocaleString()}</p>
                            <span className="report-count">
                                {monthTransactions.filter(t => t.type === 'expense').length} transactions
                            </span>
                        </div>
                        <div className="report-summary-card balance">
                            <h4>Net Balance</h4>
                            <p className="report-amount">${monthlyBalance.toLocaleString()}</p>
                            <span className={`report-indicator ${monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
                                {monthlyBalance >= 0 ? '↑ Surplus' : '↓ Deficit'}
                            </span>
                        </div>
                    </div>

                    {/* Top Spending Categories */}
                    {topCategories.length > 0 && (
                        <div className="report-section">
                            <h3>Top Spending Categories</h3>
                            <div className="category-list">
                                {topCategories.map(([category, data], index) => (
                                    <div key={category} className="category-item">
                                        <div className="category-rank">{index + 1}</div>
                                        <div className="category-info">
                                            <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                                            <p>{data.count} transactions</p>
                                        </div>
                                        <div className="category-amount">
                                            ${data.amount.toLocaleString()}
                                        </div>
                                        <div className="category-percentage">
                                            {((data.amount / monthlyExpenses) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transaction Details */}
                    <div className="report-section">
                        <h3>Transaction Details</h3>
                        <div className="report-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthTransactions
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(transaction => (
                                            <tr key={transaction.id}>
                                                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="table-category">
                                                        {transaction.category}
                                                    </span>
                                                </td>
                                                <td>{transaction.description || '-'}</td>
                                                <td>
                                                    <span className={`table-badge ${transaction.type}`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`table-amount ${transaction.type}`}>
                                                        {transaction.type === 'income' ? '+' : '-'}
                                                        ${transaction.amount.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Report Footer */}
                    <div className="report-footer">
                        <p>Report generated on {new Date().toLocaleDateString()}</p>
                        <p>Finansialin - Personal Finance Manager</p>
                    </div>
                </>
            )}
        </div>
    );
}

export default ReportView;