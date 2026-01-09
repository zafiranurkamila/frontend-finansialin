// ============================================
// NOTIFICATIONS.JSX - READ ONLY VERSION
// ============================================
"use client";
import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaShoppingCart, FaTrash, FaEdit, FaChartPie, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { fetchWithAuth } from '../utils/authHelper';
import '../style/notification.css';

function Notifications() {
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
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
        console.warn('Failed to parse notification settings, using defaults');
      }
    }
    return { transactionAlerts: true, budgetAlerts: true };
  };

  useEffect(() => {
    setNotifPrefs(readNotifPrefs());

    const handleVisibility = () => setNotifPrefs(readNotifPrefs());
    const handleStorage = () => setNotifPrefs(readNotifPrefs());

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setNotifPrefs(readNotifPrefs());
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched notifications from backend:', data);
        setBackendNotifications(data);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Only display backend notifications - no deduplication needed
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
      'BUDGET_WARNING',
    ].includes(t);
  };

  useEffect(() => {
    const sorted = [...backendNotifications]
      .filter((notif) => {
        if (!notifPrefs.transactionAlerts && isTransactionType(notif.type)) return false;
        if (!notifPrefs.budgetAlerts && isBudgetType(notif.type)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    setDisplayNotifications(sorted);
  }, [backendNotifications, notifPrefs]);

  const handleMarkAsRead = async (notif) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications/${notif.idNotification}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        console.log('✅ Notification marked as read');
        fetchNotifications();
      } else {
        const errorText = await response.text();
        console.error('Failed to mark as read:', response.status, errorText);
      }
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 20 };
    switch(type) {
      case 'income':
      case 'TRANSACTION_CREATED':
        return <FaMoneyBillWave {...iconProps} style={{ color: '#10B981' }} />;
      case 'expense':
        return <FaShoppingCart {...iconProps} style={{ color: '#EF4444' }} />;
      case 'TRANSACTION_DELETED':
      case 'delete':
        return <FaTrash {...iconProps} style={{ color: '#6B7280' }} />;
      case 'TRANSACTION_UPDATED':
      case 'update':
        return <FaEdit {...iconProps} style={{ color: '#3B82F6' }} />;
      case 'budget':
      case 'BUDGET_CREATED':
        return <FaChartPie {...iconProps} style={{ color: '#8B5CF6' }} />;
      case 'BUDGET_WARNING':
      case 'budget_warning':
        return <FaExclamationTriangle {...iconProps} style={{ color: '#F59E0B' }} />;
      case 'BUDGET_EXCEEDED':
      case 'over_budget':
        return <FaExclamationTriangle {...iconProps} style={{ color: '#EF4444' }} />;
      default:
        return <FaBell {...iconProps} style={{ color: '#6B7280' }} />;
    }
  };

  if (displayNotifications.length === 0) {
    return (
      <div className="widget-box">
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔔 Recent Notifications
        </h3>
        <p className="empty-state">
          {loading ? 'Loading notifications...' : 'You have no notifications yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="widget-box">
      <div className="notification-header">
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔔 Recent Notifications
        </h3>
      </div>
      
      <div className="notifications-list">
        {displayNotifications.map((notif) => (
          <div 
            key={`notification-${notif.idNotification}`}
            className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
          >
            <span className="notification-icon">
              {getNotificationIcon(notif.type)}
            </span>
            <div className="notification-content">
              <p className="notification-message">
                {notif.message || `[${notif.type || 'Notification'}]`}
              </p>
              <p className="notification-time">
                {new Date(notif.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="notification-item-actions">
              {!notif.read && (
                <button
                  className="mark-read-btn"
                  onClick={() => handleMarkAsRead(notif)}
                  title="Mark as read"
                  disabled={loading}
                >
                  ✓
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
