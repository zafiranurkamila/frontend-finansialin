import React from 'react';

const menuItems = [
    { name: 'Dashboard', active: true },
    { name: 'Transaction', active: false },
    { name: 'Budget Goals', active: false },
    { name: 'Analytics', active: false },
    { name: 'Settings', active: false },
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div> {/* Wadah untuk Header dan Nav */}
                <div className="sidebar-header">
                    Finansialin
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {menuItems.map((item) => (
                            <li
                                key={item.name}
                                className={`nav-item ${item.active ? 'active' : ''}`}
                            >
                                <a href="#">{item.name}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="sidebar-footer">
                <button className="logout-btn">
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;