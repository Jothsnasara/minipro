import axios from "axios";
import { useEffect, useState } from "react";
import {
    FiAlertCircle,
    FiBell,
    FiCalendar,
    FiCheckCircle, FiClock,
    FiTrendingUp
} from "react-icons/fi";
import { Link } from "react-router-dom";
import "../styles/MemberDashboard.css";

const MemberDashboard = () => {
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingReviewTasks: 0,
        performance: 0
    });
    const [tasks, setTasks] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, tasksRes, activitiesRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/member/stats/${user.id}`),
                    axios.get(`http://localhost:5001/api/member/tasks/${user.id}`),
                    axios.get(`http://localhost:5001/api/member/activity/${user.id}`)
                ]);
                setStats(statsRes.data);
                setTasks(tasksRes.data.slice(0, 5)); // Show only top 5 recent tasks
                setActivities(activitiesRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
                setLoading(false);
            }
        };

        if (user.id) {
            fetchDashboardData();
        }
    }, [user.id]);

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="member-main">
            <header className="member-header">
                <div className="welcome-section">
                    <h1>My Dashboard</h1>
                    <p>{todayDate}</p>
                </div>
                <div className="header-actions">
                    <button className="icon-btn">
                        <FiBell />
                        <span className="notification-dot"></span>
                    </button>
                    <div className="user-profile-header">
                        <div className="user-avatar-main">{user.name?.charAt(0)}</div>
                    </div>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
                            <FiCheckCircle style={{ color: 'var(--success)' }} />
                        </div>
                        <span className="stat-trend trend-up">+5 this week</span>
                    </div>
                    <div className="stat-value">{stats.completedTasks}</div>
                    <div className="stat-label">Completed Tasks</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
                            <FiClock style={{ color: 'var(--primary)' }} />
                        </div>
                        <span className="stat-trend trend-up">2 due soon</span>
                    </div>
                    <div className="stat-value">{stats.inProgressTasks}</div>
                    <div className="stat-label">In Progress</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
                            <FiAlertCircle style={{ color: 'var(--warning)' }} />
                        </div>
                        <span className="stat-trend">Awaiting feedback</span>
                    </div>
                    <div className="stat-value">{stats.pendingReviewTasks}</div>
                    <div className="stat-label">Pending Review</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: 'var(--info-light)' }}>
                            <FiTrendingUp style={{ color: 'var(--info)' }} />
                        </div>
                        <span className="stat-trend trend-up">+3%</span>
                    </div>
                    <div className="stat-value">{stats.performance}%</div>
                    <div className="stat-label">Performance</div>
                </div>
            </div>

            <div className="dashboard-grid">
                <section className="content-card recent-tasks">
                    <div className="card-header">
                        <h3>My Assigned Tasks</h3>
                        <Link to="/member/tasks" className="view-all-link">View All →</Link>
                    </div>
                    <div className="task-mini-list">
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task.id} className="task-item-mini">
                                <div className="task-mini-header">
                                    <span className="task-mini-title">{task.title}</span>
                                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <span className="task-mini-project">{task.projectName}</span>

                                <div className="progress-container">
                                    <div className="progress-header">
                                        <span>Progress</span>
                                        <span>{task.progress}%</span>
                                    </div>
                                    <div className="premium-progress">
                                        <div
                                            className="premium-progress-bar"
                                            style={{ width: `${task.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="task-meta-row" style={{ marginTop: '1rem' }}>
                                    <FiCalendar />
                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    <span style={{
                                        marginLeft: 'auto',
                                        color: task.status === 'Completed' ? 'var(--success)' : 'var(--primary)',
                                        fontWeight: '700',
                                        fontSize: '0.8125rem'
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="no-data">No tasks assigned yet.</p>
                        )}
                    </div>
                </section>

                <aside className="dashboard-sidebar-column">
                    <div className="today-focus-card">
                        <div className="focus-header">
                            <h4>Today's Focus</h4>
                            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Priority Items</p>
                        </div>
                        <div className="focus-stats">
                            <div className="focus-stat-item">
                                <div className="focus-stat-icon"><FiAlertCircle /></div>
                                <div className="focus-stat-info">
                                    <div className="focus-stat-label">High Priority</div>
                                    <div className="focus-stat-value">2 Tasks</div>
                                </div>
                            </div>
                            <div className="focus-stat-item">
                                <div className="focus-stat-icon"><FiCalendar /></div>
                                <div className="focus-stat-info">
                                    <div className="focus-stat-label">Due Today</div>
                                    <div className="focus-stat-value">1 Task</div>
                                </div>
                            </div>
                        </div>
                        <Link to="/member/tasks" className="update-btn" style={{ background: 'white', color: 'var(--primary)', border: 'none', textDecoration: 'none' }}>
                            Update Progress →
                        </Link>
                    </div>

                    <div className="content-card">
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div className="activity-feed">
                            {activities.length > 0 ? activities.map(activity => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-dot" style={{
                                        background:
                                            activity.action.includes('Completed') ? 'var(--success)' :
                                                activity.action.includes('Submitted') ? 'var(--warning)' : 'var(--primary)'
                                    }}></div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>{activity.action}</strong>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{activity.task_name}</p>
                                        </div>
                                        <div className="activity-time">
                                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="no-data">No recent activity.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MemberDashboard;
