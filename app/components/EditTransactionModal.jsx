"use client";
import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { useCategories } from '../context/CategoryContext';
import { useFundingSources } from '../context/FundingSourceContext';
import { resolveMediaUrl } from '../utils/mediaUrl';
import '../style/modal.css';

function EditTransactionModal({ isOpen, onClose, onEditTransaction, transaction }) {
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        categoryId: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        source: ''
    });

    const [error, setError] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [showCategoryList, setShowCategoryList] = useState(false);
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
    const [removeReceiptImage, setRemoveReceiptImage] = useState(false);
    const [showSourceInput, setShowSourceInput] = useState(false);
    const [newSourceName, setNewSourceName] = useState('');
    const [newSourceBalance, setNewSourceBalance] = useState('0');
    const [addingSource, setAddingSource] = useState(false);

    const { getCategoriesByType, addCategory, getCategoryByName, deleteCategory } = useCategories();
    const { fundingSources, fetchFundingSources, addFundingSource } = useFundingSources();

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

    useEffect(() => {
        if (isOpen) {
            fetchFundingSources();
        }
    }, [isOpen]);

    // Get categories for current type
    const currentCategories = getCategoriesByType(formData.type);

    // Populate form when transaction changes
    useEffect(() => {
        if (transaction) {
            console.log("📝 Editing transaction:", transaction);
            
            setFormData({
                type: transaction.type,
                amount: transaction.amount.toString(),
                categoryId: transaction.idCategory ? transaction.idCategory.toString() : '',
                description: transaction.description || '',
                date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
                source: transaction.source || ''
            });
            setReceiptFile(null);
            setReceiptPreviewUrl(resolveMediaUrl(transaction.receiptImageUrl) || '');
            setRemoveReceiptImage(false);
        }
    }, [transaction]);

    const handleReceiptChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setReceiptFile(null);
            return;
        }

        setReceiptFile(file);
        setReceiptPreviewUrl(URL.createObjectURL(file));
        setRemoveReceiptImage(false);
    };

    const handleRemoveReceipt = () => {
        setReceiptFile(null);
        setReceiptPreviewUrl('');
        setRemoveReceiptImage(true);
    };

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
            categoryId: ''
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

        const existingCategory = getCategoryByName(trimmedName, formData.type);
        
        if (existingCategory) {
            setError(`Category "${trimmedName}" already exists in ${formData.type}`);
            return;
        }

        setAddingCategory(true);
        try {
            const newCategory = await addCategory(trimmedName, formData.type);
            
            setFormData(prev => ({
                ...prev,
                categoryId: newCategory.id
            }));

            setNewCategoryName('');
            setShowCategoryInput(false);
            setError('');
        } catch (err) {
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
        } catch (err) {
            setError('Failed to delete category. It may be used in transactions.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.categoryId) {
            setError('Please fill in all required fields');
            return;
        }

        const parsedAmount = parseAmountInput(formData.amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        // Send updated data to parent
        const updatedData = {
            type: formData.type,
            amount: parsedAmount,
            description: formData.description || undefined,
            date: new Date(formData.date).toISOString(),
            source: formData.source || undefined,
            idCategory: parseInt(formData.categoryId),
            receiptImage: receiptFile || undefined,
            removeReceiptImage,
        };

        console.log("📤 Updating transaction with:", updatedData);
        try {
            await onEditTransaction(updatedData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update transaction');
        }
    };

    if (!isOpen || !transaction) return null;

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
                    <h2>Edit Transaction</h2>
                    <button className="close-btn" onClick={onClose}>
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
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                                onClick={() => handleTypeChange('expense')}
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
                        />

                        {receiptPreviewUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <img
                                    src={receiptPreviewUrl}
                                    alt="Receipt preview"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    style={{ maxWidth: '180px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                                <div style={{ marginTop: '8px' }}>
                                    <button type="button" className="btn-cancel" onClick={handleRemoveReceipt}>
                                        Remove Image
                                    </button>
                                </div>
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