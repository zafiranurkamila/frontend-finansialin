"use client";
import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import { useUser } from "../context/UserContext";
import "../style/dashboard.css";
import "../style/settings.css";
import { FaUser, FaBell, FaLock, FaPalette, FaSave } from 'react-icons/fa';

function SettingsPage() {
    const { user, updateUser } = useUser();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar: user?.avatar || ''
    });

    const [notifSettings, setNotifSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        transactionAlerts: true,
        budgetAlerts: true
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNotifChange = (key) => {
        setNotifSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        updateUser(formData);
        alert('Profile updated successfully!');
    };

    const handleSaveNotifications = () => {
        localStorage.setItem('notificationSettings', JSON.stringify(notifSettings));
        alert('Notification settings saved!');
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">Settings</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="main-content-wrapper">
                    <div className="settings-container">
                        {/* Settings Tabs */}
                        <div className="settings-tabs">
                            <button
                                className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <FaUser />
                                <span>Profile</span>
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <FaBell />
                                <span>Notifications</span>
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <FaLock />
                                <span>Security</span>
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                                onClick={() => setActiveTab('appearance')}
                            >
                                <FaPalette />
                                <span>Appearance</span>
                            </button>
                        </div>

                        {/* Settings Content */}
                        <div className="settings-content">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="settings-section">
                                    <h3 className="section-title">Profile Information</h3>
                                    <p className="section-description">Update your personal information</p>

                                    <form onSubmit={handleSaveProfile} className="settings-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="name">Full Name</label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Enter your name"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="email">Email Address</label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="phone">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="Enter your phone"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="avatar">Avatar URL</label>
                                                <input
                                                    type="url"
                                                    id="avatar"
                                                    name="avatar"
                                                    value={formData.avatar}
                                                    onChange={handleChange}
                                                    placeholder="Enter avatar URL"
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" className="save-btn">
                                            <FaSave /> Save Changes
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="settings-section">
                                    <h3 className="section-title">Notification Preferences</h3>
                                    <p className="section-description">Manage how you receive notifications</p>

                                    <div className="settings-list">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>Email Notifications</h4>
                                                <p>Receive updates via email</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.emailNotifications}
                                                    onChange={() => handleNotifChange('emailNotifications')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>Push Notifications</h4>
                                                <p>Get push notifications on your device</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.pushNotifications}
                                                    onChange={() => handleNotifChange('pushNotifications')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>Transaction Alerts</h4>
                                                <p>Notify me when transactions are added</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.transactionAlerts}
                                                    onChange={() => handleNotifChange('transactionAlerts')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>Budget Alerts</h4>
                                                <p>Notify me when approaching budget limits</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.budgetAlerts}
                                                    onChange={() => handleNotifChange('budgetAlerts')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <button className="save-btn" onClick={handleSaveNotifications}>
                                        <FaSave /> Save Preferences
                                    </button>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="settings-section">
                                    <h3 className="section-title">Security Settings</h3>
                                    <p className="section-description">Manage your password and security</p>

                                    <div className="coming-soon">
                                        <FaLock className="coming-soon-icon" />
                                        <h4>Coming Soon</h4>
                                        <p>Password change and two-factor authentication features are under development</p>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Tab */}
                            {activeTab === 'appearance' && (
                                <div className="settings-section">
                                    <h3 className="section-title">Appearance</h3>
                                    <p className="section-description">Customize your app appearance</p>

                                    <div className="coming-soon">
                                        <FaPalette className="coming-soon-icon" />
                                        <h4>Coming Soon</h4>
                                        <p>Theme customization and dark mode features are under development</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SettingsPage;