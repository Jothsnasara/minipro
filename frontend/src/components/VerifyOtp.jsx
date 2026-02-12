import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";

function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const username = state?.username;

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  // 🔒 Redirect if accessed directly
  useEffect(() => {
    if (!username) navigate("/");
  }, [username, navigate]);

  // ⏳ Countdown logic
  useEffect(() => {
    if (cooldown === 0) return;

    const timer = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // -------- VERIFY OTP --------
  const handleVerify = async () => {
    if (!otp) {
      setMessage("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await axios.post("http://localhost:5000/verify-otp", {
        username,
        otp
      });

      setMessage("OTP verified successfully");
      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // -------- RESEND OTP --------
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setMessage("");

      await axios.post("http://localhost:5000/resend-otp", { username });

      setMessage("New OTP sent to your email");
      setCooldown(30); // ⏳ restart cooldown

    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Verify OTP</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to your email
        </p>

        {message && <p className="auth-message">{message}</p>}

        <input
          className="auth-input"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          className="auth-button"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          className="auth-link-btn"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || loading}
        >
          {cooldown > 0
            ? `Resend OTP in ${cooldown}s`
            : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

export default VerifyOtp;