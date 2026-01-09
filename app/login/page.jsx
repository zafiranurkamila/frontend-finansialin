// Login.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../style/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const router = useRouter();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdOkLen = password.length >= 6;
  const pwdOkNum = /\d/.test(password);

  // Trigger animations on mount to ensure consistency on logout redirect
  useEffect(() => {
    // Force reflow to restart animations
    const loginPage = document.querySelector('.login-page');
    if (loginPage) {
      loginPage.offsetHeight;
    }
  }, []);

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

      console.log("=== RESPONSE LOGIN ===");
      console.log("Response OK?:", response.ok);
      console.log("Status:", response.status);
      console.log("Full data:", data);

      if (!response.ok) {
        setError(data.message || "Email atau password salah");
        return;
      }

      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      if (!accessToken) {
        setError("Invalid token from server");
        console.error("❌ No accessToken in response!");
        return;
      }

      console.log("✅ Menyimpan token...");

      localStorage.setItem("access_token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      const saved = localStorage.getItem("access_token");
      console.log("✅ Token tersimpan:", saved);

      console.log("🚀 Redirect ke dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch (err) {
      setError("Connection error: " + err.message);
      console.error("❌ Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    setForgotLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.message || "Failed to send reset email");
        return;
      }

      setForgotMessage("Password reset link has been sent to your email!");
      setForgotEmail("");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMessage("");
      }, 2000);
    } catch (err) {
      setForgotError("Connection error: " + err.message);
      console.error("❌ Forgot password error:", err);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");
  };

  return (
    <div className="login-page">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-forgot" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForgotModal}>×</button>

            <h2>Reset Password</h2>
            <p>Enter your email address and we'll send you a link to reset your password.</p>

            {forgotError && (
              <div className="modal-error">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="modal-success">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="forgot-form" autoComplete="off">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={forgotLoading}
                autoComplete="off"
                inputMode="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                name="forgot-email"
              />

              <button type="submit" className="modal-btn" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="login-left">
        <h2>Hello, Friend!</h2>
        <p>Enter your personal details <br /> and start journey with us</p>
        <Link href="/register" className="btn-signup-login">
          Sign Up
        </Link>
      </div>

      <div className="login-right">
        <h1 className="brand">Finansialin</h1>
        <p className="subtitle">Log in to continue</p>

        {error && (
          <div className="error-message" style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="off"
            inputMode="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            name="login-email"
          />
          {emailFocused && (
            <small className={`input-hint ${emailValid ? 'ok' : (email.length > 0 ? 'warn' : '')}`}>
              Use a valid email like name@example.com
            </small>
          )}

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
              name="login-password"
            />
            <span className="toggle-password" onClick={togglePassword}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="icon-eye">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.5 7.5 7.5 4.5 12 4.5s8.5 3 9.75 7.5c-1.25 4.5-5.25 7.5-9.75 7.5s-8.5-3-9.75-7.5z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="icon-eye">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.25 4.5 5.25 7.5 9.75 7.5 1.99 0 3.84-.57 5.39-1.55M10.5 6.75A10.45 10.45 0 0112 6.5c4.5 0 8.5 3 9.75 7.5-.39 1.42-1.11 2.71-2.09 3.79M3 3l18 18" />
                </svg>
              )}
            </span>
          </div>
          {passwordFocused && (
            <div className="hint-list">
              <div className={pwdOkLen ? 'ok' : 'warn'}>• Minimum 6 characters</div>
              <div className={pwdOkNum ? 'ok' : 'warn'}>• Include at least 1 number</div>
            </div>
          )}

          <button type="submit" className="btn-loginsignin" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>
          <button
            type="button"
            className="forgot-password"
            onClick={() => setShowForgotModal(true)}
          >
            Forgot your password?
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;