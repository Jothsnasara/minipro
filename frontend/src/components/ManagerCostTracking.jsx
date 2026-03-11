import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

const ManagerCostTracking = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [totals, setTotals] = useState({ budgeted: 0, spent: 0, remaining: 0 });
    const [byResource, setByResource] = useState([]);
    const [byMember, setByMember] = useState([]);
    const [byTask, setByTask] = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [rawCosts, setRawCosts] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/cost-tracking`);
                setTotals(res.data.totals || { budgeted: 0, spent: 0, remaining: 0 });
                setByResource(res.data.byResource || []);
                setByMember(res.data.byMember || []);
                setByTask(res.data.byTask || []);
                setMonthly(res.data.monthlyCosts || []);
                setRawCosts(res.data.rawCosts || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching cost tracking', err);
                setLoading(false);
            }
        };
        fetch();
    }, [projectId]);

    const utilization = totals.budgeted > 0 ? Math.min(100, Math.round((totals.spent / totals.budgeted) * 100)) : 0;
    const overBudgetAmt = totals.spent > totals.budgeted ? totals.spent - totals.budgeted : 0;

    const makeBarData = (data, label) => ({
        labels: data.map(d => d.label || 'Unknown'),
        datasets: [{
            label,
            data: data.map(d => parseFloat(d.value)),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
            borderRadius: 4,
        }]
    });

    const makePieData = (data) => ({
        labels: data.map(d => d.label || 'Unknown'),
        datasets: [{
            data: data.map(d => parseFloat(d.value)),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 1,
        }]
    });

    const barOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    const pieOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
    };

    const monthBarData = {
        labels: monthly.length > 0 ? monthly.map(m => m.monthStr) : ['No Data'],
        datasets: [{
            label: 'Monthly Spend (₹)',
            data: monthly.length > 0 ? monthly.map(m => parseFloat(m.total)) : [0],
            backgroundColor: '#3b82f6',
            borderRadius: 4,
        }]
    };

    if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

    return (
        <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>← Back</button>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Cost Tracking & Budget</h1>
                    <p style={{ color: '#6b7280', margin: 0, marginTop: '4px' }}>Project ID: {projectId}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Budget</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>₹{totals.budgeted.toLocaleString()}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444' }}>●</span> Total Spent
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>₹{totals.spent.toLocaleString()}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#22c55e' }}>●</span> Remaining Budget
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: totals.remaining < 0 ? '#ef4444' : '#111827' }}>
                        ₹{Math.abs(totals.remaining).toLocaleString()}
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#3b82f6' }}>●</span> Budget Utilization
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{utilization}%</div>
                    {overBudgetAmt > 0 && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                            ⚠️ Budget exceeded by ₹{overBudgetAmt.toLocaleString()}
                        </div>
                    )}
                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', height: '6px', borderRadius: '3px', marginTop: '8px' }}>
                        <div style={{ width: `${utilization}%`, backgroundColor: utilization >= 100 ? '#ef4444' : '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1: Monthly Spend + Cost by Resource */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: '600' }}>Monthly Spending</h3>
                    <div style={{ height: '260px' }}>
                        {monthly.length > 0 ? <Bar data={monthBarData} options={barOpts} /> : <p style={{ color: '#9ca3af' }}>No monthly data yet.</p>}
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: '600' }}>Cost by Resource</h3>
                    <div style={{ height: '260px' }}>
                        {byResource.length > 0 ? <Pie data={makePieData(byResource)} options={pieOpts} /> : <p style={{ color: '#9ca3af' }}>No resource data yet.</p>}
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Cost by Member + Cost by Task */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: '600' }}>Cost by Team Member</h3>
                    <div style={{ height: '260px' }}>
                        {byMember.length > 0 ? <Bar data={makeBarData(byMember, 'Spent (₹)')} options={barOpts} /> : <p style={{ color: '#9ca3af' }}>No member data yet.</p>}
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#111827', fontWeight: '600' }}>Cost by Task</h3>
                    <div style={{ height: '260px' }}>
                        {byTask.length > 0 ? <Bar data={makeBarData(byTask, 'Spent (₹)')} options={barOpts} /> : <p style={{ color: '#9ca3af' }}>No task data yet.</p>}
                    </div>
                </div>
            </div>

            {/* Raw Cost Log Table */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: '600' }}>Cost Log</h3>
                </div>
                {rawCosts.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Date</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Team Member</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Task</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Resource</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Qty</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Cost/Unit</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rawCosts.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{row.usage_date ? new Date(row.usage_date).toLocaleDateString() : '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{row.member_name || '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{row.task_name || '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{row.resource_name || '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{row.quantity}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>₹{parseFloat(row.cost_per_unit).toLocaleString()}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>₹{parseFloat(row.total_cost).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ padding: '20px', color: '#9ca3af' }}>No cost entries logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default ManagerCostTracking;
