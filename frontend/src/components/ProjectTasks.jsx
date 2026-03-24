import { useEffect, useState } from 'react';
import {
    FiArrowLeft,
    FiCheckSquare,
    FiClock,
    FiDollarSign,
    FiPlus,
    FiUsers
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ProjectTasks.css';


const DEFAULT_RESOURCES = [
    { resource_id: 'd1', resource_name: 'Figma' },
    { resource_id: 'd2', resource_name: 'Design System' },
    { resource_id: 'd3', resource_name: 'Backend Server' },
    { resource_id: 'd4', resource_name: 'Database' },
    { resource_id: 'd5', resource_name: 'DevOps Tools' },
    { resource_id: 'd6', resource_name: 'Cloud Server' },
    { resource_id: 'd7', resource_name: 'Documentation Tools' }
];

const ProjectTasks = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        task_name: '',
        description: '',
        assigned_to: '',
        priority: 'High',
        due_date: '',
        estimated_hours: '',
        resources: []
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Handle Members — fetch all from users table directly
                const [taskRes, memberRes, resourceRes, allMemberRes] = await Promise.all([
                    api.get(`/api/projects/${projectId}/tasks`).catch(err => { console.error("Tasks fetch failed", err); return { data: [] }; }),
                    api.get(`/api/projects/${projectId}/members`).catch(err => { console.error("Members fetch failed", err); return { data: [] }; }),
                    api.get('/api/projects/resources/all').catch(err => { console.error("Resources fetch failed", err); return { data: [] }; }),
                    api.get('/api/projects/team-members/all').catch(err => { console.error("All members fetch failed", err); return { data: [] }; })
                ]);

                setTasks(taskRes.data || []);

                // Favor assigned members from project_members table, fallback to all users
                const fetchedMembers = memberRes.data || [];
                const allMembers = allMemberRes.data || [];
                if (fetchedMembers.length > 0) {
                    setMembers(fetchedMembers);
                } else {
                    setMembers(allMembers);
                }

                // Handle Resources
                const resources = resourceRes.data || [];
                console.log(`[DEBUG] Received ${resources.length} resources from server`);
                if (resources.length === 0) {
                    console.warn("[DEBUG] No resources from DB, using fallback");
                    setAllResources(DEFAULT_RESOURCES);
                } else {
                    setAllResources(resources);
                }

                setLoading(false);
            } catch (err) {
                console.error("Critical error fetching project data:", err);
                setAllResources(DEFAULT_RESOURCES);
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/projects/tasks', {
                project_id: projectId,
                ...formData
            });
            toast.success("Task assigned successfully!");
            setShowModal(false);
            setFormData({
                task_name: '',
                description: '',
                assigned_to: '',
                priority: 'High',
                due_date: '',
                estimated_hours: '',
                resources: []
            });
            // Refresh tasks
            const taskRes = await api.get(`/api/projects/${projectId}/tasks`);
            setTasks(taskRes.data || []);
            navigate('/manager/projects');
        } catch (err) {
            console.error("Error adding task:", err);
            const errMsg = err.response?.data?.message || "Failed to add task.";
            toast.error(`Failed: ${errMsg}`);
        }
    };

    const handleResourceToggle = (resourceName) => {
        setFormData(prev => {
            const current = prev.resources || [];
            if (current.includes(resourceName)) {
                return { ...prev, resources: current.filter(r => r !== resourceName) };
            } else {
                return { ...prev, resources: [...current, resourceName] };
            }
        });
    };

    const stats = {
        totalTasks: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        teamMembers: [...new Set(tasks.map(t => t.assigned_to))].length,
        estHours: tasks.reduce((acc, t) => acc + parseFloat(t.estimated_hours || 0), 0)
    };

    // Calculate Workload for the chart
    const memberWorkload = tasks.reduce((acc, task) => {
        const name = task.assignee_name || 'Unassigned';
        if (!acc[name]) acc[name] = { name, tasks: 0, hours: 0 };
        acc[name].tasks += 1;
        acc[name].hours += parseFloat(task.estimated_hours || 0);
        return acc;
    }, {});

    // Calculate Resource Usage
    const resourceUsage = tasks.reduce((acc, task) => {
        let resArr = [];
        if (Array.isArray(task.resources)) {
            resArr = task.resources;
        } else if (typeof task.resources === 'string') {
            try {
                resArr = JSON.parse(task.resources);
            } catch (e) {
                resArr = task.resources.split(',').map(r => r.trim());
            }
        }

        if (Array.isArray(resArr)) {
            resArr.forEach(r => {
                const trimmed = (r || '').toString().trim();
                if (trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1;
            });
        }
        return acc;
    }, {});

    if (loading) return (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '1.2rem', color: '#333' }}>
            Loading Project Tasks...
        </div>
    );

    return (
        <div className="tasks-allocation-container">
            <header className="tasks-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/manager/projects')}>
                        <FiArrowLeft /> Back to Projects
                    </button>
                    <h1>Tasks & Resource Allocation</h1>
                    <p className="project-subtitle">Project: Website Redesign</p>
                </div>
                <div className="header-right">

                    <div className="header-buttons">
                        <button className="btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Add Task</button>
                        <button className="btn-secondary" onClick={() => navigate(`/manager/projects/${projectId}/cost-tracking`)}>
                            <FiDollarSign /> Cost Tracking
                        </button>
                    </div>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><FiCheckSquare /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Tasks</span>
                        <h2 className="stat-value">{stats.totalTasks}</h2>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FiCheckSquare /></div>
                    <div className="stat-content">
                        <span className="stat-label">Completed</span>
                        <h2 className="stat-value">{stats.completed}</h2>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><FiUsers /></div>
                    <div className="stat-content">
                        <span className="stat-label">Team Members</span>
                        <h2 className="stat-value">{stats.teamMembers}</h2>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><FiClock /></div>
                    <div className="stat-content">
                        <span className="stat-label">Est. Hours</span>
                        <h2 className="stat-value">{stats.estHours}</h2>
                    </div>
                </div>
            </div>

            <div className="task-list-section">
                <h3>Task List</h3>
                <div className="table-container">
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th>Task Name</th>
                                <th>Assigned To</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Due Date</th>
                                <th>Est. Hours</th>
                                <th>Resources</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.task_id}>
                                    <td>{task.task_name}</td>
                                    <td>
                                        <div className="assignee">
                                            <div className="avatar-small">{task.assignee_name?.[0] || 'U'}</div>
                                            {task.assignee_name || 'Unassigned'}
                                        </div>
                                    </td>
                                    <td><span className={`priority-pill ${task.priority?.toLowerCase()}`}>{task.priority}</span></td>
                                    <td><span className={`status-pill-small ${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                                                <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: '3px', background: (task.progress || 0) === 100 ? '#22c55e' : '#3b82f6', transition: 'width 0.3s' }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#64748b', minWidth: '32px' }}>{task.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                                    <td>{task.estimated_hours}h</td>
                                    <td>
                                        <div className="resource-tags">
                                            {(() => {
                                                let resArr = [];
                                                if (Array.isArray(task.resources)) {
                                                    resArr = task.resources;
                                                } else if (typeof task.resources === 'string') {
                                                    try {
                                                        resArr = JSON.parse(task.resources);
                                                    } catch (e) {
                                                        resArr = task.resources.split(',').map(r => r.trim());
                                                    }
                                                }
                                                return Array.isArray(resArr) ? resArr.map(r => (
                                                    <span key={r} className="resource-tag">{r}</span>
                                                )) : null;
                                            })()}
                                        </div>
                                    </td>
                                    <td>
                                        {task.status === 'Pending Review' ? (
                                            <button
                                                className="review-btn"
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/api/projects/tasks/${task.task_id}/review`);
                                                        setTasks(prev => prev.map(t =>
                                                            t.task_id === task.task_id ? { ...t, status: 'Reviewed' } : t
                                                        ));
                                                    } catch (err) {
                                                        console.error('Failed to review task:', err);
                                                    }
                                                }}
                                            >
                                                ✓ Mark Reviewed
                                            </button>
                                        ) : task.status === 'Reviewed' ? (
                                            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '13px' }}>✅ Reviewed</span>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No tasks found for this project.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="insights-grid">
                <div className="insight-card">
                    <h3>Team Workload</h3>
                    <div className="workload-list">
                        {Object.values(memberWorkload).map(member => (
                            <div key={member.name} className="workload-item">
                                <div className="workload-info">
                                    <span className="workload-name">{member.name}</span>
                                    <span className="workload-tasks">{member.tasks} active tasks</span>
                                </div>
                                <div className="workload-bar-bg">
                                    <div className="workload-bar-fill" style={{ width: `${Math.min(100, (member.hours / 40) * 100)}%` }}></div>
                                </div>
                                <span className="workload-hours">{member.hours} hours allocated</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="insight-card">
                    <h3>Resource Allocation & Usage</h3>
                    <div className="resource-usage-list">
                        {allResources.map(r => {
                            const count = resourceUsage[r.resource_name] || 0;
                            return (
                                <div key={r.resource_id} className="resource-usage-item">
                                    <div className="res-header">
                                        <span className="res-name">{r.resource_name}</span>
                                        <span className="res-type">{r.resource_type}</span>
                                    </div>
                                    <div className="res-bar-bg">
                                        <div className="res-bar-fill" style={{ width: `${Math.min(100, count * 20)}%` }}></div>
                                    </div>
                                    <span className="res-count">{count} tasks allocated</span>
                                </div>
                            );
                        })}
                        {allResources.length === 0 && (
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading resources from database...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add New Task Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="task-modal-card">
                        <h2>Add New Task</h2>
                        <form onSubmit={handleAddTask} className="task-form">
                            <div className="form-group full-width">
                                <label>Task Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter task name"
                                    value={formData.task_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, task_name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Description (Optional)</label>
                                <textarea
                                    placeholder="Brief task description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="2"
                                    style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Assign To</label>
                                    <select
                                        value={formData.assigned_to}
                                        onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select team member</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Estimated Hours</label>
                                    <input
                                        type="number"
                                        placeholder="40"
                                        value={formData.estimated_hours}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Resources</label>
                                <div className="resources-grid">
                                    {allResources.map(r => (
                                        <div
                                            key={r.resource_id}
                                            className={`resource-option ${(formData.resources || []).includes(r.resource_name) ? 'selected' : ''}`}
                                            onClick={() => handleResourceToggle(r.resource_name)}
                                        >
                                            {r.resource_name}
                                        </div>
                                    ))}
                                </div>
                                <p className="help-text">Click to select multiple resources</p>
                            </div>

                            <div className="modal-btns">
                                <button type="button" className="cancel-btn-modal" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="submit-btn-modal">Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTasks;
