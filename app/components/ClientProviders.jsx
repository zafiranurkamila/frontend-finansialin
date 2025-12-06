"use client";
import React from 'react';
import { UserProvider } from '../context/UserContext';
import { TransactionProvider } from '../context/TransactionContext';
import { CategoryProvider } from '../context/CategoryContext';
import { BudgetProvider } from '../context/BudgetContext';

export default function ClientProviders({ children }) {
    return (
        <UserProvider>
            <CategoryProvider>
                <TransactionProvider>
                    <BudgetProvider>
                        {children}
                    </BudgetProvider>
                </TransactionProvider>
            </CategoryProvider>
        </UserProvider>
    );
}