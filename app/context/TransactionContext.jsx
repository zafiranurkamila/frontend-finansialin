"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Load notifications from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('finansialin_notifications');
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load notifications', e);
            }
        }
    }, []);

    // Save notifications to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('finansialin_notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Method untuk set transactions dari backend - REPLACE semua data
    const setTransactionsFromBackend = (backendTransactions) => {
        console.log("🔄 REPLACING all transactions. Count:", backendTransactions.length);
        console.log("🔄 Previous count:", transactions.length);
        setTransactions(backendTransactions);
    };

    // Generic add notification function - CHECK SETTINGS BEFORE SAVING
    const addNotification = async (notificationData) => {
        // Check notification settings
        const saved = localStorage.getItem('notificationSettings');
        let settings = {
            transactionAlerts: true,
            budgetAlerts: true
        };
        
        if (saved) {
            try {
                settings = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load notification settings', e);
            }
        }

        // Check if notification should be shown
        if (notificationData.type === 'income' || notificationData.type === 'expense') {
            if (!settings.transactionAlerts) {
                console.log('⚠️ Transaction alerts disabled, skipping notification');
                return;
            }
        }

        if (notificationData.type === 'budget') {
            if (!settings.budgetAlerts) {
                console.log('⚠️ Budget alerts disabled, skipping notification');
                return;
            }
        }

        const notification = {
            id: Date.now(),
            date: new Date().toISOString(),
            read: false,
            ...notificationData
        };
        
        // Add to local state
        setNotifications(prev => [notification, ...prev]);

        // Save to backend database
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await fetch(`${BACKEND_URL}/api/notifications`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: notificationData.type,
                        message: notificationData.message
                    })
                });
                console.log('✅ Notification saved to database');
            }
        } catch (err) {
            console.error('❌ Failed to save notification to backend:', err);
        }
    };

    const addTransaction = (transaction) => {
        console.log("➕ ADD REQUEST - Transaction:", transaction);
        console.log("📋 Current transactions:", transactions.length);

        // Check if already exists (prevent duplicate)
        const exists = transactions.some(t =>
            (t.id === transaction.id || t.idTransaction === transaction.idTransaction) ||
            (t.id === transaction.idTransaction || t.idTransaction === transaction.id)
        );

        if (exists) {
            console.warn("⚠️ DUPLICATE DETECTED - Transaction already exists, SKIPPING");
            return;
        }

        // Transform to consistent format
        const newTransaction = {
            id: transaction.id || transaction.idTransaction,
            idTransaction: transaction.idTransaction || transaction.id,
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            description: transaction.description,
            date: transaction.date,
            source: transaction.source,
            idCategory: transaction.idCategory,
            category: transaction.category,
            userId: transaction.userId || transaction.idUser
        };

        console.log("✅ ADDING to context:", newTransaction);
        setTransactions(prev => {
            const updated = [newTransaction, ...prev];
            console.log("✅ New count:", updated.length);
            return updated;
        });

        // Create notification (will save to backend)
        addNotification({
            type: transaction.type,
            message: `${transaction.type === 'income' ? 'Income' : 'Expense'} of Rp${parseFloat(transaction.amount).toLocaleString('id-ID')} added`
        });
    };

    const deleteTransaction = (id) => {
        console.log("🗑️ DELETE REQUEST - ID:", id);
        setTransactions(prev => {
            const filtered = prev.filter(t => 
                t.id !== id && 
                t.idTransaction !== id &&
                t.id !== String(id) &&
                t.idTransaction !== String(id)
            );
            console.log("✅ After delete. Previous:", prev.length, "New:", filtered.length);
            return filtered;
        });

        addNotification({
            type: 'delete',
            message: 'Transaction deleted'
        });
    };

    const updateTransaction = (id, updatedData) => {
        console.log("✏️ UPDATE REQUEST - ID:", id, "Data:", updatedData);
        setTransactions(prev =>
            prev.map(t => {
                if (t.id === id || t.idTransaction === id) {
                    return {
                        ...t,
                        ...updatedData,
                        id: t.id,
                        idTransaction: t.idTransaction,
                        amount: parseFloat(updatedData.amount || t.amount)
                    };
                }
                return t;
            })
        );

        addNotification({
            type: 'update',
            message: 'Transaction updated'
        });
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
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

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
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        // Group by category
        const categoryBreakdown = monthlyTransactions.reduce((acc, t) => {
            const categoryName = t.category?.name || 'Unknown';
            if (!acc[categoryName]) {
                acc[categoryName] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                acc[categoryName].income += parseFloat(t.amount || 0);
            } else {
                acc[categoryName].expense += parseFloat(t.amount || 0);
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

    const generateYearlyReport = (year) => {
        const yearlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year;
        });

        const income = yearlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const expenses = yearlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        return {
            year,
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            transactionCount: yearlyTransactions.length,
            transactions: yearlyTransactions
        };
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            deleteTransaction,
            updateTransaction,
            setTransactionsFromBackend,
            totalIncome,
            totalExpenses,
            currentBalance,
            notifications,
            addNotification,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            deleteNotification,
            clearAllNotifications,
            unreadNotifications,
            generateMonthlyReport,
            generateYearlyReport
        }}>
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