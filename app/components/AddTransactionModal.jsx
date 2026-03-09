"use client";
import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { useCategories } from '../context/CategoryContext';
import { useFundingSources } from '../context/FundingSourceContext';
import { fetchWithAuth } from '../utils/authHelper';
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
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
    const [showSourceInput, setShowSourceInput] = useState(false);
    const [newSourceName, setNewSourceName] = useState('');
    const [newSourceBalance, setNewSourceBalance] = useState('0');
    const [addingSource, setAddingSource] = useState(false);
    const [categorizationHint, setCategorizationHint] = useState(null);

    const { getCategoriesByType, addCategory, getCategoryByName, deleteCategory } = useCategories();
    const { fundingSources, fetchFundingSources, addFundingSource } = useFundingSources();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    const parseAmountInput = (raw) => {
        if (raw === null || raw === undefined) return NaN;
        const value = String(raw).trim();
        if (!value) return NaN;

        let normalized = value.replace(/\s+/g, '');
        const lastComma = normalized.lastIndexOf(',');
        const lastDot = normalized.lastIndexOf('.');

        if (lastComma !== -1 && lastDot !== -1) {
            if (lastComma > lastDot) {
                normalized = normalized.replace(/\./g, '').replace(',', '.');
            } else {
                normalized = normalized.replace(/,/g, '');
            }
        } else if (lastComma !== -1) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = normalized.replace(/,/g, '');
        }

        return Number(normalized);
    };

    React.useEffect(() => {
        if (isOpen) {
            fetchFundingSources();
        }
    }, [isOpen]);

    React.useEffect(() => {
        const description = (formData.description || '').trim();
        const source = (formData.source || '').trim();

        if (!isOpen || (description === '' && source === '')) {
            setCategorizationHint(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const query = new URLSearchParams({
                    type: formData.type,
                    description,
                    source,
                }).toString();

                const response = await fetchWithAuth(`${BACKEND_URL}/api/categories/suggest?${query}`, {
                    method: 'GET',
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setCategorizationHint(data);

                if (!formData.categoryId && data?.suggested?.idCategory && Number(data.confidence || 0) >= 0.65) {
                    setFormData((prev) => ({
                        ...prev,
                        categoryId: String(data.suggested.idCategory),
                    }));
                }
            } catch (error) {
                console.error('Smart categorization error:', error);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [isOpen, formData.type, formData.description, formData.source]);

    const handleReceiptChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setReceiptFile(null);
            setReceiptPreviewUrl('');
            return;
        }

        setReceiptFile(file);
        setReceiptPreviewUrl(URL.createObjectURL(file));
    };

    // Get categories for current type
    const currentCategories = getCategoriesByType(formData.type);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === 'amount' ? value.replace(/[^0-9.,]/g, '') : value;
        setFormData(prev => ({
            ...prev,
            [name]: nextValue
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

        const parsedAmount = parseAmountInput(formData.amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        setLoading(true);

        try {
            // Prepare data untuk dikirim ke parent (page)
            const transactionData = {
                type: formData.type,
                amount: parsedAmount,
                description: formData.description || undefined,
                date: new Date(formData.date).toISOString(),
                source: formData.source || undefined,
                idCategory: parseInt(formData.categoryId),
                receiptImage: receiptFile || undefined,
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
            setShowSourceInput(false);
            setNewSourceName('');
            setNewSourceBalance('0');
            setShowCategoryList(false);
            setReceiptFile(null);
            setReceiptPreviewUrl('');
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

    const selectedSource = fundingSources.find((src) => src.name === formData.source);

    const handleAddSource = async () => {
        const name = newSourceName.trim();
        if (!name) {
            setError('Funding source name cannot be empty');
            return;
        }

        const exists = fundingSources.some((src) => src.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            setError('Funding source already exists');
            return;
        }

        setAddingSource(true);
        try {
            const created = await addFundingSource(name, parseFloat(newSourceBalance || '0') || 0);
            setFormData((prev) => ({ ...prev, source: created.name }));
            setShowSourceInput(false);
            setNewSourceName('');
            setNewSourceBalance('0');
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to add funding source');
        } finally {
            setAddingSource(false);
        }
    };

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
                            type="text"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0,00"
                            inputMode="decimal"
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
                                        {cat.userId ? (
                                            <button
                                                type="button"
                                                className="delete-category-btn"
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                title="Delete category"
                                            >
                                                <FaTrash />
                                            </button>
                                        ) : null}
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

                        {categorizationHint?.suggested ? (
                            <p style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                                Suggestion: {categorizationHint.suggested.name} ({Math.round((categorizationHint.confidence || 0) * 100)}% confidence)
                            </p>
                        ) : null}
                    </div>

                    {/* Source */}
                    <div className="form-group">
                        <div className="category-header">
                            <label htmlFor="source">Funding Source</label>
                            <button
                                type="button"
                                className="manage-categories-btn"
                                onClick={() => setShowSourceInput((v) => !v)}
                            >
                                {showSourceInput ? 'Hide' : 'Add Source'}
                            </button>
                        </div>

                        <div className="category-input-wrapper">
                            <select
                                id="source"
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select source (optional)</option>
                                {fundingSources.map((src) => (
                                    <option key={src.idFundingSource} value={src.name}>
                                        {src.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSource ? (
                            <p style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                                Available: Rp {selectedSource.availableBalance.toLocaleString('id-ID')}
                            </p>
                        ) : null}

                        {showSourceInput ? (
                            <div className="new-category-input" style={{ marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Source name (Cash, BCA, OVO)"
                                    value={newSourceName}
                                    onChange={(e) => setNewSourceName(e.target.value)}
                                    disabled={addingSource}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Initial balance"
                                    value={newSourceBalance}
                                    onChange={(e) => setNewSourceBalance(e.target.value)}
                                    disabled={addingSource}
                                />
                                <button type="button" className="btn-save-category" onClick={handleAddSource} disabled={addingSource}>
                                    {addingSource ? 'Adding...' : 'Save Source'}
                                </button>
                            </div>
                        ) : null}
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

                    {/* Receipt Image */}
                    <div className="form-group">
                        <label htmlFor="receiptImage">QRIS / Receipt Image</label>
                        <input
                            type="file"
                            id="receiptImage"
                            name="receiptImage"
                            accept="image/*"
                            onChange={handleReceiptChange}
                            disabled={loading}
                        />
                        {receiptPreviewUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <img
                                    src={receiptPreviewUrl}
                                    alt="Receipt preview"
                                    style={{ maxWidth: '180px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        )}
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