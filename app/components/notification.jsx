"use client";
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { FaBell, FaTrash } from 'react-icons/fa';
import '../style/notification.css';

function Notifications() {
  const { notifications, clearAllNotifications, deleteNotification, markAllNotificationsAsRead } = useTransactions();
  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    // Get recent notifications (max 5)
    const recent = notifications.slice(0, 5);
    setLocalNotifications(recent);
  }, [notifications]);

  if (localNotifications.length === 0) {
    return (
      <div className="widget-box">
        <h3>
          <FaBell style={{ marginRight: '8px' }} />
          Recent Notifications
        </h3>
        <p className="empty-state">You have no notifications yet.</p>
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
        {localNotifications.length > 0 && (
          <button 
            className="clear-btn"
            onClick={clearAllNotifications}
            title="Clear all notifications"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="notifications-list">
        {localNotifications.map((notif) => (
          <div 
            key={notif.id} 
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
              onClick={() => deleteNotification(notif.id)}
              title="Delete notification"
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