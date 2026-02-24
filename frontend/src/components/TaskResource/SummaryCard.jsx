import React from 'react';

const SummaryCard = ({ title, value, icon: Icon, type }) => {
    const colorMap = {
        total: { bg: 'bg-[#eff6ff]', icon: 'text-[#2563EB]' },
        completed: { bg: 'bg-[#f0fdf4]', icon: 'text-[#22c55e]' },
        members: { bg: 'bg-[#fff7ed]', icon: 'text-[#f97316]' },
        hours: { bg: 'bg-[#f5f3ff]', icon: 'text-[#9333ea]' }
    };

    const { bg, icon } = colorMap[type] || colorMap.total;

    return (
        <div className="bg-white p-8 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#f1f5f9] flex items-center space-x-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div className={`p-5 rounded-3xl ${bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-8 h-8 ${icon}`} strokeWidth={3} />
            </div>
            <div className="text-left">
                <p className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-[0.1em] mb-1">{title}</p>
                <p className="text-3xl font-bold text-[#1e293b] tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default SummaryCard;

