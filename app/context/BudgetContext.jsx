"use client";
import React, { createContext, useContext, useState } from "react";
import { useTransactions } from "./TransactionContext";
import { useCategories } from "../context/CategoryContext";

const BudgetContext = createContext();

export function BudgetProvider({ children }) {
  // Initialize from localStorage
  const [budgets, setBudgets] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("budgets_cache");
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

  // Remap budgets once categories sudah tersedia supaya nama kategori tidak "Unknown"
  React.useEffect(() => {
    if (!allCategories.length || !budgets.length) return;

    const remapped = budgets.map((b) => {
      const cat = allCategories.find((c) => c.id === b.idCategory || c.idCategory === b.idCategory);
      if (!cat) return b;
      // Jika sebelumnya Unknown, perbarui nama kategori
      return {
        ...b,
        category: cat.name,
      };
    });

    setBudgets(remapped);

    if (typeof window !== "undefined") {
      localStorage.setItem("budgets_cache", JSON.stringify(remapped));
    }
  }, [allCategories]);

  // Load budgets from backend
  const loadBudgets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("⚠️ No token, skip load budgets");
        return;
      }

      console.log("🔍 Loading budgets from backend...");

      const response = await fetch(`${BACKEND_URL}/api/budgets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Budgets response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ RAW Budgets from backend:", data);
        console.log("✅ First budget structure:", data[0]);

        const mapped = data.map((b) => {
          console.log("Mapping budget:", b);

          // Get category name from allCategories
          const categoryObj = allCategories.find((c) => c.id === b.idCategory || c.idCategory === b.idCategory);
          const categoryName = categoryObj?.name || b.category || b.categoryName || "Unknown";

          // Calculate period from dates
          let period = "monthly";
          if (b.periodStart && b.periodEnd) {
            const start = new Date(b.periodStart);
            const end = new Date(b.periodEnd);
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) period = "daily";
            else if (diffDays <= 7) period = "weekly";
            else if (diffDays <= 31) period = "monthly";
            else period = "yearly";
          }

          return {
            ...b,
            id: b.idBudget,
            idBudget: b.idBudget,
            limit: parseFloat(b.amount) || 0,
            amount: parseFloat(b.amount) || 0,
            period: period,
            category: categoryName,
            idCategory: b.idCategory,
          };
        });

        console.log("✅ Mapped budgets:", mapped);
        setBudgets(mapped);

        // Cache to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("budgets_cache", JSON.stringify(mapped));
        }
      } else {
        console.error("❌ Failed to load budgets:", response.status);
      }
    } catch (err) {
      console.error("❌ Load budgets error:", err);
    }
  };

  const addBudget = (budget) => {
    // For local state update (called from page after API success)
    const newBudget = {
      ...budget,
      id: budget.id || budget.idBudget || Date.now(),
      limit: parseFloat(budget.limit || budget.amount) || 0,
      spent: 0,
    };
    const updated = [...budgets, newBudget];
    setBudgets(updated);

    // Update cache
    if (typeof window !== "undefined") {
      localStorage.setItem("budgets_cache", JSON.stringify(updated));
    }

    // Add notification
    if (addNotification) {
      addNotification("BUDGET_CREATED", `Budget goal created for ${newBudget.category} - Rp${newBudget.limit.toLocaleString("id-ID")} (${newBudget.period})`);
    }
  };

  const updateBudget = (id, updatedData) => {
    const oldBudget = budgets.find((b) => b.id === id);
    const updated = budgets.map((b) =>
      b.id === id
        ? {
            ...b,
            ...updatedData,
            limit: parseFloat(updatedData.limit || updatedData.amount) || b.limit,
          }
        : b
    );
    setBudgets(updated);

    // Update cache
    if (typeof window !== "undefined") {
      localStorage.setItem("budgets_cache", JSON.stringify(updated));
    }

    // Add notification
    if (addNotification && oldBudget) {
      addNotification("BUDGET_UPDATED", `Budget goal updated for ${oldBudget.category}`);
    }
  };

  const deleteBudget = (id) => {
    const budgetToDelete = budgets.find((b) => b.id === id || b.idBudget === id);
    const updated = budgets.filter((b) => b.id !== id && b.idBudget !== id);
    setBudgets(updated);

    // Update cache
    if (typeof window !== "undefined") {
      localStorage.setItem("budgets_cache", JSON.stringify(updated));
    }

    // Add notification
    if (addNotification && budgetToDelete) {
      addNotification("BUDGET_DELETED", `Budget goal deleted for ${budgetToDelete.category}`);
    }
  };

  // Calculate spent amount for a budget
  const getBudgetProgress = (budgetId) => {
    const budget = budgets.find((b) => b.id === budgetId || b.idBudget === budgetId);
    if (!budget) return { spent: 0, remaining: 0, percentage: 0 };

    // Get category name from budget.category
    const categoryName = budget.category?.toLowerCase();

    // Filter transactions to only those that are expenses and match the budget category
    const relevantTransactions = transactions.filter((t) => {
      // Match by category name (case-insensitive)
      const transactionCategory = t.category?.name?.toLowerCase() || allCategories.find((c) => c.id === t.idCategory)?.name?.toLowerCase();

      const matchesCategory = transactionCategory === categoryName;
      const isExpense = t.type === "expense";
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
      isOver: spent > limit,
    };
  };

  // Check if date is in budget period
  const isInPeriod = (dateString, period) => {
    const date = new Date(dateString);
    const now = new Date();

    switch (period) {
      case "daily":
        return date.toDateString() === now.toDateString();
      case "weekly":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo && date <= now;
      case "monthly":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case "yearly":
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // Check budget warnings and create notifications
  const checkBudgetWarnings = async () => {
    if (!budgets.length) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      console.log("🔍 Checking budget warnings via backend API...");

      // Check each budget via backend API (this will trigger notifications automatically)
      for (const budget of budgets) {
        const budgetId = budget.id || budget.idBudget;
        if (!budgetId) continue;

        console.log(`📊 Checking budget ${budgetId} (${budget.category})`);

        const response = await fetch(`${BACKEND_URL}/api/budgets/${budgetId}/usage`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const usage = await response.json();
          console.log(`✅ Budget ${budgetId} usage:`, usage);

          // Backend automatically creates notifications when over budget
          // No need to create local notifications here
        } else {
          console.error(`❌ Failed to check budget ${budgetId} usage:`, response.status);
        }
      }
    } catch (error) {
      console.error("❌ Error checking budget warnings:", error);
    }
  };

  // Filter budgets by period and category
  const filterBudgets = async (period, date, idCategory = null) => {
    try {
      const token = localStorage.getItem("access_token");
      console.log("🔑 Token check - Token exists:", !!token, "Token length:", token?.length);
      if (!token) {
        console.log("⚠️ No token, cannot filter budgets");
        return [];
      }

      console.log("🔍 Filtering budgets:", { period, date, idCategory });
      console.log("📋 Budgets available in context:", budgets);

      let url = `${BACKEND_URL}/api/budgets/filter?period=${period}&date=${date}`;
      if (idCategory) {
        url += `&idCategory=${idCategory}`;
      }

      console.log("📤 Fetch URL:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Filtered budgets response:", data);
        console.log("📊 Total found from backend:", data.length);

        // Respect empty backend result to avoid showing unrelated periods
        if (!data || data.length === 0) {
          return [];
        }

        // Map the data
        const mapped = data.map((b) => {
          const categoryObj = allCategories.find((c) => c.id === b.idCategory || c.idCategory === b.idCategory);
          const categoryName = categoryObj?.name || b.category || "Unknown";

          return {
            ...b,
            id: b.idBudget,
            idBudget: b.idBudget,
            limit: parseFloat(b.amount) || 0,
            amount: parseFloat(b.amount) || 0,
            category: categoryName,
            idCategory: b.idCategory,
          };
        });

        return mapped;
      }

      const errorText = await response.text();
      console.error("❌ Failed to filter budgets:", response.status, errorText);
      
      if (response.status === 401) {
        console.error("❌ Token expired or invalid, please login again");
      }
      
      return [];    } catch (err) {
      console.error("❌ Filter budgets error:", err);
      return [];
    }
  };

  // Client-side filtering fallback - takes budgets as parameter to avoid closure issues
  const filterBudgetsClientSide = (budgetsToFilter, period, date, idCategory) => {
    console.log("🔍 Client-side filter - Period:", period, "Date:", date, "Category:", idCategory);
    console.log("📋 Budgets to filter:", budgetsToFilter);
    console.log("📋 Total budgets available:", budgetsToFilter.length);
    
    if (budgetsToFilter.length === 0) {
      console.warn("⚠️ No budgets available to filter!");
      return [];
    }
    
    const filterDate = new Date(date);
    console.log("📅 Filter date:", filterDate.toISOString());
    
    const filtered = budgetsToFilter.filter(b => {
      console.log(`\n🔎 Checking budget: ${b.category}`);
      console.log(`   Period Start: ${b.periodStart}`);
      console.log(`   Period End: ${b.periodEnd}`);
      console.log(`   Category ID: ${b.idCategory}, Looking for: ${idCategory}`);
      
      // Filter by category if specified
      if (idCategory && b.idCategory != idCategory) {
        console.log(`   ❌ Category doesn't match`);
        return false;
      }

      // Check if budget period overlaps with requested period
      const budgetStart = new Date(b.periodStart);
      const budgetEnd = new Date(b.periodEnd);
      
      console.log(`   Budget range: ${budgetStart.toISOString()} to ${budgetEnd.toISOString()}`);

      let periodStart, periodEnd;
      
      switch (period) {
        case 'daily':
          periodStart = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
          periodEnd = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate() + 1);
          break;
        case 'weekly': {
          const day = filterDate.getDay();
          const diff = filterDate.getDate() - day;
          periodStart = new Date(filterDate.getFullYear(), filterDate.getMonth(), diff);
          periodEnd = new Date(filterDate.getFullYear(), filterDate.getMonth(), diff + 7);
          break;
        }
        case 'monthly':
          periodStart = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
          periodEnd = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 1);
          break;
        case 'year':
          periodStart = new Date(filterDate.getFullYear(), 0, 1);
          periodEnd = new Date(filterDate.getFullYear() + 1, 0, 1);
          break;
        default:
          console.log(`   ❌ Invalid period: ${period}`);
          return false;
      }

      console.log(`   Period range: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

      // Check overlap
      const overlaps = budgetStart < periodEnd && budgetEnd > periodStart;
      console.log(`   Overlap check: budgetStart(${budgetStart.getTime()}) < periodEnd(${periodEnd.getTime()}) = ${budgetStart < periodEnd} && budgetEnd(${budgetEnd.getTime()}) > periodStart(${periodStart.getTime()}) = ${budgetEnd > periodStart} => ${overlaps}`);
      
      return overlaps;
    });

    console.log("✅ Client-side filtered result:", filtered);
    console.log("📊 Filtered count:", filtered.length);
    return filtered;
  };

  // Get budget goals by period, type, and category
  const getBudgetGoals = async (period, date, type = 'expense', idCategory = null) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("⚠️ No token, cannot get budget goals");
        return null;
      }

      console.log("🎯 Getting budget goals:", { period, date, type, idCategory });

      let url = `${BACKEND_URL}/api/budgets/goals?period=${period}&date=${date}&type=${type}`;
      if (idCategory) {
        url += `&idCategory=${idCategory}`;
      }

      console.log("📤 Goals fetch URL:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Budget goals response:", data);
        console.log("📊 Totals:", data.totals);
        console.log("📊 Data items:", data.data?.length);
        return data;
      } else {
        console.error("❌ Failed to get budget goals:", response.status);
        const errorData = await response.text();
        console.error("Error response:", errorData);
        return null;
      }
    } catch (err) {
      console.error("❌ Get budget goals error:", err);
      return null;
    }
  };

  const value = {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetProgress,
    loadBudgets,
    checkBudgetWarnings,
    filterBudgets,
    getBudgetGoals,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within BudgetProvider");
  }
  return context;
}
