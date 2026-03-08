"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/authHelper";

function PredictiveBudgetWidget() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchWithAuth(`${BACKEND_URL}/api/budgets/predictive`, {
          method: "GET",
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load predictive budget");
        }

        const data = await response.json();
        setTrends(Array.isArray(data.trends) ? data.trends : []);
        setWarnings(Array.isArray(data.categoryWarnings) ? data.categoryWarnings : []);
      } catch (err) {
        console.error("Predictive widget error:", err);
        setError(err.message || "Failed to load predictive budget");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const riskClass = (risk) => {
    if (risk === "high") return "risk-high";
    if (risk === "medium") return "risk-medium";
    return "risk-low";
  };

  return (
    <div className="widget-box predictive-widget">
      <h3>Predictive Budget</h3>

      {loading ? <p className="empty-state">Calculating 30/60/90 day trend...</p> : null}
      {!loading && error ? <p className="empty-state">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="predictive-trends">
            {trends.map((trend) => (
              <div key={trend.windowDays} className={`predictive-trend-card ${riskClass(trend.riskLevel)}`}>
                <p>{trend.windowDays}D</p>
                <strong>{trend.projectedUtilizationPercent}%</strong>
                <span>{trend.riskLevel.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {warnings.length > 0 ? (
            <div className="predictive-warning-list">
              {warnings.slice(0, 3).map((warning) => (
                <div key={warning.idCategory} className="predictive-warning-item">
                  <span>{warning.name}</span>
                  <span>{warning.projectedUtilizationPercent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No high-risk category detected.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

export default PredictiveBudgetWidget;
