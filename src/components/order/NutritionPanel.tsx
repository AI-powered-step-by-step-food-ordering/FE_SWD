'use client';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserGoals {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

interface NutritionPanelProps {
  currentNutrition: NutritionInfo;
  goals: UserGoals;
  currentStep: number;
  onGoBack?: () => void;
}

export default function NutritionPanel({ currentNutrition, goals, currentStep, onGoBack }: NutritionPanelProps) {
  const progressPercentage = {
    calories: Math.min((currentNutrition.calories / goals.targetCalories) * 100, 100),
    protein: Math.min((currentNutrition.protein / goals.targetProtein) * 100, 100),
    carbs: Math.min((currentNutrition.carbs / goals.targetCarbs) * 100, 100),
    fat: Math.min((currentNutrition.fat / goals.targetFat) * 100, 100)
  };

  const getAIInsight = () => {
    if (progressPercentage.calories > 90) {
      return "Perfect! You're hitting your calorie target.";
    } else if (progressPercentage.calories < 50) {
      return "Add more ingredients to reach your goal.";
    } else {
      return "You're on track! Keep building your bowl.";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Nutrition Progress</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Calories</span>
            <span>{currentNutrition.calories}/{goals.targetCalories}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage.calories}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Protein (g)</span>
            <span>{currentNutrition.protein}/{goals.targetProtein}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage.protein}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Carbs (g)</span>
            <span>{currentNutrition.carbs}/{goals.targetCarbs}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage.carbs}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Fat (g)</span>
            <span>{currentNutrition.fat}/{goals.targetFat}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage.fat}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-green-600">🤖</span>
          <span className="text-sm font-medium text-green-800">AI Insight</span>
        </div>
        <p className="text-sm text-green-700">
          {getAIInsight()}
        </p>
      </div>

      {currentStep > 0 && currentStep < 5 && onGoBack && (
        <button 
          onClick={onGoBack}
          className="w-full mt-4 border-2 border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:border-green-300 transition-colors"
        >
          ← Go Back
        </button>
      )}
    </div>
  );
}

