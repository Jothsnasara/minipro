import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";
import logo from "../assets/projectpulse-logo.png";

function Register() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editUser = state?.user; // 👈 comes when clicking Edit

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // for showing success messages

  // Prefill fields when editing
  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setUsername(editUser.username);
      setRole(editUser.role);
    }
  }, [editUser]);

  const isValidGmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!name || !email || !username) {
      setError("All fields are required");
      return;
    }

    if (!isValidGmail(email)) {
      setError("Please use a valid Gmail address (example@gmail.com)");
      return;
    }

    try {
      if (editUser) {
        // UPDATE USER
        await axios.put(
          `http://localhost:5000/users/${editUser.id}`,
          { name, email, username, role }
        );
        setSuccess("User updated successfully!");
      } else {
        // ADD USER
        if (!password) {
          setError("Password is required");
          return;
        }

        await axios.post("http://localhost:5000/register", {
          name,
          email,
          username,
          password,
          role,
        });
        setSuccess("User added successfully!");
      }

      // Automatically go back after 1.5s
      setTimeout(() => navigate(-1), 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={logo} alt="ProjectPulse Logo" className="auth-logo" />

        <h2 className="auth-title">
          {editUser ? "Update User" : "Add User"}
        </h2>
        <p className="auth-subtitle">ProjectPulse User Management</p>

        {/* Show error and success messages */}
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <input
          className="auth-input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {!editUser && (
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <select
          className="auth-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="member">Team Member</option>
          <option value="manager">Project Manager</option>
          <option value="admin">Admin</option>
        </select>

        <button className="auth-button" onClick={handleSubmit}>
          {editUser ? "Update User" : "Add User"}
        </button>
      </div>
    </div>
  );
}

export default Register;
