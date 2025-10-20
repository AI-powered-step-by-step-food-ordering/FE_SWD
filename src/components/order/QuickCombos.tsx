'use client';

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

interface QuickCombo {
  id: string;
  name: string;
  description: string;
  goal: string;
  items: {
    starch: FoodItem;
    protein: FoodItem;
    vegetables: FoodItem;
    sauce: FoodItem;
  };
  totalPrice: number;
  totalNutrition: NutritionInfo;
  prepTime: string;
  popularity: number;
  tags: string[];
}

interface QuickCombosProps {
  onComboSelect: (combo: QuickCombo) => void;
  selectedGoal: string;
}

export default function QuickCombos({ onComboSelect, selectedGoal }: QuickCombosProps) {
  const quickCombos: QuickCombo[] = [
    {
      id: 'office-power',
      name: 'Office Power Bowl',
      description: 'Perfect for busy office workers - high protein, sustained energy',
      goal: 'muscle-gain',
      items: {
        starch: { id: 'brown-rice', name: 'Brown Rice', price: 25, nutrition: { calories: 150, protein: 3, carbs: 30, fat: 1 }, image: '🍚', description: 'Whole grain, fiber-rich' },
        protein: { id: 'grilled-chicken', name: 'Grilled Chicken', price: 60, nutrition: { calories: 200, protein: 35, carbs: 0, fat: 6 }, image: '🍗', description: 'Lean, high-protein' },
        vegetables: { id: 'broccoli', name: 'Steamed Broccoli', price: 20, nutrition: { calories: 35, protein: 3, carbs: 7, fat: 0 }, image: '🥦', description: 'Vitamin C powerhouse' },
        sauce: { id: 'tahini', name: 'Tahini Dressing', price: 15, nutrition: { calories: 80, protein: 3, carbs: 3, fat: 7 }, image: '🥜', description: 'Creamy sesame flavor' }
      },
      totalPrice: 120,
      totalNutrition: { calories: 465, protein: 44, carbs: 40, fat: 14 },
      prepTime: '8 mins',
      popularity: 95,
      tags: ['High Protein', 'Office Favorite', 'Quick Prep']
    },
    {
      id: 'lean-machine',
      name: 'Lean Machine',
      description: 'Low-carb, high-protein for fat loss goals',
      goal: 'fat-loss',
      items: {
        starch: { id: 'cauliflower-rice', name: 'Cauliflower Rice', price: 28, nutrition: { calories: 40, protein: 3, carbs: 8, fat: 0 }, image: '🥬', description: 'Low-carb alternative' },
        protein: { id: 'salmon', name: 'Grilled Salmon', price: 80, nutrition: { calories: 250, protein: 30, carbs: 0, fat: 12 }, image: '🐟', description: 'Omega-3 rich' },
        vegetables: { id: 'spinach', name: 'Sautéed Spinach', price: 18, nutrition: { calories: 25, protein: 3, carbs: 4, fat: 0 }, image: '🥬', description: 'Iron-rich leafy green' },
        sauce: { id: 'yogurt', name: 'Greek Yogurt Sauce', price: 12, nutrition: { calories: 40, protein: 4, carbs: 3, fat: 2 }, image: '🥛', description: 'Probiotic-rich' }
      },
      totalPrice: 138,
      totalNutrition: { calories: 355, protein: 40, carbs: 15, fat: 14 },
      prepTime: '6 mins',
      popularity: 88,
      tags: ['Low Carb', 'Fat Loss', 'Omega-3']
    },
    {
      id: 'plant-power',
      name: 'Plant Power',
      description: 'Vegetarian protein powerhouse with complete nutrition',
      goal: 'slim-fit',
      items: {
        starch: { id: 'quinoa', name: 'Quinoa', price: 35, nutrition: { calories: 180, protein: 6, carbs: 32, fat: 2 }, image: '🌾', description: 'Complete protein, gluten-free' },
        protein: { id: 'tofu', name: 'Grilled Tofu', price: 45, nutrition: { calories: 150, protein: 15, carbs: 5, fat: 8 }, image: '🧈', description: 'Plant-based protein' },
        vegetables: { id: 'bell-peppers', name: 'Roasted Bell Peppers', price: 22, nutrition: { calories: 30, protein: 1, carbs: 7, fat: 0 }, image: '🫑', description: 'Colorful antioxidants' },
        sauce: { id: 'avocado', name: 'Avocado Cream', price: 20, nutrition: { calories: 100, protein: 2, carbs: 4, fat: 9 }, image: '🥑', description: 'Healthy fats' }
      },
      totalPrice: 122,
      totalNutrition: { calories: 460, protein: 24, carbs: 48, fat: 19 },
      prepTime: '7 mins',
      popularity: 82,
      tags: ['Vegetarian', 'Complete Protein', 'Antioxidants']
    },
    {
      id: 'balanced-classic',
      name: 'Balanced Classic',
      description: 'Perfect balance for maintenance and general health',
      goal: 'maintenance',
      items: {
        starch: { id: 'sweet-potato', name: 'Sweet Potato', price: 30, nutrition: { calories: 120, protein: 2, carbs: 28, fat: 0 }, image: '🍠', description: 'Rich in vitamins, natural sweetness' },
        protein: { id: 'chickpeas', name: 'Roasted Chickpeas', price: 40, nutrition: { calories: 180, protein: 12, carbs: 25, fat: 4 }, image: '🫘', description: 'Fiber and protein' },
        vegetables: { id: 'carrots', name: 'Honey Glazed Carrots', price: 20, nutrition: { calories: 45, protein: 1, carbs: 11, fat: 0 }, image: '🥕', description: 'Beta-carotene rich' },
        sauce: { id: 'pesto', name: 'Basil Pesto', price: 18, nutrition: { calories: 90, protein: 2, carbs: 2, fat: 9 }, image: '🌿', description: 'Fresh herb blend' }
      },
      totalPrice: 108,
      totalNutrition: { calories: 435, protein: 17, carbs: 66, fat: 13 },
      prepTime: '9 mins',
      popularity: 90,
      tags: ['Balanced', 'Fiber Rich', 'Natural Sweetness']
    }
  ];

  // Filter combos based on selected goal or show all
  const filteredCombos = selectedGoal === 'all' 
    ? quickCombos 
    : quickCombos.filter(combo => combo.goal === selectedGoal);

  const getGoalEmoji = (goal: string) => {
    switch (goal) {
      case 'slim-fit': return '🏃‍♀️';
      case 'muscle-gain': return '💪';
      case 'fat-loss': return '🔥';
      default: return '⚖️';
    }
  };

  const getRushHourStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;
    const rushStart = 11 * 60 + 15; // 11:15
    const rushEnd = 13 * 60 + 30;   // 13:30
    
    return currentTime >= rushStart && currentTime <= rushEnd;
  };

  const isRushHour = getRushHourStatus();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quick Combos</h2>
          <p className="text-gray-600">Ready in ≤3 steps • Perfect for office workers</p>
        </div>
        {isRushHour && (
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            🕐 Rush Hour - Quick combos recommended!
          </div>
        )}
      </div>

      {filteredCombos.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">🤖</span>
          <p className="text-gray-600">No quick combos for this goal yet</p>
          <p className="text-sm text-gray-500">Try building a custom bowl instead</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
              onClick={() => onComboSelect(combo)}
            >
              {/* Combo Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{combo.name}</h3>
                    <span className="text-lg">{getGoalEmoji(combo.goal)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{combo.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {combo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-green-600 text-lg">₹{combo.totalPrice}</div>
                  <div className="text-xs text-gray-500">{combo.totalNutrition.calories} kcal</div>
                </div>
              </div>

              {/* Combo Items Preview */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {Object.entries(combo.items).map(([category, item]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg mb-1">{item.image}</div>
                    <div className="text-xs text-gray-600 capitalize">{category}</div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-orange-500">⚡</span>
                    <span className="text-gray-600">{combo.prepTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-green-500">👥</span>
                    <span className="text-gray-600">{combo.popularity}% love it</span>
                  </div>
                </div>
                
                <div className="text-green-600 font-medium group-hover:text-green-700">
                  Select →
                </div>
              </div>

              {/* Nutrition Preview */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <div className="font-bold text-gray-700">{combo.totalNutrition.protein}g</div>
                    <div className="text-gray-500">Protein</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-700">{combo.totalNutrition.carbs}g</div>
                    <div className="text-gray-500">Carbs</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-700">{combo.totalNutrition.fat}g</div>
                    <div className="text-gray-500">Fat</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rush Hour Notice */}
      {isRushHour && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-bold text-yellow-800">Rush Hour Mode Active</h3>
          </div>
          <p className="text-sm text-yellow-700 mb-2">
            It's peak lunch time (11:15-13:30)! Quick combos are prepared faster and help reduce kitchen load.
          </p>
          <div className="flex items-center space-x-4 text-xs text-yellow-600">
            <span>🚀 Faster preparation</span>
            <span>📦 Priority processing</span>
            <span>⏰ Shorter wait times</span>
          </div>
        </div>
      )}
    </div>
  );
}
