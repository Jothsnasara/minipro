import React from 'react';
import ProgressBar from './ProgressBar';

const ResourceUsage = ({ usage }) => {
    return (
        <div className="bg-white p-12 rounded-[50px] shadow-[0_15px_60px_rgba(0,0,0,0.02)] border border-[#f1f5f9] h-full transition-all hover:shadow-xl text-left">
            <h3 className="text-xl font-bold text-[#1e293b] mb-8 tracking-tight">Resource Usage</h3>
            <div className="space-y-10">
                {usage.map((resource, i) => (
                    <div key={i} className="space-y-4 group">
                        <div className="flex justify-between items-end">
                            <span className="font-semibold text-[#334155] text-[14px] group-hover:text-[#9333ea] transition-colors">{resource.name}</span>
                            <span className="font-medium text-[#94a3b8] text-[12px] uppercase tracking-wide">{resource.taskCount} tasks</span>
                        </div>
                        <ProgressBar
                            progress={(resource.taskCount / 5) * 100}
                            color="bg-[#a855f7]"
                            height="h-3.5"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourceUsage;

