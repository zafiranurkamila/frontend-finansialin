"use client";

import React, { useEffect, useState } from 'react';
import { FaArrowRight, FaBolt, FaChartLine, FaGift } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import '../style/banner.css';

function DashboardBanner() {
    const { t } = useLanguage();
    const router = useRouter();
    const [activeAd, setActiveAd] = useState(0);

    const ads = [
        {
            badge: 'Insight',
            icon: <FaGift />,
            title: 'Ringkasan Keuangan Mingguan Kamu',
            subtitle: 'Pantau pemasukan, pengeluaran, dan kategori paling boros dalam satu tampilan cepat.',
            cta: 'Lihat Ringkasan',
            href: '/ai-insights#summary'
        },
        {
            badge: 'Smart Tips',
            icon: <FaChartLine />,
            title: 'Prediksi Pengeluaran Minggu Ini',
            subtitle: 'Lihat peluang hemat hingga Rp150.000 berdasarkan pola transaksi terakhir kamu.',
            cta: 'Lihat Prediksi',
            href: '/ai-insights#predictive'
        },
        {
            badge: 'Booster',
            icon: <FaBolt />,
            title: 'Naikkan Target Tabungan Otomatis',
            subtitle: 'Mode auto-save bantu sisihkan saldo sisa harian ke tujuan finansial bulanan.',
            cta: 'Coba Sekarang',
            href: '/ai-insights#chatbot'
        }
    ];

    useEffect(() => {
        const intervalId = setInterval(() => {
            setActiveAd((prev) => (prev + 1) % ads.length);
        }, 4500);

        return () => clearInterval(intervalId);
    }, [ads.length]);

    return (
        <div className="dashboard-banner ad-banner">
            <div className="banner-content ad-content">
                <div className="ad-slider-window">
                    <div
                        className="ad-slider-track"
                        style={{ transform: `translateX(-${activeAd * 100}%)` }}
                    >
                        {ads.map((ad, index) => (
                            <div className="ad-slide" key={`${ad.badge}-${index}`}>
                                <div className="ad-badge">{ad.badge}</div>
                                <h2 className="banner-title">{ad.title}</h2>
                                <p className="banner-subtitle">{ad.subtitle}</p>
                                <button className="ad-cta" type="button" onClick={() => router.push(ad.href)}>
                                    {ad.cta} <FaArrowRight />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="banner-illustration ad-illustration">
                    <div className="ad-icon-orb">
                        {ads[activeAd].icon}
                    </div>
                    <div className="ad-rings">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>

            <div className="ad-pagination" aria-label={t('analyticsTitle')}>
                {ads.map((_, index) => (
                    <button
                        key={`dot-${index}`}
                        type="button"
                        className={`ad-dot ${activeAd === index ? 'active' : ''}`}
                        onClick={() => setActiveAd(index)}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default DashboardBanner;