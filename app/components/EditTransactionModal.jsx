"use client";
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../style/modal.css';

function EditTransactionModal({ isOpen, onClose, onEditTransaction, transaction }) {
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Populate form when transaction changes
    useEffect(() => {
        if (transaction) {
            setFormData({
                type: transaction.type,
                amount: transaction.amount.toString(),
                category: transaction.category,
                description: transaction.description || '',
                date: transaction.date
            });
        }
    }, [transaction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.category) {
            alert('Please fill in all required fields');
            return;
        }

        onEditTransaction({
            ...formData,
            amount: parseFloat(formData.amount)
        });

        onClose();
    };

    if (!isOpen || !transaction) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Transaction</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    {/* Type Selection */}
                    <div className="form-group">
                        <label>Type *</label>
                        <div className="type-selector">
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                            >
                                Expense
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="form-group">
                        <label htmlFor="amount">Amount *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            required
                        />
                    </div>

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
                            {formData.type === 'income' ? (
                                <>
                                    <option value="salary">Salary</option>
                                    <option value="freelance">Freelance</option>
                                    <option value="investment">Investment</option>
                                    <option value="other">Other</option>
                                </>
                            ) : (
                                <>
                                    <option value="food">Food</option>
                                    <option value="transport">Transport</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="bills">Bills</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="other">Other</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Date */}
                    <div className="form-group">
                        <label htmlFor="date">Date *</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add notes (optional)"
                            rows="3"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditTransactionModal;