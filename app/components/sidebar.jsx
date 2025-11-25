// Sidebar.jsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Transaction', path: '/transaction' },
    { name: 'Budget Goals', path: '/budget' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Settings', path: '/settings' },
];

// Sidebar menerima prop onLogoutAttempt (opsional)
function Sidebar({ onLogoutAttempt }) {
    const pathname = usePathname();
    const router = useRouter(); // Tetap inisialisasi router di sini

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
                                <Link href={item.path}>{item.name}</Link>
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
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;