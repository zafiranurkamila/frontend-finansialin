// ============================================
// NOTIFICATIONS.JSX - READ ONLY VERSION
// ============================================
"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/authHelper';
import '../style/notification.css';

function Notifications() {
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
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
  useEffect(() => {
    const sorted = [...backendNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    setDisplayNotifications(sorted);
  }, [backendNotifications]);

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
    switch(type) {
      case 'income':
      case 'TRANSACTION_CREATED':
        return '💰';
      case 'expense':
        return '💸';
      case 'TRANSACTION_DELETED':
      case 'delete':
        return '🗑️';
      case 'TRANSACTION_UPDATED':
      case 'update':
        return '✏️';
      case 'budget':
      case 'BUDGET_CREATED':
        return '📊';
      case 'BUDGET_WARNING':
      case 'budget_warning':
        return '⚠️';
      case 'BUDGET_EXCEEDED':
      case 'over_budget':
        return '🚨';
      default:
        return '📝';
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
