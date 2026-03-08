import { useEffect, useState } from 'react';
import {
    FiActivity,
    FiArrowLeft,
    FiCheckCircle,
    FiStar,
    FiTrendingUp
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    Area, AreaChart,
    CartesianGrid,
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar, RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import api from '../services/api';
import './MemberProgress.css';

const MemberProgress = () => {
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) fetchProgressData(user.id);
    }, []);

    const fetchProgressData = async (userId) => {
        try {
            const res = await api.get(`/projects/member/progress/${userId}`);
            setProgressData(res.data);
        } catch (err) {
            console.error('Error fetching progress data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="member-progress-page">
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Analyzing project performance...</p>
            </div>
        </div>
    );

    if (!progressData) return (
        <div className="member-progress-page">
            <div style={{ textAlign: 'center', padding: '64px', color: '#64748b' }}>
                <p>Failed to load progress data. Please make sure the backend is running.</p>
            </div>
        </div>
    );

    const { summary, projects, radarData, trendData } = progressData;

    // Custom Tooltip for Line Chart
    const LineTooltip = ({ active, payload, label }) => {
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

    // Custom Tooltip for Radar Chart
    const RadarTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1e293b' }}>{payload[0]?.payload?.subject}</p>
                <p style={{ color: '#8b5cf6', margin: 0, fontSize: '13px' }}>Score: <strong>{payload[0]?.value}</strong></p>
            </div>
        );
    };

    return (
        <div className="member-progress-page">
            <Link to="/member" className="back-link">
                <FiArrowLeft /> Back to Dashboard
            </Link>

            <header className="progress-header">
                <h1>Progress Monitoring Dashboard</h1>
                <p>Track project progress and team performance</p>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon blue"><FiTrendingUp /></div>
                        <span>Overall Progress</span>
                    </div>
                    <div className="stat-value">{summary.overallProgress}%</div>
                    <div className="stat-subtext">Across {summary.activeProjects} project{summary.activeProjects !== 1 ? 's' : ''}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon green"><FiCheckCircle /></div>
                        <span>Tasks Reviewed</span>
                    </div>
                    <div className="stat-value">{summary.tasksCompleted}</div>
                    <div className="stat-subtext">Out of {summary.totalTasks} total tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon orange"><FiActivity /></div>
                        <span>My Tasks</span>
                    </div>
                    <div className="stat-value">{summary.memberTasks}</div>
                    <div className="stat-subtext">Assigned to me</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon purple"><FiStar /></div>
                        <span>Completion Rate</span>
                    </div>
                    <div className="stat-value">{summary.avgPerformance}%</div>
                    <div className="stat-subtext">Tasks reviewed / total</div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Progress Trend (Planned vs Actual)</h3>
                    <span className="chart-subtitle">Hover over data points for details</span>
                    <div className="chart-wrapper" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip content={<LineTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                                <Area type="monotone" dataKey="planned" name="Planned" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="url(#plannedGrad)" dot={false} />
                                <Area type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={3} fill="url(#actualGrad)" dot={{ r: 4, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Team Performance Metrics</h3>
                    <span className="chart-subtitle">Hover over vertices for details</span>
                    <div className="chart-wrapper" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip content={<RadarTooltip />} />
                                <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} dot={{ r: 4, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Project Table */}
            <section className="overview-section">
                <h3>Project Performance Overview</h3>
                {projects.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <p style={{ fontSize: '16px' }}>No projects assigned yet.</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Ask your project manager to assign you tasks.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="performance-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Overall Progress</th>
                                    <th>My Progress</th>
                                    <th>My Tasks</th>
                                    <th>Reviewed</th>
                                    <th>Contribution</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(project => (
                                    <tr key={project.project_id}>
                                        <td className="project-name-cell">{project.project_name}</td>
                                        <td>
                                            <div className="progress-bar-container">
                                                <div className="progress-track">
                                                    <div className="progress-fill" style={{ width: `${project.actual_progress}%` }}></div>
                                                </div>
                                                <span>{project.actual_progress}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="progress-bar-container">
                                                <div className="progress-track">
                                                    <div className="progress-fill" style={{ width: `${project.member_progress}%`, background: '#8b5cf6' }}></div>
                                                </div>
                                                <span>{project.member_progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{project.member_tasks} / {project.total_tasks}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ color: '#22c55e', fontWeight: 600 }}>{project.member_reviewed}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>{project.contribution_percent}%</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Milestones */}
            <section className="milestones-section">
                <h3>Project Milestones</h3>
                {projects.length === 0 ? (
                    <p style={{ color: '#94a3b8', padding: '16px 0' }}>No milestones to display yet.</p>
                ) : (
                    <div className="milestones-list">
                        {projects[0].milestones.map((milestone, idx) => (
                            <div key={idx} className="milestone-item">
                                <div className={`milestone-dot ${milestone.status.toLowerCase().replace(/\s+/g, '-')}`}></div>
                                <div className="milestone-content">
                                    <div className="milestone-header">
                                        <span className="milestone-name">{milestone.name}</span>
                                        <span className="milestone-date">{milestone.date}</span>
                                    </div>
                                    <div className="milestone-progress">
                                        <div
                                            className={`milestone-bar ${milestone.status.toLowerCase().replace(/\s+/g, '-')}`}
                                            style={{ width: `${milestone.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className={`milestone-status ${milestone.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {milestone.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MemberProgress;
