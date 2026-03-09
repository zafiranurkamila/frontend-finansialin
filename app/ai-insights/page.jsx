"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTransactions } from "../context/TransactionContext";
import { useBudget } from "../context/BudgetContext";
import { fetchWithAuth } from "../utils/authHelper";
import "../style/dashboard.css";
import "../style/ai-insights.css";

function getTopExpenseCategories(transactions) {
  const categories = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const name = t.category?.name || t.category || "Lainnya";
      categories[name] = (categories[name] || 0) + Number(t.amount || 0);
    });

  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));
}

export default function AIInsightsPage() {
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const { transactions, totalIncome, totalExpenses, currentBalance } = useTransactions();
  const { budgets, getBudgetProgress, loadBudgets } = useBudget();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [selectedPromptKey, setSelectedPromptKey] = useState("summary");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantPrompts, setAssistantPrompts] = useState([]);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [ocrDummyResult, setOcrDummyResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthed(true);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!isAuthed) return;
    loadBudgets();
  }, [isAuthed]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  const last30Days = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return transactions.filter((t) => new Date(t.date) >= cutoff);
  }, [transactions]);

  const expense30 = useMemo(
    () => last30Days.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [last30Days]
  );

  const income30 = useMemo(
    () => last30Days.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [last30Days]
  );

  const topCategories = useMemo(() => getTopExpenseCategories(last30Days), [last30Days]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.max(0, (currentBalance / totalIncome) * 100);
  }, [totalIncome, currentBalance]);

  const healthScore = useMemo(() => {
    const ratioScore = income30 > 0 ? Math.max(0, 100 - (expense30 / income30) * 100) : 35;
    const balanceScore = currentBalance > 0 ? 85 : 45;
    const activityScore = Math.min(100, last30Days.length * 3 + 30);
    return Math.round(ratioScore * 0.4 + balanceScore * 0.35 + activityScore * 0.25);
  }, [income30, expense30, currentBalance, last30Days.length]);

  const warningText = useMemo(() => {
    if (income30 <= 0) return "Data pemasukan 30 hari belum cukup untuk prediksi yang akurat.";
    const ratio = expense30 / income30;
    if (ratio >= 0.9) return "Early warning: laju pengeluaran mendekati batas aman bulanan.";
    if (ratio >= 0.75) return "Pengeluaran cukup tinggi, pertimbangkan limit mingguan per kategori.";
    return "Pengeluaran masih stabil. Pertahankan pola ini untuk capai target tabungan.";
  }, [income30, expense30]);

  const realtimeWarnings = useMemo(() => {
    return budgets
      .map((budget) => {
        const progress = getBudgetProgress(budget.idBudget || budget.id);
        const percent = Number(progress.percentage || 0);

        return {
          id: budget.idBudget || budget.id,
          category: budget.category || "Uncategorized",
          spent: Number(progress.spent || 0),
          limit: Number(budget.limit || budget.amount || 0),
          percent,
          riskLevel: percent >= 100 ? "high" : percent >= 85 ? "medium" : "low",
        };
      })
      .filter((item) => item.percent >= 80)
      .sort((a, b) => b.percent - a.percent);
  }, [budgets, getBudgetProgress, transactions]);

  const loadAssistantResponse = useCallback(
    async (promptKey = "summary") => {
      try {
        setAssistantLoading(true);
        setAssistantError("");
        setSelectedPromptKey(promptKey);

        const response = await fetchWithAuth(
          `${BACKEND_URL}/api/insights/assistant?prompt=${encodeURIComponent(promptKey)}`,
          { method: "GET" }
        );

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.message || "Gagal memuat jawaban AI.");
        }

        const data = await response.json();
        setAssistantReply(data.assistantReply || "Belum ada jawaban dari assistant.");
        setAssistantPrompts(Array.isArray(data.quickPrompts) ? data.quickPrompts : []);
      } catch (error) {
        setAssistantError(error.message || "Terjadi gangguan saat memuat assistant.");
      } finally {
        setAssistantLoading(false);
      }
    },
    [BACKEND_URL]
  );

  useEffect(() => {
    if (!isAuthed) return;
    loadAssistantResponse("summary");
  }, [isAuthed, loadAssistantResponse]);

  const handleReceiptUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "") || "Merchant";
      const now = new Date();

      setReceiptPreviewUrl(previewUrl);
      setOcrDummyResult({
        merchant: cleanName,
        date: now.toLocaleDateString("id-ID"),
        total: "125000",
        items: [
          { name: "Kopi Susu", qty: 2, price: 25000 },
          { name: "Roti", qty: 1, price: 18000 },
          { name: "Makanan Utama", qty: 1, price: 57000 },
        ],
        note: "OCR dummy aktif: hasil masih bisa diedit user sebelum simpan.",
      });
    },
    [receiptPreviewUrl]
  );

  const handleLogoutAttempt = useCallback(() => {
    setIsLogoutAlertOpen(true);
  }, []);

  const handleConfirmLogout = () => {
    setIsLogoutAlertOpen(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const fallbackQuickPrompts = [
    { key: "summary", label: "Ringkas kondisi keuangan saya" },
    { key: "what_to_cut", label: "Pengeluaran mana yang bisa dipangkas dulu" },
    { key: "saving_tips", label: "Kasih strategi hemat minggu ini" },
    { key: "budget_alerts", label: "Budget mana yang paling rawan jebol" },
  ];

  const quickPrompts = assistantPrompts.length ? assistantPrompts : fallbackQuickPrompts;

  if (loading || !isAuthed) {
    return (
      <div className="loading">
        <div className="loading-container">
          <div className="loading-text">Finansialin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container ai-page-shell">
      <Sidebar onLogoutAttempt={handleLogoutAttempt} />

      <div className="main-content-area">
        <header className="dashboard-header">
          <h2 className="page-title">AI Insights</h2>
          <div className="header-actions">
            <NotificationDropdown />
            <ProfileDropdown onLogoutAttempt={handleLogoutAttempt} />
          </div>
        </header>

        <main className="main-content-wrapper ai-main-content">
          <section className="ai-hero" id="summary">
            <h3>Asisten Finansial Berbasis Data Transaksi</h3>
            <p>
              Halaman ini menyiapkan fitur yang kamu minta: chatbot dengan konteks transaksi,
              scan struk, predictive budgeting, dan metrik kesehatan finansial.
            </p>
            <div className="ai-hero-metrics">
              <div className="metric-card">
                <span>Health Score</span>
                <strong>{healthScore}/100</strong>
              </div>
              <div className="metric-card">
                <span>Savings Rate</span>
                <strong>{savingsRate.toFixed(1)}%</strong>
              </div>
              <div className="metric-card">
                <span>30D Expense</span>
                <strong>Rp {expense30.toLocaleString("id-ID")}</strong>
              </div>
            </div>
          </section>

          <section className="ai-grid" id="chatbot">
            <article className="ai-card">
              <h4>1. Chatbot Konteks Transaksi</h4>
              <p>
                User tidak perlu ngetik dari nol. Pilih prompt cepat untuk dapat summary data,
                strategi penghematan, dan rekomendasi aksi.
              </p>
              <div className="prompt-chips">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt.key}
                    className={`chip ${selectedPromptKey === prompt.key ? "active" : ""}`}
                    onClick={() => loadAssistantResponse(prompt.key)}
                    disabled={assistantLoading}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
              <div className="ai-output">
                <p>
                  <strong>Prompt Aktif:</strong>{" "}
                  {quickPrompts.find((prompt) => prompt.key === selectedPromptKey)?.label || "Ringkasan"}
                </p>
                {assistantLoading ? <p>Memproses data transaksi user...</p> : null}
                {assistantError ? <p>{assistantError}</p> : null}
                {!assistantLoading && !assistantError ? <p>{assistantReply}</p> : null}
              </div>
            </article>

            <article className="ai-card" id="receipt">
              <h4>2. AI Scan Foto Struk (Opsional)</h4>
              <p>
                Sistem membaca item struk menjadi transaksi satu per satu, lalu user bisa edit nominal,
                kategori, dan deskripsi sebelum simpan.
              </p>
              <button type="button" className="scan-button" onClick={() => setOcrModalOpen(true)}>
                Scan Struk
              </button>
              <ul>
                <li>Auto-detect tanggal, merchant, total</li>
                <li>Split transaksi ke multi kategori</li>
                <li>Preview hasil sebelum submit</li>
              </ul>
            </article>

            <article className="ai-card" id="predictive">
              <h4>3. Predictive Budgeting + Early Warning</h4>
              <p>{warningText}</p>
              <div className="warning-box">{warningText}</div>
              <div className="warning-list">
                {realtimeWarnings.map((warning) => (
                  <div key={warning.id} className={`warning-item ${warning.riskLevel}`}>
                    <strong>{warning.category}</strong>
                    <span>
                      {warning.percent.toFixed(1)}% ({`Rp ${warning.spent.toLocaleString("id-ID")}`} / {`Rp ${warning.limit.toLocaleString("id-ID")}`})
                    </span>
                  </div>
                ))}
                {!realtimeWarnings.length ? (
                  <div className="warning-item safe">
                    <strong>Semua kategori aman</strong>
                    <span>Belum ada budget kategori yang menyentuh 80% di periode aktif.</span>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="ai-card" id="health">
              <h4>4. Metrik Kesehatan Finansial</h4>
              <p>
                Ringkasan menyeluruh kondisi keuangan pengguna berdasarkan cashflow, pola belanja,
                dan progress tabungan.
              </p>
              <ul>
                {topCategories.map((c) => (
                  <li key={c.name}>{c.name}: Rp {c.amount.toLocaleString("id-ID")}</li>
                ))}
                {!topCategories.length && <li>Belum ada data kategori pengeluaran.</li>}
              </ul>
            </article>
          </section>
        </main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutAlertOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutAlertOpen(false)}
      />

      {ocrModalOpen ? (
        <div className="ocr-modal-backdrop" onClick={() => setOcrModalOpen(false)}>
          <div className="ocr-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ocr-modal-header">
              <h4>Upload Struk untuk OCR Preview</h4>
              <button type="button" className="ocr-close" onClick={() => setOcrModalOpen(false)}>
                x
              </button>
            </div>

            <label className="ocr-upload">
              <span>Pilih gambar struk</span>
              <input type="file" accept="image/*" onChange={handleReceiptUpload} />
            </label>

            {receiptPreviewUrl ? (
              <div className="ocr-preview-grid">
                <img src={receiptPreviewUrl} alt="Preview struk" className="ocr-preview-image" />
                <div className="ocr-result">
                  <h5>OCR Dummy Result</h5>
                  <p><strong>Merchant:</strong> {ocrDummyResult?.merchant}</p>
                  <p><strong>Tanggal:</strong> {ocrDummyResult?.date}</p>
                  <p><strong>Total:</strong> Rp {Number(ocrDummyResult?.total || 0).toLocaleString("id-ID")}</p>
                  <ul>
                    {(ocrDummyResult?.items || []).map((item, idx) => (
                      <li key={`${item.name}-${idx}`}>
                        {item.qty}x {item.name} - Rp {Number(item.price).toLocaleString("id-ID")}
                      </li>
                    ))}
                  </ul>
                  <p className="ocr-note">{ocrDummyResult?.note}</p>
                </div>
              </div>
            ) : (
              <p className="ocr-empty">Belum ada gambar dipilih.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
