"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaBell, FaCheck, FaMoneyBillWave, FaShoppingCart, FaTrash, FaEdit, FaChartPie, FaExclamationTriangle, FaLock } from "react-icons/fa";
import { useTransactions } from "../context/TransactionContext";
import { fetchWithAuth } from "../utils/authHelper";
import "../style/notification.css";

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ transactionAlerts: true, budgetAlerts: true });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const { notifications: localNotifications, unreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } = useTransactions();

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

  // Fetch notifications from backend
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

  // Load preferences on mount
  useEffect(() => {
    setNotifPrefs(readNotifPrefs());
  }, []);

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Combine local and backend notifications
  const allNotifications = [
    ...backendNotifications.map((n) => ({
      id: n.idNotification,
      type: n.type,
      message: n.message,
      date: n.createdAt,
      read: n.read,
      fromBackend: true,
      backendId: n.idNotification,
    })),
    ...localNotifications.map((n) => ({
      ...n,
      fromBackend: false,
    })),
  ]
    .filter((notif) => {
      if (!notifPrefs.transactionAlerts && isTransactionType(notif.type)) return false;
      if (!notifPrefs.budgetAlerts && isBudgetType(notif.type)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate total unread from filtered notifications
  const totalUnreadNotifications = allNotifications.filter((n) => !n.read).length;

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close dropdown when click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications/read-all`, {
        method: "PATCH",
      });

      if (response.ok) {
        console.log("✅ All notifications marked as read");
        markAllNotificationsAsRead();
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Mark as read
  const handleMarkRead = async (notif) => {
    if (!notif.fromBackend) {
      // Local notification
      markNotificationAsRead(notif.id);
      return;
    }

    // Backend notification
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications/${notif.backendId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
        console.log("✅ Notification marked as read");
        fetchNotifications();
      } else {
        const errorText = await response.text();
        console.error("Failed to mark as read:", response.status, errorText);
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 18 };
    switch (type) {
      case "income":
      case "TRANSACTION_CREATED":
        return <FaMoneyBillWave {...iconProps} style={{ color: '#10B981' }} />;
      case "expense":
        return <FaShoppingCart {...iconProps} style={{ color: '#EF4444' }} />;
      case "TRANSACTION_DELETED":
        return <FaTrash {...iconProps} style={{ color: '#6B7280' }} />;
      case "TRANSACTION_UPDATED":
        return <FaEdit {...iconProps} style={{ color: '#3B82F6' }} />;
      case "BUDGET_CREATED":
      case "budget":
        return <FaChartPie {...iconProps} style={{ color: '#8B5CF6' }} />;
      case "BUDGET_WARNING":
      case "warning":
        return <FaExclamationTriangle {...iconProps} style={{ color: '#F59E0B' }} />;
      case "BUDGET_EXCEEDED":
      case "danger":
        return <FaExclamationTriangle {...iconProps} style={{ color: '#EF4444' }} />;
      case "BUDGET_DELETED":
        return <FaTrash {...iconProps} style={{ color: '#6B7280' }} />;
      case "PASSWORD_RESET":
        return <FaLock {...iconProps} style={{ color: '#6B7280' }} />;
      default:
        return <FaBell {...iconProps} style={{ color: '#6B7280' }} />;
    }
  };

  const NotificationDropdownContent = () => (
    <div
      className="notification-dropdown-portal"
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      <div className="notification-header">
        <h3>
          <FaBell />
          Notifications
        </h3>
        {allNotifications.length > 0 && (
          <div className="notification-header-actions">
            {unreadNotifications > 0 && (
              <button onClick={handleMarkAllRead} className="mark-all-read-btn" title="Mark all as read">
                ✓
              </button>
            )}
          </div>
        )}
      </div>

      <div className="notification-list">
        {allNotifications.length === 0 ? (
          <div className="empty-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          allNotifications
            .filter((n) => n.message)
            .map((notification) => (
              <div key={`${notification.fromBackend ? "backend" : "local"}-${notification.id || notification.backendId}`} className={`notification-item ${notification.type} ${notification.read ? "read" : "unread"}`}>
                <div className="notification-icon">{getNotificationIcon(notification.type)}</div>

                <div className="notification-content">
                  {notification.message ? (
                    <>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.date).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  ) : (
                    <span className="notification-time">
                      {new Date(notification.date).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                <div className="notification-item-actions">
                  {!notification.read && (
                    <button onClick={() => handleMarkRead(notification)} className="mark-read-btn" title="Mark as read">
                      <FaCheck />
                    </button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="notification-wrapper">
      <button ref={buttonRef} className="notif-icon" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {totalUnreadNotifications > 0 && <span className="notif-badge">{totalUnreadNotifications}</span>}
      </button>

      {isOpen && typeof window !== "undefined" && createPortal(<NotificationDropdownContent />, document.body)}
    </div>
  );
}

export default NotificationDropdown;
