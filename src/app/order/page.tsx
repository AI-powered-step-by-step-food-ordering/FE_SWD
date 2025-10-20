'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageLoading } from '@/hooks/usePageLoading';
import { toast } from 'react-toastify';
import Header from '@/components/shared/Header';
import ProgressBar from '@/components/order/ProgressBar';
import GoalSelection from '@/components/order/GoalSelection';
import FoodSelection from '@/components/order/FoodSelection';
import NutritionPanel from '@/components/order/NutritionPanel';
import ReviewSection from '@/components/order/ReviewSection';
import QuickCombos from '@/components/order/QuickCombos';

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

interface UserGoals {
  type: 'slim-fit' | 'muscle-gain' | 'fat-loss' | 'maintenance';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

const FOOD_DATA = {
  starch: [
    { id: 'brown-rice', name: 'Brown Rice', price: 25, nutrition: { calories: 150, protein: 3, carbs: 30, fat: 1 }, image: '🍚', description: 'Whole grain, fiber-rich' },
    { id: 'quinoa', name: 'Quinoa', price: 35, nutrition: { calories: 180, protein: 6, carbs: 32, fat: 2 }, image: '🌾', description: 'Complete protein, gluten-free' },
    { id: 'sweet-potato', name: 'Sweet Potato', price: 30, nutrition: { calories: 120, protein: 2, carbs: 28, fat: 0 }, image: '🍠', description: 'Rich in vitamins, natural sweetness' },
    { id: 'cauliflower-rice', name: 'Cauliflower Rice', price: 28, nutrition: { calories: 40, protein: 3, carbs: 8, fat: 0 }, image: '🥬', description: 'Low-carb alternative' }
  ],
  protein: [
    { id: 'grilled-chicken', name: 'Grilled Chicken', price: 60, nutrition: { calories: 200, protein: 35, carbs: 0, fat: 6 }, image: '🍗', description: 'Lean, high-protein' },
    { id: 'tofu', name: 'Grilled Tofu', price: 45, nutrition: { calories: 150, protein: 15, carbs: 5, fat: 8 }, image: '🧈', description: 'Plant-based protein' },
    { id: 'salmon', name: 'Grilled Salmon', price: 80, nutrition: { calories: 250, protein: 30, carbs: 0, fat: 12 }, image: '🐟', description: 'Omega-3 rich' },
    { id: 'chickpeas', name: 'Roasted Chickpeas', price: 40, nutrition: { calories: 180, protein: 12, carbs: 25, fat: 4 }, image: '🫘', description: 'Fiber and protein' }
  ],
  vegetables: [
    { id: 'broccoli', name: 'Steamed Broccoli', price: 20, nutrition: { calories: 35, protein: 3, carbs: 7, fat: 0 }, image: '🥦', description: 'Vitamin C powerhouse' },
    { id: 'spinach', name: 'Sautéed Spinach', price: 18, nutrition: { calories: 25, protein: 3, carbs: 4, fat: 0 }, image: '🥬', description: 'Iron-rich leafy green' },
    { id: 'bell-peppers', name: 'Roasted Bell Peppers', price: 22, nutrition: { calories: 30, protein: 1, carbs: 7, fat: 0 }, image: '🫑', description: 'Colorful antioxidants' },
    { id: 'carrots', name: 'Honey Glazed Carrots', price: 20, nutrition: { calories: 45, protein: 1, carbs: 11, fat: 0 }, image: '🥕', description: 'Beta-carotene rich' }
  ],
  sauce: [
    { id: 'tahini', name: 'Tahini Dressing', price: 15, nutrition: { calories: 80, protein: 3, carbs: 3, fat: 7 }, image: '🥜', description: 'Creamy sesame flavor' },
    { id: 'pesto', name: 'Basil Pesto', price: 18, nutrition: { calories: 90, protein: 2, carbs: 2, fat: 9 }, image: '🌿', description: 'Fresh herb blend' },
    { id: 'yogurt', name: 'Greek Yogurt Sauce', price: 12, nutrition: { calories: 40, protein: 4, carbs: 3, fat: 2 }, image: '🥛', description: 'Probiotic-rich' },
    { id: 'avocado', name: 'Avocado Cream', price: 20, nutrition: { calories: 100, protein: 2, carbs: 4, fat: 9 }, image: '🥑', description: 'Healthy fats' }
  ]
};

const USER_GOALS: Record<string, UserGoals> = {
  'slim-fit': { type: 'slim-fit', targetCalories: 400, targetProtein: 25, targetCarbs: 40, targetFat: 15 },
  'muscle-gain': { type: 'muscle-gain', targetCalories: 600, targetProtein: 40, targetCarbs: 60, targetFat: 20 },
  'fat-loss': { type: 'fat-loss', targetCalories: 350, targetProtein: 30, targetCarbs: 25, targetFat: 12 },
  'maintenance': { type: 'maintenance', targetCalories: 500, targetProtein: 30, targetCarbs: 50, targetFat: 18 }
};

function OrderForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { navigateWithLoading, showLoading, hideLoading } = usePageLoading();
  const isReorder = searchParams.get('reorder') === 'true';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string>('maintenance');
  const [selectedItems, setSelectedItems] = useState<{
    starch?: FoodItem;
    protein?: FoodItem;
    vegetables?: FoodItem;
    sauce?: FoodItem;
  }>({});
  const [isReorderLoaded, setIsReorderLoaded] = useState(false);
  const [showQuickCombos, setShowQuickCombos] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const steps = ['Goal', 'Starch', 'Protein', 'Vegetables', 'Sauce', 'Review'];
  const categories = ['starch', 'protein', 'vegetables', 'sauce'] as const;

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Show loading immediately when component mounts
      showLoading();
      
      // Add a small delay to show loading animation 
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authStatus = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      
      if (authStatus !== 'true' || !userData) {
        // Hide loading before redirect
        hideLoading();
        // Redirect to login with order redirect param
        navigateWithLoading('/auth/login?from=order');
        return;
      }
      
      // Hide loading and set authenticated
      hideLoading();
      setIsAuthenticated(true);
      setIsPageLoading(false);
    };

    checkAuth();
  }, [navigateWithLoading, showLoading, hideLoading]);

  // Load reorder data if coming from order history
  useEffect(() => {
    if (isReorder && !isReorderLoaded) {
      const reorderData = localStorage.getItem('reorderItems');
      if (reorderData) {
        const { selectedItems: reorderItems, selectedGoal: reorderGoal } = JSON.parse(reorderData);
        setSelectedItems(reorderItems);
        setSelectedGoal(reorderGoal);
        setCurrentStep(5); // Go directly to review
        setIsReorderLoaded(true);
        
        // Show reorder success toast
        toast.success('🔄 Previous order loaded! Ready for review.', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Clear the reorder data
        localStorage.removeItem('reorderItems');
      }
    }
  }, [isReorder, isReorderLoaded]);

  const calculateTotalNutrition = (): NutritionInfo => {
    return Object.values(selectedItems).reduce(
      (total, item) => {
        if (item) {
          return {
            calories: total.calories + item.nutrition.calories,
            protein: total.protein + item.nutrition.protein,
            carbs: total.carbs + item.nutrition.carbs,
            fat: total.fat + item.nutrition.fat
          };
        }
        return total;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const calculateTotalPrice = (): number => {
    return Object.values(selectedItems).reduce((total, item) => total + (item?.price || 0), 0);
  };

  const getAIRecommendations = (category: string): FoodItem[] => {
    try {
      const currentNutrition = calculateTotalNutrition();
      const goals = USER_GOALS[selectedGoal];
      const items = FOOD_DATA[category as keyof typeof FOOD_DATA];
      
      if (!items || !Array.isArray(items)) {
        console.warn(`No items found for category: ${category}`);
        return [];
      }
      
      // Simple AI logic: recommend based on remaining nutritional needs
      const remainingCalories = Math.max(0, goals.targetCalories - currentNutrition.calories);
      const remainingProtein = Math.max(0, goals.targetProtein - currentNutrition.protein);
      
      return items.sort((a, b) => {
        const aScore = Math.abs(a.nutrition.calories - remainingCalories/4) + Math.abs(a.nutrition.protein - remainingProtein/4);
        const bScore = Math.abs(b.nutrition.calories - remainingCalories/4) + Math.abs(b.nutrition.protein - remainingProtein/4);
        return aScore - bScore;
      });
    } catch (error) {
      console.error(`Error getting AI recommendations for ${category}:`, error);
      return FOOD_DATA[category as keyof typeof FOOD_DATA] || [];
    }
  };

  const selectItem = (category: string, item: FoodItem) => {
    try {
      setSelectedItems(prev => ({ ...prev, [category]: item }));
      
      // Show success toast
      toast.success(`✅ ${item.name} added to your bowl!`, {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false, 
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error selecting item:', error);
      toast.error('❌ Failed to add item. Please try again.', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoalSelect = (goal: string) => {
    try {
      setSelectedGoal(goal);
      
      // Show goal selection toast
      const goalNames = {
        'slim-fit': 'Slim Fit',
        'muscle-gain': 'Muscle Gain', 
        'fat-loss': 'Fat Loss',
        'maintenance': 'Maintenance'
      };
      
      toast.success(`🎯 Goal "${goalNames[goal as keyof typeof goalNames]}" selected!`, {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Check if it's rush hour to show quick combos
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour * 60 + minute;
      const rushStart = 11 * 60 + 15; // 11:15
      const rushEnd = 13 * 60 + 30;   // 13:30
      const isRushHour = currentTime >= rushStart && currentTime <= rushEnd;
      
      if (isRushHour) {
        setShowQuickCombos(true);
        toast.info('🚀 Rush hour detected! Quick combos available.', {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        goToNextStep();
      }
    } catch (error) {
      console.error('Error selecting goal:', error);
      toast.error('❌ Failed to select goal. Please try again.', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleQuickComboSelect = (combo: any) => {
    try {
      setSelectedItems(combo.items);
      setCurrentStep(5); // Go directly to review
      setShowQuickCombos(false);
      
      // Show success toast
      toast.success(`🚀 Quick combo "${combo.name}" selected! Ready for review.`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error selecting quick combo:', error);
      toast.error('❌ Failed to select quick combo. Please try again.', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleSkipQuickCombos = () => {
    setShowQuickCombos(false);
    goToNextStep();
  };

  const currentNutrition = calculateTotalNutrition();
  const goals = USER_GOALS[selectedGoal];

  // Show loading while checking authentication or page loading
  if (isPageLoading || isAuthenticated === null) {
    return null; // Global loading overlay will handle this
  }

  // Don't render if not authenticated (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header 
        totalPrice={calculateTotalPrice()}
        totalCalories={currentNutrition.calories}
        showPriceInfo={true}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProgressBar steps={steps} currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Goal Selection */}
            {currentStep === 0 && !showQuickCombos && (
              <GoalSelection 
                goals={USER_GOALS}
                selectedGoal={selectedGoal}
                onGoalSelect={handleGoalSelect}
              />
            )}

            {/* Quick Combos (Rush Hour) */}
            {showQuickCombos && (
              <div className="space-y-6">
                <QuickCombos
                  onComboSelect={handleQuickComboSelect}
                  selectedGoal={selectedGoal}
                />
                <div className="text-center">
                  <button
                    onClick={handleSkipQuickCombos}
                    className="text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Skip quick combos - Build custom bowl →
                  </button>
                </div>
              </div>
            )}

            {/* Food Selection */}
            {currentStep > 0 && currentStep < 5 && !showQuickCombos && (
              <FoodSelection
                category={categories[currentStep - 1] || ''}
                items={getAIRecommendations(categories[currentStep - 1] || '')}
                onItemSelect={selectItem}
                onSkip={goToNextStep}
              />
            )}

            {/* Review */}
            {currentStep === 5 && (
              <ReviewSection
                selectedItems={selectedItems}
                totalPrice={calculateTotalPrice()}
                totalNutrition={currentNutrition}
              />
            )}
          </div>

          {/* Nutrition Panel */}
          <div className="lg:col-span-1">
            <NutritionPanel
              currentNutrition={currentNutrition}
              goals={goals}
              currentStep={currentStep}
              onGoBack={goToPreviousStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <OrderForm />
    </Suspense>
  );
}