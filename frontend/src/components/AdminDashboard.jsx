import { useNavigate } from "react-router-dom";


import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Card, CardContent, Button, Divider, LinearProgress
} from "@mui/material";
import { People, Folder, BarChart } from "@mui/icons-material";

export default function AdminDashboard() {
  // State variables
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);

  const navigate = useNavigate();


  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await axios.get("http://localhost:5001/users");
      const projectsRes = await axios.get("http://localhost:5001/projects");
      //const activitiesRes = await axios.get("http://localhost:5001/activities"); 

      setUsers(usersRes.data);
      setProjects(projectsRes.data);
      //setActivities(activitiesRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  // Derived stats
  // Derived stats
  const totalUsers = users.filter(u => u.status === "Active" || u.status === "Inactive").length;
  const activeUsers = users.filter(u => u.status === "Active").length;
  const admins = users.filter(u => u.role === "admin").length;
  const managers = users.filter(u => u.role === "manager").length;



  // Matches statuses from Projects.jsx
  const activeProjects = projects.filter(p => ['Planning', 'In Progress', 'On Track', 'At Risk', 'Delayed'].includes(p.status)).length;

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const completionRate = projects.length
    ? Math.round((projects.filter(p => p.status === "Completed").length / projects.length) * 100)
    : 0;

  const activeMembers = activeUsers; // For LinearProgress example

  return (
    <Box sx={{ p: 6, backgroundColor: "#fff" }}>

      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: "#334155", letterSpacing: "-0.04em" }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b", fontWeight: 600 }}>
          Welcome back! Here's an overview of your system.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", mb: 6 }}>
        <Card sx={{ flex: 1, minWidth: 200, p: 3, borderRadius: 4, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", border: "1px solid #f1f5f9" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 1.5, bgcolor: "#eff6ff", borderRadius: 3, width: "fit-content", mb: 3 }}>
              <People sx={{ color: "#2563EB", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ color: "#334155", fontWeight: 800, mb: 0.5 }}>{totalUsers}</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Users</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200, p: 3, borderRadius: 4, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", border: "1px solid #f1f5f9" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 1.5, bgcolor: "#ecfdf5", borderRadius: 3, width: "fit-content", mb: 3 }}>
              <Folder sx={{ color: "#16A34A", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ color: "#334155", fontWeight: 800, mb: 0.5 }}>{activeProjects}</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Projects</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200, p: 3, borderRadius: 4, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", border: "1px solid #f1f5f9" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 1.5, bgcolor: "#f5f3ff", borderRadius: 3, width: "fit-content", mb: 3 }}>
              <BarChart sx={{ color: "#8B5CF6", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ color: "#334155", fontWeight: 800, mb: 0.5 }}>₹{totalBudget.toLocaleString()}</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Budget</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200, p: 3, borderRadius: 4, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", border: "1px solid #f1f5f9" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 1.5, bgcolor: "#fffbeb", borderRadius: 3, width: "fit-content", mb: 3 }}>
              <BarChart sx={{ color: "#F59E0B", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ color: "#334155", fontWeight: 800, mb: 0.5 }}>{completionRate}%</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Completion Rate</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions & Recent Activity */}
      <Box sx={{ display: "flex", gap: 5, flexWrap: "wrap", mb: 6 }}>
        {/* Quick Actions */}
        <Card sx={{ flex: 1, minWidth: 300, p: 4, borderRadius: 4, border: "1px solid #eaecf0", boxShadow: "none" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 800, mb: 4 }}>Quick Actions</Typography>
          <Button
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: "#2563EB",
              color: "#fff",
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": { backgroundColor: "#1D4ED8" }
            }}
            onClick={() => navigate("/admin/users")}
          >
            Manage Users
          </Button>


          <Button
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: "#16A34A",
              color: "#fff",
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": { backgroundColor: "#15803D" }
            }}
            onClick={() => navigate("/admin/projects")}
          >
            View Projects
          </Button>
          <Button fullWidth sx={{ backgroundColor: "#8B5CF6", color: "#fff", py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: "none", fontSize: "1rem", "&:hover": { backgroundColor: "#7C3AED" } }}>Reports & Analytics</Button>
        </Card>

        {/* Recent Activity */}
        <Card sx={{ flex: 1, minWidth: 400, p: 4, borderRadius: 4, border: "1px solid #eaecf0", boxShadow: "none" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 800, mb: 4 }}>Recent Activity</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {activities.length === 0 && <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>No recent activity to show</Typography>}
            {activities.map((act, index) => (
              <Box key={index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                  • {act.description}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                  {act.timeAgo}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      {/* Active Resources */}
      <Box sx={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 300, p: 4, borderRadius: 4, border: "1px solid #eaecf0", boxShadow: "none" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 800, mb: 4 }}>System Resources</Typography>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>Team Utilization</Typography>
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>{Math.round(totalUsers ? (activeMembers / totalUsers) * 100 : 0)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={totalUsers ? (activeMembers / totalUsers) * 100 : 0} sx={{ height: 10, borderRadius: 5, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: "#2563EB" } }} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>Project Allocation</Typography>
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>{Math.round(projects.length ? (activeProjects / projects.length) * 100 : 0)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={projects.length ? (activeProjects / projects.length) * 100 : 0}
              sx={{ height: 10, borderRadius: 5, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { backgroundColor: "#8B5CF6" } }}
            />
          </Box>
        </Card>
      </Box>

    </Box>
  );
}
