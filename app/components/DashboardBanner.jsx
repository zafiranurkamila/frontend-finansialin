"use client";

import React from 'react';
import { FaLightbulb, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import '../style/banner.css';

function DashboardBanner() {
    const { t } = useLanguage();
    
    return (
        <div className="dashboard-banner">
            <div className="banner-content">
                <div className="banner-text">
                    <h2 className="banner-title">{t('manageYourFinances')}</h2>
                    <p className="banner-subtitle">
                        {t('startManagingBetter')}
                    </p>

                    <div className="banner-tips">
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>{t('recordEveryTransaction')}</span>
                        </div>
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>{t('createBudgetCategories')}</span>
                        </div>
                        <div className="tip-item">
                            <FaLightbulb className="tip-icon" />
                            <span>{t('monitorMonthlyReports')}</span>
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