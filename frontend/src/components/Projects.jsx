import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, Card, CardContent, LinearProgress, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { Add, ArrowBack, Folder, CheckCircle, AttachMoney, Groups } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import '../styles/ManagerDashboard.css';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]); // Still need for Team Members count
    const [managers, setManagers] = useState([]); // Dedicated state for managers
    const [loading, setLoading] = useState(true);

    // Modal State
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        project_name: '',
        manager_id: ''
    });

    const summaryCards = [
        { title: 'Total Projects', value: projects.length, icon: <Folder />, color: '#3b82f6', bgColor: '#eff6ff' },
        { title: 'On Track', value: projects.filter(p => p.status === 'On Track').length, icon: <CheckCircle />, color: '#10b981', bgColor: '#ecfdf5' },
        { title: 'Total Budget', value: `₹${(projects.reduce((acc, curr) => acc + Number(curr.budget || 0), 0) / 1000).toFixed(0)}K`, icon: <AttachMoney />, color: '#f59e0b', bgColor: '#fffbeb' },
        { title: 'Team Members', value: users.filter(u => u.status && (u.status === 'Active' || u.status === 'Inactive')).length, icon: <Groups />, color: '#8b5cf6', bgColor: '#f5f3ff' },
    ];

    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        fetchData();
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            // Updated to use the specific endpoint as requested
            const res = await axios.get('http://localhost:5001/users/managers');
            setManagers(res.data);
            console.log("Fetched Managers:", res.data);
        } catch (err) {
            console.error("Failed to fetch managers:", err);
            // Fallback or alert if needed
        }
    }

    const fetchData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // Fetch Projects
            try {
                const projectsRes = await axios.get('http://localhost:5001/projects');
                setProjects(projectsRes.data);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setFetchError(prev => (prev ? prev + " | " : "") + "Projects: " + (err.message || "Unknown error"));
            }

            // Fetch Users (for summary)
            try {
                const usersRes = await axios.get('http://localhost:5001/users');
                setUsers(usersRes.data);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setFetchError(prev => (prev ? prev + " | " : "") + "Users: " + (err.message || "Unknown error"));
            }
        } catch (error) {
            console.error("General Fetch Error:", error);
            setFetchError("General: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData({
            project_name: '',
            manager_id: ''
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Removed client-side filtering since we now have server-side fetching
    // const managers = users.filter(user => (user.role || '').toLowerCase() === 'manager');

    const handleSubmit = async () => {
        try {
            if (!formData.project_name || !formData.manager_id) {
                alert("Please fill all required fields");
                return;
            }
            await axios.post('http://localhost:5001/projects', formData);
            fetchData(); // Refresh list
            handleClose();
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project: " + (error.response?.data?.message || error.message));
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'In Progress': return 'ongoing';
            case 'On Track': return 'ongoing';
            case 'At Risk': return 'at-risk';
            case 'Delayed': return 'at-risk';
            case 'Completed': return 'done';
            default: return 'done'; // Planning etc
        }
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        return amount ? `₹${(Number(amount) / 1000).toFixed(0)}K` : '₹0K';
    };

    return (
        <div className="main-content" style={{ marginLeft: 0, padding: '40px' }}> {/* Override marginLeft since no sidebar here */}
            <div className="page-header-block">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin')}
                    sx={{ mb: 2, textTransform: 'none', color: '#6b7280' }}
                >
                    Back to Dashboard
                </Button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Project Management</h1>
                        <p className="sub-text">Monitor and manage all projects</p>
                    </div>
                    <button className="btn-create-large" onClick={handleOpen}>
                        + Assign Project
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="kpi-grid">
                {summaryCards.map((card, index) => (
                    <div className={`kpi-card ${index === 0 ? 'blue' : index === 1 ? 'green' : index === 2 ? 'orange' : 'purple'}`} key={index}>
                        <div className="icon">{card.icon}</div>
                        <h3>{card.value}</h3>
                        <p>{card.title}</p>
                    </div>
                ))}
            </div>

            {/* Projects Grid */}
            <div className="detailed-grid">
                {projects.map((project, index) => {
                    const progress = Math.floor(Math.random() * 100);
                    // const budgetUsage = Math.floor(Math.random() * 100);
                    const members = Math.floor(Math.random() * 15) + 5;
                    const statusClass = getStatusClass(project.status);

                    return (
                        <div className="figma-detailed-card" key={index}>
                            <div className="card-top-row">
                                <h4>{project.project_name}</h4>
                                <span className={`status-pill ${statusClass}`}>{project.status}</span>
                            </div>

                            <p className="card-summary">
                                {project.description || "No description provided."}
                            </p>

                            <div className="card-meta-info">
                                <div className="meta-item">
                                    <span>📅</span> {dayjs(project.end_date).format('DD/MM/YYYY')}
                                </div>
                                <div className="meta-item">
                                    <span>👥</span> {members} members
                                </div>
                                <div className="meta-item">
                                    <span>💲</span> {formatCurrency(project.budget)}
                                </div>
                                <div className="meta-item">
                                    <span>PM:</span> {project.manager_name || 'Unassigned'}
                                </div>
                            </div>

                            <div className="card-progress">
                                <div className="progress-labels">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="bar-bg">
                                    <div className="bar-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="card-action-btns">
                                <button className="btn-action tasks">
                                    <span>👁</span> Tasks & Resources
                                </button>
                                <button className="btn-action cost">
                                    <span>💲</span> Cost Tracking
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Assign Project Dialog - Keeping MUI for Modal as it's functional */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Assign Project</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            fullWidth margin="normal" label="Project Name" name="project_name"
                            value={formData.project_name} onChange={handleChange} required
                        />

                        <TextField
                            fullWidth margin="normal" label="Assign Manager" name="manager_id" select
                            value={formData.manager_id} onChange={handleChange} required
                        >
                            {managers.length > 0 ? (
                                managers.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.name} ({user.status || 'No Status'})
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    No Managers Found
                                </MenuItem>
                            )}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#2563EB' }}>Assign</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};


export default Projects;
