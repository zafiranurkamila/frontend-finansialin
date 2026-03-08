"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/authHelper';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
    // Separate categories by type
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('access_token');
            console.log("🔍 Fetching categories...");

            if (!token) {
                console.log("⚠️ No token, skip fetch categories");
                setIsLoaded(true);
                return;
            }

            const response = await fetchWithAuth(`${BACKEND_URL}/api/categories`, {
                method: 'GET',
            });

            console.log("Categories response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Categories loaded:", data);
                
                // Transform categories
                const transformed = data.map(cat => ({
                    id: cat.idCategory,
                    name: cat.name,
                    type: cat.type || 'expense',
                    userId: cat.idUser,
                    createdAt: cat.createdAt
                }));

                const income = transformed.filter(cat => cat.type === 'income');
                const expense = transformed.filter(cat => cat.type !== 'income');

                setIncomeCategories(income);
                setExpenseCategories(expense);
            } else {
                console.error("❌ Failed to fetch categories:", response.status);
                const errorData = await response.json();
                console.error("Error:", errorData);
            }
        } catch (err) {
            console.error('❌ Fetch categories error:', err);
        } finally {
            setIsLoaded(true);
        }
    };

    const addCategory = async (name, type) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('No token');

            console.log("➕ Adding category:", name, "Type:", type);

            const response = await fetchWithAuth(`${BACKEND_URL}/api/categories`, {
                method: 'POST',
                body: JSON.stringify({ name, type }),
            });

            console.log("Add category response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Error:", errorData);
                throw new Error(errorData.message || 'Failed to add category');
            }

            const newCategory = await response.json();
            console.log("✅ Category added:", newCategory);
            
            const transformed = {
                id: newCategory.idCategory,
                name: newCategory.name,
                type: newCategory.type || type,
                userId: newCategory.idUser,
                createdAt: newCategory.createdAt,
            };
            
            // Add to appropriate list
            if (type === 'income') {
                const updated = [...incomeCategories, transformed];
                setIncomeCategories(updated);
            } else {
                const updated = [...expenseCategories, transformed];
                setExpenseCategories(updated);
            }
            
            return transformed;
        } catch (err) {
            console.error('❌ Add category error:', err);
            throw err;
        }
    };

    const deleteCategory = async (id, type) => {
        try {
            const token = localStorage.getItem('access_token');
            console.log("🗑️ Deleting category:", id, "Type:", type);

            const response = await fetchWithAuth(`${BACKEND_URL}/api/categories/${id}`, {
                method: 'DELETE',
            });

            console.log("Delete category response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Error:", errorData);
                throw new Error(errorData.message || 'Failed to delete category');
            }

            console.log("✅ Category deleted");
            
            // Remove from appropriate list
            if (type === 'income') {
                const updated = incomeCategories.filter(c => c.id !== id);
                setIncomeCategories(updated);
            } else {
                const updated = expenseCategories.filter(c => c.id !== id);
                setExpenseCategories(updated);
            }
        } catch (err) {
            console.error('❌ Delete category error:', err);
            throw err;
        }
    };

    const getCategoryByName = (name, type) => {
        const list = type === 'income' ? incomeCategories : expenseCategories;
        return list.find(c => c.name.toLowerCase() === name.toLowerCase());
    };

    const getCategoryById = (id) => {
        return [...incomeCategories, ...expenseCategories].find(c => c.id === id);
    };

    const getCategoriesByType = (type) => {
        return type === 'income' ? incomeCategories : expenseCategories;
    };

    const value = {
        incomeCategories,
        expenseCategories,
        allCategories: [...incomeCategories, ...expenseCategories],
        isLoaded,
        addCategory,
        deleteCategory,
        getCategoryByName,
        getCategoryById,
        getCategoriesByType,
        fetchCategories
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within CategoryProvider');
    }
    return context;
}