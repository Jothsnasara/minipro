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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#fff" }}>

      {/* Sidebar */}
      <Box sx={{
        width: 256,
        bgcolor: "#fff",
        borderRight: "1px solid #eaecf0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0
      }}>
        <Box>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 4 }}>
            <Box component="img" src={logo} alt="ProjectPulse Logo" sx={{ width: 32, height: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#334155", letterSpacing: "-0.02em" }}>ProjectPulse</Typography>
          </Box>
          <Divider sx={{ mx: 2, opacity: 0.6 }} />

          {/* Sidebar Items */}
          <List sx={{ px: 2, mt: 2 }}>
            {sidebarItems.map((item, index) => (
              <ListItem
                button
                key={index}
                selected={activeItem === item.path}
                onClick={() => handleNavigate(item)}
                sx={{
                  borderRadius: 3,
                  mb: 1,
                  px: 2,
                  py: 1.5,
                  "&.Mui-selected": {
                    bgcolor: "#eff6ff",
                    "& .MuiListItemIcon-root": { color: "#2563EB" },
                    "& .MuiListItemText-primary": { color: "#2563EB", fontWeight: 700 }
                  },
                  "&:hover": {
                    bgcolor: "#f8faff",
                  },
                  transition: "all 0.2s ease"
                }}
              >
                <ListItemIcon sx={{ color: "#94a3b8", minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: { color: "#64748b", fontSize: "0.95rem", fontWeight: 600 }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Logout Button */}
        <Box sx={{ p: 4 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{
              bgcolor: "#fff",
              color: "#ef4444",
              border: "2px solid #fee2e2",
              boxShadow: "none",
              borderRadius: 4,
              fontWeight: 800,
              py: 1.5,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#ef4444",
                color: "#fff",
                borderColor: "#ef4444"
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* Topbar */}
        <Box sx={{
          height: 80,
          px: 6,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          bgcolor: "#fff",
          borderBottom: "1px solid #eaecf0",
          position: "sticky",
          top: 0,
          zindex: 10
        }}>
          <Typography sx={{ mr: 4, color: "#64748b", fontWeight: 600, fontSize: "0.9rem" }}>admin@projecttrack.com</Typography>
          <Notifications sx={{ color: "#334155", cursor: "pointer", fontSize: 28 }} />
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 6, flex: 1, backgroundColor: "#fff" }}>
          <Outlet /> {/* Nested routes render here */}
        </Box>
      </Box>
    </Box>
  );
};

export default Admin;
