import React, { useEffect, useState } from 'react';
import {
    FiActivity, FiAlertCircle,
    FiArrowLeft,
    FiCheckCircle,
    FiTrendingUp
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import api from '../services/api';
import './ManagerProgress.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const ManagerProgress = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) fetchData(user.id);
    }, []);

    const fetchData = async (managerId) => {
        try {
            const res = await api.get(`/api/projects/manager/${managerId}/progress`);
            setData(res.data);
        } catch (err) {
            console.error('Error fetching manager progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewTask = async (taskId) => {
        try {
            await api.put(`/api/projects/tasks/${taskId}/review`);
            // Update local state
            setData(prev => ({
                ...prev,
                pendingReviewTasks: prev.pendingReviewTasks.filter(t => t.task_id !== taskId),
                summary: {
                    ...prev.summary,
                    pendingReview: Math.max(0, prev.summary.pendingReview - 1),
                    completedTasks: prev.summary.completedTasks + 1
                },
                projects: prev.projects.map(p => ({
                    ...p,
                    pending_review: p.pending_review > 0 ? p.pending_review - 1 : 0,
                    completed: p.completed + (p.pending_review > 0 ? 1 : 0)
                }))
            }));
        } catch (err) {
            console.error('Failed to review task:', err);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-label">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color, margin: '2px 0', fontSize: '13px' }}>
                        {entry.name}: <strong>{entry.value}%</strong>
                    </p>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="manager-progress-page">
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading progress data...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="manager-progress-page">
            <div style={{ textAlign: 'center', padding: '64px', color: '#64748b' }}>
                <p>Failed to load progress data.</p>
            </div>
        </div>
    );

    const { summary, projects, pendingReviewTasks, trendData } = data;

    // Build bar chart data from projects
    const barData = projects.map(p => ({
        name: p.project_name.length > 15 ? p.project_name.substring(0, 15) + '…' : p.project_name,
        progress: p.progress,
        tasks: p.total_tasks
    }));

    return (
        <div className="manager-progress-page">
            <Link to="/manager-dashboard" className="back-link">
                <FiArrowLeft /> Back to Dashboard
            </Link>

            <header className="progress-header">
                <h1>Progress Monitoring Dashboard</h1>
                <p>Monitor project progress and review team submissions</p>
            </header>

            {/* Stat Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon blue"><FiTrendingUp /></div>
                        <span>Overall Progress</span>
                    </div>
                    <div className="stat-value">{summary.overallProgress}%</div>
                    <div className="stat-subtext">Across {summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon green"><FiCheckCircle /></div>
                        <span>Completed</span>
                    </div>
                    <div className="stat-value">{summary.completedTasks}</div>
                    <div className="stat-subtext">Out of {summary.totalTasks} total tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon amber"><FiAlertCircle /></div>
                        <span>Pending Review</span>
                    </div>
                    <div className="stat-value">{summary.pendingReview}</div>
                    <div className="stat-subtext">Awaiting your approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon purple"><FiActivity /></div>
                        <span>Total Projects</span>
                    </div>
                    <div className="stat-value">{summary.totalProjects}</div>
                    <div className="stat-subtext">Under your management</div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Progress Trend</h3>
                    <span className="chart-subtitle">Planned vs Actual (hover for details)</span>
                    <div style={{ width: '100%', height: '260px', minWidth: '0', marginTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="mgActualGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 13 }} />
                                <Area type="monotone" dataKey="planned" name="Planned" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} />
                                <Area type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={3} fill="url(#mgActualGrad)" dot={{ r: 4, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Project Progress Comparison</h3>
                    <span className="chart-subtitle">Average task completion per project</span>
                    <div style={{ width: '100%', height: '260px', minWidth: '0', marginTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(val) => `${val}%`} />
                                <Bar dataKey="progress" name="Progress" radius={[6, 6, 0, 0]} barSize={40}>
                                    {barData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Pending Review Tasks */}
            <section className="review-section">
                <h3>⏳ Tasks Pending Your Review ({pendingReviewTasks.length})</h3>
                <p className="section-subtitle">Members have completed these tasks and are waiting for your review</p>
                {pendingReviewTasks.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        <p>🎉 No tasks pending review. You're all caught up!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="review-table">
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Project</th>
                                    <th>Assigned To</th>
                                    <th>Due Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingReviewTasks.map(task => (
                                    <tr key={task.task_id}>
                                        <td style={{ fontWeight: 500 }}>{task.task_name}</td>
                                        <td>{task.project_name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                                    {task.assignee_name?.[0] || '?'}
                                                </div>
                                                {task.assignee_name}
                                            </div>
                                        </td>
                                        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <button className="review-btn" onClick={() => handleReviewTask(task.task_id)}>
                                                ✓ Mark Reviewed
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Project Performance Overview */}
            <section className="overview-section">
                <h3>Project Performance Overview</h3>
                {projects.length === 0 ? (
                    <p style={{ color: '#94a3b8', padding: '16px 0' }}>No projects found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="performance-table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Progress</th>
                                    <th>Tasks</th>
                                    <th>Completed</th>
                                    <th>In Progress</th>
                                    <th>Pending Review</th>
                                    <th>Status</th>
                                    <th>Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(project => (
                                    <React.Fragment key={project.project_id}>
                                        <tr>
                                            <td style={{ fontWeight: 500 }}>{project.project_name}</td>
                                            <td>
                                                <div className="progress-bar-container">
                                                    <div className="progress-track">
                                                        <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                                                    </div>
                                                    <span style={{ fontSize: 13, minWidth: 36 }}>{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{project.total_tasks}</td>
                                            <td style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{project.completed}</td>
                                            <td style={{ textAlign: 'center', color: '#3b82f6' }}>{project.in_progress}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {project.pending_review > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{project.pending_review}</span>}
                                                {project.pending_review === 0 && <span style={{ color: '#94a3b8' }}>0</span>}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${(project.status || 'planning').toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {project.status || 'Planning'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="members-toggle"
                                                    onClick={() => setExpandedProject(expandedProject === project.project_id ? null : project.project_id)}
                                                >
                                                    {project.members?.length || 0} members {expandedProject === project.project_id ? '▴' : '▾'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedProject === project.project_id && project.members?.length > 0 && (
                                            <tr key={`${project.project_id}-members`}>
                                                <td colSpan="8" style={{ padding: '8px 24px 16px', background: '#f8fafc' }}>
                                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>TEAM CONTRIBUTIONS</div>
                                                    {project.members.map(m => (
                                                        <div className="member-row" key={m.user_id}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                                                                    {m.member_name?.[0] || '?'}
                                                                </div>
                                                                <span>{m.member_name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                                <span>{m.task_count} tasks</span>
                                                                <span style={{ color: '#3b82f6' }}>{m.avg_progress}% avg</span>
                                                                <span style={{ color: '#22c55e' }}>{m.reviewed} reviewed</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ManagerProgress;
