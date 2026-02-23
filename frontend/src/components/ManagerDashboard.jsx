import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/ManagerDashboard.css';

const ManagerDashboard = () => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const [modalConfig, setModalConfig] = useState({
        isOpen: false, project_id: null, title: '', message: '', type: 'confirm'
    });
    const [managerId, setManagerId] = useState(null);
    const [teamMemberCount, setTeamMemberCount] = useState(0);

    const fetchProjects = async (id) => {
        try {
            // Using port 5001 as per configuration
            const response = await axios.get(`http://localhost:5001/projects/manager/${id}`);
            setProjects(response.data);

            // Fetch team members count
            const teamRes = await axios.get(`http://localhost:5001/projects/manager/${id}/team-members`);
            setTeamMemberCount(teamRes.data.team_count);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log("Logged in user:", user);
            if (user && user.id) {
                setManagerId(user.id);
                fetchProjects(user.id);
            } else {
                console.error("User ID missing in localStorage");
            }
        } else {
            navigate("/");
        }
    }, [navigate]);

    const getDaysLeft = (dateString) => {
        const today = new Date();
        const deadline = new Date(dateString);
        const diffTime = deadline - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const upcomingDeadlines = projects.filter(proj => {
        const daysLeft = getDaysLeft(proj.end_date);
        return daysLeft >= 0 && daysLeft <= 7 && proj.status !== 'Completed';
    });

    const openDeleteModal = (id, name) => {
        setModalConfig({
            isOpen: true, project_id: id, title: 'Delete Project?',
            message: `Are you sure you want to delete "${name}"? This will permanently remove it from the database.`,
            type: 'confirm'
        });
    };

    const handleModalAction = async () => {
        if (modalConfig.type === 'confirm') {
            try {
                // Assuming delete endpoint exists or using placeholder for now since user didn't provide backend code
                // But generally specific delete logic wasn't in previous plans. 
                // Using route from provided frontend code: /api/projects/delete/:id -> adapting to our backend if needed
                // For now, let's assume standard REST: DELETE /projects/:id
                await axios.delete(`http://localhost:5001/projects/${modalConfig.project_id}`);
                setModalConfig({ ...modalConfig, isOpen: false });
                // Refresh
                if (managerId) fetchProjects(managerId);
            } catch (error) {
                console.error("Delete failed", error);
                // alert("Failed to delete project"); // using console for now as alert not passed
            }
        } else {
            setModalConfig({ ...modalConfig, isOpen: false });
        }
    };

    // Calculate Progress for display
    const getProgress = (status) => {
        switch (status) {
            case 'Completed': return 100;
            case 'On Track': return 75;
            case 'At Risk': return 45;
            default: return 30;
        }
    };

    return (
        <div className="dashboard-content">
            <div className="page-header-block">
                <h1>Project Manager Dashboard</h1>
                <p className="sub-text">Track and manage your projects efficiently.</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card blue"><span className="icon">📂</span><h3>{projects.length}</h3><p>Total Projects</p></div>
                <div className="kpi-card green"><span className="icon">✅</span><h3>{projects.filter(p => p.status === 'Completed').length}</h3><p>Completed Tasks</p></div>
                <div className="kpi-card orange"><span className="icon">🕒</span><h3>{projects.filter(p => p.status !== 'Completed').length}</h3><p>Pending Tasks</p></div>
                <div className="kpi-card purple"><span className="icon">👥</span><h3>{teamMemberCount}</h3><p>Team Members</p></div>
            </div>

            <div className="projects-card">
                <div className="section-header"><h3>My Projects</h3></div>
                <div className="project-list-container">
                    {projects.map((proj) => (
                        <div className="project-item-card" key={proj.id || proj.project_id}>
                            <div className="card-top">
                                <h4>{proj.project_name}</h4>
                                <div className="card-actions">
                                    <span className={`badge ${proj.status === 'Completed' ? 'on-track' : proj.status === 'Planning' ? 'planning-badge' : 'at-risk'}`}>
                                        {proj.status || 'Planning'}
                                    </span>
                                    {/* Delete button logic would go here */}
                                </div>
                            </div>

                            {proj.status === 'Planning' ? (
                                <div className="card-planning-view" style={{ textAlign: 'center', padding: '15px 0' }}>
                                    <p style={{ color: '#6b7280', marginBottom: '10px' }}>Action Required</p>
                                    <button
                                        onClick={() => navigate('/manager/activate-project', { state: { project_id: proj.project_id || proj.id, project_name: proj.project_name } })}
                                        className="update-details-btn"
                                        style={{
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Complete Setup
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="card-details">
                                        <div className="detail-item"><span>Progress</span><strong>{getProgress(proj.status)}%</strong></div>
                                        <div className="detail-item"><span>Deadline</span><strong>{new Date(proj.end_date).toLocaleDateString()}</strong></div>
                                        <div className="detail-item"><span>Budget Used</span><strong className={proj.budget > 500000 ? 'text-red' : ''}>40%</strong></div>
                                    </div>
                                    <div className="card-progress-bar"><div className="progress-fill" style={{ width: `${getProgress(proj.status)}%` }}></div></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bottom-dashboard-row">
                <div className="left-stack">
                    <div className="actions-panel-card">
                        <h4>Quick Actions</h4>
                        <div className="action-buttons-grid">
                            <button className="action-button green-theme"><span className="btn-icon">✅</span><span>Assign Task</span></button>
                        </div>
                    </div>

                    <div className="alerts-panel-card">
                        <h4>Critical Alerts</h4>
                        <div className="alert-list-stack">
                            {projects.filter(p => p.budget > 500000).map(proj => (
                                <div className="alert-item-box red-alert" key={proj.id || proj.project_id}>
                                    <span className="alert-icon">⚠️</span>
                                    <div className="alert-info"><strong>Budget Overrun</strong><p>{proj.project_name}</p></div>
                                </div>
                            ))}
                            <div className="alert-item-box yellow-alert"><span className="alert-icon">⚠️</span><div className="alert-info"><strong>Resource Shortage</strong></div></div>
                        </div>
                    </div>
                </div>

                <div className="deadlines-panel-card">
                    <div className="section-header"><h4>Upcoming Deadlines</h4></div>
                    <div className="deadline-list-stack">
                        {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(proj => (
                            <div className="deadline-item-box" key={proj.id || proj.project_id}>
                                <div className="deadline-indicator"></div>
                                <div className="deadline-info">
                                    <strong>{proj.project_name}</strong>
                                    <p>Deadline: {new Date(proj.end_date).toLocaleDateString()}</p>
                                    <span className="time-remaining">🕒 {getDaysLeft(proj.end_date)} days left</span>
                                </div>
                            </div>
                        )) : (
                            <p className="no-deadlines">No urgent deadlines this week.</p>
                        )}
                    </div>
                </div>
            </div>

            {modalConfig.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{modalConfig.title}</h3>
                        <p>{modalConfig.message}</p>
                        <div className="modal-actions">
                            <button className="modal-btn-cancel" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>Cancel</button>
                            <button className="modal-btn-confirm" onClick={handleModalAction}>Delete Project</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
