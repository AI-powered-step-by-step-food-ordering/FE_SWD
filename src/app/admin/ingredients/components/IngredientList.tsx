'use client';

import React from 'react';
import type { Ingredient } from '@/types/api.types';
import IngredientItem from './IngredientItem';

type Props = {
  items: Ingredient[];
  onDelete: (id: string) => void;
  onUpdate?: (ing: Ingredient) => void;
  onSoftDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
};

export default function IngredientList({ items, onDelete, onUpdate, onSoftDelete, onRestore }: Props) {
  if (!items || items.length === 0) {
    return <div className="col-span-full text-center py-12 text-gray-500">No ingredients found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((it) => (
        <IngredientItem 
          key={it.id} 
          ingredient={it} 
          onDelete={onDelete} 
          onUpdate={onUpdate}
          onSoftDelete={onSoftDelete}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
