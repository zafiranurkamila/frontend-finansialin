"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import NotificationDropdown from "../components/NotificationDropdown";
import ProfileDropdown from "../components/ProfileDropdown";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTransactions } from "../context/TransactionContext";
import { useBudget } from "../context/BudgetContext";
import { useCategories } from "../context/CategoryContext";
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
  const { transactions, addTransaction, totalIncome, totalExpenses, currentBalance } = useTransactions();
  const { budgets, getBudgetProgress, loadBudgets } = useBudget();
  const { expenseCategories, allCategories } = useCategories();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [selectedPromptKey, setSelectedPromptKey] = useState("summary");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantPrompts, setAssistantPrompts] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [selectedReceiptFile, setSelectedReceiptFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [showRawOcrText, setShowRawOcrText] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [saveTxLoading, setSaveTxLoading] = useState(false);
  const [saveTxError, setSaveTxError] = useState("");
  const [saveTxSuccess, setSaveTxSuccess] = useState("");
  const [txForm, setTxForm] = useState({
    type: "expense",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    idCategory: "",
    description: "",
    source: "",
  });

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

  const isOverspending = useMemo(() => totalExpenses > totalIncome, [totalExpenses, totalIncome]);
  const overspendingAmount = useMemo(() => Math.max(0, totalExpenses - totalIncome), [totalExpenses, totalIncome]);

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
    async (promptKey = "summary", message = "") => {
      try {
        setAssistantLoading(true);
        setAssistantError("");
        if (message) {
          setSelectedPromptKey("free_text");
        } else {
          setSelectedPromptKey(promptKey);
        }

        const query = new URLSearchParams();
        query.set("prompt", promptKey);
        if (message) {
          query.set("message", message);
        }

        const response = await fetchWithAuth(`${BACKEND_URL}/api/insights/assistant?${query.toString()}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.message || "Gagal memuat jawaban AI.");
        }

        const data = await response.json();
        setAssistantReply(data.assistantReply || "Belum ada jawaban dari assistant.");
        setAssistantPrompts(Array.isArray(data.quickPrompts) ? data.quickPrompts : []);
        if (message) {
          setChatHistory((prev) => [...prev, { role: "user", text: message }, { role: "assistant", text: data.assistantReply || "" }]);
        }
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
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setReceiptPreviewUrl(previewUrl);
      setSelectedReceiptFile(file);
      setShowRawOcrText(false);
      setOcrError("");
      setSaveTxError("");
      setSaveTxSuccess("");

      try {
        setOcrLoading(true);
        const formData = new FormData();
        formData.append("receiptImage", file);

        const response = await fetchWithAuth(`${BACKEND_URL}/api/insights/receipt-ocr`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || "Gagal memproses OCR struk.");
        }

        const data = await response.json();
        setOcrResult(data);
        setTxForm((prev) => ({
          ...prev,
          type: data?.suggested?.type || "expense",
          amount: String(Math.round(Number(data?.total || 0))),
          date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : prev.date,
          idCategory: data?.suggested?.idCategory ? String(data.suggested.idCategory) : prev.idCategory,
          description: data?.suggested?.description || `Belanja di ${data?.merchant || "merchant"}`,
          source: data?.suggested?.source || "",
        }));
      } catch (error) {
        setOcrResult(null);
        setOcrError(error.message || "OCR gagal diproses.");
      } finally {
        setOcrLoading(false);
      }
    },
    [BACKEND_URL, receiptPreviewUrl]
  );

  const handleChatSubmit = async () => {
    const message = chatInput.trim();
    if (!message || assistantLoading) return;
    setChatInput("");
    await loadAssistantResponse("summary", message);
  };

  const handleTxFormChange = (field, value) => {
    setTxForm((prev) => ({ ...prev, [field]: value }));
  };

  const isLowConfidenceField = (fieldName) => {
    const conf = Number(ocrResult?.meta?.fieldConfidence?.[fieldName] ?? 1);
    return conf < 0.65;
  };

  const getItemConfidenceLevel = (item) => {
    const conf = Number(item?.confidence ?? 0);
    if (conf >= 0.8) return "high";
    if (conf >= 0.6) return "medium";
    return "low";
  };

  const saveAsTransaction = async () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      setSaveTxError("Nominal transaksi harus diisi lebih dari 0.");
      return;
    }

    try {
      setSaveTxLoading(true);
      setSaveTxError("");
      setSaveTxSuccess("");

      const formData = new FormData();
      formData.append("type", txForm.type);
      formData.append("amount", String(txForm.amount));
      formData.append("date", txForm.date);
      formData.append("description", txForm.description || "");
      if (txForm.idCategory) {
        formData.append("idCategory", txForm.idCategory);
      }
      if (txForm.source) {
        formData.append("source", txForm.source);
      }
      if (selectedReceiptFile) {
        formData.append("receiptImage", selectedReceiptFile);
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/api/transactions`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Gagal menyimpan transaksi.");
      }

      const created = await response.json();
      addTransaction(created);
      setSaveTxSuccess("Transaksi berhasil disimpan dari hasil scan struk.");
    } catch (error) {
      setSaveTxError(error.message || "Gagal simpan transaksi.");
    } finally {
      setSaveTxLoading(false);
    }
  };

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
            {isOverspending ? (
              <div className="overspending-alert" role="alert">
                <strong>Peringatan Keuangan:</strong> Pengeluaran kamu sudah melampaui pemasukan sebesar
                {` Rp ${overspendingAmount.toLocaleString("id-ID")}`}. Prioritaskan kebutuhan utama dulu dan tunda pengeluaran yang tidak mendesak.
              </div>
            ) : null}
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
                  {quickPrompts.find((prompt) => prompt.key === selectedPromptKey)?.label || "Chat Bebas"}
                </p>
                {assistantLoading ? <p>Memproses data transaksi user...</p> : null}
                {assistantError ? <p>{assistantError}</p> : null}
                {!assistantLoading && !assistantError ? <p>{assistantReply}</p> : null}
              </div>
              <div className="chat-box">
                <div className="chat-history">
                  {chatHistory.map((chat, index) => (
                    <div key={`${chat.role}-${index}`} className={`chat-bubble ${chat.role}`}>
                      {chat.text}
                    </div>
                  ))}
                  {!chatHistory.length ? <p className="chat-empty">Belum ada chat, coba tanya soal kondisi finansialmu.</p> : null}
                </div>
                <div className="chat-input-row">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Contoh: gimana cara hemat makan minggu ini?"
                  />
                  <button type="button" onClick={handleChatSubmit} disabled={assistantLoading}>
                    Kirim
                  </button>
                </div>
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
                  <h5>OCR Backend Result</h5>
                  {ocrLoading ? <p>Memproses OCR di backend...</p> : null}
                  {ocrError ? <p className="ocr-error">{ocrError}</p> : null}
                  {!ocrLoading && !ocrError ? (
                    <>
                      <p><strong>Merchant:</strong> {ocrResult?.merchant || "-"}</p>
                      <p><strong>Tanggal:</strong> {ocrResult?.date ? new Date(ocrResult.date).toLocaleDateString("id-ID") : "-"}</p>
                      <p><strong>Total:</strong> Rp {Number(ocrResult?.total || 0).toLocaleString("id-ID")}</p>
                      <p><strong>Confidence:</strong> {Math.round(Number(ocrResult?.meta?.confidence || 0) * 100)}%</p>
                      {ocrResult?.meta?.merchantTemplate ? (
                        <p><strong>Template:</strong> {ocrResult.meta.merchantTemplate}</p>
                      ) : null}
                      {ocrResult?.meta?.validation ? (
                        <div className={`ocr-validation ${ocrResult.meta.validation.isConsistent ? "ok" : "warn"}`}>
                          {ocrResult.meta.validation.isConsistent
                            ? `Valid: total OCR konsisten dengan jumlah item (selisih Rp ${Number(ocrResult.meta.validation.difference || 0).toLocaleString("id-ID")}).`
                            : `Perlu review: total OCR tidak konsisten dengan jumlah item (selisih Rp ${Number(ocrResult.meta.validation.difference || 0).toLocaleString("id-ID")}).`}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="raw-ocr-toggle"
                        onClick={() => setShowRawOcrText((prev) => !prev)}
                      >
                        {showRawOcrText ? "Sembunyikan Raw OCR" : "Tampilkan Raw OCR"}
                      </button>
                      {showRawOcrText ? (
                        <pre className="raw-ocr-text">{ocrResult?.meta?.rawText || "(Tidak ada raw text)"}</pre>
                      ) : null}
                    </>
                  ) : null}
                  <ul>
                    {(ocrResult?.items || []).map((item, idx) => (
                      <li key={`${item.name}-${idx}`} className={`ocr-item-row ${getItemConfidenceLevel(item) === "low" ? "low" : ""}`}>
                        <span className="ocr-item-main">
                          {item.qty}x {item.name} - Rp {Number(item.price).toLocaleString("id-ID")}
                        </span>
                        <span className={`ocr-item-confidence ${getItemConfidenceLevel(item)}`}>
                          {Math.round(Number(item.confidence || 0) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="ocr-edit-form">
                    <label className={isLowConfidenceField("merchant") ? "low-confidence" : ""}>
                      <span>Tipe</span>
                      <select value={txForm.type} onChange={(event) => handleTxFormChange("type", event.target.value)}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </label>
                    <label className={isLowConfidenceField("total") ? "low-confidence" : ""}>
                      <span>Nominal</span>
                      <input
                        type="number"
                        min="0"
                        value={txForm.amount}
                        onChange={(event) => handleTxFormChange("amount", event.target.value)}
                      />
                    </label>
                    <label className={isLowConfidenceField("date") ? "low-confidence" : ""}>
                      <span>Tanggal</span>
                      <input
                        type="date"
                        value={txForm.date}
                        onChange={(event) => handleTxFormChange("date", event.target.value)}
                      />
                    </label>
                    <label className={isLowConfidenceField("items") ? "low-confidence" : ""}>
                      <span>Kategori</span>
                      <select
                        value={txForm.idCategory}
                        onChange={(event) => handleTxFormChange("idCategory", event.target.value)}
                      >
                        <option value="">Pilih kategori</option>
                        {(txForm.type === "income" ? allCategories.filter((c) => c.type === "income") : expenseCategories).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={isLowConfidenceField("items") ? "low-confidence" : ""}>
                      <span>Deskripsi</span>
                      <input
                        type="text"
                        value={txForm.description}
                        onChange={(event) => handleTxFormChange("description", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Sumber Dana (opsional)</span>
                      <input
                        type="text"
                        value={txForm.source}
                        onChange={(event) => handleTxFormChange("source", event.target.value)}
                        placeholder="Contoh: Bank BCA"
                      />
                    </label>
                  </div>

                  <div className="ocr-actions">
                    <button type="button" className="save-transaction-btn" onClick={saveAsTransaction} disabled={saveTxLoading || ocrLoading}>
                      {saveTxLoading ? "Menyimpan..." : "Simpan jadi transaksi"}
                    </button>
                    {saveTxError ? <p className="ocr-error">{saveTxError}</p> : null}
                    {saveTxSuccess ? <p className="ocr-success">{saveTxSuccess}</p> : null}
                  </div>
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
