'use client';

import React from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getFirebaseThumbnail } from '@/lib/firebase-storage';
import { formatVND } from '@/lib/format-number';
import type { Ingredient } from '@/types/api.types';

type Props = {
  ingredient: Ingredient;
  onDelete: (id: string) => void;
  onUpdate?: (ing: Ingredient) => void;
  onSoftDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
};

export default function IngredientItem({ ingredient, onDelete, onUpdate, onSoftDelete, onRestore }: Props) {
  // Debug: Log active value (backend uses 'active' field, not 'isActive')
  console.log('Ingredient:', ingredient.name, 'active:', ingredient.active, 'type:', typeof ingredient.active);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {ingredient.imageUrl ? (
        <div className="relative w-full h-40 bg-gray-100">
          <ImageWithFallback src={getFirebaseThumbnail(ingredient.imageUrl)} alt={ingredient.name} fill className="object-cover" unoptimized fallbackSrc="/icon.svg" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
          <i className="bx bx-image-alt text-gray-300 text-[48px]" aria-hidden="true"></i>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{ingredient.name}</h3>
            <p className="text-sm text-gray-600">{ingredient.categoryId}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unit:</span>
            <span className="font-medium text-gray-900">{ingredient.unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Standard Qty:</span>
            <span className="font-medium text-gray-900">{ingredient.standardQuantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium text-green-600">{formatVND(ingredient.unitPrice ?? 0)}</span>
          </div>
        </div>

        {/* Status Badge */}
        {ingredient.active !== undefined && (
          <div className="mb-3">
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
              ingredient.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {ingredient.active ? "Active" : "Inactive"}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {ingredient.active === false ? (
            // Inactive: Only show Restore button
            onRestore && (
              <button
                onClick={() => onRestore(ingredient.id!)}
                className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                Restore
              </button>
            )
          ) : (
            // Active: Show Edit + Soft Delete buttons
            <>
              <button
                onClick={() => onUpdate?.(ingredient)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Edit
              </button>
              {onSoftDelete && (
                <button
                  onClick={() => onSoftDelete(ingredient.id!)}
                  className="flex-1 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
