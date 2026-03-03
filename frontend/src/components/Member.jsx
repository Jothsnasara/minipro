import {
  FiBell,
  FiLayout, FiList,
  FiLogOut,
  FiTrendingUp
} from "react-icons/fi";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "../styles/MemberDashboard.css";
import MemberDashboard from "./MemberDashboard";
import MemberTasks from "./MemberTasks";

const Member = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/member") return location.pathname === "/member" || location.pathname === "/member/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="member-dashboard-container">
      <aside className="member-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <FiTrendingUp style={{ color: 'var(--primary)' }} />
            ProjectPulse
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: '800', letterSpacing: '0.1em' }}>TEAM MEMBER</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/member" className={`nav-item ${isActive("/member") && !location.pathname.includes('tasks') ? "active" : ""}`}>
            <FiLayout /> Dashboard
          </Link>
          <Link to="/member/tasks" className={`nav-item ${isActive("/member/tasks") ? "active" : ""}`}>
            <FiList /> My Tasks
          </Link>
          <Link to="/member/progress" className={`nav-item ${isActive("/member/progress") ? "active" : ""}`}>
            <FiTrendingUp /> Progress
          </Link>
          <Link to="/member/notifications" className={`nav-item ${isActive("/member/notifications") ? "active" : ""}`}>
            <FiBell /> Notifications
          </Link>
        </nav>

        <div className="user-profile-mini">
          <div className="user-avatar-main">{user.name?.charAt(0)}</div>
          <div className="user-info-text">
            <span className="user-name">{user.name}</span>
            <span className="user-role-label">Member</span>
          </div>
          <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>

      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<MemberDashboard />} />
          <Route path="tasks" element={<MemberTasks />} />
          <Route path="progress" element={<MemberDashboard />} />
          <Route path="notifications" element={<MemberDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default Member;
