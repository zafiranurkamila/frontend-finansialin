"use client";
import React, { useState, useEffect } from "react";
import { FaChartLine, FaChartBar, FaWallet } from 'react-icons/fa';
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import TransactionDetailModal from "./TransactionDetailModal";

function DashboardContent() {
  const { transactions, notifications, totalIncome, totalExpenses, currentBalance } = useTransactions();
  const { getCategoryById } = useCategories();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Reset state saat component mount
  useEffect(() => {
    setIsDetailModalOpen(false);
    setSelectedTransaction(null);
    
    // Reset scroll position
    const mainContent = document.querySelector('.main-content-area');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, []);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="dashboard-content">
      {/* Cards Grid */}
      <div className="cards-grid">
        <div className="card">
          <div className="card-header">
            <h4>Total Income</h4>
            <FaChartLine className="card-icon" style={{ color: '#10B981' }} />
          </div>
          <div className="value">Rp{totalIncome.toLocaleString('id-ID')}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>Total Expenses</h4>
            <FaChartBar className="card-icon" style={{ color: '#EF4444' }} />
          </div>
          <div className="value">Rp{totalExpenses.toLocaleString('id-ID')}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>Current Balance</h4>
            <FaWallet className="card-icon" style={{ color: '#F59E0B' }} />
          </div>
          <div className="value">Rp{currentBalance.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Content Split */}
      <div className="content-split">
        {/* Left Section */}
        <div className="left-section">
          <div className="budget-section">
            <h3>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <div className="transactions-list">
                {transactions.slice(0, 5).map((transaction) => {
                  const categoryName = transaction.category?.name || 
                                      getCategoryById(transaction.idCategory)?.name || 
                                      'Uncategorized';
                  
                  const description = transaction.description || 
                                    transaction.source || 
                                    'No description';
                  
                  return (
                    <div 
                      key={transaction.id || transaction.idTransaction} 
                      className="transaction-item"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="transaction-info">
                        <p className="transaction-category">{categoryName}</p>
                        <p className="transaction-desc">{description}</p>
                        <p className="transaction-date">
                          {new Date(transaction.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}Rp{parseFloat(transaction.amount).toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <div className="widget-box">
            <h3>Recent Notifications</h3>
            {notifications.length === 0 ? (
              <p className="empty-state">You have no notifications.</p>
            ) : (
              <div className="notifications-widget-list">
                {notifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className="notification-widget-item">
                    <span className="notif-widget-icon">
                      {notification.type === 'income' ? '💰' : notification.type === 'expense' ? '💸' : '🗑️'}
                    </span>
                    <div className="notif-widget-content">
                      <p>{notification.message}</p>
                      <span className="notif-widget-time">
                        {new Date(notification.date).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="widget-box">
            <h3>Quick Stats</h3>
            <div className="quick-stats">
              <div className="quick-stat-item">
                <span className="quick-stat-label">Transactions</span>
                <span className="quick-stat-value">{transactions.length}</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Savings Rate</span>
                <span className="quick-stat-value">
                  {totalIncome > 0 ? ((currentBalance / totalIncome) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        categoryName={selectedTransaction ? (
            selectedTransaction.category?.name ||
            getCategoryById(selectedTransaction.idCategory)?.name ||
            'Uncategorized'
        ) : ''}
      />
    </div>
  );
}

export default DashboardContent;