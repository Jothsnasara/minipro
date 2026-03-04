import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ManagerDashboard.css'; 

const ProjectForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { project_id, project_name } = location.state || {}; 

    // Configuration: Centralize the backend URL to make changes easier
    const BACKEND_URL = "http://localhost:5001";

    const [formData, setFormData] = useState({
        project_id: project_id || '',
        project_name: project_name || '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        manager_id: '',
        selectedMembers: [] 
    });

    const [availableMembers, setAvailableMembers] = useState([]);

    useEffect(() => {
        // 1. Redirect if no project data is passed
        if (!project_id) {
            alert("No project selected for activation. Redirecting to dashboard.");
            navigate('/manager-dashboard');
            return;
        }

        // 2. Get Manager ID from localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setFormData(prev => ({ ...prev, manager_id: user.id }));
        } else {
            navigate('/login');
            return;
        }

        // 3. Fetch available members from Port 5001
        const fetchMembers = async () => {
            try {
                // Changed from 5000 to 5001 to match your server log
                const res = await axios.get(`${BACKEND_URL}/api/users`); 
                console.log("Team members loaded:", res.data);
                setAvailableMembers(res.data);
            } catch (err) {
                console.error("Error fetching members:", err);
                // Hint: If this still fails, make sure app.get('/api/users') is in server.js
            }
        };
        fetchMembers();
    }, [navigate, project_id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMemberChange = (memberId) => {
        setFormData(prev => {
            const isSelected = prev.selectedMembers.includes(memberId);
            return {
                ...prev,
                selectedMembers: isSelected 
                    ? prev.selectedMembers.filter(id => id !== memberId)
                    : [...prev.selectedMembers, memberId]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Date Validation
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) {
            alert("Error: End Date cannot be before Start Date.");
            return;
        }

        // Checklist Validation (Optional: ensures at least one person is assigned)
        if (formData.selectedMembers.length === 0) {
            const confirmEmpty = window.confirm("No team members selected. Continue anyway?");
            if (!confirmEmpty) return;
        }

        try {
            // Update project details + send member IDs to the backend on Port 5001
            await axios.put(`${BACKEND_URL}/projects/complete-project/${formData.project_id}`, formData);
            alert("Project Setup Completed & Team Assigned!");
            navigate('/manager-dashboard');
        } catch (err) {
            console.error("Error updating project:", err);
            alert("Failed to update project: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="form-section">
            <div className="form-header">
                <h3>Project Setup</h3>
                <h2>Setup: {formData.project_name}</h2>
                <p>Define the scope, budget, and assign your team.</p>
                <div onClick={() => navigate('/manager-dashboard')} className="back-statement" style={{ fontSize: '0.9rem', cursor: 'pointer', color: '#2563eb' }}>
                    ← Cancel and go back
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="input-group full-width">
                        <label>Description</label>
                        <textarea 
                            name="description" 
                            placeholder="Provide project details..." 
                            onChange={handleChange} 
                            value={formData.description} 
                            required 
                        />
                    </div>

                    <div className="input-group full-width">
                        <label>Budget ($)</label>
                        <input 
                            type="number" 
                            name="budget" 
                            placeholder="0.00"
                            onChange={handleChange} 
                            value={formData.budget} 
                            required 
                        />
                    </div>

                    <div className="date-row" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Start Date</label>
                            <input type="date" name="start_date" onChange={handleChange} value={formData.start_date} required />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>End Date</label>
                            <input type="date" name="end_date" onChange={handleChange} value={formData.end_date} required />
                        </div>
                    </div>

                    {/* TEAM MEMBER SELECTION CHECKLIST */}
                    <div className="input-group full-width" style={{ marginTop: '20px' }}>
                        <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                            Assign Team Members ({formData.selectedMembers.length} selected)
                        </label>
                        <div className="members-checklist" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                            gap: '10px',
                            background: '#f9fafb',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            maxHeight: '180px',
                            overflowY: 'auto'
                        }}>
                            {availableMembers.length > 0 ? (
                                availableMembers.map(member => (
                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            id={`mem-${member.id}`}
                                            checked={formData.selectedMembers.includes(member.id)}
                                            onChange={() => handleMemberChange(member.id)}
                                        />
                                        <label htmlFor={`mem-${member.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                            {member.username || member.name} 
                                            <span style={{color: '#9ca3af', fontSize: '0.75rem', marginLeft: '5px'}}>
                                                ({member.specialization || 'Member'})
                                            </span>
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No members found. Add users with 'member' role in the database.</p>
                            )}
                        </div>
                    </div>
                </div>
                <button type="submit" className="create-project-btn" style={{ marginTop: '20px' }}>
                    Complete Setup & Activate
                </button>
            </form>
        </div>
    );
};
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Call this instead of alert:
toast.success("Project assigned successfully!");
export default ProjectForm;