"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../style/auth-action.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function parseApiResponse(response) {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {
      message: `Unexpected server response (${response.status}).`,
    };
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim() !== "" && token.trim() !== "" && password.length >= 6 && password === confirmPassword;
  }, [email, token, password, confirmPassword]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password tidak sama.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          password,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Reset password gagal.");
        return;
      }

      setStatus("success");
      setMessage("Password berhasil direset. Mengarahkan ke login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      setStatus("error");
      setMessage(`Connection error: ${error.message}`);
    }
  };

  return (
    <main className="auth-action-page">
      <section className="auth-card">
        <h1>Reset Password</h1>
        <p>Masukkan token reset dan password baru kamu.</p>

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

          <label>Reset Token</label>
          <input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="paste token"
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="minimum 6 karakter"
            minLength={6}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="ulangi password"
            minLength={6}
            required
          />

          <button type="submit" className="primary-btn" disabled={!canSubmit || status === "loading"}>
            {status === "loading" ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-footer">
          <Link href="/login">Kembali ke Login</Link>
        </p>
      </section>
    </main>
  );
}
