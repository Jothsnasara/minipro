import axios from "axios";
import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiLayers } from "react-icons/fi";
import "../styles/MemberDashboard.css";

const MemberTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchTasks();
    }, [user.id]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/member/tasks/${user.id}`);
            setTasks(res.data);

            // Initialize edit forms for all tasks
            const initialForms = {};
            res.data.forEach(task => {
                initialForms[task.id] = {
                    status: task.status,
                    progress: task.progress
                };
            });
            setEditForm(initialForms);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching tasks", error);
            setLoading(false);
        }
    };

    const handleFormChange = (taskId, field, value) => {
        setEditForm(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (taskId) => {
        setUpdatingId(taskId);
        try {
            await axios.put(`http://localhost:5001/api/member/tasks/${taskId}`, editForm[taskId]);
            // Visual feedback
            setTimeout(() => {
                setUpdatingId(null);
                fetchTasks();
            }, 500);
        } catch (error) {
            console.error("Error updating task", error);
            const msg = error.response?.data?.message || error.message;
            alert(`Failed to update task: ${msg}`);
            setUpdatingId(null);
        }
    };

    if (loading) return <div className="loading">Loading Tasks...</div>;

    return (
        <div className="member-main">
            <header className="member-header">
                <div className="welcome-section">
                    <h1>My Tasks</h1>
                    <p>Manage and update your assigned tasks.</p>
                </div>
            </header>

            <div className="task-grid">
                {tasks.map(task => (
                    <div key={task.id} className="task-card">
                        <div className="task-card-header">
                            <div>
                                <span className="task-project-name">{task.projectName}</span>
                                <h3 className="task-card-title">{task.title}</h3>
                            </div>
                            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                {task.priority}
                            </span>
                        </div>

                        <div className="task-meta-row">
                            <FiCalendar />
                            <span>Due Date: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>

                        <div className="progress-container">
                            <div className="progress-header">
                                <span>Current Progress</span>
                                <span style={{ color: 'var(--primary)', fontWeight: '800' }}>
                                    {editForm[task.id]?.progress}%
                                </span>
                            </div>
                            <div className="premium-progress" style={{ marginBottom: '1.5rem' }}>
                                <div
                                    className="premium-progress-bar"
                                    style={{ width: `${editForm[task.id]?.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="task-update-section">
                            <div className="update-controls">
                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                        UPDATE STATUS
                                    </label>
                                    <select
                                        className="status-dropdown"
                                        value={editForm[task.id]?.status}
                                        onChange={(e) => handleFormChange(task.id, 'status', e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending Review">Pending Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
                                        UPDATE PROGRESS
                                    </label>
                                    <div className="progress-slider-container">
                                        <input
                                            type="range"
                                            className="premium-slider"
                                            min="0"
                                            max="100"
                                            value={editForm[task.id]?.progress}
                                            onChange={(e) => handleFormChange(task.id, 'progress', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="update-btn"
                                    onClick={() => handleUpdate(task.id)}
                                    disabled={updatingId === task.id}
                                >
                                    {updatingId === task.id ? (
                                        "Updating..."
                                    ) : (
                                        <>Mark Updated <FiCheck /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="content-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                        <FiLayers style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                        <h3>No Tasks Assigned</h3>
                        <p>You're all caught up! Check back later for new assignments.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberTasks;
