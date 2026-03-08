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

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            fetchTasks(user.id);
        }
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
