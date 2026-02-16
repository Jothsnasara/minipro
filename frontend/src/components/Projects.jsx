import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, Card, CardContent, LinearProgress, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { Add, ArrowBack, Folder, CheckCircle, AttachMoney, Groups } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        project_name: '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        manager_id: '',
        status: 'Planning'
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
    }, []);

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

            // Fetch Users
            try {
                const usersRes = await axios.get('http://localhost:5001/users');
                setUsers(usersRes.data);
                console.log("Fetched Users:", usersRes.data);
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
            description: '',
            budget: '',
            start_date: '',
            end_date: '',
            manager_id: '',
            status: 'Planning'
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Filter only managers (case-insensitive)
    const managers = users.filter(user => (user.role || '').toLowerCase() === 'manager');

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                manager_id: formData.manager_id || null // Convert empty string to null
            };
            await axios.post('http://localhost:5001/projects', payload);
            fetchData(); // Refresh list
            handleClose();
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project: " + (error.response?.data?.message || error.message));
        }
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'In Progress': return { color: 'success', bgcolor: '#dcfce7', labelColor: '#166534' };
            case 'On Track': return { color: 'success', bgcolor: '#dcfce7', labelColor: '#166534' };
            case 'At Risk': return { color: 'warning', bgcolor: '#fef3c7', labelColor: '#92400e' };
            case 'Delayed': return { color: 'error', bgcolor: '#fee2e2', labelColor: '#991b1b' };
            case 'Planning': return { color: 'info', bgcolor: '#e0f2fe', labelColor: '#075985' };
            default: return { color: 'default', bgcolor: '#f3f4f6', labelColor: '#374151' };
        }
    }

    // Helper to format currency
    const formatCurrency = (amount) => {
        return amount ? `₹${(Number(amount) / 1000).toFixed(0)}K` : '₹0K';
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin')}
                    sx={{ mb: 2, textTransform: 'none', color: '#6b7280' }}
                >
                    Back to Dashboard
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>Project Management</Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>Monitor and manage all projects</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpen}
                        sx={{ bgcolor: '#2563EB', textTransform: 'none' }}
                    >
                        Create Project
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {summaryCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '24px !important' }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: card.bgColor,
                                    color: card.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {card.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#6b7280' }}>{card.title}</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#111827' }}>{card.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* DEBUG SECTION - REMOVE AFTER FIXING */}
            {/* 
            <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6">Debug: Raw Users Data</Typography>
                <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(users, null, 2)}
                </pre>
            </Box> 
            */}

            {/* Projects Grid */}
            <Grid container spacing={3}>
                {projects.map((project, index) => {
                    const statusProps = getStatusChipProps(project.status);
                    // Mock data for missing fields if any
                    const progress = Math.floor(Math.random() * 100);
                    const budgetUsage = Math.floor(Math.random() * 100);
                    // For members count, we can just show a random number or fetched if we had project_members table
                    const members = Math.floor(Math.random() * 15) + 5;
                    const barColor = project.status === 'At Risk' ? '#f59e0b' : (project.status === 'Delayed' ? '#ef4444' : '#10b981');

                    return (
                        <Grid item xs={12} lg={6} key={index}>
                            <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: 2, height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#111827' }}>{project.project_name}</Typography>
                                        <Chip
                                            label={project.status}
                                            size="small"
                                            sx={{
                                                bgcolor: statusProps.bgcolor,
                                                color: statusProps.labelColor,
                                                fontWeight: 500,
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
                                        {project.description}
                                    </Typography>

                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '1rem' }}>📅</Typography>
                                                <Typography variant="caption" sx={{ color: '#374151' }}>{dayjs(project.end_date).format('DD/MM/YYYY')}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Groups sx={{ color: '#9ca3af', fontSize: '1rem' }} />
                                                <Typography variant="caption" sx={{ color: '#374151' }}>{members} members</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '1rem' }}>💲</Typography>
                                                <Typography variant="caption" sx={{ color: '#374151' }}>{formatCurrency(project.budget)}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#9ca3af' }}>PM:</Typography>
                                                <Typography variant="caption" sx={{ color: '#374151' }}>{project.manager_name || 'Unassigned'}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#374151' }}>Progress</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#374151' }}>{progress}%</Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: '#e5e7eb',
                                                '& .MuiLinearProgress-bar': { bgcolor: barColor }
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                bgcolor: '#2563EB',
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
                                            }}
                                        >
                                            Tasks & Resources
                                        </Button>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                bgcolor: '#9333EA',
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: '#7e22ce', boxShadow: 'none' }
                                            }}
                                        >
                                            Cost Tracking
                                        </Button>
                                    </Box>

                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>Budget Usage</Typography>
                                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#111827' }}>{budgetUsage}%</Typography>
                                    </Box>

                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Create Project Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            fullWidth margin="normal" label="Project Name" name="project_name"
                            value={formData.project_name} onChange={handleChange} required
                        />
                        <TextField
                            fullWidth margin="normal" label="Description" name="description"
                            value={formData.description} onChange={handleChange} multiline rows={3}
                        />
                        <TextField
                            fullWidth margin="normal" label="Budget" name="budget" type="number"
                            value={formData.budget} onChange={handleChange}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth margin="normal" label="Start Date" name="start_date" type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.start_date} onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth margin="normal" label="End Date" name="end_date" type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.end_date} onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            fullWidth margin="normal" label="Manager" name="manager_id" select
                            value={formData.manager_id} onChange={handleChange}
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
                        <TextField
                            fullWidth margin="normal" label="Status" name="status" select
                            value={formData.status} onChange={handleChange}
                        >
                            <MenuItem value="Planning">Planning</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="On Track">On Track</MenuItem>
                            <MenuItem value="At Risk">At Risk</MenuItem>
                            <MenuItem value="Delayed">Delayed</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#2563EB' }}>Save Project</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};


export default Projects;
