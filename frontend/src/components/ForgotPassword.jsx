/*import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/forgot-password", {
        email
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/reset-password", {
          state: { username: res.data.username }
        });
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <input
        type="email"
        placeholder="Enter your registered email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleSubmit}>Send OTP</button>
    </div>
  );
}

export default ForgotPassword;*/



import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5001/forgot-password",
        { email }
      );

      setMessage(res.data.message);

      // 👉 Navigate to reset page
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <input
          className="auth-input"
          type="email"
          placeholder="Enter Registered Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="auth-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
