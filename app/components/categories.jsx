import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import ConfirmDialog from "../components/ConfirmDialog";
import { useCategories } from "../context/CategoryContext";
import { fetchWithAuth } from "../utils/authHelper";

function Categories() {
  const { categories = [], deleteCategory } = useCategories();
  const [isCatAlertOpen, setIsCatAlertOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const onDeleteCategoryClick = (cat) => {
    setCategoryToDelete(cat);
    setIsCatAlertOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const id = categoryToDelete.id || categoryToDelete.idCategory;
      const res = await fetchWithAuth(`${BACKEND_URL}/api/categories/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      // Accept 200/204 as success; treat 404 as idempotent success
      if (res.ok || res.status === 204 || res.status === 404) {
        deleteCategory(id); // update context/UI
      } else {
        let msg = "Failed to delete category";
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {}
        alert(msg);
      }
    } catch (err) {
      alert("Gagal menghapus kategori: " + (err?.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
      setIsCatAlertOpen(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDeleteCategory = () => {
    if (isDeleting) return;
    setIsCatAlertOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="widget-box">
      <h3>Categories</h3>

      {categories.length === 0 ? (
        <p className="empty-state">You have no categories.</p>
      ) : (
        <div className="category-list">
          {categories.map((cat) => (
            <div key={cat.id || cat.idCategory} className="category-item">
              <span className="category-name">{cat.name}</span>
              <button
                className="icon-btn delete"
                onClick={() => onDeleteCategoryClick(cat)}
                title="Delete"
                disabled={isDeleting}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={isCatAlertOpen}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"?`}
        onConfirm={confirmDeleteCategory}
        onCancel={cancelDeleteCategory}
      />
    </div>
  );
}

export default Categories;