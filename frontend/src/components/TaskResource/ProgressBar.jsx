import React from 'react';

const ProgressBar = ({ progress, color = 'bg-[#22c55e]', height = 'h-2.5' }) => {
    return (
        <div className={`w-full bg-[#f0f2f5] rounded-full ${height} overflow-hidden`}>
            <div
                className={`${height} ${color} transition-all duration-700 ease-out rounded-full shadow-sm`}
                style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
