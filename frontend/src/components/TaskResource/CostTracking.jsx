import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as PieTooltip
} from 'recharts';

/* ── Budget summary data ─────────────────────────────── */
const summaryCards = [
    {
        label: 'Total Budget',
        value: '₹50K',
        icon: DollarSign,
        bg: 'bg-[#eff6ff]',
        iconColor: 'text-[#2563EB]',
        sub: null,
    },
    {
        label: 'Total Spent',
        value: '₹38K',
        icon: TrendingUp,
        bg: 'bg-[#fff7ed]',
        iconColor: 'text-[#f97316]',
        sub: '75% of budget',
    },
    {
        label: 'Remaining',
        value: '₹13K',
        icon: TrendingDown,
        bg: 'bg-[#f0fdf4]',
        iconColor: 'text-[#22c55e]',
        sub: '25% available',
    },
    {
        label: 'Projected Total',
        value: '₹50K',
        icon: Activity,
        bg: 'bg-[#f5f3ff]',
        iconColor: 'text-[#9333ea]',
        sub: 'At current rate',
    },
];

/* ── Bar chart data ──────────────────────────────────── */
const barData = [
    { month: 'Sep', Planned: 5000, Actual: 4200 },
    { month: 'Oct', Planned: 8200, Actual: 8800 },
    { month: 'Nov', Planned: 9000, Actual: 9200 },
    { month: 'Dec', Planned: 12000, Actual: 13500 },
    { month: 'Jan', Planned: 15800, Actual: 15200 },
];

/* ── Pie chart data ──────────────────────────────────── */
const pieData = [
    { name: 'Development', value: 48, color: '#4f6ef7' },
    { name: 'Design', value: 23, color: '#8b5cf6' },
    { name: 'Testing', value: 16, color: '#22c55e' },
    { name: 'Infrastructure', value: 13, color: '#f97316' },
];

/* ── Breakdown table data ────────────────────────────── */
const breakdown = [
    { category: 'Development', budgeted: 20000, spent: 18000, remaining: 2000, variance: 2000, pct: 90, barColor: 'bg-[#f97316]' },
    { category: 'Design', budgeted: 10000, spent: 8500, remaining: 1500, variance: 1500, pct: 85, barColor: 'bg-[#f97316]' },
    { category: 'Testing', budgeted: 8000, spent: 6000, remaining: 2000, variance: 2000, pct: 75, barColor: 'bg-[#22c55e]' },
    { category: 'Infrastructure', budgeted: 7000, spent: 5000, remaining: 2000, variance: 2000, pct: 71, barColor: 'bg-[#22c55e]' },
    { category: 'Miscellaneous', budgeted: 5000, spent: 0, remaining: 5000, variance: 5000, pct: 0, barColor: 'bg-[#e2e8f0]' },
];
const totalRow = {
    category: 'Total',
    budgeted: 50000,
    spent: 37500,
    remaining: 12500,
    variance: -12500,
    pct: 75,
    barColor: null,
};

const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

/* ── Custom Pie label ─────────────────────────────────── */
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const r = outerRadius + 32;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="13" fontWeight="600">
            {`${name}: ${value}%`}
        </text>
    );
};

/* ════════════════════════════════════════════════════════ */
const CostTracking = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Try to get project info passed via state or params
    const project = location.state?.project || {};
    const projectName = project.name || project.project_name || 'Website Redesign';

    // Try to determine back path
    const fromPath = location.state?.from || -1;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1300px] mx-auto px-8 py-8">

                {/* ── Top bar ──────────────────────────────── */}
                <button
                    onClick={() => navigate(typeof fromPath === 'string' ? fromPath : -1)}
                    className="flex items-center text-[#2563EB] text-[14px] font-medium hover:underline mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </button>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">Cost Tracking & Budget</h1>
                        <p className="text-[14px] text-[#64748b] mt-1">
                            Project: <span className="font-semibold text-[#334155]">{projectName}</span>
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-5 py-2.5 border border-[#2563EB] text-[#2563EB] rounded-[10px] text-[14px] font-semibold hover:bg-[#eff6ff] transition"
                        >
                            View Tasks
                        </button>
                        <button
                            onClick={() => navigate('/manager/dashboard')}
                            className="px-5 py-2.5 bg-[#2563EB] text-white rounded-[10px] text-[14px] font-semibold hover:bg-blue-700 transition shadow-md"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* ── Summary cards ─────────────────────────── */}
                <div className="grid grid-cols-4 gap-5 mb-8">
                    {summaryCards.map((c) => (
                        <div key={c.label} className="bg-white border border-[#f1f5f9] rounded-[20px] p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className={`p-2.5 rounded-xl ${c.bg}`}>
                                    <c.icon className={`w-5 h-5 ${c.iconColor}`} strokeWidth={2} />
                                </div>
                                <span className="text-[13px] font-medium text-[#64748b]">{c.label}</span>
                            </div>
                            <p className="text-3xl font-bold text-[#1e293b]">{c.value}</p>
                            {c.sub && <p className="text-[12px] text-[#94a3b8] mt-1">{c.sub}</p>}
                        </div>
                    ))}
                </div>

                {/* ── Budget Usage Progress ──────────────────── */}
                <div className="bg-white border border-[#f1f5f9] rounded-[20px] p-7 shadow-sm mb-8">
                    <h2 className="text-[17px] font-bold text-[#1e293b] mb-5">Budget Usage Progress</h2>
                    <div className="flex items-center justify-between text-[13px] text-[#64748b] mb-2">
                        <span className="font-medium">Budget Utilization</span>
                        <span className="font-semibold text-[#1e293b]">₹37,500 / ₹50,000</span>
                    </div>
                    <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-[#22c55e] rounded-full" style={{ width: '75%' }} />
                    </div>
                    <p className="text-[12px] text-[#64748b]">75.0% of budget used</p>
                </div>

                {/* ── Charts row ────────────────────────────── */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* Bar chart */}
                    <div className="bg-white border border-[#f1f5f9] rounded-[20px] p-7 shadow-sm">
                        <h2 className="text-[17px] font-bold text-[#1e293b] mb-6">Planned vs Actual Cost</h2>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} barCategoryGap="30%" barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '13px' }}
                                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']}
                                />
                                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
                                <Bar dataKey="Planned" fill="#4f6ef7" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Actual" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie chart */}
                    <div className="bg-white border border-[#f1f5f9] rounded-[20px] p-7 shadow-sm">
                        <h2 className="text-[17px] font-bold text-[#1e293b] mb-6">Cost Distribution by Category</h2>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    labelLine={true}
                                    label={renderCustomLabel}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <PieTooltip
                                    formatter={(v, name) => [`${v}%`, name]}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '13px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Detailed Cost Breakdown ────────────────── */}
                <div className="bg-white border border-[#f1f5f9] rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-7 border-b border-[#f1f5f9]">
                        <h2 className="text-[17px] font-bold text-[#1e293b]">Detailed Cost Breakdown</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white text-[#94a3b8] text-[12px] font-semibold uppercase tracking-[0.08em] border-b border-[#f1f5f9]">
                                    <th className="pl-7 pr-4 py-4">Category</th>
                                    <th className="px-4 py-4">Budgeted</th>
                                    <th className="px-4 py-4">Spent</th>
                                    <th className="px-4 py-4">Remaining</th>
                                    <th className="px-4 py-4">Variance</th>
                                    <th className="px-4 py-4 text-right pr-7">% Used</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f8faff]">
                                {breakdown.map((row) => (
                                    <tr key={row.category} className="hover:bg-[#fafbff] transition-colors">
                                        <td className="pl-7 pr-4 py-5 text-[14px] font-semibold text-[#1e293b]">{row.category}</td>
                                        <td className="px-4 py-5 text-[14px] text-[#64748b]">{fmt(row.budgeted)}</td>
                                        <td className="px-4 py-5 text-[14px] text-[#64748b]">{fmt(row.spent)}</td>
                                        <td className="px-4 py-5 text-[14px] text-[#64748b]">{fmt(row.remaining)}</td>
                                        <td className="px-4 py-5 text-[14px] font-semibold text-[#22c55e]">{fmt(row.variance)}</td>
                                        <td className="px-4 py-5 pr-7">
                                            <div className="flex items-center justify-end space-x-3">
                                                <div className="w-20 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${row.barColor}`} style={{ width: `${row.pct}%` }} />
                                                </div>
                                                <span className="text-[13px] font-semibold text-[#1e293b] w-8 text-right">{row.pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Total row */}
                                <tr className="bg-[#f8faff] border-t-2 border-[#e2e8f0]">
                                    <td className="pl-7 pr-4 py-5 text-[14px] font-bold text-[#1e293b]">Total</td>
                                    <td className="px-4 py-5 text-[14px] font-semibold text-[#1e293b]">{fmt(totalRow.budgeted)}</td>
                                    <td className="px-4 py-5 text-[14px] font-semibold text-[#1e293b]">{fmt(totalRow.spent)}</td>
                                    <td className="px-4 py-5 text-[14px] font-semibold text-[#1e293b]">{fmt(totalRow.remaining)}</td>
                                    <td className="px-4 py-5 text-[14px] font-bold text-[#ef4444]">-{fmt(totalRow.remaining)}</td>
                                    <td className="px-4 py-5 pr-7 text-right">
                                        <span className="text-[13px] font-bold text-[#1e293b]">{totalRow.pct}%</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CostTracking;
