import React from 'react';

const TaskTable = ({ tasks }) => {
    const priorityColors = {
        High: 'bg-[#fee2e2] text-[#ef4444]',
        Medium: 'bg-[#fef9c3] text-[#ca8a04]',
        Low: 'bg-[#dbeafe] text-[#2563eb]'
    };

    const statusColors = {
        'Todo': 'bg-[#f1f5f9] text-[#475569]',
        'In Progress': 'bg-[#eff6ff] text-[#1d4ed8]',
        'Completed': 'bg-[#f0fdf4] text-[#15803d]'
    };

    const avatarColors = [
        'bg-[#7c3aed]', 'bg-[#3b82f6]', 'bg-[#2563eb]', 'bg-[#6366f1]', 'bg-[#8b5cf6]'
    ];

    if (!tasks || tasks.length === 0) {
        return (
            <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-[#f1f5f9]">
                <p className="text-[#94a3b8] font-bold">No tasks found for this project.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] shadow-[0_10px_50px_rgba(0,0,0,0.02)] border border-[#f1f5f9]">
            <div className="p-8 border-b border-[#f1f5f9] text-left">
                <h3 className="text-xl font-bold text-[#1e293b]">Task List</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#f8faff] text-[#94a3b8] text-[12px] font-semibold uppercase tracking-[0.1em] border-b border-[#f1f5f9]">
                            <th className="pl-10 pr-4 py-4">Task Name</th>
                            <th className="px-8 py-4">Assigned To</th>
                            <th className="px-6 py-4 text-center">Priority</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-8 py-4">Due Date</th>
                            <th className="px-8 py-4">Est. Hours</th>
                            <th className="px-8 py-4">Resources</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                        {tasks.map((task, idx) => (
                            <tr key={task._id} className="hover:bg-[#fcfdff] transition-all group cursor-default">
                                <td className="pl-10 pr-4 py-5 text-[15px] font-semibold text-[#1e293b] group-hover:text-[#2563EB] transition-colors">
                                    {task.title}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-[11px] font-bold shadow-sm border-2 border-white`}>
                                            {task.assignedTo?.name ? task.assignedTo.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                                        </div>
                                        <span className="text-[14px] font-medium text-[#475569]">
                                            {task.assignedTo?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${statusColors[task.status] || 'bg-gray-100'}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-[13px] font-medium text-[#64748b] whitespace-nowrap">
                                    {new Date(task.dueDate).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-8 py-5 text-[14px] font-semibold text-[#1e293b]">
                                    {task.estimatedHours}h
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex flex-wrap gap-2">
                                        {task.resources.map((res, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-[#f5f3ff] text-[#9333ea] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#f3e8ff]"
                                            >
                                                {res}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskTable;

