import { useEffect, useState } from 'react';
import {
    FiArrowLeft,
    FiCalendar,
    FiCheckCircle,
    FiCheckSquare,
    FiClock
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './MemberTasks.css';

const MemberTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, inProgress: 0, pendingReview: 0 });
    const [updatingTaskId, setUpdatingTaskId] = useState(null);
    const [resourceUsage, setResourceUsage] = useState({});
    const [allResources, setAllResources] = useState([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            fetchTasks(user.id);
        }

        // Fetch all resources that exist for mapping
        const loadResources = async () => {
            try {
                const res = await api.get('/projects/resources/all');
                setAllResources(res.data || []);
            } catch (err) {
                console.error("Failed to load resources catalog:", err);
            }
        };
        loadResources();
    }, []);

    const fetchTasks = async (userId) => {
        try {
            const res = await api.get(`/projects/member/dashboard/${userId}`);
            setTasks(res.data.tasks || []);

            // Calculate stats from response
            const s = res.data.stats || {};
            setStats({
                total: s.total || 0,
                inProgress: s.in_progress || 0,
                pendingReview: s.pending_review || 0
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setLoading(false);
        }
    };

    const handleProgressChange = async (taskId, newProgress) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.task_id === taskId ? { ...t, progress: newProgress, status: newProgress > 0 && t.status === 'Todo' ? 'In Progress' : t.status } : t
        ));

        try {
            setUpdatingTaskId(taskId);
            const task = tasks.find(t => t.task_id === taskId);
            let newStatus = task.status;
            if (newProgress > 0 && task.status === 'Todo') newStatus = 'In Progress';

            await api.put(`/projects/tasks/${taskId}/progress`, {
                progress: newProgress,
                status: newStatus
            });

            setTimeout(() => setUpdatingTaskId(null), 1000);
        } catch (err) {
            console.error("Failed to update progress:", err);
            setUpdatingTaskId(null);
        }
    };

    const handleResourceUsageChange = (taskId, field, value) => {
        setResourceUsage(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const submitResourceUsage = async (task) => {
        const usage = resourceUsage[task.task_id];
        if (!usage || !usage.resourceId || !usage.used || parseInt(usage.used) <= 0) {
            alert('Please select a resource and enter a valid quantity.');
            return;
        }

        try {
            await api.post(`/projects/tasks/${task.task_id}/resource-usage`, {
                projectId: task.project_id,
                resourceId: usage.resourceId,
                quantity: usage.used
            });
            alert('Resource usage logged successfully!');

            // Clear the form
            setResourceUsage(prev => {
                const updated = { ...prev };
                delete updated[task.task_id];
                return updated;
            });
        } catch (err) {
            console.error("Failed to log resource usage:", err);
            alert(err.response?.data?.message || 'Failed to log usage');
        }
    };

    const handleMarkComplete = async (taskId) => {
        try {
            setUpdatingTaskId(taskId);
            await api.put(`/projects/tasks/${taskId}/progress`, {
                progress: 100,
                status: 'Pending Review'
            });

            // Update local state
            setTasks(prev => prev.map(t =>
                t.task_id === taskId ? { ...t, progress: 100, status: 'Pending Review' } : t
            ));

            // Refresh stats
            setStats(prev => ({
                ...prev,
                inProgress: Math.max(0, prev.inProgress - 1),
                pendingReview: prev.pendingReview + 1
            }));

            setTimeout(() => setUpdatingTaskId(null), 1000);
        } catch (err) {
            console.error("Failed to mark complete:", err);
            setUpdatingTaskId(null);
        }
    };

    if (loading) return <div className="member-tasks-page"><p>Loading tasks...</p></div>;

    return (
        <div className="member-tasks-page">
            <div className="tasks-header">
                <Link to="/member" className="back-link">
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <h1>My Tasks</h1>
                <p>Manage and update your assigned tasks</p>
            </div>

            <div className="tasks-stats">
                <div className="mini-stat-card blue">
                    <div className="mini-icon"><FiCheckSquare /></div>
                    <div className="stat-info">
                        <span>Total Tasks</span>
                        <strong>{stats.total}</strong>
                    </div>
                </div>
                <div className="mini-stat-card orange">
                    <div className="mini-icon"><FiClock /></div>
                    <div className="stat-info">
                        <span>In Progress</span>
                        <strong>{stats.inProgress}</strong>
                    </div>
                </div>
                <div className="mini-stat-card green">
                    <div className="mini-icon"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <span>Pending Review</span>
                        <strong>{stats.pendingReview}</strong>
                    </div>
                </div>
            </div>

            <div className="tasks-grid">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.task_id} className="task-card-large">
                        <div className="task-card-header">
                            <div className="task-title-area">
                                <h3>{task.task_name}</h3>
                                <p className="task-project">{task.project_name}</p>
                            </div>
                            <span className={`task-priority-tag ${task.priority?.toLowerCase()}`}>
                                {task.priority}
                            </span>
                        </div>

                        <div className="task-card-meta">
                            <div className="meta-box">
                                <FiCalendar /> Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                            <div className="meta-box">
                                <span className={`status-indicator ${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {task.status}
                                </span>
                            </div>
                        </div>

                        <div className="task-progress-section">
                            <div className="progress-label">
                                <span>Progress</span>
                                <span>{task.progress || 0}%</span>
                            </div>
                            <div className="large-progress-bar">
                                <div className="large-progress-fill" style={{ width: `${task.progress || 0}%` }}></div>
                            </div>

                            <div className="update-controls">
                                <span className="update-label">Update Progress:</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={task.progress || 0}
                                    onChange={(e) => handleProgressChange(task.task_id, parseInt(e.target.value))}
                                    className="progress-slider"
                                    disabled={task.status === 'Pending Review' || task.status === 'Reviewed'}
                                />
                                <button
                                    className="complete-btn"
                                    onClick={() => handleMarkComplete(task.task_id)}
                                    disabled={task.status === 'Pending Review' || task.status === 'Reviewed'}
                                >
                                    {task.status === 'Reviewed' ? '✅ Reviewed' : task.status === 'Pending Review' ? '⏳ Pending Review' : 'Mark Complete'}
                                </button>
                                {updatingTaskId === task.task_id && <span className="save-status">Saving...</span>}
                            </div>

                            <div className="resource-tracking-section" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Log Resource Usage (Cost Tracking)</h4>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' }}>
                                        <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Select Resource</label>
                                        <select
                                            value={resourceUsage[task.task_id]?.resourceId || ''}
                                            onChange={(e) => handleResourceUsageChange(task.task_id, 'resourceId', e.target.value)}
                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">-- Choose Assigned --</option>
                                            {allResources
                                                .filter(r => {
                                                    // task.resources is stored as a JSON array of names
                                                    let assignedNames = [];
                                                    try {
                                                        assignedNames = typeof task.resources === 'string'
                                                            ? JSON.parse(task.resources)
                                                            : (task.resources || []);
                                                    } catch (e) { assignedNames = []; }
                                                    return assignedNames.includes(r.resource_name);
                                                })
                                                .map(r => (
                                                    <option key={r.resource_id} value={r.resource_id}>{r.resource_name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Units Used</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={resourceUsage[task.task_id]?.used || ''}
                                            onChange={(e) => handleResourceUsageChange(task.task_id, 'used', e.target.value)}
                                            placeholder="e.g. 5"
                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '90px' }}
                                        />
                                    </div>
                                    <button
                                        style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                                        onClick={() => submitResourceUsage(task)}
                                    >
                                        Save Usage Log
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="no-tasks-placeholder">
                        <p>No tasks found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberTasks;
