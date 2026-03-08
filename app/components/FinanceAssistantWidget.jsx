"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/authHelper";

function FinanceAssistantWidget() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [assistantReply, setAssistantReply] = useState("");
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [activePrompt, setActivePrompt] = useState("summary");

  const loadInsights = async (prompt = "summary") => {
    try {
      setLoading(true);
      setError("");
      setActivePrompt(prompt);

      const response = await fetchWithAuth(`${BACKEND_URL}/api/insights/assistant?prompt=${encodeURIComponent(prompt)}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load assistant insights");
      }

      const data = await response.json();
      setSummary(data.summary || null);
      setAssistantReply(data.assistantReply || "");
      setQuickPrompts(Array.isArray(data.quickPrompts) ? data.quickPrompts : []);
    } catch (err) {
      console.error("Assistant widget error:", err);
      setError(err.message || "Failed to load financial insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights("summary");
  }, []);

  return (
    <div className="widget-box assistant-widget">
      <h3>Finance Assistant</h3>

      {loading ? (
        <p className="empty-state">Analyzing your recent transactions...</p>
      ) : error ? (
        <p className="empty-state">{error}</p>
      ) : (
        <>
          {summary ? (
            <div className="assistant-metrics">
              <div className="assistant-metric">
                <span>30D Net</span>
                <strong>Rp {Number(summary.net || 0).toLocaleString("id-ID")}</strong>
              </div>
              <div className="assistant-metric">
                <span>Savings Rate</span>
                <strong>{Number(summary.savingsRate || 0).toFixed(1)}%</strong>
              </div>
            </div>
          ) : null}

          <p className="assistant-reply">{assistantReply}</p>

          <div className="assistant-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.key}
                type="button"
                className={`assistant-chip ${activePrompt === prompt.key ? "active" : ""}`}
                onClick={() => loadInsights(prompt.key)}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FinanceAssistantWidget;
