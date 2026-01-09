"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// Translations
const translations = {
    en: {
        // Common
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        close: 'Close',
        confirm: 'Confirm',
        search: 'Search',
        filter: 'Filter',
        clear: 'Clear',
        apply: 'Apply',
        loading: 'Loading',
        name: 'Name',
        description: 'Description',
        date: 'Date',
        actions: 'Actions',
        noData: 'No data available',

        // Navigation
        dashboard: 'Dashboard',
        budget: 'Budget',
        transaction: 'Transaction',
        analytics: 'Analytics',
        settings: 'Settings',
        logout: 'Logout',

        // Dashboard
        welcome: 'Welcome',
        totalIncome: 'Total Income',
        totalExpense: 'Total Expense',
        totalBalance: 'Total Balance',
        recentTransactions: 'Recent Transactions',
        budgetOverview: 'Budget Overview',
        quickActions: 'Quick Actions',
        viewAll: 'View All',
        thisMonth: 'This Month',
    manageYourFinances: 'Manage Your Finances!',
    startManagingBetter: 'Start managing expenses and investments better. Achieve your financial goals with Finansialin.',
    recordEveryTransaction: 'Record every transaction',
    createBudgetCategories: 'Create budget for expense categories',
    monitorMonthlyReports: 'Monitor monthly financial reports',
    
    // Settings Page
    settingsTitle: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    language: 'Language',
    profileInfo: 'Profile Information',
    updatePersonalInfo: 'Update your personal information',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        notificationPreferences: 'Notification Preferences',
        manageNotifications: 'Manage how you receive notifications',
        transactionAlerts: 'Transaction Alerts',
        transactionAlertsDesc: 'Notify me when transactions are added',
        budgetAlerts: 'Budget Alerts',
        budgetAlertsDesc: 'Notify me when approaching budget limits',
        savePreferences: 'Save Preferences',
        languageSettings: 'Language Settings',
        selectLanguage: 'Select your preferred language',
    confirmLogout: 'Confirm Logout',
    logoutMessage: 'Are you sure you want to log out?',
    
    // Budget Page
        budgetGoals: 'Budget Goals',
        addBudget: 'Add Budget',
        editBudget: 'Edit Budget',
        deleteBudget: 'Delete Budget',
        budgetName: 'Budget Name',
        amount: 'Amount',
        category: 'Category',
        period: 'Period',
        startDate: 'Start Date',
        endDate: 'End Date',
        type: 'Type',
        income: 'Income',
        expense: 'Expense',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        selectCategory: 'Select Category',
        selectPeriod: 'Select Period',
        selectDate: 'Select Date',
        totalBudget: 'Total Budget',
        totalSpent: 'Total Spent',
        remaining: 'Remaining',
        budgetGoalsSummary: 'Budget Goals Summary',
        dataBreakdown: 'Data Breakdown',
        filterBudgets: 'Filter Budgets',
        showFilters: 'Show Filters',
        hideFilters: 'Hide Filters',
        applyFilter: 'Apply Filter',
        clearFilter: 'Clear Filter',
        noBudgetsFound: 'No budgets found',
        createYourFirstBudget: 'Create your first budget to get started',
    spent: 'Spent',
    limit: 'Limit',
    used: 'used',
    overBudgetBy: 'Over budget by',
    budgetRemaining: 'remaining',
    budgetSummary: 'Budget Summary',
    activeGoals: 'Active Goals',
    pleaseSelectPeriod: 'Please select a period',
        editTransaction: 'Edit Transaction',
        deleteTransaction: 'Delete Transaction',
        transactionDetails: 'Transaction Details',
        transactionType: 'Transaction Type',
        allTransactions: 'All Transactions',
        recentActivity: 'Recent Activity',

        // Analytics
        analyticsTitle: 'Analytics',
        categoryBreakdown: 'Category Distribution',
        expenseWithIncome: 'Expense (with income)',
        expenseNoIncome: 'Expense (no income)',
        incomeWithExpense: 'Income (with expense)',
        incomeNoExpense: 'Income (no expense)',
        monthlyTrend: 'Monthly Trend',
        financialReport: 'Financial Report',
        exportReport: 'Export Report',
        generateReport: 'Generate Report',
        spendingByCategory: 'Spending by Category',
        incomeVsExpense: 'Income vs Expense',
    statistics: 'Statistics',
    totalTransactions: 'Total Transactions',
    averageIncome: 'Average Income',
    averageExpense: 'Average Expense',
    highestIncome: 'Highest Income',
    highestExpense: 'Highest Expense',
    savingsRate: 'Savings Rate',
        transactionCreated: 'Transaction created successfully!',
        transactionUpdated: 'Transaction updated successfully!',
        transactionDeleted: 'Transaction deleted successfully!',
        error: 'Error',
    },
    id: {
        // Common
        save: 'Simpan',
        cancel: 'Batal',
        delete: 'Hapus',
        edit: 'Edit',
        add: 'Tambah',
        close: 'Tutup',
        confirm: 'Konfirmasi',
        search: 'Cari',
        filter: 'Filter',
        clear: 'Bersihkan',
        apply: 'Terapkan',
        loading: 'Memuat',
        name: 'Nama',
        description: 'Deskripsi',
        date: 'Tanggal',
        actions: 'Aksi',
        noData: 'Tidak ada data',

        // Navigation
        dashboard: 'Dasbor',
        budget: 'Anggaran',
        transaction: 'Transaksi',
        analytics: 'Analitik',
        settings: 'Pengaturan',
        logout: 'Keluar',

        // Dashboard
        welcome: 'Selamat Datang',
        totalIncome: 'Total Pemasukan',
        totalExpense: 'Total Pengeluaran',
        totalBalance: 'Total Saldo',
        recentTransactions: 'Transaksi Terbaru',
        budgetOverview: 'Ringkasan Anggaran',
        quickActions: 'Aksi Cepat',
        viewAll: 'Lihat Semua',
        thisMonth: 'Bulan Ini',
    manageYourFinances: 'Yuk, Atur Keuanganmu!',
    startManagingBetter: 'Mulai kelola pengeluaran dan investasi dengan lebih baik. Capai tujuan finansialmu bersama Finansialin.',
    recordEveryTransaction: 'Catat setiap transaksi Anda',
    createBudgetCategories: 'Buat budget untuk kategori pengeluaran',
    monitorMonthlyReports: 'Monitor laporan keuangan bulanan',
    
    // Settings Page
    settingsTitle: 'Pengaturan',
    profile: 'Profil',
    notifications: 'Notifikasi',
    language: 'Bahasa',
    profileInfo: 'Informasi Profil',
    updatePersonalInfo: 'Perbarui informasi pribadi Anda',
    fullName: 'Nama Lengkap',
    emailAddress: 'Alamat Email',
        saveChanges: 'Simpan Perubahan',
        saving: 'Menyimpan...',
        notificationPreferences: 'Preferensi Notifikasi',
        manageNotifications: 'Kelola cara Anda menerima notifikasi',
        transactionAlerts: 'Peringatan Transaksi',
        transactionAlertsDesc: 'Beritahu saya saat transaksi ditambahkan',
        budgetAlerts: 'Peringatan Anggaran',
        budgetAlertsDesc: 'Beritahu saya saat mendekati batas anggaran',
        savePreferences: 'Simpan Preferensi',
        languageSettings: 'Pengaturan Bahasa',
        selectLanguage: 'Pilih bahasa pilihan Anda',
        confirmLogout: 'Konfirmasi Keluar',
        logoutMessage: 'Apakah Anda yakin ingin keluar?',
        
        // Budget Page
        budgetGoals: 'Target Anggaran',
        addBudget: 'Tambah Anggaran',
        editBudget: 'Edit Anggaran',
        deleteBudget: 'Hapus Anggaran',
        budgetName: 'Nama Anggaran',
        amount: 'Jumlah',
        category: 'Kategori',
        period: 'Periode',
        startDate: 'Tanggal Mulai',
        endDate: 'Tanggal Selesai',
        type: 'Tipe',
        income: 'Pemasukan',
        expense: 'Pengeluaran',
        daily: 'Harian',
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        yearly: 'Tahunan',
        selectCategory: 'Pilih Kategori',
        selectPeriod: 'Pilih Periode',
        selectDate: 'Pilih Tanggal',
        totalBudget: 'Total Anggaran',
        totalSpent: 'Total Terpakai',
        remaining: 'Sisa',
        budgetGoalsSummary: 'Ringkasan Target Anggaran',
        dataBreakdown: 'Rincian Data',
        filterBudgets: 'Filter Anggaran',
        showFilters: 'Tampilkan Filter',
        hideFilters: 'Sembunyikan Filter',
        applyFilter: 'Terapkan Filter',
        clearFilter: 'Bersihkan Filter',
        noBudgetsFound: 'Tidak ada anggaran',
        createYourFirstBudget: 'Buat anggaran pertama Anda untuk memulai',
    spent: 'Terpakai',
    limit: 'Batas',
    used: 'terpakai',
    overBudgetBy: 'Melebihi anggaran sebesar',
    budgetRemaining: 'tersisa',
    budgetSummary: 'Ringkasan Anggaran',
    activeGoals: 'Target Aktif',
    pleaseSelectPeriod: 'Silakan pilih periode',
        editTransaction: 'Edit Transaksi',
        deleteTransaction: 'Hapus Transaksi',
        transactionDetails: 'Detail Transaksi',
        transactionType: 'Tipe Transaksi',
        allTransactions: 'Semua Transaksi',
        recentActivity: 'Aktivitas Terbaru',

        // Analytics
        analyticsTitle: 'Analitik',
        categoryBreakdown: 'Distribusi Kategori',
        expenseWithIncome: 'Pengeluaran (dengan pemasukan)',
        expenseNoIncome: 'Pengeluaran (tanpa pemasukan)',
        incomeWithExpense: 'Pemasukan (dengan pengeluaran)',
        incomeNoExpense: 'Pemasukan (tanpa pengeluaran)',
        monthlyTrend: 'Tren Bulanan',
        financialReport: 'Laporan Keuangan',
        exportReport: 'Ekspor Laporan',
        generateReport: 'Buat Laporan',
        spendingByCategory: 'Pengeluaran per Kategori',
        incomeVsExpense: 'Pemasukan vs Pengeluaran',
    statistics: 'Statistik',
    totalTransactions: 'Total Transaksi',
    averageIncome: 'Rata-rata Pemasukan',
    averageExpense: 'Rata-rata Pengeluaran',
    highestIncome: 'Pemasukan Tertinggi',
    highestExpense: 'Pengeluaran Tertinggi',
    savingsRate: 'Tingkat Tabungan',
        transactionCreated: 'Transaksi berhasil dibuat!',
        transactionUpdated: 'Transaksi berhasil diperbarui!',
        transactionDeleted: 'Transaksi berhasil dihapus!',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('id'); // Default Indonesia

    useEffect(() => {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'id')) {
            setLanguage(savedLanguage);
        }
    }, []);

    const changeLanguage = (lang) => {
        if (lang === 'en' || lang === 'id') {
            setLanguage(lang);
            localStorage.setItem('language', lang);
        }
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    const value = {
        language,
        changeLanguage,
        t,
        translations: translations[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
