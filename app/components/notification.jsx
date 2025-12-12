"use client";
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { fetchWithAuth } from '../utils/authHelper';
import { FaBell, FaTrash } from 'react-icons/fa';
import '../style/notification.css';

function Notifications() {
  const { notifications: localNotifications } = useTransactions();
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

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Combine and display notifications - prioritize backend
  useEffect(() => {
    const combined = [
      ...backendNotifications.map(n => ({
        id: n.idNotification,
        type: n.type || 'info',
        message: n.message,
        date: n.createdAt,
        read: n.read,
        fromBackend: true,
        backendId: n.idNotification
      })),
      ...localNotifications.map(n => ({
        ...n,
        fromBackend: false
      }))
    ];

    // Remove duplicates and get recent 5
    const unique = [];
    const seen = new Set();
    for (const notif of combined) {
      const key = notif.fromBackend ? `backend-${notif.backendId}` : `local-${notif.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(notif);
      }
    }

    setDisplayNotifications(unique.slice(0, 5));
  }, [backendNotifications, localNotifications]);

  // Delete notification from backend
  const handleDelete = async (notif) => {
    try {
      if (notif.fromBackend) {
        const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications/${notif.backendId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          console.log('✅ Notification deleted from backend');
          fetchNotifications();
        }
      }
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      // Delete all from backend
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications`, {
        method: 'DELETE'
      });
      if (response.ok) {
        console.log('✅ All notifications cleared from backend');
        fetchNotifications();
      }
    } catch (err) {
      console.error('❌ Error clearing notifications:', err);
    }
  };

  if (displayNotifications.length === 0) {
    return (
      <div className="widget-box">
        <h3>
          <FaBell style={{ marginRight: '8px' }} />
          Recent Notifications
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
        <h3>
          <FaBell style={{ marginRight: '8px' }} />
          Recent Notifications
        </h3>
        {displayNotifications.length > 0 && (
          <button 
            className="clear-btn"
            onClick={handleClearAll}
            title="Clear all notifications"
            disabled={loading}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="notifications-list">
        {displayNotifications.map((notif) => (
          <div 
            key={`${notif.fromBackend ? 'backend' : 'local'}-${notif.id || notif.backendId}`}
            className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
          >
            <div className="notif-content">
              <p className="notif-message">{notif.message}</p>
              <p className="notif-time">
                {new Date(notif.date).toLocaleString('id-ID')}
              </p>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(notif)}
              title="Delete notification"
              disabled={loading}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;