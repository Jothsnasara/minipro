/*import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const username = state?.username;

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async () => {
    setError("");
    setSuccess("");

    if (!otp || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/reset-password", {
        username,
        otp,
        newPassword: password
      });

      setSuccess(res.data.message);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <input
          className="auth-input"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" onClick={handleReset}>
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;*/


import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError("");
    setMessage("");

    if (!otp || !newPassword) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5001/reset-password",
        { email, otp, newPassword }
      );

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <p style={{ textAlign: "center" }}>Invalid request</p>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <input
          className="auth-input"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button
          className="auth-button"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
