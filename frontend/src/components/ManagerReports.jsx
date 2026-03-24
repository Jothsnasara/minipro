import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBriefcase, FiCheckCircle, FiCpu, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import '../Styles/ManagerDashboard.css';

const ManagerReports = () => {
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        successRate: 0,
        resourceEfficiency: 0,
        allocatedCount: 0,
        totalPool: 0,
        budgetVariance: 0,
        totalBudget: 0,
        totalSpent: 0
    });
    const [trendData, setTrendData] = useState([]);
    const [costData, setCostData] = useState([]);
    const [managerId, setManagerId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('token');
        
        const fetchReports = async () => {
            try {
                const response = await axios.get('http://localhost:5005/api/reports/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (isMounted) {
                    setStats({ 
                        totalProjects: response.data.totalProjects,
                        activeProjects: response.data.activeProjects,
                        completedProjects: response.data.completedProjects,
                        successRate: response.data.successRate,
                        resourceEfficiency: response.data.resourceEfficiency,
                        budgetVariance: response.data.budgetVariance,
                        totalBudget: response.data.totalBudget,
                        totalSpent: response.data.totalSpent,
                        totalPool: response.data.totalPool,
                        allocatedCount: response.data.allocatedCount
                    });
                }
            } catch (error) {
                console.error("Error fetching report stats:", error.message);
                if (isMounted) {
                    setStats(prev => ({ ...prev, totalProjects: 'Error' }));
                }
            }
        };

        const fetchTrendData = async () => {
            try {
                const response = await axios.get('http://localhost:5005/api/reports/utilization-trend', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isMounted) {
                    setTrendData(response.data);
                }
            } catch (error) {
                console.error("Error fetching trend data:", error.message);
            }
        };

        const fetchCostAnalysis = async () => {
            try {
                const response = await axios.get('http://localhost:5005/api/reports/cost-analysis', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isMounted) {
                    setCostData(response.data.chartData || []);
                }
            } catch (error) {
                console.error("Error fetching cost analysis:", error.message);
            }
        };

        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setManagerId(decoded.id);
            } catch (err) { console.error("Token error"); }
        }

        if (managerId) {
            setLoading(true);
            Promise.all([fetchReports(), fetchTrendData(), fetchCostAnalysis()]).then(() => {
                if (isMounted) setLoading(false);
            });
        }
        
        return () => { isMounted = false; };
    }, [managerId]);

    // Internal Card Styles
    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    };

    const iconWrapperStyle = (bgColor) => ({
        width: '48px', height: '48px', borderRadius: '12px',
        backgroundColor: bgColor, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
    });

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading...</div>;

    return (
        <div style={{ padding: '32px', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <h2 style={{ fontSize: '1.75rem', color: '#0F172A', fontWeight: '700', marginBottom: '8px' }}>Reports & Analytics</h2>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Track project status and organizational efficiency markers.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                
                {/* Projects KPI */}
                <div style={cardStyle}>
                    <div style={iconWrapperStyle('#EFF6FF')}>
                        <FiBriefcase size={28} color="#3B82F6" />
                    </div>
                    <div>
                        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Total Projects</p>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{stats.totalProjects}</h3>
                        <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Management Overview</p>
                    </div>
                </div>

                {/* Success Rate KPI */}
                <div style={cardStyle}>
                    <div style={iconWrapperStyle('#ECFDF5')}>
                        <FiCheckCircle size={28} color="#10B981" />
                    </div>
                    <div>
                        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Success Rate</p>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{`${stats.successRate}%`}</h3>
                        <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Project Completion Rate</p>
                    </div>
                </div>

                {/* Efficiency KPI */}
                <div style={cardStyle}>
                    <div style={iconWrapperStyle('#F5F3FF')}>
                        <FiCpu size={28} color="#8B5CF6" />
                    </div>
                    <div>
                        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Resource Efficiency</p>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: '700' }}>{`${stats.resourceEfficiency}%`}</h3>
                        <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Capacity Utilization</p>
                    </div>
                </div>

                {/* Budget KPI */}
                <div style={cardStyle}>
                    <div style={iconWrapperStyle('#FFEDD5')}>
                        {stats.totalSpent > stats.totalBudget ? <FiAlertCircle size={28} color="#EF4444" /> : <FiTrendingDown size={28} color="#10B981" />}
                    </div>
                    <div>
                        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Budget Variance</p>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: stats.totalSpent > stats.totalBudget ? '#EF4444' : '#10B981' }}>
                            {`${stats.budgetVariance}%`}
                        </h3>
                        <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Financial Performance</p>
                    </div>
                </div>

            </div>
            
            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
                
                {/* Utilization Trend Chart */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px', color: '#0F172A' }}>Resource Utilization Trend</h3>
                    <div style={{ height: '350px', width: '100%', position: 'relative', display: 'block' }}>
                        {trendData.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', borderRadius: '8px' }}>
                                <p style={{ color: '#94A3B8' }}>No trend data available</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, 'Utilization']} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    <Line name="Utilization %" type="monotone" dataKey="utilization" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 8 }} />
                                    <Line name="Capacity" type="monotone" dataKey="capacity" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Cost Analysis Bar Chart */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px', color: '#0F172A' }}>Cost Analysis (Budget vs Spent)</h3>
                    <div style={{ height: '350px', width: '100%', position: 'relative', display: 'block' }}>
                        {costData.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', borderRadius: '8px' }}>
                                <p style={{ color: '#94A3B8' }}>No cost data available</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={costData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                    <Bar name="Budget" dataKey="totalBudget" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar name="Spent" dataKey="totalSpent" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManagerReports;