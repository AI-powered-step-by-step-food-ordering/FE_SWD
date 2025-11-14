'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';
import type { Ingredient, IngredientRequest, Category } from '@/types/api.types';
import ingredientService from '@/services/ingredient.service';

const FirebaseImageUpload = dynamic(() => import('@/components/shared/FirebaseImageUpload'), { ssr: false });

type Props = {
  categories: Category[];
  onClose: () => void;
  onSaved: (ing: Ingredient) => void;
};

export default function AddIngredientModal({ categories, onClose, onSaved }: Props) {
  const [form, setForm] = useState<IngredientRequest>({
    name: '',
    unit: 'g',
    standardQuantity: 100,
    unitPrice: 0,
    categoryId: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await ingredientService.create(form);
      if (resp?.data) {
        onSaved(resp.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Add Ingredient</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Qty</label>
              <input
                type="number"
                value={form.standardQuantity}
                onChange={(e) => setForm({ ...form, standardQuantity: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select category...</option>
                {(Array.isArray(categories) ? categories : [])
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <FirebaseImageUpload
              value={form.imageUrl}
              onChange={(url: string) => setForm({ ...form, imageUrl: url })}
            />
            {form.imageUrl && (
              <div className="mt-2">
                <ImageWithFallback
                  src={getFirebaseThumbnail(form.imageUrl)}
                  alt="Preview"
                  width={60}
                  height={60}
                  className="rounded object-cover"
                  fallbackSrc="/icon.svg"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 bg-green-600 text-white rounded">
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}