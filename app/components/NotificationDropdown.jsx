"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaBell, FaCheck, FaTrash, FaTimes } from 'react-icons/fa';
import { useTransactions } from '../context/TransactionContext';
import '../style/notification.css';

function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const {
        notifications,
        unreadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications
    } = useTransactions();

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

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'income':
                return '💰';
            case 'expense':
                return '💸';
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
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                    <div className="notification-actions">
                        <button
                            onClick={markAllNotificationsAsRead}
                            className="header-btn"
                            title="Mark all as read"
                        >
                            <FaCheck />
                        </button>
                        <button
                            onClick={clearAllNotifications}
                            className="header-btn"
                            title="Clear all"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <p>No notifications</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        >
                            <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="notification-content">
                                <p className="notification-message">{notification.message}</p>
                                <span className="notification-time">
                                    {new Date(notification.date).toLocaleString()}
                                </span>
                            </div>

                            <div className="notification-item-actions">
                                {!notification.read && (
                                    <button
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        className="notif-action-btn"
                                        title="Mark as read"
                                    >
                                        <FaCheck />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="notif-action-btn delete"
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
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#374151',
                    fontSize: '20px'
                }}
            >
                <FaBell style={{ display: 'block', width: '20px', height: '20px' }} />
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