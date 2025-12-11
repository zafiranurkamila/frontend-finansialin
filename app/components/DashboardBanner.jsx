"use client";

import React from 'react';
import { FaLightbulb, FaArrowRight } from 'react-icons/fa';
import '../style/banner.css';

function DashboardBanner() {
    return (
        <div className="dashboard-banner">
            <div className="banner-content">
                <div className="banner-text">
                    <h2 className="banner-title">Yuk, Atur Keuanganmu!</h2>
                    <p className="banner-subtitle">
                        Mulai kelola pengeluaran dan investasi dengan lebih baik.
                        Capai tujuan finansialmu bersama Finansialin.
                    </p>

                    <div className="banner-tips">
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>Catat setiap transaksi Anda</span>
                        </div>
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>Buat budget untuk kategori pengeluaran</span>
                        </div>
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>Monitor laporan keuangan bulanan</span>
                        </div>
                    </div>
                </div>

                <div className="banner-illustration">
                    <div className="illustration-circle">
                        <div className="circle-1"></div>
                        <div className="circle-2"></div>
                        <div className="circle-3"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardBanner;