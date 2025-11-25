// app/components/ClientProviders.jsx
'use client';
import React from 'react';
import { TransactionProvider } from '../context/TransactionContext';
import { UserProvider } from '../context/UserContext';
import { BudgetProvider } from '../context/BudgetContext'; // <-- TAMBAHKAN INI

export default function ClientProviders({ children }) {
    return (
        // Susun semua provider di sini.
        // Pastikan semua provider (User, Transaction, Budget) mengelilingi 'children'.
        <UserProvider>
            <TransactionProvider>
                <BudgetProvider> {/* <-- WRAP DENGAN BUDGETPROVIDER */}
                    {children}
                </BudgetProvider>
            </TransactionProvider>
        </UserProvider>
    );
}