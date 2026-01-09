"use client";
import React, { useState, useEffect } from "react";
import { FaChartLine, FaChartBar, FaWallet, FaMoneyBillWave, FaShoppingCart, FaTrash, FaEdit, FaChartPie, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { useLanguage } from "../context/LanguageContext";
import TransactionDetailModal from "./TransactionDetailModal";
import { fetchWithAuth } from "../utils/authHelper";

function DashboardContent() {
  const { t } = useLanguage();
  const { transactions, totalIncome, totalExpenses, currentBalance } = useTransactions();
  const { getCategoryById } = useCategories();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ transactionAlerts: true, budgetAlerts: true });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const readNotifPrefs = () => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          transactionAlerts: parsed.transactionAlerts ?? true,
          budgetAlerts: parsed.budgetAlerts ?? true,
        };
      } catch (e) {
        console.warn('Failed to parse notification settings');
      }
    }
    return { transactionAlerts: true, budgetAlerts: true };
  };

  const isTransactionType = (type) => {
    const t = (type || '').toUpperCase();
    return [
      'INCOME',
      'EXPENSE',
      'TRANSACTION_CREATED',
      'TRANSACTION_UPDATED',
      'TRANSACTION_DELETED',
      'TRANSACTION',
      'DELETE',
      'UPDATE',
    ].includes(t);
  };

  const isBudgetType = (type) => {
    const t = (type || '').toUpperCase();
    return [
      'BUDGET',
      'BUDGET_CREATED',
      'BUDGET_WARNING',
      'BUDGET_EXCEEDED',
      'OVER_BUDGET',
      'BUDGET_DELETED',
    ].includes(t);
  };

  const fetchNotifications = async () => {
    try {
      setNotifPrefs(readNotifPrefs());
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        setBackendNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Reset state saat component mount
  useEffect(() => {
    setIsDetailModalOpen(false);
    setSelectedTransaction(null);
    setNotifPrefs(readNotifPrefs());
    fetchNotifications();
    
    // Reset scroll position
    const mainContent = document.querySelector('.main-content-area');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, []);

  // Filter notifications based on preferences
  const filteredNotifications = backendNotifications
    .filter((notif) => {
      if (!notifPrefs.transactionAlerts && isTransactionType(notif.type)) return false;
      if (!notifPrefs.budgetAlerts && isBudgetType(notif.type)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getNotificationIcon = (type) => {
    const iconProps = { size: 20 };
    switch(type) {
      case 'income':
      case 'TRANSACTION_CREATED':
        return <FaMoneyBillWave {...iconProps} style={{ color: '#10B981' }} />;
      case 'expense':
        return <FaShoppingCart {...iconProps} style={{ color: '#EF4444' }} />;
      case 'TRANSACTION_DELETED':
        return <FaTrash {...iconProps} style={{ color: '#6B7280' }} />;
      case 'TRANSACTION_UPDATED':
        return <FaEdit {...iconProps} style={{ color: '#3B82F6' }} />;
      case 'budget':
      case 'BUDGET_CREATED':
        return <FaChartPie {...iconProps} style={{ color: '#8B5CF6' }} />;
      case 'BUDGET_WARNING':
        return <FaExclamationTriangle {...iconProps} style={{ color: '#F59E0B' }} />;
      case 'BUDGET_EXCEEDED':
        return <FaExclamationTriangle {...iconProps} style={{ color: '#EF4444' }} />;
      default:
        return <FaBell {...iconProps} style={{ color: '#6B7280' }} />;
    }
  };

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
            <h4>{t('totalIncome')}</h4>
            <FaChartLine className="card-icon" style={{ color: '#10B981' }} />
          </div>
          <div className="value">Rp{totalIncome.toLocaleString('id-ID')}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>{t('totalExpense')}</h4>
            <FaChartBar className="card-icon" style={{ color: '#EF4444' }} />
          </div>
          <div className="value">Rp{totalExpenses.toLocaleString('id-ID')}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>{t('totalBalance')}</h4>
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
            <h3>{t('recentTransactions')}</h3>
            {transactions.length === 0 ? (
              <p>{t('noData')}</p>
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
            {filteredNotifications.length === 0 ? (
              <p className="empty-state">You have no notifications.</p>
            ) : (
              <div className="notifications-widget-list">
                {filteredNotifications.slice(0, 3).map(notification => (
                  <div key={notification.idNotification} className="notification-widget-item">
                    <span className="notif-widget-icon">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="notif-widget-content">
                      <p>{notification.message}</p>
                      <span className="notif-widget-time">
                        {new Date(notification.createdAt).toLocaleString('id-ID', {
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