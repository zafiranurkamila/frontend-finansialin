"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTransactions } from './TransactionContext';

const BudgetContext = createContext();

export function BudgetProvider({ children }) {
    const [budgets, setBudgets] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { transactions } = useTransactions();

    // Load from localStorage
    useEffect(() => {
        const savedBudgets = localStorage.getItem('budgets');
        if (savedBudgets) {
            setBudgets(JSON.parse(savedBudgets));
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('budgets', JSON.stringify(budgets));
        }
    }, [budgets, isLoaded]);

    const addBudget = (budget) => {
        const newBudget = {
            ...budget,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        setBudgets(prev => [newBudget, ...prev]);
    };

    const updateBudget = (id, updatedData) => {
        setBudgets(prev =>
            prev.map(b => (b.id === id ? { ...b, ...updatedData } : b))
        );
    };

    const deleteBudget = (id) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const getBudgetProgress = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) return { spent: 0, remaining: 0, percentage: 0 };

        // Calculate spent amount for this category
        const spent = transactions
            .filter(t => 
                t.type === 'expense' && 
                t.category.toLowerCase() === budget.category.toLowerCase()
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const remaining = budget.limit - spent;
        const percentage = (spent / budget.limit) * 100;

        return {
            spent,
            remaining,
            percentage
        };
    };

    const value = {
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetProgress
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