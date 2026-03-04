import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return <Navigate to="/" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;