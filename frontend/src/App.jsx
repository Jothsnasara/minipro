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

import Manager from "./components/Manager";
import ManagerDashboard from "./components/ManagerDashboard";
import ManagerProjects from "./components/ManagerProjects";
import ProjectForm from "./components/ProjectForm";
import ManagerLayout from "./components/ManagerLayout";
import Member from "./components/Member";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/ForgotPassword";

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
            <Admin /> {/* Only one sidebar here */}
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} /> {/* Default /admin */}
        <Route path="users" element={<UserManagement />} /> {/* /admin/users */}
        <Route path="projects" element={<Projects />} /> {/* /admin/projects */}

      </Route>

      {/* Manager routes */}
      {/* Manager routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/manager" element={<ManagerDashboard />} /> {/* Legacy/Fallback */}
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/projects" element={<ManagerProjects />} />
        <Route path="/manager/create-project" element={<ProjectForm />} />
        <Route path="/manager/activate-project" element={<ProjectForm />} />
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
