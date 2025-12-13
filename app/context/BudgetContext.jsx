"use client";
import React, { createContext, useContext, useState } from 'react';
import { useTransactions } from './TransactionContext';
import { useCategories } from '../context/CategoryContext';

const BudgetContext = createContext();

export function BudgetProvider({ children }) {
    // Initialize from localStorage
    const [budgets, setBudgets] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('budgets_cache');
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    return [];
                }
            }
        }
        return [];
    });
    const { transactions, addNotification } = useTransactions();
    const { allCategories, getCategoryById } = useCategories();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Load budgets from backend
    const loadBudgets = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.log("⚠️ No token, skip load budgets");
                return;
            }

            console.log("🔍 Loading budgets from backend...");

            const response = await fetch(`${BACKEND_URL}/api/budgets`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log("Budgets response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("✅ RAW Budgets from backend:", data);
                console.log("✅ First budget structure:", data[0]);

                const mapped = data.map(b => {
                    console.log("Mapping budget:", b);

                    // Get category name from allCategories
                    const categoryObj = allCategories.find(c => c.id === b.idCategory || c.idCategory === b.idCategory);
                    const categoryName = categoryObj?.name || b.category || b.categoryName || 'Unknown';

                    // Calculate period from dates
                    let period = 'monthly';
                    if (b.periodStart && b.periodEnd) {
                        const start = new Date(b.periodStart);
                        const end = new Date(b.periodEnd);
                        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

                        if (diffDays <= 1) period = 'daily';
                        else if (diffDays <= 7) period = 'weekly';
                        else if (diffDays <= 31) period = 'monthly';
                        else period = 'yearly';
                    }

                    return {
                        ...b,
                        id: b.idBudget,
                        idBudget: b.idBudget,
                        limit: parseFloat(b.amount) || 0,
                        amount: parseFloat(b.amount) || 0,
                        period: period,
                        category: categoryName,
                        idCategory: b.idCategory
                    };
                });

                console.log("✅ Mapped budgets:", mapped);
                setBudgets(mapped);

                // Cache to localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('budgets_cache', JSON.stringify(mapped));
                }
            } else {
                console.error("❌ Failed to load budgets:", response.status);
            }
        } catch (err) {
            console.error('❌ Load budgets error:', err);
        }
    };

    const addBudget = (budget) => {
        // For local state update (called from page after API success)
        const newBudget = {
            ...budget,
            id: budget.id || budget.idBudget || Date.now(),
            limit: parseFloat(budget.limit || budget.amount) || 0,
            spent: 0
        };
        const updated = [...budgets, newBudget];
        setBudgets(updated);

        // Update cache
        if (typeof window !== 'undefined') {
            localStorage.setItem('budgets_cache', JSON.stringify(updated));
        }

        // Add notification
        if (addNotification) {
            addNotification('BUDGET_CREATED', `Budget goal created for ${newBudget.category} - Rp${newBudget.limit.toLocaleString('id-ID')} (${newBudget.period})`);
        }
    };

    const updateBudget = (id, updatedData) => {
        const oldBudget = budgets.find(b => b.id === id);
        const updated = budgets.map(b =>
            b.id === id
                ? {
                    ...b,
                    ...updatedData,
                    limit: parseFloat(updatedData.limit || updatedData.amount) || b.limit
                }
                : b
        );
        setBudgets(updated);

        // Update cache
        if (typeof window !== 'undefined') {
            localStorage.setItem('budgets_cache', JSON.stringify(updated));
        }

        // Add notification
        if (addNotification && oldBudget) {
            addNotification('BUDGET_UPDATED', `Budget goal updated for ${oldBudget.category}`);
        }
    };

    const deleteBudget = (id) => {
        const budgetToDelete = budgets.find(b => b.id === id || b.idBudget === id);
        const updated = budgets.filter(b => b.id !== id && b.idBudget !== id);
        setBudgets(updated);

        // Update cache
        if (typeof window !== 'undefined') {
            localStorage.setItem('budgets_cache', JSON.stringify(updated));
        }

        // Add notification
        if (addNotification && budgetToDelete) {
            addNotification('BUDGET_DELETED', `Budget goal deleted for ${budgetToDelete.category}`);
        }
    };

    // Calculate spent amount for a budget
    const getBudgetProgress = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId || b.idBudget === budgetId);
        if (!budget) return { spent: 0, remaining: 0, percentage: 0 };

        // Get category name from budget.category
        const categoryName = budget.category?.toLowerCase();

        // Filter transactions to only those that are expenses and match the budget category
        const relevantTransactions = transactions.filter(t => {
            // Match by category name (case-insensitive)
            const transactionCategory = t.category?.name?.toLowerCase() ||
                allCategories.find(c => c.id === t.idCategory)?.name?.toLowerCase();

            const matchesCategory = transactionCategory === categoryName;
            const isExpense = t.type === 'expense';
            const matchesPeriod = isInPeriod(t.date, budget.period);

            return matchesCategory && isExpense && matchesPeriod;
        });

        const spent = relevantTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const limit = parseFloat(budget.limit || budget.amount) || 0;
        const remaining = limit - spent;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
            spent,
            remaining: remaining < 0 ? Math.abs(remaining) : remaining,
            percentage,
            isOver: spent > limit
        };
    };

    // Check if date is in budget period
    const isInPeriod = (dateString, period) => {
        const date = new Date(dateString);
        const now = new Date();

        switch (period) {
            case 'daily':
                return date.toDateString() === now.toDateString();
            case 'weekly':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo && date <= now;
            case 'monthly':
                return date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
            case 'yearly':
                return date.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    };

    // Check budget warnings and create notifications
    const checkBudgetWarnings = () => {
        budgets.forEach(budget => {
            const progress = getBudgetProgress(budget.id || budget.idBudget);

            // Warning at 90%
            if (progress.percentage >= 90 && progress.percentage < 100 && !progress.isOver) {
                const warningKey = `budget_warning_90_${budget.id}_${new Date().toDateString()}`;
                const alreadyWarned = localStorage.getItem(warningKey);

                if (!alreadyWarned && addNotification) {
                    addNotification('BUDGET_WARNING', `⚠️ Budget Warning: ${budget.category} is ${progress.percentage.toFixed(0)}% used (Rp${progress.spent.toLocaleString('id-ID')} / Rp${budget.limit.toLocaleString('id-ID')})`);
                    localStorage.setItem(warningKey, 'true');
                }
            }

            // Over budget alert
            if (progress.isOver) {
                const overKey = `budget_over_${budget.id}_${new Date().toDateString()}`;
                const alreadyAlerted = localStorage.getItem(overKey);

                if (!alreadyAlerted && addNotification) {
                    addNotification('BUDGET_EXCEEDED', `🚨 Budget Exceeded: ${budget.category} is over budget! Spent Rp${progress.spent.toLocaleString('id-ID')} (Limit: Rp${budget.limit.toLocaleString('id-ID')})`);
                    localStorage.setItem(overKey, 'true');
                }
            }
        });
    };

    const value = {
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetProgress,
        loadBudgets,
        checkBudgetWarnings
    };

    return (
        <BudgetContext.Provider value={value}>
            {children}
        </BudgetContext.Provider>
    );
}

export function useBudget() {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within BudgetProvider');
    }
    return context;
}