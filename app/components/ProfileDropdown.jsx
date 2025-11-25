// ProfileDropdown.jsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import '../style/profile-dropdown.css';

// Menerima prop onLogoutAttempt
function ProfileDropdown({ onLogoutAttempt }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const { user } = useUser();

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

    const handleSettingsClick = () => {
        router.push('/settings');
        setIsOpen(false);
    };

    // [5] Fungsi Logout yang Baru: Hanya memicu alert di parent
    const handleLogout = () => {
        setIsOpen(false); // Tutup dropdown terlebih dahulu
        
        if (onLogoutAttempt) {
            onLogoutAttempt(); // Panggil handler di DashboardPage
        }
        // Logika logout sebenarnya sudah DIPINDAHKAN ke DashboardPage.jsx
    };

    const ProfileDropdownContent = () => (
        <div 
            className="profile-dropdown-portal"
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
            }}
        >
            <div className="profile-dropdown-header">
                <div className="profile-avatar-large">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                    ) : (
                        <FaUserCircle />
                    )}
                </div>
                <div className="profile-info">
                    <h4>{user?.name || 'User'}</h4>
                    <p>{user?.email || 'user@example.com'}</p>
                </div>
            </div>

            <div className="profile-menu">
                <button className="profile-menu-item" onClick={handleSettingsClick}>
                    <FaCog />
                    <span>Settings</span>
                </button>
                <button className="profile-menu-item" onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="profile-dropdown-wrapper">
            <button
                ref={buttonRef}
                className="profile-avatar-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                ) : (
                    <FaUserCircle />
                )}
            </button>

            {isOpen && typeof window !== 'undefined' && createPortal(
                <ProfileDropdownContent />,
                document.body
            )}
        </div>
    );
}

export default ProfileDropdown;