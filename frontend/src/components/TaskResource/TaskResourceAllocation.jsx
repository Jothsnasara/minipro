import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircle,
    ListTodo,
    Users,
    Clock,
    Plus,
    DollarSign,
    ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import SummaryCard from './SummaryCard';
import TaskTable from './TaskTable';
import TeamWorkload from './TeamWorkload';
import ResourceUsage from './ResourceUsage';

const TaskResourceAllocation = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tasks, setTasks] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [usage, setUsage] = useState([]);
    const [summary, setSummary] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [resolvedProjectId, setResolvedProjectId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
        estimatedHours: '',
        resources: ''
    });

    const API_BASE = 'http://localhost:5001/api';

    // Map path to a friendly title
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('projects') && !path.includes('tasks')) return 'Project Management';
        if (path.includes('dashboard')) return 'Manager Overview';
        if (path.includes('reports')) return 'Analytics Reports';
        if (path.includes('notifications')) return 'Notifications';
        return 'Tasks & Resource Allocation';
    };

    const fetchData = async () => {
        try {
            // ── 1. Resolve project ID from URL param, location state, or API ──
            let currentProjectId = (projectId && projectId !== 'undefined') ? projectId : null;

            if (!currentProjectId && location.state?.project) {
                const sp = location.state.project;
                currentProjectId = sp.project_id || sp._id || sp.id;
            }

            if (!currentProjectId || currentProjectId === 'undefined') {
                const projectRes = await axios.get('http://localhost:5001/projects').catch(() => ({ data: [] }));
                const first = projectRes.data[0];
                if (first) currentProjectId = first.project_id || first._id || first.id;
            }

            const numericProjectId = (currentProjectId && currentProjectId !== 'undefined') ? parseInt(currentProjectId, 10) : null;

            if (numericProjectId && !isNaN(numericProjectId)) {
                setResolvedProjectId(numericProjectId);
                console.log('[TaskAllocation] Resolved project ID:', numericProjectId);
            } else {
                setResolvedProjectId(null);
            }

            // ── 2. Fetch team members (MySQL role=member) ──
            try {
                const usersRes = await axios.get('http://localhost:5001/users');
                const members = usersRes.data.filter(u => u.role === 'member');
                setTeamMembers(members);
            } catch (err) {
                console.error('Failed to fetch users:', err);
            }

            // ── 3. Fetch all dashboard data ──
            if (numericProjectId) {
                console.log('Fetching data for Project ID:', numericProjectId);
                const [tasksRes, workloadRes, usageRes, summaryRes, projectsRes] = await Promise.all([
                    axios.get(`${API_BASE}/projects/${numericProjectId}/tasks`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE}/dashboard/team-workload/${numericProjectId}`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE}/dashboard/resource-usage/${numericProjectId}`).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE}/dashboard/summary/${numericProjectId}`).catch(() => ({ data: { totalTasks: 0, completedTasks: 0, teamMembers: 0, totalEstHours: 0 } })),
                    axios.get('http://localhost:5001/projects').catch(() => ({ data: [] }))
                ]);

                setTasks(tasksRes.data);
                setWorkload(workloadRes.data);
                setUsage(usageRes.data);
                setSummary(summaryRes.data);

                const proj = projectsRes.data.find(p => {
                    const pid = p.project_id ?? p._id ?? p.id;
                    return String(pid) === String(numericProjectId);
                });
                setProject(proj || location.state?.project || null);
            }
            setLoading(false);
        } catch (error) {
            console.error('General error in fetchData:', error);
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [projectId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const pid = resolvedProjectId || (projectId && projectId !== 'undefined' ? Number(projectId) : null);
            if (!pid || isNaN(pid)) {
                alert('No project selected. Please open this page from a project.');
                setIsSubmitting(false);
                return;
            }
            const taskData = {
                ...formData,
                projectId: pid,
                resources: formData.resources.split(',').map(r => r.trim()).filter(r => r),
                estimatedHours: Number(formData.estimatedHours)
            };

            await axios.post(`${API_BASE}/tasks`, taskData);
            setIsModalOpen(false);
            setFormData({
                title: '',
                assignedTo: '',
                priority: 'Medium',
                status: 'Todo',
                dueDate: '',
                estimatedHours: '',
                resources: ''
            });
            fetchData(); // Refresh all data
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <div className="flex flex-col items-center space-y-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-[#eff6ff] border-t-[#2563EB] shadow-sm"></div>
                    <p className="font-black text-[#475569] text-xl tracking-tighter animate-pulse">Initializing Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 text-left">
                    <button
                        onClick={() => navigate('/manager/projects')}
                        className="flex items-center text-[#2563EB] font-black text-[15px] hover:translate-x-[-6px] transition-transform duration-300 group"
                    >
                        <ArrowLeft className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" strokeWidth={3} /> Back to Projects
                    </button>
                    <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">{getPageTitle()}</h1>
                    <p className="text-[14px] font-medium text-[#64748b] mt-1">
                        Project: <span className="text-[#334155] font-semibold">{project?.name || project?.project_name || 'Website Redesign'}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-5 py-2.5 bg-[#2563EB] text-white rounded-[12px] font-semibold text-[14px] hover:bg-blue-700 transition shadow-md hover:scale-105 active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" strokeWidth={2.5} /> Add Task
                    </button>
                    <button
                        onClick={() => {
                            const pid = resolvedProjectId || project?.project_id || project?._id || project?.id || projectId;
                            if (!pid || pid === 'undefined') {
                                alert('Please select a project first');
                                return;
                            }
                            const basePath = location.pathname.includes('/manager')
                                ? `/manager/projects/${pid}/tasks/cost-tracking`
                                : `/admin/projects/${pid}/tasks/cost-tracking`;
                            navigate(basePath, { state: { project, from: location.pathname } });
                        }}
                        className="flex items-center px-5 py-2.5 bg-[#9333ea] text-white rounded-[12px] font-semibold text-[14px] hover:bg-purple-700 transition shadow-md hover:scale-105 active:scale-95 group"
                    >
                        <DollarSign className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.5} /> Cost Tracking
                    </button>
                </div>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
                <SummaryCard
                    title="Total Tasks"
                    value={summary?.totalTasks || 0}
                    icon={ListTodo}
                    type="total"
                />
                <SummaryCard
                    title="Completed"
                    value={summary?.completedTasks || 0}
                    icon={CheckCircle}
                    type="completed"
                />
                <SummaryCard
                    title="Team Members"
                    value={summary?.teamMembers || 0}
                    icon={Users}
                    type="members"
                />
                <SummaryCard
                    title="Est. Hours"
                    value={`${summary?.totalEstHours || 0}h`}
                    icon={Clock}
                    type="hours"
                />
            </div>

            {/* Task Table Section */}
            <TaskTable tasks={tasks} />

            {/* Dashboard Graphics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                <TeamWorkload workload={workload} />
                <ResourceUsage usage={usage} />
            </div>


            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#f8faff]">
                            <div>
                                <h2 className="text-2xl font-black text-[#334155] tracking-tight">Create New Task</h2>
                                <p className="text-sm font-bold text-[#64748b] mt-1">Fill in the details to allocate resources</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAddTask} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Task Title</label>
                                    <input
                                        required name="title" value={formData.title} onChange={handleInputChange}
                                        placeholder="e.g. Design System Audit"
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Assigned To</label>
                                    <select
                                        required name="assignedTo" value={formData.assignedTo} onChange={handleInputChange}
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    >
                                        <option value="">Select Member</option>
                                        {teamMembers.map(member => (
                                            <option key={member.id} value={member.name}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Priority</label>
                                    <select
                                        name="priority" value={formData.priority} onChange={handleInputChange}
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Est. Hours</label>
                                    <input
                                        type="number" required name="estimatedHours" value={formData.estimatedHours} onChange={handleInputChange}
                                        placeholder="40"
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Due Date</label>
                                    <input
                                        type="date" required name="dueDate" value={formData.dueDate} onChange={handleInputChange}
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-black text-[#475569] uppercase tracking-wider">Resources (comma separated)</label>
                                    <input
                                        name="resources" value={formData.resources} onChange={handleInputChange}
                                        placeholder="Figma, Design System, Database"
                                        className="w-full px-5 py-4 rounded-[16px] border-2 border-slate-100 focus:border-[#2563EB] outline-none font-bold text-[#334155] transition-all bg-[#f8faff] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4.5 rounded-[20px] font-black text-[#64748b] bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className="flex-[2] py-4.5 rounded-[20px] font-black text-white bg-[#2563EB] hover:bg-blue-700 transition-all shadow-[0_12px_24px_rgba(37,99,235,0.2)] disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskResourceAllocation;
