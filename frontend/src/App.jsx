import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOtp from "./components/VerifyOtp";
import ResetPassword from "./components/ResetPassword";
import Admin from "./components/Admin";
import AdminDashboard from "./components/AdminDashboard";
import UserManagement from "./components/UserManagement";
import Projects from "./components/Projects";
import ManagerDashboard from "./components/TaskResource/ManagerDashboard";
import TaskResourceAllocation from "./components/TaskResource/TaskResourceAllocation";
import CostTracking from "./components/TaskResource/CostTracking";
import Member from "./components/Member";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/Forgotpassword";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin routes with nested pages */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <Admin />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId/tasks" element={<TaskResourceAllocation />} />
        <Route path="projects/:projectId/tasks/cost-tracking" element={<CostTracking />} />
      </Route>

      {/* Manager routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<TaskResourceAllocation />} />
        <Route path="dashboard" element={<TaskResourceAllocation />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId/tasks" element={<TaskResourceAllocation />} />
        <Route path="projects/:projectId/tasks/cost-tracking" element={<CostTracking />} />
        <Route path="tasks" element={<TaskResourceAllocation />} />
        <Route path="reports" element={<TaskResourceAllocation />} />
        <Route path="notifications" element={<TaskResourceAllocation />} />
      </Route>

      {/* Member routes */}
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRole="member">
            <Member />
          </ProtectedRoute>
        }
      />

      {/* Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
