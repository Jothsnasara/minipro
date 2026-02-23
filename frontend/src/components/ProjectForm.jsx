import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ManagerDashboard.css'; // Reusing dashboard styles for consistency

const ProjectForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { project_id, project_name } = location.state || {}; // Get data from navigation

    const [formData, setFormData] = useState({
        project_id: project_id || '',
        project_name: project_name || '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        manager_id: ''
    });

    useEffect(() => {
        // Redirect if accessed directly without state
        if (!project_id) {
            alert("No project selected for activation. Redirecting to dashboard.");
            navigate('/manager-dashboard');
            return;
        }

        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setFormData(prev => ({ ...prev, manager_id: user.id }));
        } else {
            navigate('/login');
        }
    }, [navigate, project_id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Strict Date Validation
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);

        if (end < start) {
            alert("Error: End Date cannot be before Start Date.");
            return;
        }

        try {
            await axios.put(`http://localhost:5001/projects/complete-project/${formData.project_id}`, formData);
            alert("Project Setup Completed & Activated!");
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
                <p>Define the scope, budget, and timeline to activate this project.</p>
                <div onClick={() => navigate('/manager-dashboard')} className="back-statement" style={{ fontSize: '0.9rem', cursor: 'pointer', color: '#2563eb' }}>
                    ← Cancel and go back
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {/* Project Name is Display Only */}

                    <input type="hidden" name="manager_id" value={formData.manager_id} />
                    <input type="hidden" name="project_id" value={formData.project_id} />

                    <div className="input-group full-width">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="Provide a detailed project summary..."
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
                            placeholder="Enter project budget"
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
                </div>
                <button type="submit" className="create-project-btn">Complete Setup & Activate</button>
            </form>
        </div>
    );
};

export default ProjectForm;