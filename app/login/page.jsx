"use client";

import { useState } from "react";
import Link from "next/link";
import "../style/Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* PANEL KIRI (HIJAU) */}
      <div className="login-left">
        <h2>Hello, Friend!</h2>
        <p>
          Enter your personal details <br /> and start journey with us
        </p>
        <Link href="/register" className="btn-signup">
          Sign Up
        </Link>
      </div>

      {/* PANEL KANAN (FORM LOGIN) */}
      <div className="login-right">
        <h1 className="brand">Finansialin</h1>
        <p className="subtitle">Log in to continue</p>

        <form className="login-form">
          <label>Username</label>
          <input type="text" placeholder="Enter your username" required />

          <label>Password</label>
          <div className="password-wrapper">
            <input type={showPassword ? "text" : "password"} placeholder="Enter your password" required />
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

          <button type="submit" className="btn-loginsignin">
            Log In
          </button>
          <a href="#" className="forgot-password">
            Forgot your password?
          </a>
        </form>
      </div>
    </div>
  );
}

export default Login;
