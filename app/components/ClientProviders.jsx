"use client";
import React from 'react';
import { UserProvider } from '../context/UserContext';
import { TransactionProvider } from '../context/TransactionContext';
import { CategoryProvider } from '../context/CategoryContext';
import { BudgetProvider } from '../context/BudgetContext';
import { LanguageProvider } from '../context/LanguageContext';
import { FundingSourceProvider } from '../context/FundingSourceContext';

export default function ClientProviders({ children }) {
    return (
        <LanguageProvider>
            <UserProvider>
                <CategoryProvider>
                    <FundingSourceProvider>
                        <TransactionProvider>
                            <BudgetProvider>
                                {children}
                            </BudgetProvider>
                        </TransactionProvider>
                    </FundingSourceProvider>
                </CategoryProvider>
            </UserProvider>
        </LanguageProvider>
    );
}