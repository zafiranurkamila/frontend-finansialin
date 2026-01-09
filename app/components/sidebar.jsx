// Sidebar.jsx
"use client";
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

// Sidebar menerima prop onLogoutAttempt (opsional)
function Sidebar({ onLogoutAttempt }) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const [navigating, setNavigating] = useState(false);

    const menuItems = [
        { name: t('dashboard'), path: '/dashboard' },
        { name: t('transaction'), path: '/transaction' },
        { name: t('budgetGoals'), path: '/budget' },
        { name: t('analytics'), path: '/analytics' },
        { name: t('settings'), path: '/settings' },
    ];

    const handleNavigate = (path) => {
        if (pathname === path || navigating) return;
        
        setNavigating(true);
        router.push(path);
        setTimeout(() => {
            setNavigating(false);
        }, 300);
    };

    // Fungsi ini sekarang memeriksa apakah onLogoutAttempt diberikan
    const handleClick = () => {
        if (onLogoutAttempt) {
            // Jika handler dari DashboardPage ada, panggil untuk memunculkan ConfirmDialog
            onLogoutAttempt();
        } else {
            // Jika tidak ada handler (misalnya, di halaman lain), lakukan logout standar (opsi cadangan)
            localStorage.removeItem('token');
            router.push('/login');
        }
    };

    return (
        <aside className="sidebar">
            {/* ... bagian header dan nav tetap sama ... */}
            <div>
                <div className="sidebar-header">
                    Finansialin
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {menuItems.map((item) => (
                            <li
                                key={item.name}
                                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                            >
                                <button 
                                    onClick={() => handleNavigate(item.path)}
                                    disabled={navigating}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'center',
                                        cursor: navigating ? 'wait' : 'pointer',
                                        color: 'inherit',
                                        font: 'inherit',
                                        padding: 0
                                    }}
                                >
                                    {item.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="sidebar-footer">
                <button 
                    className="logout-btn" 
                    onClick={handleClick} // Memanggil handleClick
                >
                    {t('logout')}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;