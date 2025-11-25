"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load dari localStorage saat pertama kali
    useEffect(() => {
        const savedTransactions = localStorage.getItem('transactions');
        const savedNotifications = localStorage.getItem('notifications');

        if (savedTransactions) {
            setTransactions(JSON.parse(savedTransactions));
        }
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications));
        }
        setIsLoaded(true);
    }, []);

    // Save ke localStorage setiap kali berubah
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('transactions', JSON.stringify(transactions));
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }
    }, [transactions, notifications, isLoaded]);

    const addTransaction = (transaction) => {
        const newTransaction = {
            ...transaction,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);

        // Create notification
        const notification = {
            id: Date.now(),
            type: transaction.type,
            message: `${transaction.type === 'income' ? 'Income' : 'Expense'} of $${transaction.amount} added for ${transaction.category}`,
            date: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [notification, ...prev]);
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));

        const notification = {
            id: Date.now(),
            type: 'delete',
            message: 'Transaction deleted',
            date: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [notification, ...prev]);
    };

    const updateTransaction = (id, updatedData) => {
        setTransactions(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updatedData } : t))
        );
    };

    const markNotificationAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpenses;

    const unreadNotifications = notifications.filter(n => !n.read).length;

    // Report Functions
    const generateMonthlyReport = (month, year) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Group by category
        const categoryBreakdown = monthlyTransactions.reduce((acc, t) => {
            if (!acc[t.category]) {
                acc[t.category] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                acc[t.category].income += t.amount;
            } else {
                acc[t.category].expense += t.amount;
            }
            return acc;
        }, {});

        return {
            month,
            year,
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            transactionCount: monthlyTransactions.length,
            categoryBreakdown,
            transactions: monthlyTransactions
        };
    };

    const getReportSummary = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        return generateMonthlyReport(currentMonth, currentYear);
    };

    const value = {
        transactions,
        notifications,
        unreadNotifications,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        totalIncome,
        totalExpenses,
        currentBalance,
        generateMonthlyReport,
        getReportSummary
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within TransactionProvider');
    }
    return context;
}