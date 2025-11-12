"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../style/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError("Connection error: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* PANEL KIRI */}
      <div className="login-left">
        <h2>Hello, Friend!</h2>
        <p>Enter your personal details <br /> and start journey with us</p>
        <Link href="/register" className="btn-signup-login">
          Sign Up
        </Link>
      </div>

      {/* PANEL KANAN */}
      <div className="login-right">
        <h1 className="brand">Finansialin</h1>
        <p className="subtitle">Log in to continue</p>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={togglePassword}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="icon-eye">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.5 7.5 7.5 4.5 12 4.5s8.5 3 9.75 7.5c-1.25 4.5-5.25 7.5-9.75 7.5s-8.5-3-9.75-7.5z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="icon-eye">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.5 12c1.25 4.5 5.25 7.5 9.75 7.5 1.99 0 3.84-.57 5.39-1.55M10.5 6.75A10.45 10.45 0 0112 6.5c4.5 0 8.5 3 9.75 7.5-.39 1.42-1.11 2.71-2.09 3.79M3 3l18 18"
                  />
                </svg>
              )}
            </span>
          </div>

          <button type="submit" className="btn-loginsignin" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>
          <a href="#" className="forgot-password">Forgot your password?</a>
        </form>
      </div>
    </div>
  );
}

export default Login;