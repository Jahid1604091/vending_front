import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";

export default function Login({ setAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const res = await api.post("/api/login", { username, password });

      if (res.data.success) {
        localStorage.setItem("adminId", res.data.adminId);
        localStorage.setItem("username", res.data.username);
        setAuthenticated(true);
        navigate("/admin");
      } else {
        setError(res.data.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login request error:", err.message, err.response?.status, err.response?.data);
      if (err.response) {
        if (err.response.status === 500) {
          setError(err.response.data.message || "Server error. Please check server logs.");
        } else {
          setError(err.response.data.message || "Login failed. Please try again.");
        }
      } else {
        setError("Unable to connect to the server. Please check if the server is running.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
}