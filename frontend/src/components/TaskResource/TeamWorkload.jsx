import React from 'react';
import ProgressBar from './ProgressBar';

const TeamWorkload = ({ workload }) => {
    const avatarColors = [
        'bg-[#7c3aed]', 'bg-[#3b82f6]', 'bg-[#2563eb]', 'bg-[#6366f1]', 'bg-[#8b5cf6]'
    ];

    return (
        <div className="bg-white p-10 rounded-[50px] shadow-[0_15px_60px_rgba(0,0,0,0.02)] border border-[#f1f5f9] h-full text-left">
            <h3 className="text-xl font-bold text-[#1e293b] mb-8 tracking-tight">Team Workload</h3>
            <div className="space-y-12">
                {workload.map((member, i) => (
                    <div key={i} className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-5">
                                <div className={`w-14 h-14 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-black text-[16px] shadow-lg border-2 border-white`}>
                                    {member.avatar}
                                </div>
                                <span className="text-[15px] font-semibold text-[#334155]">{member.name}</span>
                            </div>
                            <span className="text-[12px] font-medium text-[#94a3b8] uppercase tracking-wide">{member.activeTasks} active tasks</span>
                        </div>
                        <div className="pl-20">
                            <ProgressBar
                                progress={(member.allocatedHours / 100) * 100}
                                color="bg-[#22c55e]"
                                height="h-3.5"
                            />
                            <p className="text-[12px] font-medium text-[#94a3b8] mt-2 uppercase tracking-wide">
                                {member.allocatedHours}h allocated
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamWorkload;

