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
    <Box sx={{ p: 4, backgroundColor: "#F9FAFB" }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: "#000" }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "#000" }}>
          Welcome back! Here's an overview of your system.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
          <CardContent>
            <People sx={{ color: "#2563EB" }} />
            <Typography variant="h6" sx={{ color: "#000", mt: 1 }}>{totalUsers}</Typography>
            <Typography variant="body2" sx={{ color: "#000" }}>Total Users</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
          <CardContent>
            <Folder sx={{ color: "#16A34A" }} />
            <Typography variant="h6" sx={{ color: "#000", mt: 1 }}>{activeProjects}</Typography>
            <Typography variant="body2" sx={{ color: "#000" }}>Active Projects</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
          <CardContent>
            <BarChart sx={{ color: "#8B5CF6" }} />
            <Typography variant="h6" sx={{ color: "#000", mt: 1 }}>₹{totalBudget.toLocaleString()}</Typography>
            <Typography variant="body2" sx={{ color: "#000" }}>Total Budget</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
          <CardContent>
            <BarChart sx={{ color: "#F59E0B" }} />
            <Typography variant="h6" sx={{ color: "#000", mt: 1 }}>{completionRate}%</Typography>
            <Typography variant="body2" sx={{ color: "#000" }}>Completion Rate</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions & Recent Activity */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}>
        {/* Quick Actions */}
        <Card sx={{ flex: 1, minWidth: 250, p: 2 }}>
          <Typography variant="h6" sx={{ color: "#000", mb: 2 }}>Quick Actions</Typography>
          <Button
            fullWidth
            sx={{
              mb: 1,
              backgroundColor: "#2563EB",
              color: "#fff",
              "&:hover": { backgroundColor: "#1D4ED8" }
            }}
            onClick={() => navigate("/admin/users")} // <-- correct nested route
          >
            Manage Users
          </Button>


          <Button
            fullWidth
            sx={{ mb: 1, backgroundColor: "#16A34A", color: "#fff", "&:hover": { backgroundColor: "#15803D" } }}
            onClick={() => navigate("/admin/projects")}
          >
            View Projects
          </Button>
          <Button fullWidth sx={{ mb: 1, backgroundColor: "#8B5CF6", color: "#fff", "&:hover": { backgroundColor: "#7C3AED" } }}>Analytics</Button>
        </Card>

        {/* Recent Activity */}
        <Card sx={{ flex: 1, minWidth: 300, p: 2 }}>
          <Typography variant="h6" sx={{ color: "#000", mb: 2 }}>Recent Activity</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {activities.length === 0 && <Typography>No recent activity</Typography>}
            {activities.map((act, index) => (
              <Typography key={index} variant="body2" sx={{ color: "#000" }}>
                • {act.description}{" "}
                <Typography component="span" sx={{ float: "right", color: "gray" }}>
                  {act.timeAgo}
                </Typography>
              </Typography>
            ))}
          </Box>
        </Card>
      </Box>

      {/* Active Resources */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 300, p: 2 }}>
          <Typography variant="h6" sx={{ color: "#000", mb: 2 }}>Resource Overview</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {users.filter(u => u.role === 'member').map(member => {
              // Find projects this member is assigned to (mocking for overview if tasks not joined)
              // In a real scenario, we'd fetch assignments. For now, we'll list the member.
              return (
                <Box key={member.id} sx={{ p: 1.5, border: '1px solid #E5E7EB', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{member.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'gray' }}>
                    Specialization: {member.specialization || 'Generalist'} | Status: {member.status}
                  </Typography>
                </Box>
              );
            })}
            {users.filter(u => u.role === 'member').length === 0 && (
              <Typography variant="body2" color="gray">No members registered.</Typography>
            )}
          </Box>
        </Card>
      </Box>

    </Box>
  );
}
