'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import FirebaseImageUpload from '@/components/shared/FirebaseImageUpload';
import apiClient from '@/services/api.config';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';
import type { Ingredient, IngredientRequest, Category } from '@/types/api';
import { toast } from 'react-toastify';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function IngredientsPage() {
  useRequireAdmin();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<IngredientRequest>({
    name: '',
    unit: 'g',
    unitPrice: 0,
    categoryId: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsRes, categoriesRes] = await Promise.all([
        apiClient.get<{ data: Ingredient[] }>('/api/ingredients/getall'),
        apiClient.get<{ data: Category[] }>('/api/categories/getall'),
      ]);
      setIngredients(ingredientsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingIngredient) {
        await apiClient.put(`/api/ingredients/update/${editingIngredient.id}`, formData);
        toast.success('Ingredient updated successfully');
      } else {
        await apiClient.post('/api/ingredients/create', formData);
        toast.success('Ingredient created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      toast.error('Failed to save ingredient');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    
    try {
      await apiClient.delete(`/api/ingredients/delete/${id}`);
      toast.success('Ingredient deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      toast.error('Failed to delete ingredient');
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      unitPrice: ingredient.unitPrice,
      categoryId: ingredient.categoryId,
      imageUrl: ingredient.imageUrl || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      unit: 'g',
      unitPrice: 0,
      categoryId: '',
      imageUrl: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <AdminLayout title="Ingredients Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
            <p className="text-sm text-gray-600 mt-1">Manage all ingredients in the system</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Ingredient
          </button>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading...
            </div>
          ) : ingredients.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No ingredients found
            </div>
          ) : (
            ingredients.map((ingredient) => (
              <div key={ingredient.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                {ingredient.imageUrl ? (
                  <div className="relative w-full h-40 bg-gray-100">
                    <Image
                      src={getFirebaseThumbnail(ingredient.imageUrl)}
                      alt={ingredient.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{ingredient.name}</h3>
                      <p className="text-sm text-gray-600">{getCategoryName(ingredient.categoryId)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium text-gray-900">{ingredient.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-green-600">${ingredient.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(ingredient)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ingredient.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (l)</option>
                        <option value="pc">Pieces (pc)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="lb">Pounds (lb)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price * ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <FirebaseImageUpload
                        value={formData.imageUrl}
                        onChange={(url: string) => setFormData({ ...formData, imageUrl: url })}
                        folder="ingredients"
                        label="Ingredient Image"
                        maxSizeMB={5}
                        showPreview={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingIngredient ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
