"use client";
import React, { useEffect, useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { useTransactions } from "../context/TransactionContext";
import "../style/budgetProgress.css";
import { FaExclamationTriangle } from 'react-icons/fa';

export default function BudgetProgress() {
  const { budgets, getBudgetProgress } = useBudget();
  const { transactions } = useTransactions();
  const [budgetData, setBudgetData] = useState([]);

  useEffect(() => {
    if (budgets && budgets.length > 0) {
      const data = budgets.map(budget => ({
        ...budget,
        progress: getBudgetProgress(budget.id)
      }));
      setBudgetData(data);
    }
  }, [budgets, transactions, getBudgetProgress]);

  if (!budgetData || budgetData.length === 0) {
    return (
      <div className="budget-section">
        <h3>Budget Progress</h3>
        <div className="empty-budget-state">
          <p>No budget goals set yet</p>
          <small>Create a budget to start tracking your spending</small>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-section">
      <h3>Budget Progress</h3>
      <div className="budget-progress-list">
        {budgetData.map(budget => {
          const isOverBudget = budget.progress.percentage > 100;
          const statusClass = isOverBudget ? 'over-budget' : budget.progress.percentage > 75 ? 'warning' : 'normal';

          return (
            <div key={budget.id} className={`budget-progress-item ${statusClass}`}>
              <div className="budget-item-header">
                <div className="budget-info">
                  <h4 className="budget-category">
                    {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                  </h4>
                  <span className="budget-period">{budget.period}</span>
                </div>
                <div className="budget-amounts">
                  <span className="spent-amount">
                    Rp {budget.progress.spent.toLocaleString('id-ID')}
                  </span>
                  <span className="divider">/</span>
                  <span className="limit-amount">
                    Rp {budget.limit.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar-background">
                  <div
                    className={`progress-bar-fill ${isOverBudget ? 'over' : ''}`}
                    style={{
                      width: `${Math.min(budget.progress.percentage, 100)}%`
                    }}
                  ></div>
                </div>
                <span className="progress-percentage">
                  {budget.progress.percentage.toFixed(0)}%
                </span>
              </div>

              <div className="budget-status">
                {isOverBudget ? (
                  <div className="status-over">
                    <FaExclamationTriangle className="status-icon" />
                    <span>
                      Over by Rp {Math.abs(budget.progress.remaining).toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <div className="status-normal">
                    <span>
                      Rp {budget.progress.remaining.toLocaleString('id-ID')} remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}