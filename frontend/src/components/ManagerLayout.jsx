import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../styles/ManagerDashboard.css';
import logo from '../assets/projectpulse-logo.png'; // Assuming logo exists

const ManagerLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Manager' };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="app-container">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src={logo} alt="ProjectPulse Logo" className="logo-img" onError={(e) => { e.target.style.display = 'none' }} /> {/* Fallback if no logo */}
                    <div className="brand-text">
                        <h2>ProjectPulse</h2>
                        <span>Project Manager</span>
                    </div>
                </div>
                <nav className="menu">
                    <NavLink to="/manager-dashboard" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>Dashboard</NavLink>
                    <NavLink to="/manager/projects" className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}>Projects</NavLink>
                    {/* Placeholders for visual fidelity to Figma */}
                    <div className="menu-item">Progress Monitoring</div>
                    <div className="menu-item">Reports & Analytics</div>
                    <div className="menu-item">Notifications</div>
                </nav>
            </aside>

            <main className="main-content">
                {/* TOP HEADER */}
                <header className="top-header">
                    <div className="header-left-placeholder"></div>

                    <div className="header-actions">
                        <div className="bell-container">
                            <span className="bell-icon">🔔</span>
                            <span className="notification-dot"></span>
                        </div>

                        <div className="pm-user-block">
                            <div className="pm-avatar">{user.name.charAt(0).toUpperCase()}</div>
                            <div className="pm-info">
                                <strong>{user.name}</strong>
                                <span>project manager</span>
                            </div>
                        </div>

                        <button className="logout-btn-figma" onClick={handleLogout}>
                            <span className="logout-icon">📤</span>
                            Logout
                        </button>
                    </div>
                </header>

                <div className="page-scroller">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ManagerLayout;
