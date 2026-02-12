import React, { useState } from "react";
import { Logout } from "@mui/icons-material";
import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { Dashboard, People, Folder, BarChart, Notifications } from "@mui/icons-material";
import logo from "../assets/projectpulse-logo.png";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const sidebarItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/admin" },
  { text: "User Management", icon: <People />, path: "/admin/users" },
  { text: "Projects", icon: <Folder />, path: "/admin/projects" },
  { text: "Reports & Analytics", icon: <BarChart />, path: "/admin/reports" },
  { text: "Notifications", icon: <Notifications />, path: "/admin/notifications" },
];

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleNavigate = (item) => {
    setActiveItem(item.path);
    navigate(item.path);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <Box sx={{ width: 250, bgcolor: "#fdf9f9", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 3 }}>
            <Box component="img" src={logo} alt="ProjectPulse Logo" sx={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#000" }}>ProjectPulse</Typography>
          </Box>
          <Divider />

          {/* Sidebar Items */}
          <List>
            {sidebarItems.map((item, index) => (
              <ListItem 
                button 
                key={index} 
                selected={activeItem === item.path}
                onClick={() => handleNavigate(item)}
                sx={{ 
                  "&.Mui-selected": { 
                    bgcolor: "#e8ebf3", 
                    borderRadius: 2,
                    "& .MuiListItemIcon-root": { color: "#2563EB" },
                    "& .MuiListItemText-primary": { color: "#2563EB" }
                  },
                  "&:hover": { 
                    bgcolor: "#cdcfd7", 
                    borderRadius: 2, 
                    transition: "all 0.3s ease-in-out" 
                  },
                  mb: 0.5,
                  transition: "all 0.3s ease-in-out"
                }}
              >
                <ListItemIcon sx={{ color: "#2563EB" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ color: "#000" }} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Logout Button */}
        <Box sx={{ p: 3 }}>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<Logout />} 
            fullWidth 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", bgcolor: "#fff", borderBottom: "1px solid #E5E7EB" }}>
          <Typography sx={{ mr: 3 }}>admin@projecttrack.com</Typography>
          <Notifications sx={{ mr: 2, cursor: "pointer" }} />
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 4, flex: 1, backgroundColor: "#F9FAFB" }}>
          <Outlet /> {/* Nested routes render here */}
        </Box>
      </Box>
    </Box>
  );
};

export default Admin;
