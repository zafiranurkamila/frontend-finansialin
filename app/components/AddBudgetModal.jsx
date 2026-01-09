"use client";
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useBudget } from "../context/BudgetContext";
import { useCategories } from "../context/CategoryContext";
import "../style/modal.css";
import ConfirmDialog from "./ConfirmDialog";

function AddBudgetModal({ isOpen, onClose, onAddBudget }) {
    const { budgets } = useBudget();
    const { expenseCategories, incomeCategories } = useCategories();
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: "expense",
        category: "",
        limit: "",
        period: "monthly",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Reset category when type changes
            ...(name === "type" ? { category: "" } : {}),
        }));
    };

    // Get categories based on selected type
    const availableCategories = formData.type === "expense" ? expenseCategories : incomeCategories;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.category || !formData.limit) {
            alert("Please fill in all required fields");
            return;
        }

        const limitValue = parseFloat(formData.limit);
        if (isNaN(limitValue) || limitValue <= 0) {
            alert("Please enter a valid amount greater than 0");
            return;
        }

        // Check duplicate: same category AND same period
        const isDuplicate = budgets.some(
            (budget) => 
                budget.category.toLowerCase() === formData.category.toLowerCase() && 
                budget.period === formData.period
        );
        
        if (isDuplicate) {
            setIsDuplicateDialogOpen(true);
            return;
        }

        // Find category ID from the correct category list
        const selectedCategory = availableCategories.find(cat => cat.name === formData.category);
        
        // Call parent handler (will make API call)
        onAddBudget({
            type: formData.type,
            category: formData.category,
            limit: limitValue,
            period: formData.period,
            idCategory: selectedCategory?.id || selectedCategory?.idCategory
        });

        // Reset form
        setFormData({
            type: "expense",
            category: "",
            limit: "",
            period: "monthly",
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
                    {/* Type */}
                    <div className="form-group">
                        <label htmlFor="type">Budget Type *</label>
                        <select 
                            id="type" 
                            name="type" 
                            value={formData.type} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
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
                            {availableCategories.length === 0 ? (
                                <option disabled>No {formData.type} categories available</option>
                            ) : (
                                availableCategories.map((cat) => (
                                    <option key={cat.id || cat.idCategory} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {availableCategories.length === 0 && (
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                💡 Add {formData.type} categories in the Transaction page first
                            </p>
                        )}
                    </div>

                    {/* Limit */}
                    <div className="form-group">
                        <label htmlFor="limit">Budget Limit (Rp) *</label>
                        <input 
                            type="number" 
                            id="limit" 
                            name="limit" 
                            value={formData.limit} 
                            onChange={handleChange} 
                            placeholder="0.00" 
                            step="0.01"
                            min="0"
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
                    <div
                        style={{
                            padding: "12px 16px",
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "#1E40AF",
                        }}
                    >
                        💡 Your budget will track expenses in the selected category and alert you when approaching the limit.
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={availableCategories.length === 0}
                        >
                            Create Budget
                        </button>
                    </div>
                </form>
            </div>
            
            <ConfirmDialog
                isOpen={isDuplicateDialogOpen}
                title="Budget Already Exists"
                message={`You already have a ${formData.period} budget for "${formData.category}". Please choose a different category or period.`}
                onConfirm={() => setIsDuplicateDialogOpen(false)}
                onCancel={() => setIsDuplicateDialogOpen(false)}
                showCancel={false}
            />
        </div>
    );
}

export default AddBudgetModal;