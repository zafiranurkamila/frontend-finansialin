"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../style/auth-action.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialToken = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendMessage, setResendMessage] = useState("");

  const canSubmit = useMemo(() => email.trim() !== "" && token.trim() !== "", [email, token]);

  const verifyEmail = async (payloadEmail, payloadToken) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payloadEmail,
          token: payloadToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Failed to verify email");
        return;
      }

      setStatus("success");
      setMessage("Email berhasil diverifikasi. Silakan login.");
    } catch (error) {
      setStatus("error");
      setMessage(`Connection error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (initialEmail && initialToken) {
      verifyEmail(initialEmail, initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    await verifyEmail(email, token);
  };

  const resendVerification = async () => {
    if (!email.trim()) {
      setResendStatus("error");
      setResendMessage("Email wajib diisi");
      return;
    }

    setResendStatus("loading");
    setResendMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/email/verification-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setResendStatus("error");
        setResendMessage(data.message || "Gagal kirim ulang verifikasi");
        return;
      }

      setResendStatus("success");
      if (data?.verification?.token) {
        setToken(data.verification.token);
        setResendMessage("Token verifikasi baru berhasil dibuat. Klik Verify Email.");
        return;
      }

      setResendMessage("Link verifikasi sudah dikirim ke email kamu.");
    } catch (error) {
      setResendStatus("error");
      setResendMessage(`Connection error: ${error.message}`);
    }
  };

  return (
    <main className="auth-action-page">
      <section className="auth-card">
        <h1>Verify Your Email</h1>
        <p>Masukkan email dan token verifikasi, atau buka link dari email.</p>

        {message && (
          <div className={`message-box ${status === "success" ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form" autoComplete="off">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            required
          />

          <label>Verification Token</label>
          <input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="paste token"
            required
          />

          <button type="submit" className="primary-btn" disabled={!canSubmit || status === "loading"}>
            {status === "loading" ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <button
          type="button"
          className="secondary-btn"
          onClick={resendVerification}
          disabled={resendStatus === "loading"}
        >
          {resendStatus === "loading" ? "Sending..." : "Resend Verification"}
        </button>

        {resendMessage && (
          <div className={`message-box ${resendStatus === "success" ? "success" : "error"}`}>
            {resendMessage}
          </div>
        )}

        <p className="auth-footer">
          Sudah selesai? <Link href="/login">Kembali ke Login</Link>
        </p>
      </section>
    </main>
  );
}
