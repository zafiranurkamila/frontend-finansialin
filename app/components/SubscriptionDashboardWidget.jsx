"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/authHelper";

function SubscriptionDashboardWidget() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchWithAuth(`${BACKEND_URL}/api/subscriptions/dashboard?lookbackDays=120`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load subscription dashboard");
      }

      const data = await response.json();
      setSummary(data.summary || null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("Subscription dashboard error:", err);
      setError(err.message || "Failed to load subscription dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="widget-box subscription-widget">
      <h3>Subscriptions</h3>

      {loading ? <p className="empty-state">Analyzing recurring expenses...</p> : null}
      {!loading && error ? <p className="empty-state">{error}</p> : null}

      {!loading && !error && summary ? (
        <div className="subscription-summary">
          <div className="quick-stat-item">
            <span className="quick-stat-label">Recurring</span>
            <span className="quick-stat-value">{summary.subscriptionCount || 0}</span>
          </div>
          <div className="quick-stat-item">
            <span className="quick-stat-label">Est. Monthly</span>
            <span className="quick-stat-value">Rp {Number(summary.estimatedMonthlyTotal || 0).toLocaleString("id-ID")}</span>
          </div>
          <div className="quick-stat-item">
            <span className="quick-stat-label">Due in 7 days</span>
            <span className="quick-stat-value">{summary.dueSoonCount || 0}</span>
          </div>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="subscription-list">
          {items.slice(0, 4).map((item, idx) => (
            <div className="subscription-item" key={`${item.label}-${idx}`}>
              <div>
                <p className="subscription-label">{item.label}</p>
                <p className="subscription-meta">{item.source || "-"} • every ~{item.avgIntervalDays} days</p>
              </div>
              <div className="subscription-amount-wrap">
                <span className="subscription-amount">Rp {Number(item.amount || 0).toLocaleString("id-ID")}</span>
                <span className="subscription-due">D-{item.daysUntilDue}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? <p className="empty-state">No recurring subscriptions detected yet.</p> : null}
    </div>
  );
}

export default SubscriptionDashboardWidget;
