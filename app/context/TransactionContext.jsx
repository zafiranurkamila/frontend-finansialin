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
    const addNotification = async (type, message) => {
        const notification = {
            id: Date.now(),
            type,
            message,
            date: new Date().toISOString(),
            read: false,
        };

        setNotifications(prev => [...prev, notification]);
        
        // COMMENT OUT UNTUK SEMENTARA:
        /*
        try {
            await fetchWithAuth(`${BACKEND_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message }),
            });
        } catch (err) {
            console.error('Error saving notification:', err);
        }
        */
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
        
        // Get transaction details sebelum delete
        const txToDelete = transactions.find(t => 
            t.id === id || t.idTransaction === id
        );
        
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

        // Create notification with details
        if (txToDelete) {
            addNotification({
                type: 'delete',
                message: `${txToDelete.type === 'income' ? 'Income' : 'Expense'} of Rp${parseFloat(txToDelete.amount).toLocaleString('id-ID')} deleted`
            });
        }
    };

    const updateTransaction = (id, updatedData) => {
        console.log("✏️ UPDATE REQUEST - ID:", id, "Data:", updatedData);
        
        // Get old transaction
        const oldTx = transactions.find(t => t.id === id || t.idTransaction === id);
        
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

        // Create notification with details
        if (oldTx) {
            const newAmount = parseFloat(updatedData.amount || oldTx.amount);
            addNotification({
                type: 'update',
                message: `${oldTx.type === 'income' ? 'Income' : 'Expense'} updated to Rp${newAmount.toLocaleString('id-ID')}`
            });
        }
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