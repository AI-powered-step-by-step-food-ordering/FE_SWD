'use client';

import { formatVND } from '@/lib/format-number';
interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  nutrition: NutritionInfo;
  image: string;
  description: string;
}

interface FoodSelectionProps {
  category: string;
  items: FoodItem[];
  onItemSelect: (category: string, item: FoodItem) => void;
  selectedIds?: string[];
}

export default function FoodSelection({ category, items, onItemSelect, selectedIds = [] }: FoodSelectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">
          Choose Your {category}
        </h2>
        <div className="text-sm text-green-600 font-medium">
          🤖 AI Recommended
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(category, item)}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-green-300 hover:border-green-300 hover:shadow-md ${
              selectedIds.includes(item.id)
                ? 'border-green-500 bg-green-50'
                : index === 0
                ? 'border-green-300 bg-green-50/40'
                : 'border-gray-200'
            }`}
            aria-pressed={selectedIds.includes(item.id)}
          >
            <div className="flex items-center space-x-3 mb-2">
              {item.image.startsWith('http') ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-full border"
                  loading="lazy"
                  width={48}
                  height={48}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Img'; }}
                />
              ) : (
                <span className="text-3xl">{item.image}</span>
              )}
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              {selectedIds.includes(item.id) ? (
                <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full">Đã chọn</span>
              ) : index === 0 ? (
                <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">AI Pick</span>
              ) : null}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-green-600">{formatVND(item.price)}</span>
              {/** API chưa có dữ liệu dinh dưỡng, tạm ẩn */}
              {false && (
                <span className="text-gray-600">
                  {item.nutrition.calories} kcal | {item.nutrition.protein}g protein
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

