import React, { useState } from "react";
import {
    LayoutDashboard,
    FolderKanban,
    Activity,
    BarChart3,
    Bell,
    LogOut
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/projectpulse-logo.png";

const sidebarItems = [
    { text: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },
    { text: "Projects", icon: FolderKanban, path: "/manager/projects" },
    { text: "Progress Monitoring", icon: Activity, path: "/manager" },
    { text: "Reports & Analytics", icon: BarChart3, path: "/manager/reports" },
    { text: "Notifications", icon: Bell, path: "/manager/notifications" },
];

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get user from localStorage
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = savedUser.name || 'Project Manager';
    const userEmail = savedUser.email || 'pm@projectpulse.com';
    const userInitial = userName.charAt(0).toUpperCase();

    // Determine active item from location or default to first
    const activeItem = location.pathname;

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <div className="flex h-screen bg-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-[#eaecf0] flex flex-col h-full z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-8 pb-6 flex items-center space-x-3 bg-white">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                    <div>
                        <h2 className="text-xl font-black text-[#334155] tracking-tighter leading-none">ProjectPulse</h2>
                        <p className="text-[10px] font-bold text-[#2563EB] tracking-widest uppercase mt-1">PROJECT MANAGER</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-10 space-y-2 bg-white">
                    {sidebarItems.map((item) => {
                        const isActive = activeItem === item.path || (item.path === '/manager' && activeItem === '/manager/');
                        return (
                            <button
                                key={item.text}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-semibold transition-all duration-200 ${isActive
                                    ? "bg-[#eff6ff] text-[#2563EB] shadow-sm"
                                    : "text-[#64748b] bg-white hover:bg-[#f8faff] hover:text-[#334155]"
                                    }`}
                            >
                                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#2563EB]" : "text-[#94a3b8]"}`} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[15px]">{item.text}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-8 mt-auto">
                    <div className="bg-[#f8faff] rounded-[24px] p-5 flex items-center space-x-4 border border-[#f1f5f9]">
                        <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-100">
                            {userInitial}
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                            <h4 className="text-[14px] font-black text-[#334155] truncate leading-tight">{userName}</h4>
                            <p className="text-[12px] text-[#94a3b8] truncate font-bold">{userEmail}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-white">
                {/* Navbar */}
                <header className="h-20 bg-white border-b border-[#eaecf0] flex items-center justify-end px-10 space-x-8 sticky top-0 z-10 shrink-0">
                    <button className="relative p-2.5 rounded-full text-[#334155] bg-[#f8faff] hover:bg-[#eff6ff] transition-colors group">
                        <Bell className="w-5.5 h-5.5 group-hover:shake" />
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-white"></span>
                    </button>

                    <div className="flex items-center space-x-4 px-5 py-2 bg-[#f8faff] rounded-full border border-[#f1f5f9] hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-inner">
                            {userInitial}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-[14px] font-black text-[#334155] leading-tight">{userName}</p>
                            <p className="text-[10px] text-[#94a3b8] uppercase font-black tracking-tighter">project manager</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-white border-2 border-[#fee2e2] text-[#ef4444] rounded-[18px] font-black hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] transition-all transform active:scale-95 group"
                    >
                        <LogOut className="w-4.5 h-4.5 text-[#ef4444] group-hover:text-white" strokeWidth={3} />
                        <span className="text-[14px]">Logout</span>
                    </button>
                </header>

                <div className="p-8 w-full max-w-[1400px] mx-auto flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
