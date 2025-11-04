'use client';

import React, { useState } from 'react';
import type { Ingredient, IngredientRequest } from '@/types/api.types';
import ingredientService from '@/services/ingredient.service';

type Props = {
  onAdd: (item: Ingredient) => void;
};

export default function AddIngredientForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const resp = await ingredientService.create({
        name,
        unit: 'g',
        standardQuantity: 100,
        unitPrice: 0,
        categoryId: '',
        imageUrl: '',
      } as IngredientRequest);

      if (resp?.data) onAdd(resp.data);
      setName('');
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New ingredient" className="px-3 py-2 border rounded" />
      <button type="submit" disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded">
        {loading ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
