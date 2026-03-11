import Visibility from '@mui/icons-material/Visibility';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button as MuiButton, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import '../Styles/ManagerDashboard.css';

const ManagerProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [managerId, setManagerId] = useState(null);
    const [members, setMembers] = useState([]);
    const [teamOpen, setTeamOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);

    const fetchProjects = async (id) => {
        try {
            const res = await api.get(`/projects/manager/${id}`);
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    };

    const fetchAllMembers = async () => {
        try {
            // FIXED: Changed from /auth/users/members to /api/users
            const res = await api.get('/api/users');
            setMembers(res.data);
        } catch (err) {
            console.error("Member Fetch Error:", err);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setManagerId(user.id);
            fetchProjects(user.id);
            fetchAllMembers();
        }
    }, []);

    const handleTeamOpen = async (project) => {
        setSelectedProject(project);
        setTeamOpen(true);
        setLoadingTeam(true);
        try {
            const pId = project.project_id || project.id;
            const res = await api.get(`/projects/${pId}/members`);
            setProjectMembers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch project members:", err);
            setProjectMembers([]);
        } finally {
            setLoadingTeam(false);
        }
    };

    const handleTeamClose = () => {
        setTeamOpen(false);
        setProjectMembers([]);
        setSelectedProject(null);
    };

    return (
        <div className="management-page">
            <header className="management-header">
                <div className="header-left">
                    <div onClick={() => navigate('/manager-dashboard')} className="back-statement" style={{ cursor: 'pointer' }}>
                        ← Back to Dashboard
                    </div>
                    <h1>Project Management</h1>
                    <p>Monitor and manage all projects</p>
                </div>
            </header>

            <div className="detailed-grid">
                {projects.map(proj => (
                    <div className="figma-detailed-card" key={proj.id || proj.project_id}>
                        <div className="card-top-row">
                            <h4>{proj.project_name}</h4>
                            <span className={`status-pill ${proj.status === 'Completed' ? 'done' : proj.status === 'At Risk' ? 'at-risk' : 'ongoing'}`}>
                                {proj.status || 'Planning'}
                            </span>
                        </div>

                        <p className="card-summary">{proj.description || "No description provided."}</p>

                        <div className="card-meta-info">
                            <div className="meta-item">
                                <span>📅</span> {proj.end_date ? dayjs(proj.end_date).format('DD/MM/YYYY') : 'Not Set'}
                            </div>
                            <div className="meta-item">
                                <span>👥</span> {proj.member_count || 0} members
                            </div>
                            <div className="meta-item">
                                <span>💲</span> {proj.budget ? `₹${(proj.budget / 1000).toFixed(0)}K` : '₹0K'}
                            </div>
                            <div className="meta-item">
                                <span>PM:</span> {proj.manager_name || 'Unassigned'}
                            </div>
                        </div>

                        <div className="card-progress">
                            <div className="progress-labels">
                                <span>Progress</span>
                                <strong>75%</strong>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill" style={{ width: '75%' }}></div>
                            </div>
                        </div>

                        <div className="card-action-btns">
                            <button
                                className="btn-action tasks"
                                onClick={() => {
                                    const pId = proj.project_id || proj.id;
                                    if (pId) navigate(`/manager/projects/${pId}/tasks`);
                                }}
                            >
                                <span className="btn-icon"><Visibility style={{ fontSize: '18px' }} /></span> Tasks & Resources
                            </button>
                            <button className="btn-action cost" onClick={() => handleTeamOpen(proj)}>
                                <span className="btn-icon">👥</span> Team
                            </button>
                            <button className="btn-action tasks" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} onClick={() => {
                                const pId = proj.project_id || proj.id;
                                if (pId) navigate(`/manager/projects/${pId}/cost-tracking`);
                            }}>
                                <span className="btn-icon">💰</span> Cost Tracking
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={teamOpen} onClose={handleTeamClose} fullWidth maxWidth="xs">
                <DialogTitle>Project Team: {selectedProject?.project_name}</DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                        Manage members for {selectedProject?.project_name}.
                    </p>

                    {loadingTeam ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading team...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Current Team Section */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ✅ Members Added to Project ({projectMembers.length})
                                </h4>
                                {projectMembers.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '8px' }}>No members assigned yet.</p>
                                ) : (
                                    <div className="member-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {projectMembers.map(member => (
                                            <div key={`current-${member.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', border: '1px solid #dbeafe', borderRadius: '8px', background: '#f0f9ff' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                                        {(member.name || member.username)?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 600 }}>
                                                        {member.name || member.username}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: '#2563eb', background: '#dbeafe', padding: '2px 10px', borderRadius: '12px', fontWeight: 500 }}>
                                                    In Project
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Divider />

                            {/* Add Members Section */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: '#475569' }}>Remaining Members Pool</h4>
                                <div className="member-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {members
                                        .filter(m => !projectMembers.some(pm => pm.id === m.id))
                                        .map(member => (
                                            <div key={`avail-${member.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'all 0.2s' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: member.status === 'Active' ? '#f59e0b' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                                        {(member.name || member.username)?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                                                            {member.name || member.username}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: member.status === 'Active' ? '#d97706' : '#64748b' }}>
                                                            {member.status === 'Active' ? 'Allocated to other projects' : 'Available (Not in any project)'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <MuiButton
                                                    size="small"
                                                    variant="contained"
                                                    style={{ textTransform: 'none', borderRadius: '6px', backgroundColor: '#2563eb', boxShadow: 'none' }}
                                                    onClick={async () => {
                                                        try {
                                                            const pId = selectedProject.project_id || selectedProject.id;
                                                            await api.post(`/projects/${pId}/members`, { userId: member.id });
                                                            // Refresh project members
                                                            const res = await api.get(`/projects/${pId}/members`);
                                                            setProjectMembers(res.data || []);
                                                            fetchProjects(managerId); // Refresh count
                                                        } catch (err) {
                                                            alert(err.response?.data?.message || "Error adding member");
                                                        }
                                                    }}
                                                >
                                                    Add
                                                </MuiButton>
                                            </div>
                                        ))}
                                    {members.filter(m => !projectMembers.some(pm => pm.id === m.id)).length === 0 && (
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No other members available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={handleTeamClose}>Close</MuiButton>
                </DialogActions>
            </Dialog >
        </div >
    );
};

export default ManagerProjects;