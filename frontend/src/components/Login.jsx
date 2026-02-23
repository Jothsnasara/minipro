import logo from "../assets/projectpulse-logo.png";


import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5001/login", {
        username,
        password
      });

      const user = res.data.user;

      // Save logged-in user
      localStorage.setItem("user", JSON.stringify(user));

      // 🔒 INACTIVE USER HANDLING
      if (user.status === "Inactive") {
        navigate("/inactive-user");
        return;
      }

      // 🔐 Role-based redirect (ACTIVE users only)
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "manager") navigate("/manager-dashboard");
      else navigate("/member");

    } catch (err) {
      const msg = err.response?.data?.message;

      if (msg === "Please verify your account with OTP first") {
        navigate("/verify-otp", { state: { username } });
        return;
      }

      setError(msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="ProjectPulse logo" />
        </div>


        <h2 className="auth-title">ProjectPulse</h2>
        <p className="auth-subtitle">Sign in to continue</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label className="auth-label">Username</label>
          <input
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>

        <button
          className="auth-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>


        <p className="auth-footer">
          <Link className="auth-link" to="/forgot-password">
            Forgot password?
          </Link>
        </p>




      </div>
    </div>
  );
}

export default Login;
