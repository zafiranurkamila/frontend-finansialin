"use client";
import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { useCategories } from '../context/CategoryContext';
import '../style/modal.css';

function AddTransactionModal({ isOpen, onClose, onAddTransaction }) {
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        categoryId: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        source: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [showCategoryList, setShowCategoryList] = useState(false);

    const { getCategoriesByType, addCategory, getCategoryByName, deleteCategory } = useCategories();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Get categories for current type
    const currentCategories = getCategoriesByType(formData.type);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            type,
            categoryId: '' // Reset category when type changes
        }));
        setShowCategoryInput(false);
        setNewCategoryName('');
        setError('');
    };

    const handleAddCategory = async () => {
        const trimmedName = newCategoryName.trim();
        
        if (!trimmedName) {
            setError('Category name cannot be empty');
            return;
        }

        console.log("🔍 Checking for duplicate:", trimmedName, "in", formData.type);
        
        // Check duplicate in current type
        const existingCategory = getCategoryByName(trimmedName, formData.type);
        
        if (existingCategory) {
            console.log("❌ Duplicate found:", existingCategory);
            setError(`Category "${trimmedName}" already exists in ${formData.type}`);
            return;
        }

        console.log("✅ No duplicate, adding category");
        setAddingCategory(true);
        
        try {
            const newCategory = await addCategory(trimmedName, formData.type);
            console.log("✅ Category added successfully:", newCategory);
            
            setFormData(prev => ({
                ...prev,
                categoryId: newCategory.id
            }));

            setNewCategoryName('');
            setShowCategoryInput(false);
            setError('');
        } catch (err) {
            console.error("❌ Add category error:", err);
            setError(err.message || 'Failed to add category');
        } finally {
            setAddingCategory(false);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
            return;
        }

        try {
            await deleteCategory(categoryId, formData.type);
            
            if (parseInt(formData.categoryId) === categoryId) {
                setFormData(prev => ({
                    ...prev,
                    categoryId: ''
                }));
            }
            
            setError('');
        } catch (err) {
            console.error("❌ Delete error:", err);
            setError(err.message || 'Failed to delete category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.amount || !formData.categoryId) {
            setError('Please fill in all required fields');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        setLoading(true);

        try {
            // Prepare data untuk dikirim ke parent (page)
            const transactionData = {
                type: formData.type,
                amount: parseFloat(formData.amount),
                description: formData.description || undefined,
                date: new Date(formData.date).toISOString(),
                source: formData.source || undefined,
                idCategory: parseInt(formData.categoryId)
            };

            console.log("📤 Sending to parent:", transactionData);

            // Parent yang akan handle backend call
            await onAddTransaction(transactionData);

            // Reset form
            setFormData({
                type: 'income',
                amount: '',
                categoryId: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                source: ''
            });

            setShowCategoryInput(false);
            setNewCategoryName('');
            setShowCategoryList(false);
            setError('');

            // onClose(); // Biarkan parent yang close modal setelah success
        } catch (err) {
            console.error('❌ Add transaction error:', err);
            setError(err.message || 'Failed to add transaction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Transaction</h2>
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

                    {/* Type Selection */}
                    <div className="form-group">
                        <label>Type *</label>
                        <div className="type-selector">
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                                onClick={() => handleTypeChange('income')}
                                disabled={loading}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                                onClick={() => handleTypeChange('expense')}
                                disabled={loading}
                            >
                                Expense
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="form-group">
                        <label htmlFor="amount">Amount (Rp) *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Category with Add & Manage */}
                    <div className="form-group">
                        <div className="category-header">
                            <label htmlFor="categoryId">Category * ({formData.type})</label>
                            {currentCategories.length > 0 && (
                                <button
                                    type="button"
                                    className="manage-categories-btn"
                                    onClick={() => setShowCategoryList(!showCategoryList)}
                                >
                                    {showCategoryList ? 'Hide' : 'Manage'} Categories
                                </button>
                            )}
                        </div>
                        
                        {/* Category List */}
                        {showCategoryList && currentCategories.length > 0 && (
                            <div className="category-list">
                                {currentCategories.map(cat => (
                                    <div key={cat.id} className="category-item">
                                        <span className="category-name">{cat.name}</span>
                                        <button
                                            type="button"
                                            className="delete-category-btn"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            title="Delete category"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!showCategoryInput ? (
                            <div className="category-input-wrapper">
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                >
                                    <option value="">Select or add category</option>
                                    {currentCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="add-category-btn"
                                    onClick={() => setShowCategoryInput(true)}
                                    disabled={loading}
                                    title="Add new category"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        ) : (
                            <div className="new-category-input">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => {
                                        setNewCategoryName(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={`Enter ${formData.type} category name`}
                                    disabled={addingCategory}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="btn-save-category"
                                    onClick={handleAddCategory}
                                    disabled={addingCategory || !newCategoryName.trim()}
                                >
                                    {addingCategory ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-cancel-category"
                                    onClick={() => {
                                        setShowCategoryInput(false);
                                        setNewCategoryName('');
                                        setError('');
                                    }}
                                    disabled={addingCategory}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Source */}
                    <div className="form-group">
                        <label htmlFor="source">Source</label>
                        <input
                            type="text"
                            id="source"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            placeholder="e.g., Cash, Bank, Wallet"
                            disabled={loading}
                        />
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
                            disabled={loading}
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
                            disabled={loading}
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
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddTransactionModal;