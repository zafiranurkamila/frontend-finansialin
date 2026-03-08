"use client";

import React, { createContext, useContext, useState } from "react";
import { fetchWithAuth } from "../utils/authHelper";

const FundingSourceContext = createContext();

export function FundingSourceProvider({ children }) {
  const [fundingSources, setFundingSources] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const fetchFundingSources = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoaded(true);
        return [];
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/api/funding-sources`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch funding sources");
      }

      const data = await response.json();
      const mapped = (Array.isArray(data) ? data : []).map((src) => ({
        idFundingSource: src.idFundingSource,
        name: src.name,
        initialBalance: Number(src.initialBalance || 0),
        availableBalance: Number(src.availableBalance || 0),
      }));

      setFundingSources(mapped);
      setIsLoaded(true);
      return mapped;
    } catch (error) {
      console.error("Funding source fetch error:", error);
      setIsLoaded(true);
      return [];
    }
  };

  const addFundingSource = async (name, initialBalance = 0) => {
    const response = await fetchWithAuth(`${BACKEND_URL}/api/funding-sources`, {
      method: "POST",
      body: JSON.stringify({ name, initialBalance }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to add funding source");
    }

    const created = {
      idFundingSource: data.idFundingSource,
      name: data.name,
      initialBalance: Number(data.initialBalance || 0),
      availableBalance: Number(data.availableBalance || 0),
    };

    setFundingSources((prev) => {
      const next = [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      return next;
    });

    return created;
  };

  const value = {
    fundingSources,
    isLoaded,
    fetchFundingSources,
    addFundingSource,
  };

  return <FundingSourceContext.Provider value={value}>{children}</FundingSourceContext.Provider>;
}

export function useFundingSources() {
  const context = useContext(FundingSourceContext);
  if (!context) {
    throw new Error("useFundingSources must be used within FundingSourceProvider");
  }
  return context;
}
