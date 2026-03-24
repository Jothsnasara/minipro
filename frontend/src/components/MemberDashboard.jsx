import { useEffect, useState } from 'react';
import {
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiTrendingUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MemberDashboard.css';

const MemberDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchDashboardData(storedUser.id);
        }
    }, []);

    const fetchDashboardData = async (userId) => {
        try {
            const res = await api.get(`/api/projects/member/dashboard/${userId}`);
            setData(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching member dashboard:", err);
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="member-dashboard">
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        </div>
    );

    if (!data) return <div className="member-dashboard"><div className="error">Failed to load dashboard data.</div></div>;

    const { stats, tasks, activities, performance } = data;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="member-dashboard">
            <header className="dashboard-header">
                <div className="header-info">
                    <h1>My Dashboard</h1>
                    <p>Track your tasks and monitor your progress.</p>
                </div>
            </header>

            <div className="stats-cards">
                <div className="stat-card green">
                    <div className="stat-icon"><FiCheckCircle /></div>
                    <div className="stat-value">{stats.completed || 0}</div>
                    <div className="stat-label">Completed Tasks</div>
                    <div className="stat-change">+5 this week</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon"><FiClock /></div>
                    <div className="stat-value">{stats.in_progress || 0}</div>
                    <div className="stat-label">In Progress</div>
                    <div className="stat-change">2 due soon</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon"><FiAlertCircle /></div>
                    <div className="stat-value">{stats.pending_review || 0}</div>
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-change">Awaiting feedback</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><FiTrendingUp /></div>
                    <div className="stat-value">92%</div>
                    <div className="stat-label">Performance</div>
                    <div className="stat-change">+3%</div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="main-content">
                    <section className="tasks-section">
                        <div className="section-header">
                            <h2>My Assigned Tasks</h2>
                            <button className="view-all" onClick={() => navigate('/member/tasks')}>View All →</button>
                        </div>
                        <div className="tasks-list">
                            {tasks.length > 0 ? tasks.map(task => (
                                <div key={task.task_id} className="task-item">
                                    <div className="task-main">
                                        <div className="task-info">
                                            <h3>{task.task_name}</h3>
                                            <p className="project-name">{task.project_name || 'Website Redesign'}</p>
                                        </div>
                                        <span className={`priority-badge ${task.priority?.toLowerCase()}`}>
                                            {task.priority || 'Medium'}
                                        </span>
                                    </div>
                                    <div className="task-meta">
                                        <div className="meta-item">
                                            <FiClock /> {formatDate(task.due_date)}
                                        </div>
                                        <span className={`status-pill ${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {task.status || 'Todo'}
                                        </span>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${task.progress || 0}%` }}></div>
                                        </div>
                                        <span className="progress-text">{task.progress || 0}%</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="no-tasks">No tasks assigned to you yet.</p>
                            )}
                        </div>
                    </section>

                    <section className="performance-section">
                        <div className="section-header">
                            <h2>Monthly Performance</h2>
                        </div>
                        <div className="performance-grid">
                            <div className="perf-item">
                                <span className="perf-label">Tasks Completed</span>
                                <span className="perf-value">{performance?.tasksCompleted || 0}</span>
                                <div className="perf-bar green"><div style={{ width: `${Math.min(100, ((performance?.tasksCompleted || 0) / (performance?.targetTasks || 30)) * 100)}%` }}></div></div>
                                <span className="perf-sub">{Math.floor(((performance?.tasksCompleted || 0) / (performance?.targetTasks || 30)) * 100)}% of target</span>
                            </div>
                            <div className="perf-item">
                                <span className="perf-label">On-Time Delivery</span>
                                <span className="perf-value">{performance?.onTimeDelivery || 0}%</span>
                                <div className="perf-bar blue"><div style={{ width: `${performance?.onTimeDelivery || 0}%` }}></div></div>
                                <span className="perf-sub">{performance?.onTimeDelivery >= 90 ? 'Excellent' : 'Good'} performance</span>
                            </div>
                            <div className="perf-item">
                                <span className="perf-label">Code Quality</span>
                                <span className="perf-value">{performance?.codeQuality || 0}/5</span>
                                <div className="perf-bar purple"><div style={{ width: `${((performance?.codeQuality || 0) / 5) * 100}%` }}></div></div>
                                <span className="perf-sub">Peer review score</span>
                            </div>
                            <div className="perf-item">
                                <span className="perf-label">Collaboration</span>
                                <span className="perf-value">{performance?.collaboration || 0}/5</span>
                                <div className="perf-bar orange"><div style={{ width: `${((performance?.collaboration || 0) / 5) * 100}%` }}></div></div>
                                <span className="perf-sub">Team feedback</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="side-content">
                    <section className="activity-section">
                        <div className="section-header">
                            <h2>Recent Activity</h2>
                        </div>
                        <div className="activity-list">
                            {activities.map(activity => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-content">
                                        <strong>{activity.type}</strong>
                                        <p>{activity.detail}</p>
                                        <span className="activity-time">{activity.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="focus-card">
                        <h3>Today's Focus</h3>
                        <div className="focus-items">
                            <div className="focus-item">
                                <span>High Priority Tasks</span>
                                <strong>{tasks.filter(t => t.priority === 'High').length}</strong>
                            </div>
                            <div className="focus-item">
                                <span>Due Today</span>
                                <strong>{tasks.filter(t => {
                                    const today = new Date().toISOString().split('T')[0];
                                    return t.due_date?.split('T')[0] === today;
                                }).length}</strong>
                            </div>
                        </div>
                        <button className="update-btn" onClick={() => navigate('/member/tasks')}>Update Progress →</button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;
