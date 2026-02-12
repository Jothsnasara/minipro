



import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, Table,
  TableHead, TableBody, TableRow, TableCell,
  Avatar, Chip
} from "@mui/material";
import {
  Edit, Delete, Group, CheckCircle,
  AdminPanelSettings, People
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const roleColors = {
  admin: "#EDE9FE",
  manager: "#DDEAFE",
  member: "#D1FAE5",
};

const statusColors = {
  Active: "#D1FAE5",
  Inactive: "#FEE2E2",
};


export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
    const [resignDate, setResignDate] = useState(null);
const [openResignId, setOpenResignId] = useState(null); // which user we're resigning

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5000/users");
    setUsers(res.data);
  };


 const handleResign = async (id) => {
  const resignDateInput = window.prompt(
    "Enter resign date (YYYY-MM-DD):",
    new Date().toISOString().slice(0, 10)
  );
  if (!resignDateInput) return;

  try {
    await axios.put(`http://localhost:5000/users/${id}/resign`, {
      resign_date: resignDateInput
    });
    fetchUsers(); // refresh table
  } catch (err) {
    alert(err.response?.data?.message || "Failed to update resign date");
  }
};





  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
    
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: "#000" }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system users and their roles
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<People />}
          sx={{
            backgroundColor: "#2563EB",
            "&:hover": { backgroundColor: "#1D4ED8" },
          }}
          onClick={() => navigate("/register")}
        >
          Add New User
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <StatCard
  icon={<Group sx={{ color: "#2563EB" }} />}
  label="Total Users"
  value={users.filter(u => u.status === "Active" || u.status === "Inactive").length} // <-- only active/inactive
  bg="#DDEAFE"
/>

       <StatCard
  icon={<CheckCircle sx={{ color: "#16A34A" }} />}
  label="Active Users"
  value={users.filter(u => u.status === "Active").length}
  bg="#D1FAE5"
/>

        <StatCard
          icon={<AdminPanelSettings sx={{ color: "#8B5CF6" }} />}
          label="Admins"
          value={users.filter(u => u.role === "admin").length}
          bg="#EDE9FE"
        />
        <StatCard
          icon={<People sx={{ color: "#F59E0B" }} />}
          label="Project Managers"
          value={users.filter(u => u.role === "manager").length}
          bg="#FFEDD5"
        />
      </Box>

      <TextField
        fullWidth
        placeholder="🔎Search users by name or email..."
        size="small"
        sx={{ mb: 2, bgcolor: "#fff" }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table sx={{ bgcolor: "#fff", borderRadius: 2 }}>
  <TableHead>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>Email</TableCell>
      <TableCell>Role</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Join Date</TableCell>
      <TableCell>Resign Date</TableCell> 
      <TableCell align="center">Actions</TableCell>
    </TableRow>
  </TableHead>

  <TableBody>
  {filteredUsers.map((user) => (
    <TableRow key={user.id}>
      <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar sx={{ bgcolor: "#2563EB", width: 32, height: 32, fontSize: 14 }}>
          {user.name[0]}
        </Avatar>
        <Typography sx={{ whiteSpace: "nowrap" }}>{user.name}</Typography>
      </TableCell>

      <TableCell>{user.email}</TableCell>

      <TableCell>
        <Chip label={user.role} size="small" sx={{ bgcolor: roleColors[user.role] }} />
      </TableCell>

      <TableCell>
        <Chip label={user.status} size="small" sx={{ bgcolor: statusColors[user.status] }} />
      </TableCell>

      <TableCell>{new Date(user.join_date).toLocaleDateString()}</TableCell>

      <TableCell>
        {user.resign_date ? new Date(user.resign_date).toLocaleDateString() : "-"}
      </TableCell>

      {/* Actions Column */}
      <TableCell align="center">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
          {/* Edit button */}
          <Button
            size="small"
            onClick={() => navigate("/register", { state: { user } })}
            disabled={!!user.resign_date}
          >
            <Edit sx={{ color: user.resign_date ? "#A1A1A1" : "#2563EB" }} />
          </Button>

          {/* Resign / DatePicker */}
          {openResignId === user.id ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={resignDate}
                onChange={(newValue) => setResignDate(newValue)}
                onAccept={async (date) => {
                  try {
                    await axios.put(`http://localhost:5000/users/${user.id}/resign`, {
                      resign_date: dayjs(date).format("YYYY-MM-DD"),
                    });
                    setOpenResignId(null);
                    fetchUsers();
                  } catch (err) {
                    alert(err.response?.data?.message || "Failed to update resign date");
                  }
                }}
                onClose={() => setOpenResignId(null)}
                disablePast
                renderInput={(params) => <TextField {...params} size="small" sx={{ width: 130 }} />}
              />
            </LocalizationProvider>
          ) : (
            <Button
              size="small"
              onClick={() => setOpenResignId(user.id)}
              disabled={!!user.resign_date}
            >
              <Delete sx={{ color: user.resign_date ? "#A1A1A1" : "#EF4444" }} />
            </Button>
          )}
        </Box>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

</Table>

    </Box>
  );
}


const StatCard = ({ icon, label, value, bg }) => (
  <Box sx={{ flex: 1, minWidth: 150, p: 2, bgcolor: bg, borderRadius: 2, display: "flex", gap: 1 }}>
    {icon}
    <Box>
      <Typography variant="caption" sx={{ color: "#000" }}>{label}</Typography>
      <Typography variant="h6" sx={{ color: "#000" }}>{value}</Typography>
    </Box>
  </Box>
);


