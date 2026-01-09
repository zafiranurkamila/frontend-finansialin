"use client";
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useCategories } from '../context/CategoryContext';
import '../style/modal.css';

function EditBudgetModal({ isOpen, onClose, onEditBudget, budget }) {
    const [formData, setFormData] = useState({
        categoryId: '',
        amount: '',
        periodStart: '',
        periodEnd: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { expenseCategories } = useCategories();

    // Populate form when budget changes
    useEffect(() => {
        if (budget) {
            console.log("📝 Editing budget:", budget);
            
            setFormData({
                categoryId: budget.categoryId ? budget.categoryId.toString() : '',
                amount: budget.amount ? budget.amount.toString() : budget.limit.toString(),
                periodStart: budget.periodStart ? budget.periodStart.split('T')[0] : '',
                periodEnd: budget.periodEnd ? budget.periodEnd.split('T')[0] : ''
            });
        }
    }, [budget]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.amount) {
            setError('Please fill in all required fields');
            return;
        }

        if (parseInt(formData.amount, 10) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        setLoading(true);

        try {
            const updatedData = {
                amount: parseInt(formData.amount, 10),
                periodStart: new Date(formData.periodStart).toISOString(),
                periodEnd: new Date(formData.periodEnd).toISOString()
            };

            console.log("📤 Updating budget with:", updatedData);
            await onEditBudget(updatedData);

            onClose();
        } catch (err) {
            console.error('❌ Edit budget error:', err);
            setError(err.message || 'Failed to update budget. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !budget) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Budget Goal</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}

                    {/* Category (Read-only) */}
                    <div className="form-group">
                        <label htmlFor="categoryId">Category</label>
                        <select
                            id="categoryId"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            disabled={true}
                        >
                            <option value="">Select category</option>
                            {expenseCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#666', fontSize: '0.85rem' }}>
                            Category cannot be changed
                        </small>
                    </div>

                    {/* Budget Amount */}
                    <div className="form-group">
                        <label htmlFor="amount">Budget Limit (Rp) *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0"
                            step="1"
                            min="0"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Period Start */}
                    <div className="form-group">
                        <label htmlFor="periodStart">Period Start *</label>
                        <input
                            type="date"
                            id="periodStart"
                            name="periodStart"
                            value={formData.periodStart}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Period End */}
                    <div className="form-group">
                        <label htmlFor="periodEnd">Period End *</label>
                        <input
                            type="date"
                            id="periodEnd"
                            name="periodEnd"
                            value={formData.periodEnd}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditBudgetModal;