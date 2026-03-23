import {
    FiBell,
    FiCheckSquare,
    FiGrid,
    FiLogOut,
    FiTrendingUp
} from 'react-icons/fi';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/projectpulse-logo.png';
import './MemberLayout.css';

const MemberLayout = () => {
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { name: 'Member', email: 'member@projecttrack.com' };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="member-layout">
            <aside className="member-sidebar">
                <div className="sidebar-brand">
                    <img src={logo} alt="ProjectPulse" className="logo" onError={(e) => e.target.style.display = 'none'} />
                    <div className="brand-info">
                        <h2>ProjectPulse</h2>
                        <span>TEAM MEMBER</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/member" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <FiGrid /> Dashboard
                    </NavLink>
                    <NavLink to="/member/tasks" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <FiCheckSquare /> My Tasks
                    </NavLink>
                    <NavLink to="/member/progress" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <FiTrendingUp /> Progress
                    </NavLink>
                    <NavLink to="/member/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <FiBell /> Notifications
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-email">{user.email || 'member@projecttrack.com'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="member-main">
                <header className="member-top-header">
                    <div className="header-actions">
                        <div className="notification-bell" style={{ cursor: 'pointer' }} onClick={() => navigate('/member/notifications')}>
                            <FiBell />
                            <span className="bell-badge"></span>
                        </div>
                        <div className="header-user">
                            <div className="avatar">{user.name?.charAt(0).toUpperCase() || 'M'}</div>
                            <div className="user-info">
                                <strong>{user.name}</strong>
                                <span>team member</span>
                            </div>
                        </div>
                        <button className="logout-button" onClick={handleLogout}>
                            <FiLogOut /> Logout
                        </button>
                    </div>
                </header>
                <div className="member-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MemberLayout;
