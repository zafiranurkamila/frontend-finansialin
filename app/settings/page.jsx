"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import ConfirmDialog from "../components/ConfirmDialog";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import "../style/dashboard.css";
import "../style/settings.css";
import { FaUser, FaBell, FaSave, FaLanguage } from 'react-icons/fa';

function SettingsPage() {
    const router = useRouter();
    const { user, updateUser } = useUser();
    const { language, changeLanguage, t } = useLanguage();
    const [activeTab, setActiveTab] = useState('profile');
    const [isAuthed, setIsAuthed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
    const [isNotifConfirmOpen, setIsNotifConfirmOpen] = useState(false);
    const [pendingNotifSettings, setPendingNotifSettings] = useState(null);
    const [confirmNotifMessage, setConfirmNotifMessage] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    
    // --- State untuk Form Data ---
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    // --- State untuk Notifikasi ---
    const [notifSettings, setNotifSettings] = useState({
        transactionAlerts: true,
        budgetAlerts: true
    });

    // --- State untuk Custom Alert/Notification Dialog ---
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Check auth saat mount
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
        } else {
            setIsAuthed(true);
            fetchUserProfile();
            loadNotificationSettings();
        }
        setLoading(false);
    }, [router]);

    // Update formData saat user berubah
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("access_token");
                    router.push("/login");
                }
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            console.log("Profile data from backend:", data);
            updateUser(data);
            setFormData({
                name: data.name || '',
                email: data.email || ''
            });
        } catch (err) {
            console.error("Profile fetch error:", err);
        }
    };

    const loadNotificationSettings = () => {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            setNotifSettings(JSON.parse(saved));
        }
    };

    // --- Handlers ---
    
    const handleCloseNotification = () => {
        setIsNotificationOpen(false);
        setNotificationTitle('');
        setNotificationMessage('');
    };

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

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem("access_token");
            
            const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update profile");
            }

            const updatedUser = await response.json();
            updateUser(updatedUser);

            setNotificationTitle(t('updateSuccessful'));
            setNotificationMessage(t('profileUpdated'));
            setIsNotificationOpen(true);
        } catch (err) {
            console.error("Update profile error:", err);
            setNotificationTitle(t('error'));
            setNotificationMessage(err.message || 'Failed to update profile. Please try again.');
            setIsNotificationOpen(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotifications = useCallback(() => {
        const selections = [];
        if (notifSettings.transactionAlerts) selections.push('Transaction Alerts');
        if (notifSettings.budgetAlerts) selections.push('Budget Alerts');

        const summary = selections.length > 0
            ? `You will receive: ${selections.join(', ')}.`
            : 'All notifications will be turned off.';

        setPendingNotifSettings(notifSettings);
        setConfirmNotifMessage(`${summary} Save these notification preferences?`);
        setIsNotifConfirmOpen(true);
    }, [notifSettings]);

    const handleConfirmSaveNotifications = () => {
        if (!pendingNotifSettings) return;

        localStorage.setItem('notificationSettings', JSON.stringify(pendingNotifSettings));

        setNotificationTitle(t('settingsSaved'));
        setNotificationMessage(t('notificationSettingsSaved'));
        setIsNotificationOpen(true);

        setPendingNotifSettings(null);
        setIsNotifConfirmOpen(false);
        setConfirmNotifMessage('');
    };

    const handleCancelSaveNotifications = () => {
        setPendingNotifSettings(null);
        setIsNotifConfirmOpen(false);
        setConfirmNotifMessage('');
    };

    const handleLogoutAttempt = useCallback(() => {
        setIsLogoutAlertOpen(true);
    }, []);

    const handleConfirmLogout = () => {
        setIsLogoutAlertOpen(false);
        const token = localStorage.getItem('access_token');
        
        if (token) {
            fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            }).catch(console.error);
        }
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
    };

    const handleCancelLogout = () => {
        setIsLogoutAlertOpen(false);
    };

    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleSaveLanguage = () => {
        changeLanguage(selectedLanguage);
        setNotificationTitle(t('languageChanged'));
        setNotificationMessage(t('languageChangedMessage'));
        setIsNotificationOpen(true);
    };

    if (loading || !isAuthed) return (
        <div className="loading">
            <div className="loading-container">
                <div className="loading-text">Finansialin</div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar onLogoutAttempt={handleLogoutAttempt} />

            <div className="main-content-area">
                <header className="dashboard-header">
                    <h2 className="page-title">{t('settingsTitle')}</h2>

                    <div className="header-actions">
                        <NotificationDropdown />
                        <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
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
                                <span>{t('profile')}</span>
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <FaBell />
                                <span>{t('notifications')}</span>
                            </button>
                        </div>

                        {/* Settings Content */}
                        <div className="settings-content">
                            {/* Profile Tab */}
                            <div className="settings-section" style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
                                <h3 className="section-title">{t('profileInfo')}</h3>
                                <p className="section-description">{t('updatePersonalInfo')}</p>

                                <form onSubmit={handleSaveProfile} className="settings-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="name">{t('fullName')}</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder={t('fullName')}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">{t('emailAddress')}</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder={t('emailAddress')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="save-btn" disabled={isSaving}>
                                        <FaSave /> {isSaving ? t('saving') : t('saveChanges')}
                                    </button>
                                </form>
                            </div>

                            {/* Notifications Tab */}
                            <div className="settings-section" style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
                                <h3 className="section-title">{t('notificationPreferences')}</h3>
                                <p className="section-description">{t('manageNotifications')}</p>

                                <div className="settings-list">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h4>{t('transactionAlerts')}</h4>
                                            <p>{t('transactionAlertsDesc')}</p>
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
                                            <h4>{t('budgetAlerts')}</h4>
                                            <p>{t('budgetAlertsDesc')}</p>
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
                                    <FaSave /> {t('savePreferences')}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* CONFIRM DIALOG UNTUK NOTIFIKASI */}
            <ConfirmDialog
                isOpen={isNotificationOpen}
                title={notificationTitle}
                message={notificationMessage}
                onConfirm={handleCloseNotification}
                onCancel={handleCloseNotification}
            />

            <ConfirmDialog
                isOpen={isNotifConfirmOpen}
                title="Save Notification Preferences?"
                message={confirmNotifMessage}
                onConfirm={handleConfirmSaveNotifications}
                onCancel={handleCancelSaveNotifications}
            />

            {/* CONFIRM DIALOG UNTUK LOGOUT */}
            <ConfirmDialog
                isOpen={isLogoutAlertOpen}
                title={t('confirmLogout')}
                message={t('logoutMessage')}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
        </div>
    );
}

export default SettingsPage;