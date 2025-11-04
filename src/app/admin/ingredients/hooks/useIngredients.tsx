'use client';

import { useState } from 'react';
import ingredientService from '@/services/ingredient.service';
import type { Ingredient } from '@/types/api.types';

export default function useIngredients(initial: Ingredient[] = []) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial ?? []);

  const addIngredient = (item: Ingredient) => setIngredients((prev) => [item, ...prev]);

  const updateIngredient = async (updated: Ingredient) => {
    try {
      const resp = await ingredientService.update(updated.id!, updated as any);
      if (resp?.data) setIngredients((prev) => prev.map((i) => (i.id === updated.id ? resp.data : i)));
    } catch (err) {
      console.error('update ingredient failed', err);
    }
  };

  const deleteIngredient = async (id: string) => {
    const prev = ingredients;
    setIngredients((prevList) => prevList.filter((i) => i.id !== id));
    try {
      await ingredientService.delete(id);
    } catch (err) {
      // rollback
      setIngredients(prev);
    }
  };

  return { ingredients, addIngredient, updateIngredient, deleteIngredient };
}
