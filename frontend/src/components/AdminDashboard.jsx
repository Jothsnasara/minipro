import api from "../services/api";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import {
  Box, Typography, Card, CardContent, Button, Divider, LinearProgress
} from "@mui/material";
import { People, Folder, BarChart } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await api.get("/users");
      const projectsRes = await api.get("/projects");
      const tasksRes = await api.get("/projects/tasks/all");
      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const totalUsers = users.filter(u => u.status === "Active" || u.status === "Inactive").length;
  const activeProjects = projects.filter(p => ['Planning', 'In Progress', 'On Track', 'At Risk', 'Delayed'].includes(p.status)).length;
  const totalBudget = projects
    .filter(p => p.status !== 'Planning' && p.status !== 'Pending')
    .reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const completionRate = projects.length
    ? Math.round((projects.filter(p => p.status === "Completed").length / projects.length) * 100)
    : 0;

  // Derive Activities
  const derivedActivities = [
    ...users.map(u => ({
      description: `New user "${u.name}" joined as ${u.role}`,
      date: u.join_date ? new Date(u.join_date) : new Date(0),
      timeAgo: u.join_date ? dayjs(u.join_date).fromNow() : 'Recently'
    })),
    ...users.filter(u => u.resign_date).map(u => ({
      description: `User "${u.name}" has resigned`,
      date: new Date(u.resign_date),
      timeAgo: dayjs(u.resign_date).fromNow()
    })),
    ...projects.map(p => {
      const pDate = p.created_at || p.start_date;
      return {
        description: `Project "${p.project_name}" allocated`,
        date: pDate ? new Date(pDate) : new Date(0),
        timeAgo: pDate ? dayjs(pDate).fromNow() : 'Previously'
      }
    }),
    ...tasks.map(t => ({
      description: `Task "${t.task_name}" assigned to ${t.assignee_name || '...'}`,
      date: new Date(), // Display as recent
      timeAgo: 'Recently'
    }))
  ]
    .filter(a => a.date.getTime() > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const displayActivities = derivedActivities.length > 0 ? derivedActivities : activities;

  return (
    <Box sx={{ p: 4, backgroundColor: "#F9FAFB" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: "#000" }}>Admin Dashboard</Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>Welcome back! Here's an overview of your system.</Typography>
      </Box>

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
            <Typography variant="body2" sx={{ color: "#000" }}>Total Budget Allocated</Typography>
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

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: 250, p: 2 }}>
          <Typography variant="h6" sx={{ color: "#000", mb: 2 }}>Quick Actions</Typography>
          <Button fullWidth variant="contained" sx={{ mb: 1, bgcolor: "#2563EB" }} onClick={() => navigate("/admin/users")}>Manage Users</Button>
          <Button fullWidth variant="contained" sx={{ mb: 1, bgcolor: "#16A34A" }} onClick={() => navigate("/admin/projects")}>View Projects</Button>
        </Card>

        <Card sx={{ flex: 1, minWidth: 300, p: 2 }}>
          <Typography variant="h6" sx={{ color: "#000", mb: 2 }}>Recent Activity</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {displayActivities.length === 0 && <Typography variant="body2">No recent activity</Typography>}
            {displayActivities.map((act, index) => (
              <Typography key={index} variant="body2" sx={{ borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                • {act.description} <br />
                <Typography component="span" sx={{ fontSize: '11px', color: "gray" }}>{act.timeAgo}</Typography>
              </Typography>
            ))}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
