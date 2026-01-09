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
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "../components/ConfirmDialog";
import "../style/dashboard.css";
import "../style/budget.css";
import { FaPlus, FaEdit, FaTrash, FaChartLine, FaFilter } from "react-icons/fa";

function BudgetGoalsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState(null);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  // Filter states
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState("");
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [budgetGoals, setBudgetGoals] = useState(null);

  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetProgress, loadBudgets, filterBudgets, getBudgetGoals } = useBudget();
  const { fetchCategories, allCategories } = useCategories();

  // Debug: Log budgetGoals changes
  useEffect(() => {
    console.log("💰 budgetGoals state updated:", budgetGoals);
    if (budgetGoals) {
      console.log("  - Period:", budgetGoals.period);
      console.log("  - Total Budget:", budgetGoals.totals?.totalBudget);
      console.log("  - Active Goals:", budgetGoals.data?.length);
    }
  }, [budgetGoals]);

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
        
        // Don't load budget goals on initial mount - only show when user applies filter
        // setBudgetGoals will remain null until user clicks Apply Filter

        setLoadingBudgets(false);
      }
    };

    loadData();
  }, [isAuthed]);

  // Apply filters
  const handleApplyFilter = async () => {
    if (!filterPeriod) {
      alert(t('pleaseSelectPeriod'));
      return;
    }

    console.log("🎯 Applying filter:", { filterPeriod, filterDate, filterCategory });
    console.log("📋 Current budgets in state:", budgets);
    console.log("📊 Current budgets count:", budgets.length);
    
    setLoadingBudgets(true);
    const categoryId = filterCategory ? parseInt(filterCategory) : null;
    
    // Map UI period to backend period format
    const periodMapping = {
      'daily': 'day',
      'weekly': 'week',
      'monthly': 'monthly',
      'yearly': 'year',
      'year': 'year'
    };
    const backendPeriod = periodMapping[filterPeriod] || filterPeriod;
    
    // Add a small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const filtered = await filterBudgets(backendPeriod, filterDate, categoryId);
    console.log("📊 Filtered results:", filtered);
    setFilteredBudgets(filtered);

    // Get budget type (expense or income) based on category if specified
    let budgetType = 'expense'; // default
    if (categoryId) {
      const selectedCat = allCategories.find(c => (c.id || c.idCategory) === categoryId);
      if (selectedCat) {
        budgetType = selectedCat.type || 'expense';
      }
    }

    // Also get budget goals with proper type (use backend period format)
    const goals = await getBudgetGoals(backendPeriod, filterDate, budgetType, categoryId);
    console.log("🎯 Budget goals response:", goals);
    console.log("🎯 Setting budgetGoals state with:", goals);
    setBudgetGoals(goals);
    
    console.log("✅ Filter complete - backendPeriod:", backendPeriod, "budgetGoals should update");

    setLoadingBudgets(false);
  };

  // Clear filters
  const handleClearFilter = async () => {
    setFilterPeriod("");
    setFilterDate(new Date().toISOString().split('T')[0]);
    setFilterCategory("");
    setFilteredBudgets([]);
    
    // Clear budget goals summary when clearing filter
    setBudgetGoals(null);
  };

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

      // Use amount from updatedData directly
      let payload = {
        amount: parseInt(updatedData.amount, 10),
        periodStart: updatedData.periodStart,
        periodEnd: updatedData.periodEnd,
      };

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

      // Reload budgets from backend to get fresh data
      await loadBudgets();

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
        }, body: JSON.stringify({}),
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
          <h2 className="page-title">{t('budgetGoals')}</h2>

          <div className="header-actions">
            <NotificationDropdown />
            <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
          </div>
        </header>

        <main className="main-content-wrapper">
          <div className="budget-header">
            <p className="budget-subtitle">Set monthly spending limits for different categories</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="add-budget-btn" onClick={() => setShowFilters(!showFilters)}>
                <FaFilter /> {showFilters ? t('hideFilters') : t('showFilters')}
              </button>
              <button className="add-budget-btn" onClick={() => setIsModalOpen(true)}>
                <FaPlus /> {t('addBudget')}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filter-section" style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '15px' }}>{t('filterBudgets')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('period')}</label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">{t('selectPeriod')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="weekly">{t('weekly')}</option>
                    <option value="monthly">{t('monthly')}</option>
                    <option value="year">{t('yearly')}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('date')}</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('category')}</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {allCategories.map(cat => (
                      <option key={cat.id || cat.idCategory} value={cat.id || cat.idCategory}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleApplyFilter}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('applyFilter')}
                </button>
                <button
                  onClick={handleClearFilter}
                  style={{
                    padding: '10px 20px',
                    background: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('clearFilter')}
                </button>
              </div>

              {budgetGoals && (
                budgetGoals.data && budgetGoals.data.length > 0 ? (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    borderLeft: '4px solid #10b981'
                  }}>
                    <h4 style={{ marginBottom: '10px' }}>{t('budgetGoalsSummary')}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                      {/* Get totals from nested structure */}
                      {budgetGoals.totals && (
                        <>
                          {budgetGoals.totals.totalBudget !== undefined && budgetGoals.totals.totalBudget !== null && (
                            <div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('totalBudget')}: </span>
                              <strong>Rp {budgetGoals.totals.totalBudget?.toLocaleString('id-ID')}</strong>
                            </div>
                          )}
                          {budgetGoals.totals.totalSpent !== undefined && budgetGoals.totals.totalSpent !== null && (
                            <div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('totalSpent')}: </span>
                              <strong>Rp {budgetGoals.totals.totalSpent?.toLocaleString('id-ID')}</strong>
                            </div>
                          )}
                          {budgetGoals.totals.remaining !== undefined && budgetGoals.totals.remaining !== null && (
                            <div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('remaining')}: </span>
                              <strong style={{ color: budgetGoals.totals.remaining < 0 ? '#ef4444' : '#10b981' }}>
                                Rp {Math.abs(budgetGoals.totals.remaining)?.toLocaleString('id-ID')}
                              </strong>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Show data breakdown - group by category name to avoid duplicates */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d1d5db' }}>
                      <p style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>Breakdown by category:</p>
                      {/* Group by category name to combine income/expense */}
                      {Array.from(
                        budgetGoals.data.reduce((acc, item) => {
                          const existing = acc.get(item.name) || { ...item, count: 0 };
                          existing.budgetAmount = (existing.budgetAmount || 0) + (item.budgetAmount || 0);
                          existing.spent = (existing.spent || 0) + (item.spent || 0);
                          existing.count = (existing.count || 0) + 1;
                          return acc.set(item.name, existing);
                        }, new Map()).values()
                      ).map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                          <span>{item.name}:</span>
                          <span>
                            {item.budgetAmount > 0 && (
                              <span style={{ marginRight: '8px' }}>
                                Budget: <strong>Rp {item.budgetAmount?.toLocaleString('id-ID')}</strong>
                              </span>
                            )}
                            {item.spent > 0 && (
                              <span style={{ color: item.overBudget ? '#ef4444' : '#10b981' }}>
                                Spent: <strong>Rp {item.spent?.toLocaleString('id-ID')}</strong>
                              </span>
                            )}
                            {item.budgetAmount === 0 && item.spent === 0 && (
                              <span style={{ color: '#9ca3af' }}>No data</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '6px',
                    color: '#92400E',
                    fontSize: '14px'
                  }}>
                    ⚠️ {t('noBudgetsAvailable') || 'No budgets available for the selected period and category.'}
                  </div>
                )
              )}

              {filteredBudgets.length === 0 && filterPeriod && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '6px',
                  color: '#92400E',
                  fontSize: '14px'
                }}>
                  ⚠️ No budgets found for the selected period, date, and category. Try adjusting your filters.
                </div>
              )}
            </div>
          )}

          <div className="budget-grid">
            {loadingBudgets ? (
              <div className="empty-state-budget">
                <p>Loading budgets...</p>
              </div>
            ) : (filteredBudgets.length > 0 ? filteredBudgets : budgets).length === 0 ? (
              <div className="empty-state-budget">
      <FaChartLine className="empty-icon" />
      <h3>No Budget Goals Yet</h3>
      <p>Start by creating your first budget goal to track your spending</p>
    </div>
  ) : (
    (filteredBudgets.length > 0 ? filteredBudgets : budgets).map((budget) => {
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
              <span className="amount-label">{t('spent')}</span>
              <span className={`amount-value ${isOverBudget ? "over" : ""}`}>Rp {progress.spent.toLocaleString("id-ID")}</span>
            </div>
            <div className="amount-item">
              <span className="amount-label">{t('limit')}</span>
              <span className="amount-value">Rp {limit.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div className={`progress-fill ${isOverBudget ? "over-budget" : ""}`} style={{ width: `${Math.min(progress.percentage, 100)}%` }}></div>
            </div>
            <span className={`progress-text ${isOverBudget ? "over" : ""}`}>{progress.percentage.toFixed(0)}% {t('used')}</span>
          </div>

          {isOverBudget && <div className="budget-warning">{t('overBudgetBy')} Rp {progress.remaining.toLocaleString("id-ID")}</div>}

          {!isOverBudget && progress.remaining > 0 && <div className="budget-info">Rp {progress.remaining.toLocaleString("id-ID")} {t('budgetRemaining')}</div>}
        </div>
      );
    })
  )}
</div>

{/* Budget Summary - use budgetGoals if available, otherwise use budgets */}
{
  budgetGoals ? (
    <div className="budget-summary">
      <h3>{t('budgetSummary')}</h3>
      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">{t('totalBudget')}</span>
          <span className="stat-value">Rp {(budgetGoals.totals?.totalBudget || 0).toLocaleString("id-ID")}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('activeGoals')}</span>
          <span className="stat-value">{budgetGoals.data?.length || 0}</span>
        </div>
      </div>
    </div>
  ) : (
    (filteredBudgets.length > 0 ? filteredBudgets : budgets).length > 0 && (
      <div className="budget-summary">
        <h3>{t('budgetSummary')}</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">{t('totalBudget')}</span>
            <span className="stat-value">Rp {(filteredBudgets.length > 0 ? filteredBudgets : budgets).reduce((sum, b) => sum + parseFloat(b.limit || b.amount || 0), 0).toLocaleString("id-ID")}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('activeGoals')}</span>
            <span className="stat-value">{(filteredBudgets.length > 0 ? filteredBudgets : budgets).length}</span>
          </div>
        </div>
      </div>
    )
  )
}
        </main >
      </div >

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
    </div >
  );
}

export default BudgetGoalsPage;
