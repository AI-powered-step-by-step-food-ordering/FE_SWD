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

  // Temporarily hidden per request
  return null;
}

