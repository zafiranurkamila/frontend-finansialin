"use client";
import React, { useState, useMemo } from "react";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { FaDownload, FaPrint, FaCalendar, FaFilter } from "react-icons/fa";
import "../style/report.css";

function ReportView() {
  const { transactions } = useTransactions();
  const { getCategoryById } = useCategories();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedType, setSelectedType] = useState("all");

  // Helper to get category name
  const getCategoryName = (transaction) => {
    return transaction.category?.name || getCategoryById(transaction.idCategory)?.name || "Unknown";
  };

  // Get available months from transactions
  const availableMonths = [
    ...new Set(
      transactions.map((t) => {
        const date = new Date(t.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      })
    ),
  ]
    .sort()
    .reverse();

  // Filter transactions for selected month
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return monthKey === selectedMonth;
  });

  // Get unique categories for this month
  const categoriesInMonth = useMemo(() => {
    const cats = new Set(monthTransactions.map((t) => getCategoryName(t)));
    return Array.from(cats).sort();
  }, [monthTransactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((t) => {
      const categoryMatch = selectedCategories.size === 0 || selectedCategories.has(getCategoryName(t));
      const typeMatch = selectedType === "all" || t.type === selectedType;
      return categoryMatch && typeMatch;
    });
  }, [monthTransactions, selectedCategories, selectedType]);

  // Calculate monthly totals
  const monthlyIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const monthlyExpenses = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = filteredTransactions.reduce((acc, t) => {
      if (t.type === "expense") {
        const categoryName = getCategoryName(t);
        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, count: 0 };
        }
        acc[categoryName].amount += parseFloat(t.amount || 0);
        acc[categoryName].count += 1;
      }
      return acc;
    }, {});
    return breakdown;
  }, [filteredTransactions]);

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);

  // Color palette for categories
  const getColorForCategory = (index) => {
    const colors = [
      { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B" },
      { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
      { bg: "#DCFCE7", border: "#16A34A", text: "#166534" },
      { bg: "#DBEAFE", border: "#0284C7", text: "#0C2340" },
      { bg: "#F3E8FF", border: "#A855F7", text: "#581C87" },
    ];
    return colors[index % colors.length];
  };

  // Format month name
  const formatMonthName = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Escape CSV value
  const escapeCsvValue = (value) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  };

  // Handle download Excel dengan warna
  const handleDownload = async () => {
    try {
      const XLSX = require("xlsx");

      // 1. SUMMARY SHEET
      const summaryData = [
        ["Laporan Keuangan Sederhana"],
        [],
        ["Periode:", formatMonthName(selectedMonth)],
        ["Tanggal Export:", new Date().toLocaleDateString("id-ID")],
        [],
        ["RINGKASAN KEUANGAN"],
        ["Keterangan", "Jumlah"],
        ["Total Income", `Rp ${monthlyIncome.toLocaleString("id-ID")}`],
        ["Total Expenses", `Rp ${monthlyExpenses.toLocaleString("id-ID")}`],
        ["Net Balance", `Rp ${monthlyBalance.toLocaleString("id-ID")}`],
      ];

      // 2. CATEGORIES SHEET
      const categoryData = [["TOP SPENDING CATEGORIES"], [], ["No", "Category", "Transactions", "Amount", "Percentage"]];

      topCategories.forEach(([category, data], index) => {
        const percentage = monthlyExpenses > 0 ? ((data.amount / monthlyExpenses) * 100).toFixed(1) : 0;
        categoryData.push([index + 1, category, data.count, `Rp ${data.amount.toLocaleString("id-ID")}`, `${percentage}%`]);
      });

      // 3. TRANSACTIONS SHEET
      const transactionData = [["DETAIL TRANSAKSI"], [], ["No", "Tanggal", "Category", "Keterangan", "Debit", "Kredit", "Saldo"]];

      let runningBalance = 0;
      filteredTransactions
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((t, index) => {
          const categoryName = getCategoryName(t);
          const date = new Date(t.date).toLocaleDateString("id-ID");
          const description = t.description || t.source || "-";
          const amount = parseFloat(t.amount);

          if (t.type === "income") {
            runningBalance += amount;
            transactionData.push([index + 1, date, categoryName, description, "", `Rp ${amount.toLocaleString("id-ID")}`, `Rp ${runningBalance.toLocaleString("id-ID")}`]);
          } else {
            runningBalance -= amount;
            transactionData.push([index + 1, date, categoryName, description, `Rp ${amount.toLocaleString("id-ID")}`, "", `Rp ${runningBalance.toLocaleString("id-ID")}`]);
          }
        });

      // Total row
      transactionData.push(["", "", "", "Jumlah", `Rp ${monthlyExpenses.toLocaleString("id-ID")}`, `Rp ${monthlyIncome.toLocaleString("id-ID")}`, `Rp ${monthlyBalance.toLocaleString("id-ID")}`]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      const ws2 = XLSX.utils.aoa_to_sheet(categoryData);
      const ws3 = XLSX.utils.aoa_to_sheet(transactionData);

      // Set column widths
      ws1["!cols"] = [{ wch: 25 }, { wch: 25 }];
      ws2["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      ws3["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

      // Add styles to summary sheet
      const greenFill = { fgColor: { rgb: "FFD1FAE5" } };
      const redFill = { fgColor: { rgb: "FFFEE2E2" } };
      const yellowFill = { fgColor: { rgb: "FFFEF3C7" } };
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        fill: { fgColor: { rgb: "FF344d33" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      // Style summary sheet
      ws1["A1"].font = { bold: true, size: 14 };
      ws1["A6"].font = { bold: true };
      ws1["A7"].font = { bold: true };
      ws1["B7"].font = { bold: true };
      ws1["A8"].fill = greenFill;
      ws1["A9"].fill = redFill;
      ws1["A10"].fill = yellowFill;

      // Style category sheet
      ws2["A1"].font = { bold: true, size: 14 };
      ws2["A5"] = { ...ws2["A5"], font: { bold: true }, fill: headerStyle.fill };
      ws2["B5"] = { ...ws2["B5"], font: { bold: true }, fill: headerStyle.fill };
      ws2["C5"] = { ...ws2["C5"], font: { bold: true }, fill: headerStyle.fill };
      ws2["D5"] = { ...ws2["D5"], font: { bold: true }, fill: headerStyle.fill };
      ws2["E5"] = { ...ws2["E5"], font: { bold: true }, fill: headerStyle.fill };

      // Style transaction sheet
      ws3["A1"].font = { bold: true, size: 14 };
      const headerRow = 3;
      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c: col });
        ws3[cellRef] = {
          ...ws3[cellRef],
          font: { bold: true, color: { rgb: "FFFFFFFF" } },
          fill: { fgColor: { rgb: "FF344d33" } },
          alignment: { horizontal: "center" },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws1, "Summary");
      XLSX.utils.book_append_sheet(wb, ws2, "Categories");
      XLSX.utils.book_append_sheet(wb, ws3, "Transactions");

      XLSX.writeFile(wb, `Laporan-Keuangan-${selectedMonth}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("Gagal membuat file Excel");
    }
  };

  const toggleCategory = (category) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  return (
    <div className="report-container">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-title-section">
          <h2>Monthly Financial Report</h2>
          <div className="month-selector">
            <FaCalendar />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedCategories(new Set());
                setSelectedType("all");
              }}
              className="month-select"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthName(month)}
                  </option>
                ))
              ) : (
                <option value={selectedMonth}>{formatMonthName(selectedMonth)}</option>
              )}
            </select>
          </div>
        </div>

        <div className="report-actions">
          <button className="report-btn" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="report-btn" onClick={handleDownload}>
            <FaDownload /> Download XLS
          </button>
        </div>
      </div>

      {monthTransactions.length === 0 ? (
        <div className="report-empty">
          <p>No transactions found for {formatMonthName(selectedMonth)}</p>
        </div>
      ) : (
        <>
          {/* Report Summary */}
          <div className="report-summary">
            <div className="report-summary-card income">
              <h4>Total Income</h4>
              <p className="report-amount">Rp {monthlyIncome.toLocaleString("id-ID")}</p>
              <span className="report-count">{filteredTransactions.filter((t) => t.type === "income").length} transactions</span>
            </div>
            <div className="report-summary-card expense">
              <h4>Total Expenses</h4>
              <p className="report-amount">Rp {monthlyExpenses.toLocaleString("id-ID")}</p>
              <span className="report-count">{filteredTransactions.filter((t) => t.type === "expense").length} transactions</span>
            </div>
            <div className="report-summary-card balance">
              <h4>Net Balance</h4>
              <p className="report-amount">Rp {monthlyBalance.toLocaleString("id-ID")}</p>
              <span className={`report-indicator ${monthlyBalance >= 0 ? "positive" : "negative"}`}>{monthlyBalance >= 0 ? "↑ Surplus" : "↓ Deficit"}</span>
            </div>
          </div>

          {/* Filters Section - Horizontal dengan Warna */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "32px",
              alignItems: "center",
              flexWrap: "wrap",
              backgroundColor: "#F9FAFB",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
            }}
          >
            {/* Type Filter */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280", whiteSpace: "nowrap" }}>
                <FaFilter /> Type:
              </label>
              {["all", "income", "expense"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: "6px 12px",
                    border: selectedType === type ? "none" : "1.5px solid #D1D5DB",
                    backgroundColor: selectedType === type ? "#344d33" : "white",
                    color: selectedType === type ? "white" : "#6B7280",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                >
                  {type === "all" ? "All" : type === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {categoriesInMonth.length > 0 && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280" }}>Categories:</label>
                {categoriesInMonth.map((category, idx) => {
                  const isSelected = selectedCategories.has(category);
                  const color = getColorForCategory(idx);
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: isSelected ? color.border : color.bg,
                        color: isSelected ? "white" : color.text,
                        border: `1.5px solid ${color.border}`,
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: isSelected ? "600" : "500",
                        transition: "all 0.2s",
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reset Button */}
            {(selectedCategories.size > 0 || selectedType !== "all") && (
              <button
                onClick={() => {
                  setSelectedCategories(new Set());
                  setSelectedType("all");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  marginLeft: "auto",
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Top Spending Categories */}
          {topCategories.length > 0 && (
            <div className="report-section">
              <h3>Top Spending Categories</h3>
              <div className="category-list">
                {topCategories.map(([category, data], index) => {
                  const color = getColorForCategory(index);
                  const percentage = monthlyExpenses > 0 ? ((data.amount / monthlyExpenses) * 100).toFixed(1) : 0;

                  return (
                    <div
                      key={category}
                      className="category-item"
                      style={{
                        backgroundColor: color.bg,
                        borderLeft: `5px solid ${color.border}`,
                        borderBottom: "none",
                        borderTop: "none",
                        borderRight: "none",
                      }}
                    >
                      <div
                        className="category-rank"
                        style={{
                          backgroundColor: color.border,
                          color: "white",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="category-info">
                        <h4 style={{ color: color.text }}>{category}</h4>
                        <p>{data.count} transactions</p>
                      </div>
                      <div className="category-amount" style={{ color: color.text, textAlign: "right" }}>
                        Rp {data.amount.toLocaleString("id-ID")}
                      </div>
                      <div className="category-percentage" style={{ color: color.text, textAlign: "right" }}>
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="report-section">
            <h3>Transaction Details ({filteredTransactions.length})</h3>
            <div className="report-table">
              {filteredTransactions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>No transactions match your filters</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{new Date(transaction.date).toLocaleDateString("id-ID")}</td>
                          <td>
                            <span className="table-category">{getCategoryName(transaction)}</span>
                          </td>
                          <td>{transaction.description || transaction.source || "-"}</td>
                          <td>
                            <span className={`table-badge ${transaction.type}`}>{transaction.type}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`table-amount ${transaction.type}`}>
                              {transaction.type === "income" ? "+" : "-"}
                              Rp {parseFloat(transaction.amount).toLocaleString("id-ID")}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Report Footer */}
          <div className="report-footer">
            <p>Report generated on {new Date().toLocaleDateString("id-ID")}</p>
            <p>Finansialin - Personal Finance Manager</p>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportView;
