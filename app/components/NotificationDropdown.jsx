"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaBell, FaCheck, FaTrash, FaTimes } from 'react-icons/fa';
import { useTransactions } from '../context/TransactionContext';
import { fetchWithAuth } from '../utils/authHelper';
import '../style/notification.css';

function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const [backendNotifications, setBackendNotifications] = useState([]);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const {
        notifications: localNotifications,
        unreadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications
    } = useTransactions();

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Fetch notifications from backend
    const fetchNotifications = async () => {
        try {
            const response = await fetchWithAuth(`${BACKEND_URL}/api/notifications`);
            if (response.ok) {
                const data = await response.json();
                setBackendNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    // Fetch on mount and when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Combine local and backend notifications
    const allNotifications = [...localNotifications, ...backendNotifications.map(n => ({
        id: n.idNotification,
        type: n.type,
        message: n.message,
        date: n.createdAt,
        read: n.read
    }))];

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 12,
                right: window.innerWidth - rect.right
            });
        }
    }, [isOpen]);

    // Close dropdown when click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleMarkAllRead = async () => {
        try {
            await fetchWithAuth(`${BACKEND_URL}/api/notifications/read-all`, {
                method: 'POST'
            });
            markAllNotificationsAsRead();
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleClearAll = async () => {
        try {
            await fetchWithAuth(`${BACKEND_URL}/api/notifications`, {
                method: 'DELETE'
            });
            clearAllNotifications();
            setBackendNotifications([]);
        } catch (err) {
            console.error('Failed to clear all:', err);
        }
    };

    const handleMarkRead = async (notif) => {
        if (notif.idNotification) {
            // Backend notification
            try {
                await fetchWithAuth(`${BACKEND_URL}/api/notifications/${notif.idNotification}/read`, {
                    method: 'POST'
                });
                fetchNotifications();
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        } else {
            // Local notification
            markNotificationAsRead(notif.id);
        }
    };

    const handleDelete = async (notif) => {
        if (notif.idNotification) {
            // Backend notification
            try {
                await fetchWithAuth(`${BACKEND_URL}/api/notifications/${notif.idNotification}`, {
                    method: 'DELETE'
                });
                fetchNotifications();
            } catch (err) {
                console.error('Failed to delete:', err);
            }
        } else {
            // Local notification
            deleteNotification(notif.id);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'income':
                return '💰';
            case 'expense':
                return '💸';
            case 'budget':
                return '🎯';
            case 'warning':
                return '⚠️';
            case 'danger':
                return '🚨';
            case 'edit':
                return '✏️';
            case 'delete':
                return '🗑️';
            default:
                return '📌';
        }
    };

    const NotificationDropdownContent = () => (
        <div 
            className="notification-dropdown-portal"
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
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
                            <button
                                onClick={handleMarkAllRead}
                                className="mark-all-read-btn"
                                title="Mark all as read"
                            >
                                ✓
                            </button>
                        )}
                        <button
                            onClick={handleClearAll}
                            className="clear-btn"
                            title="Clear all"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div className="notification-list">
                {allNotifications.length === 0 ? (
                    <div className="empty-notifications">
                        <p>No notifications</p>
                    </div>
                ) : (
                    allNotifications.map(notification => (
                        <div
                            key={notification.id || notification.idNotification}
                            className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                        >
                            <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="notification-content">
                                <p className="notification-message">{notification.message}</p>
                                <span className="notification-time">
                                    {new Date(notification.date).toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            <div className="notification-item-actions">
                                {!notification.read && (
                                    <button
                                        onClick={() => handleMarkRead(notification)}
                                        className="mark-read-btn"
                                        title="Mark as read"
                                    >
                                        <FaCheck />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(notification)}
                                    className="delete-btn"
                                    title="Delete"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="notification-wrapper">
            <button
                ref={buttonRef}
                className="notif-icon"
                onClick={() => setIsOpen(!isOpen)}
            >
                <FaBell />
                {unreadNotifications > 0 && (
                    <span className="notif-badge">{unreadNotifications}</span>
                )}
            </button>

            {isOpen && typeof window !== 'undefined' && createPortal(
                <NotificationDropdownContent />,
                document.body
            )}
        </div>
    );
}

export default NotificationDropdown;