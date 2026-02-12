import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOtp from "./components/VerifyOtp";

import ResetPassword from "./components/ResetPassword";

import Admin from "./components/Admin";
import AdminDashboard from "./components/AdminDashboard";
import UserManagement from "./components/UserManagement";

import Manager from "./components/Manager";
import Member from "./components/Member";
import ProtectedRoute from "./components/Protectedroute";
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
            <Admin /> {/* Only one sidebar here */}
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} /> {/* Default /admin */}
        <Route path="users" element={<UserManagement />} /> {/* /admin/users */}
        
      </Route>

      {/* Manager routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <Manager />
          </ProtectedRoute>
        }
      />

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
