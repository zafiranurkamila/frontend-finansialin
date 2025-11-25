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

function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Clear token/session
        localStorage.removeItem('token');
        // Redirect to login
        router.push('/login');
    };

    return (
        <aside className="sidebar">
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
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;