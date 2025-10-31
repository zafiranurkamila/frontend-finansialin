"use client";

import { useState } from "react";
import Link from "next/link";
import "../style/Register.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="register-page">
      <div className="register-left">
        <h1 className="brand">Finansialin</h1>
        <p className="subtitle">Sign up to continue</p>

        <form className="register-form">
          <label>Username</label>
          <input type="text" placeholder="Enter your Username" required />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="Enter your email" required />

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

          <button type="submit" className="btn-signup">
            Sign Up
          </button>
        </form>
      </div>

      <div className="register-right">
        <h2>Welcome Back!</h2>
        <p>
          To keep connect with us please <br /> login with your personal info
        </p>
        <Link href="/login" className="btn-signup">
          Log In
        </Link>
      </div>
    </div>
  );
}

export default Register;
