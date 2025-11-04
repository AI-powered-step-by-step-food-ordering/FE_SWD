'use client';

import React, { useState, useEffect } from 'react';
import type { Ingredient, Category } from '@/types/api.types';
import ingredientService from '@/services/ingredient.service';
import AddIngredientForm from './AddIngredientForm';
import IngredientList from './IngredientList';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import AdminSearchBar from '@/components/admin/AdminSearchBar';
import Pagination from '@/components/admin/Pagination';

type Props = {
  initialIngredients?: Ingredient[];
  initialCategories?: Category[];
};

export default function ClientIngredients({ initialIngredients = [], initialCategories = [] }: Props) {
  // client-side protection
  useRequireAdmin();

  // State for backend pagination
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [useLegacy, setUseLegacy] = useState(false);

  // Load ingredients with backend pagination
  const loadIngredients = async () => {
    setLoading(true);
    try {
      const sortParam = sortField ? `${sortField},${sortDirection}` : undefined;
      const q = (search || '').trim().toLowerCase();

      if (q && !useLegacy) {
        setUseLegacy(true);
        setLoading(false);
        return;
      }
      if (!q && useLegacy) {
        setUseLegacy(false);
      }

      if (useLegacy && q) {
        const legacy = await ingredientService.getAllLegacy();
        if (legacy.success && legacy.data) {
          let list = legacy.data;
          list = list.filter((i) => (
            (i.name?.toLowerCase().includes(q)) ||
            (String(i.categoryId || '').toLowerCase().includes(q))
          ));
          const total = list.length;
          const startIndex = Math.max(0, (page - 1) * Math.max(1, pageSize));
          const paged = list.slice(startIndex, startIndex + pageSize);
          setIngredients(paged);
          setTotalElements(total);
          setTotalPages(Math.max(1, Math.ceil(total / Math.max(1, pageSize))));
        }
      } else {
        const response = await ingredientService.getAll({
          page: page - 1, // Backend uses 0-indexed pages
          size: pageSize,
          sort: sortParam,
        });

        if (response.success && response.data) {
          setIngredients(response.data.content);
          setTotalElements(response.data.totalElements);
          setTotalPages(response.data.totalPages);
        }
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load ingredients when dependencies change
  useEffect(() => {
    loadIngredients();
  }, [page, pageSize, search, sortField, sortDirection]);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page when searching
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all ingredients in the system</p>
        </div>

        <div className="flex items-center gap-4">
          <AddIngredientForm onAdd={addIngredient} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <AdminSearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search ingredients..."
        />
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading ingredients...</div>
        </div>
      )}

      {/* Ingredients List */}
      {!loading && (
        <IngredientList items={ingredients} onDelete={deleteIngredient} onUpdate={updateIngredient} />
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
    </div>
  );
}
