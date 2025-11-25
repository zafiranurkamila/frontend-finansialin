"use client";
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useBudget } from '../context/BudgetContext';
import '../style/modal.css';

function AddBudgetModal({ isOpen, onClose }) {
    const { addBudget } = useBudget();
    const [formData, setFormData] = useState({
        category: '',
        limit: '',
        period: 'monthly'
    });

    const categories = [
        'food',
        'transport',
        'shopping',
        'bills',
        'entertainment',
        'healthcare',
        'education',
        'other'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.category || !formData.limit) {
            alert('Please fill in all required fields');
            return;
        }

        addBudget({
            category: formData.category,
            limit: parseFloat(formData.limit),
            period: formData.period
        });

        // Reset form
        setFormData({
            category: '',
            limit: '',
            period: 'monthly'
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Budget Goal</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    {/* Category */}
                    <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Limit */}
                    <div className="form-group">
                        <label htmlFor="limit">Budget Limit *</label>
                        <input
                            type="number"
                            id="limit"
                            name="limit"
                            value={formData.limit}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Period */}
                    <div className="form-group">
                        <label htmlFor="period">Period *</label>
                        <select
                            id="period"
                            name="period"
                            value={formData.period}
                            onChange={handleChange}
                            required
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    {/* Info Box */}
                    <div style={{
                        padding: '12px 16px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#1E40AF'
                    }}>
                        💡 Your budget will track expenses in the selected category and alert you when approaching the limit.
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Create Budget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddBudgetModal;