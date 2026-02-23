import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/ManagerDashboard.css';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';

const ManagerProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [managerId, setManagerId] = useState(null);
    const [members, setMembers] = useState([]); // All members (for team assignment)
    const [teamOpen, setTeamOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const fetchProjects = async (id) => {
        try {
            const res = await axios.get(`http://localhost:5001/projects/manager/${id}`);
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAllMembers = async () => {
        try {
            const res = await axios.get('http://localhost:5001/auth/users/members');
            setMembers(res.data);
        } catch (err) {
            console.error(err);
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


    const handleTeamOpen = (project) => {
        setSelectedProject(project);
        setTeamOpen(true);
    };


    const handleTeamClose = () => {
        setTeamOpen(false);
    };



    return (
        <div className="management-page">
            <header className="management-header">
                <div className="header-left">
                    <div onClick={() => navigate('/manager-dashboard')} className="back-statement">
                        ← Back to Dashboard
                    </div>
                    <h1>Project Management</h1>
                    <p>Monitor and manage all projects</p>
                </div>
            </header>

            {/* Detailed Grid for Professional Cards */}
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
                                <span className="meta-icon">📅</span>
                                <span>{new Date(proj.end_date).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">👥</span>
                                <span>8 members</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">💰</span>
                                <span>₹{(proj.budget / 1000).toFixed(0)}K</span>
                            </div>
                            <div className="meta-item">
                                <strong>PM:</strong>
                                <span>{proj.manager_name}</span>
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
                            {proj.status === 'Active' && (
                                <button
                                    className="btn-action tasks"
                                    onClick={() => console.log('Tasks clicked')}
                                >
                                    <span className="btn-icon"><Visibility style={{ fontSize: '18px' }} /></span> Tasks & Resources
                                </button>
                            )}
                            <button className="btn-action cost" onClick={() => handleTeamOpen(proj)}>
                                <span className="btn-icon">👥</span> Team
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            {/* Team Management Modal */}
            <Dialog open={teamOpen} onClose={handleTeamClose} fullWidth maxWidth="xs">
                <DialogTitle>Project Team: {selectedProject?.project_name}</DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                        Assign members to this project's specialized team.
                    </p>
                    <div className="member-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {members.map(member => (
                            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '0.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                                <span>{member.name} ({member.specialization || 'Generalist'})</span>
                                <MuiButton size="small" onClick={async () => {
                                    try {
                                        await axios.post(`http://localhost:5001/projects/${selectedProject.project_id || selectedProject.id}/members`, { userId: member.id });
                                        alert("Member added to team!");
                                    } catch (err) {
                                        alert(err.response?.data?.message || "Already in team");
                                    }
                                }}>Add</MuiButton>
                            </div>
                        ))}
                    </div>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={handleTeamClose}>Close</MuiButton>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ManagerProjects;
