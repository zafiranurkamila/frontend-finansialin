"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import AddBudgetModal from "../components/AddBudgetModal";
import EditBudgetModal from "../components/EditBudgetModal";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import { useBudget } from "../context/BudgetContext";
import { useCategories } from "../context/CategoryContext";
import ConfirmDialog from "../components/ConfirmDialog";
import "../style/dashboard.css";
import "../style/budget.css";
import { FaPlus, FaEdit, FaTrash, FaChartLine } from "react-icons/fa";

function BudgetGoalsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState(null);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetProgress, loadBudgets } = useBudget();
  const { fetchCategories } = useCategories();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthed(true);
    }
    setLoading(false);
  }, [router]);

  // Load data on mount and when coming back to page
  useEffect(() => {
    const loadData = async () => {
      if (isAuthed) {
        console.log("🔄 Loading budget page data...");
        setLoadingBudgets(true);

        // Load categories FIRST
        await fetchCategories();

        // Wait a bit for categories to be in context
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Then load budgets
        await loadBudgets();

        setLoadingBudgets(false);
      }
    };

    loadData();
  }, [isAuthed]);

  // Reload budgets when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isAuthed) {
        console.log("👁️ Page visible, reloading budgets...");
        setLoadingBudgets(true);
        await loadBudgets();
        setLoadingBudgets(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthed]);

  const handleAddBudget = async (budgetData) => {
    try {
      const token = localStorage.getItem("access_token");

      // Convert period to dates for backend
      const { periodStart, periodEnd } = getPeriodDates(budgetData.period);

      const payload = {
        idCategory: budgetData.idCategory,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        amount: parseFloat(budgetData.limit),
      };

      console.log("📤 Creating budget:", payload);

      const response = await fetch(`${BACKEND_URL}/api/budgets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add budget");
      }

      const newBudget = await response.json();
      console.log("✅ Budget created:", newBudget);

      // Add to context with original format + category name
      const budgetToAdd = {
        ...newBudget,
        id: newBudget.idBudget,
        category: budgetData.category, // Keep the category NAME
        period: budgetData.period, // Keep the period STRING
        limit: budgetData.limit,
        amount: budgetData.limit,
      };

      console.log("Adding to context:", budgetToAdd);
      addBudget(budgetToAdd);

      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Add budget error:", err);
      alert("Failed to add budget: " + err.message);
    }
  };

  const handleEditBudgetClick = (budget) => {
    setBudgetToEdit(budget);
    setIsEditModalOpen(true);
  };

  const handleEditBudget = async (updatedData) => {
    try {
      if (!budgetToEdit) return;

      const token = localStorage.getItem("access_token");
      const budgetId = budgetToEdit.id || budgetToEdit.idBudget;

      // Convert period to dates if period changed
      let payload = {
        amount: parseFloat(updatedData.limit),
      };

      if (updatedData.period && updatedData.period !== budgetToEdit.period) {
        const { periodStart, periodEnd } = getPeriodDates(updatedData.period);
        payload.periodStart = periodStart.toISOString();
        payload.periodEnd = periodEnd.toISOString();
      }

      console.log("📤 Updating budget:", budgetId, payload);

      const response = await fetch(`${BACKEND_URL}/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update budget");
      }

      const updated = await response.json();
      console.log("✅ Budget updated:", updated);

      updateBudget(budgetId, {
        ...updatedData,
        limit: updatedData.limit,
      });

      setIsEditModalOpen(false);
      setBudgetToEdit(null);
    } catch (err) {
      console.error("❌ Edit budget error:", err);
      alert("Failed to update budget: " + err.message);
    }
  };

  const handleDeleteBudgetClick = (id) => {
    setBudgetToDeleteId(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!budgetToDeleteId) return;

      const token = localStorage.getItem("access_token");

      console.log("🗑️ Deleting budget:", budgetToDeleteId);

      const response = await fetch(`${BACKEND_URL}/api/budgets/${budgetToDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete budget");
      }

      console.log("✅ Budget deleted");

      deleteBudget(budgetToDeleteId);
      setIsAlertOpen(false);
      setBudgetToDeleteId(null);
    } catch (err) {
      console.error("❌ Delete budget error:", err);
      alert("Failed to delete budget: " + err.message);
    }
  };

  const handleCancelDelete = () => {
    setIsAlertOpen(false);
    setBudgetToDeleteId(null);
  };

  const handleLogoutAttempt = () => {
    setIsLogoutAlertOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutAlertOpen(false);
    const token = localStorage.getItem("access_token");

    if (token) {
      fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(console.error);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const handleCancelLogout = () => {
    setIsLogoutAlertOpen(false);
  };

  // Helper: Convert period string to dates
  const getPeriodDates = (period) => {
    const now = new Date();
    let periodStart, periodEnd;

    switch (period) {
      case "daily":
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "weekly": {
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const diff = now.getDate() - day; // Get Monday of current week
        periodStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
        break;
      }
      case "monthly":
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "yearly":
        periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { periodStart, periodEnd };
  };

  if (loading || !isAuthed)
    return (
      <div className="loading">
        <div className="loading-container">
          <div className="loading-text">Finansialin</div>
        </div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <Sidebar onLogoutAttempt={handleLogoutAttempt} />

      <div className="main-content-area">
        <header className="dashboard-header">
          <h2 className="page-title">Budget Goals</h2>

          <div className="header-actions">
            <NotificationDropdown />
            <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
          </div>
        </header>

        <main className="main-content-wrapper">
          <div className="budget-header">
            <p className="budget-subtitle">Set monthly spending limits for different categories</p>
            <button className="add-budget-btn" onClick={() => setIsModalOpen(true)}>
              <FaPlus /> Add Budget Goal
            </button>
          </div>

          <div className="budget-grid">
            {loadingBudgets ? (
              <div className="empty-state-budget">
                <p>Loading budgets...</p>
              </div>
            ) : budgets.length === 0 ? (
              <div className="empty-state-budget">
                <FaChartLine className="empty-icon" />
                <h3>No Budget Goals Yet</h3>
                <p>Start by creating your first budget goal to track your spending</p>
              </div>
            ) : (
              budgets.map((budget) => {
                const progress = getBudgetProgress(budget.id || budget.idBudget);
                const isOverBudget = progress.percentage > 100;
                const limit = parseFloat(budget.limit || budget.amount) || 0;

                return (
                  <div key={budget.id || budget.idBudget} className="budget-card">
                    <div className="budget-card-header">
                      <div>
                        <h3 className="budget-category">{budget.category}</h3>
                        <p className="budget-period">{budget.period || "monthly"}</p>
                      </div>
                      <div className="budget-actions">
                        <button className="icon-btn edit" onClick={() => handleEditBudgetClick(budget)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDeleteBudgetClick(budget.id || budget.idBudget)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="budget-amounts">
                      <div className="amount-item">
                        <span className="amount-label">Spent</span>
                        <span className={`amount-value ${isOverBudget ? "over" : ""}`}>Rp {progress.spent.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Limit</span>
                        <span className="amount-value">Rp {limit.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className={`progress-fill ${isOverBudget ? "over-budget" : ""}`} style={{ width: `${Math.min(progress.percentage, 100)}%` }}></div>
                      </div>
                      <span className={`progress-text ${isOverBudget ? "over" : ""}`}>{progress.percentage.toFixed(0)}% used</span>
                    </div>

                    {isOverBudget && <div className="budget-warning">⚠️ Over budget by Rp {progress.remaining.toLocaleString("id-ID")}</div>}

                    {!isOverBudget && progress.remaining > 0 && <div className="budget-info">Rp {progress.remaining.toLocaleString("id-ID")} remaining</div>}
                  </div>
                );
              })
            )}
          </div>

          {budgets.length > 0 && (
            <div className="budget-summary">
              <h3>Budget Summary</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Budget</span>
                  <span className="stat-value">Rp {budgets.reduce((sum, b) => sum + parseFloat(b.limit || b.amount || 0), 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Goals</span>
                  <span className="stat-value">{budgets.length}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AddBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddBudget={handleAddBudget} />

      <EditBudgetModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setBudgetToEdit(null);
        }}
        onEditBudget={handleEditBudget}
        budget={budgetToEdit}
      />

      <ConfirmDialog isOpen={isAlertOpen} title="Delete Budget Goal" message="Are you sure you want to delete this budget goal?" onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />

      <ConfirmDialog isOpen={isLogoutAlertOpen} title="Confirm Logout" message="Are you sure you want to log out?" onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
    </div>
  );
}

export default BudgetGoalsPage;
