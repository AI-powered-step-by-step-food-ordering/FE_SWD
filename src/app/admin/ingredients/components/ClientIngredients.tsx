'use client';

import React, { useState, useEffect } from 'react';
import type { Ingredient, Category } from '@/types/api.types';
import ingredientService from '@/services/ingredient.service';
import categoryService from '@/services/category.service';
// import AddIngredientForm from './AddIngredientForm';
import IngredientList from './IngredientList';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import Pagination from '@/components/admin/Pagination';
import EditIngredientModal from './EditIngredientModal';
import AddIngredientModal from './AddIngredientModal';

type Props = {
  initialIngredients?: Ingredient[];
  initialCategories?: Category[];
};

export default function ClientIngredients({ initialIngredients = [], initialCategories = [] }: Props) {
  // client-side protection
  useRequireAdmin();

  // State for backend pagination
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients || []);
  const [categories, setCategories] = useState<Category[]>(Array.isArray(initialCategories) ? initialCategories : []);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load ingredients with backend pagination (fully server-side)
  const loadIngredients = async () => {
    setLoading(true);
    try {

      // Use server-side active/inactive endpoints with pagination
      const response = showInactive 
        ? await ingredientService.getInactive({
            page: page - 1,
            size: pageSize,
            sortBy: sortField,
            sortDir: sortDirection,
          })
        : await ingredientService.getActive({
            page: page - 1,
            size: pageSize,
            sortBy: sortField,
            sortDir: sortDirection,
          });

      if (response.success && response.data) {
        const { content, totalElements: total, totalPages: pages } = response.data;
        
        setIngredients(content);
        setTotalElements(total);
        setTotalPages(pages);
      } else {
        setIngredients([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      setIngredients([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Load ingredients when dependencies change
  useEffect(() => {
    loadIngredients();
  }, [showInactive, page, pageSize, sortField, sortDirection]);

  // Ensure categories are loaded and normalized
  useEffect(() => {
    const ensureCategories = async () => {
      const list = Array.isArray(categories) ? categories : [];
      if (list.length > 0) return;
      try {
        const resp = await categoryService.getAll({ page: 0, size: 500, sortDir: 'asc', sortBy: 'name' } as any);
        const content = resp?.data?.content || [];
        setCategories(content.filter((c) => c.active === true));
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      }
    };
    ensureCategories();
  }, []);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <i className="bx bx-sort text-[16px]"></i>;
    return sortDirection === 'asc' ? (
      <i className="bx bx-sort-up text-[16px]"></i>
    ) : (
      <i className="bx bx-sort-down text-[16px]"></i>
    );
  };

  const addIngredient = (item: Ingredient) => {
    setIngredients((prev) => [item, ...prev]);
    // Reload to get accurate pagination
    loadIngredients();
  };

  const updateIngredient = async (updated: Ingredient) => {
    try {
      const resp = await ingredientService.update(updated.id!, updated as any);
      if (resp?.data) {
        setIngredients((prev) => prev.map((i) => (i.id === updated.id ? resp.data : i)));
      }
    } catch (err) {
      console.error('update ingredient failed', err);
    }
  };

  const deleteIngredient = async (id: string) => {
    const prev = ingredients;
    setIngredients((prevList) => prevList.filter((i) => i.id !== id));
    try {
      await ingredientService.delete(id);
      // Reload to get accurate pagination
      loadIngredients();
    } catch (err) {
      // rollback
      setIngredients(prev);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await ingredientService.softDelete(id);
        loadIngredients();
      } catch (error) {
        console.error("Error soft deleting ingredient:", error);
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm("Are you sure you want to restore this ingredient?")) {
      try {
        await ingredientService.restore(id);
        loadIngredients();
      } catch (error) {
        console.error("Error restoring ingredient:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all ingredients in the system</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!showInactive ? 'font-medium text-green-600' : 'text-gray-500'}`}>Active</span>
            <button
              onClick={() => {
                setShowInactive(!showInactive);
                setPage(1);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showInactive ? 'bg-red-600' : 'bg-green-600'
              }`}
              aria-label="Toggle Active/Inactive"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${showInactive ? 'font-medium text-red-600' : 'text-gray-500'}`}>Inactive</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            <i className="bx bx-plus text-[20px]"></i>
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <button
          onClick={() => handleSort('name')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          Name {getSortIcon('name')}
        </button>
        <button
          onClick={() => handleSort('categoryId')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          Category {getSortIcon('categoryId')}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading ingredients...</div>
        </div>
      )}

      {/* Ingredients List */}
      {!loading && (
        <IngredientList
          items={ingredients}
          onDelete={deleteIngredient}
          onUpdate={(ing) => { setEditing(ing); setShowEditModal(true); }}
          onSoftDelete={handleSoftDelete}
          onRestore={handleRestore}
        />
      )}

      {/* Pagination */}
      {!loading && totalElements > 0 && (
        <div className="flex justify-center">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalElements}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}

      {showEditModal && (
        <EditIngredientModal
          ingredient={editing}
          categories={Array.isArray(categories) ? categories : []}
          onClose={() => { setShowEditModal(false); setEditing(null); }}
          onSaved={(saved) => {
            setIngredients((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
          }}
        />
      )}

      {showAddModal && (
        <AddIngredientModal
          categories={Array.isArray(categories) ? categories : []}
          onClose={() => setShowAddModal(false)}
          onSaved={(created) => {
            addIngredient(created);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
