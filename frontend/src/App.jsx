import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOtp from "./components/VerifyOtp";

import ResetPassword from "./components/ResetPassword";

import Admin from "./components/Admin";
import AdminDashboard from "./components/AdminDashboard";
import Projects from "./components/Projects";
import UserManagement from "./components/UserManagement";

import ForgotPassword from "./components/ForgotPassword";
import ManagerDashboard from "./components/ManagerDashboard";
import ManagerLayout from "./components/ManagerLayout";
import ManagerProgress from "./components/ManagerProgress";
import ManagerProjects from "./components/ManagerProjects";
import MemberDashboard from "./components/MemberDashboard";
import MemberLayout from "./components/MemberLayout";
import MemberProgress from "./components/MemberProgress";
import MemberTasks from "./components/MemberTasks";
import ProjectForm from "./components/ProjectForm";
import ProjectTasks from "./components/ProjectTasks";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
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
        <Route path="register" element={<Register />} /> {/* /admin/register */}
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
        <Route path="/manager/projects/:projectId/tasks" element={<ProjectTasks />} />
        <Route path="/manager/progress" element={<ManagerProgress />} />
      </Route>

      {/* Member routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="member">
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/member/tasks" element={<MemberTasks />} />
        <Route path="/member/progress" element={<MemberProgress />} />
        <Route path="/member/notifications" element={<MemberDashboard />} />
      </Route>

      {/* Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
